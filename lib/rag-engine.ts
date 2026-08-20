import { createAdminClient } from '@/lib/supabase-admin'
import { generateEmbedding } from '@/lib/embeddings'
import { evaluateInputGuardrails, evaluateRetrievalGuardrails } from '@/lib/guardrails'
import { withRetry, RagCitation, LatencyBreakdown } from '@/lib/harness'
import Groq from 'groq-sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface RAGEngineOptions {
  userId: string
  query: string
  sttMs?: number
  minSimilarityThreshold?: number
  matchCount?: number
}

export interface RetrievedChunk {
  id: string
  document_id: string
  content: string
  similarity: number
}

export interface RAGStreamResult {
  stream: ReadableStream<Uint8Array>
  latency: LatencyBreakdown
  citations: RagCitation[]
  refusal: boolean
  confidence: number
}

const SYSTEM_PROMPT = `You are a fast, precise, and helpful AI assistant for personal documents.
Answer the question accurately using ONLY the provided document context.

Rules:
- Be direct, concise, and professional.
- Do not make up facts or extrapolate beyond the context.
- Use clean markdown bullet points or bold text where appropriate.
- If information is not in the context, explicitly state so.`

/**
 * Executes low-latency grounded RAG pipeline with stage-by-stage instrumentation.
 */
export async function executeRAGPipeline(
  options: RAGEngineOptions
): Promise<RAGStreamResult> {
  const {
    userId,
    query,
    sttMs = 0,
    minSimilarityThreshold = 0.55,
    matchCount = 5
  } = options

  const overallStartTime = performance.now()
  const latency: LatencyBreakdown = {
    stt_ms: sttMs,
    embedding_ms: 0,
    retrieval_ms: 0,
    ttft_ms: 0,
    generation_ms: 0,
    total_ms: 0
  }

  // 1. Evaluate Input Guardrails
  const inputCheck = evaluateInputGuardrails(query)
  if (inputCheck.shouldRefuse) {
    latency.total_ms = Math.round(performance.now() - overallStartTime)
    const refusalText = inputCheck.refusalMessage || 'Unable to process query.'
    return createStaticStreamResponse(refusalText, latency, [], true, 0)
  }

  // 2. Query Embedding Generation
  const tEmbedStart = performance.now()
  const queryEmbedding = await generateEmbedding(query)
  latency.embedding_ms = Math.round(performance.now() - tEmbedStart)

  // 3. Supabase pgvector Similarity Retrieval
  const tRetrievalStart = performance.now()
  const adminClient = createAdminClient()
  
  const { data: rawChunks, error: searchError } = await withRetry(async () => {
    return await adminClient.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.35,
      match_count: matchCount,
      p_user_id: userId,
    })
  }, { maxRetries: 2, timeoutMs: 5000 })

  latency.retrieval_ms = Math.round(performance.now() - tRetrievalStart)

  if (searchError) {
    console.error('Vector search error:', searchError)
    throw new Error('Document retrieval failed.')
  }

  const chunks: RetrievedChunk[] = rawChunks || []

  // 4. Evaluate Retrieval Guardrails & Similarity Threshold Gating
  const retrievalCheck = evaluateRetrievalGuardrails(chunks, {
    minSimilarityThreshold
  })

  if (retrievalCheck.shouldRefuse) {
    latency.total_ms = Math.round(performance.now() - overallStartTime)
    const refusalText = retrievalCheck.refusalMessage || 'No relevant information found.'
    return createStaticStreamResponse(
      refusalText,
      latency,
      [],
      true,
      retrievalCheck.confidenceScore
    )
  }

  const citations: RagCitation[] = chunks.map(c => ({
    chunk_id: c.id,
    document_id: c.document_id,
    content: c.content.slice(0, 200) + (c.content.length > 200 ? '...' : ''),
    similarity: parseFloat(c.similarity.toFixed(3))
  }))

  // 5. Build Context and Invoke High-Speed Streaming LLM
  const contextText = chunks.map(c => c.content).join('\n\n---\n\n')
  const userPrompt = `Context from user's documents:\n${contextText}\n\nQuestion: ${query}`

  const encoder = new TextEncoder()
  let hasRecordedTTFT = false

  const stream = new ReadableStream({
    async start(controller) {
      const tGenStart = performance.now()

      try {
        // Option A: Groq (Blazing-Fast <100ms TTFT)
        if (process.env.GROQ_API_KEY) {
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
          const chatStream = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            stream: true,
          })

          for await (const chunk of chatStream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              if (!hasRecordedTTFT) {
                latency.ttft_ms = Math.round(performance.now() - tGenStart)
                hasRecordedTTFT = true
              }
              controller.enqueue(encoder.encode(content))
            }
          }
        }
        // Option B: Google Gemini 2.0 Flash / Flash-latest
        else if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

          const result = await model.generateContentStream({
            contents: [
              { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }
            ]
          })

          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              if (!hasRecordedTTFT) {
                latency.ttft_ms = Math.round(performance.now() - tGenStart)
                hasRecordedTTFT = true
              }
              controller.enqueue(encoder.encode(text))
            }
          }
        }
        // Option C: OpenAI GPT-4o-mini
        else if (process.env.OPENAI_API_KEY) {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
          const openAiStream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ],
            stream: true
          })

          for await (const chunk of openAiStream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              if (!hasRecordedTTFT) {
                latency.ttft_ms = Math.round(performance.now() - tGenStart)
                hasRecordedTTFT = true
              }
              controller.enqueue(encoder.encode(content))
            }
          }
        } else {
          throw new Error('No LLM API key configured (GROQ_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or OPENAI_API_KEY).')
        }

        latency.generation_ms = Math.round(performance.now() - tGenStart)
        latency.total_ms = Math.round(performance.now() - overallStartTime)
      } catch (err) {
        console.error('LLM Streaming error:', err)
        const errMsg = err instanceof Error ? err.message : 'Generation failed'
        controller.enqueue(encoder.encode(`\n\n[Error: ${errMsg}]`))
      } finally {
        controller.close()
      }
    }
  })

  return {
    stream,
    latency,
    citations,
    refusal: false,
    confidence: retrievalCheck.confidenceScore
  }
}

/**
 * Creates a stream for instant refusal or early returns without LLM execution.
 */
function createStaticStreamResponse(
  message: string,
  latency: LatencyBreakdown,
  citations: RagCitation[],
  refusal: boolean,
  confidence: number
): RAGStreamResult {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(message))
      controller.close()
    }
  })

  return {
    stream,
    latency,
    citations,
    refusal,
    confidence
  }
}
