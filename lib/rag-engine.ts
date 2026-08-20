import { searchSimilarChunks, saveChatMessage } from '@/lib/db'
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
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
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

const SYSTEM_PROMPT = `You are a fast, intelligent, and precise personal AI assistant for documents.
Answer the user's question accurately in the same language (English, Hindi, or Hinglish as requested) using ONLY the provided document context.

Formatting & Structure Guidelines:
- Format your response cleanly with clear markdown headers (### Category), bullet points (-), and highlighted bold keywords (**Key Term**).
- Keep content organized in neat sections (e.g., 🎓 Education, 💼 Experience, 🛠️ Skills, 🚀 Projects, 🏆 Achievements).
- If the user asks for a summary or general query (e.g., "maine kya info diya hai"), provide a crisp, well-structured breakdown.
- Do not fabricate facts outside the context.
- Maintain context awareness across prior turns in the conversation.
- Be direct, professional, and friendly.`

/**
 * Executes low-latency grounded RAG pipeline with multi-turn memory & Neon DB persistence.
 */
export async function executeRAGPipeline(
  options: RAGEngineOptions
): Promise<RAGStreamResult> {
  const {
    userId,
    query,
    sttMs = 0,
    minSimilarityThreshold = 0.35,
    matchCount = 5,
    conversationHistory = []
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
    // Persist turn
    saveChatMessage({ userId, role: 'user', content: query }).catch(() => {})
    saveChatMessage({ userId, role: 'assistant', content: refusalText }).catch(() => {})
    return createStaticStreamResponse(refusalText, latency, [], true, 0)
  }

  // 2. Query Embedding Generation
  const tEmbedStart = performance.now()
  const queryEmbedding = await generateEmbedding(query)
  latency.embedding_ms = Math.round(performance.now() - tEmbedStart)

  // 3. Neon DB pgvector Similarity Retrieval
  const tRetrievalStart = performance.now()
  
  let chunks: RetrievedChunk[] = []
  try {
    chunks = await withRetry(async () => {
      return await searchSimilarChunks({
        userId,
        queryEmbedding,
        matchThreshold: 0.35,
        matchCount
      })
    }, { maxRetries: 2, timeoutMs: 5000 })
  } catch (searchError) {
    console.error('Neon vector search error:', searchError)
    throw new Error('Document retrieval failed from Neon DB.')
  }

  latency.retrieval_ms = Math.round(performance.now() - tRetrievalStart)

  // 4. Evaluate Retrieval Guardrails & Similarity Threshold Gating
  const retrievalCheck = evaluateRetrievalGuardrails(chunks, {
    minSimilarityThreshold
  })

  if (retrievalCheck.shouldRefuse) {
    latency.total_ms = Math.round(performance.now() - overallStartTime)
    const refusalText = retrievalCheck.refusalMessage || 'No relevant information found.'
    saveChatMessage({ userId, role: 'user', content: query }).catch(() => {})
    saveChatMessage({ userId, role: 'assistant', content: refusalText }).catch(() => {})
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
    similarity: parseFloat((c.similarity || 0).toFixed(3))
  }))

  // 5. Build Context and Multi-turn Messages
  const contextText = chunks.map(c => c.content).join('\n\n---\n\n')
  const userPrompt = `Context from user's documents:\n${contextText}\n\nQuestion: ${query}`

  // Slice recent history (last 4 turns) for context window
  const recentHistory = conversationHistory.slice(-4).map(h => ({
    role: h.role,
    content: h.content
  }))

  const messagesPayload = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...recentHistory,
    { role: 'user' as const, content: userPrompt }
  ]

  // Persist user prompt to Neon DB
  saveChatMessage({ userId, role: 'user', content: query }).catch(() => {})

  const encoder = new TextEncoder()
  let hasRecordedTTFT = false
  let accumulatedAssistantResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      const tGenStart = performance.now()

      try {
        // Option A: OpenRouter (Qwen / Custom models)
        if (process.env.OPENROUTER_API_KEY) {
          const modelName = process.env.LLM_MODEL || 'qwen/qwen-2.5-72b-instruct'
          const openai = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
            defaultHeaders: {
              'HTTP-Referer': 'https://github.com/ajiteshvish/HHGOA_RAG',
              'X-Title': 'Voice RAG AI',
            }
          })

          const chatStream = await openai.chat.completions.create({
            model: modelName,
            messages: messagesPayload,
            stream: true,
            temperature: 0.2
          })

          for await (const chunk of chatStream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              if (!hasRecordedTTFT) {
                latency.ttft_ms = Math.round(performance.now() - tGenStart)
                hasRecordedTTFT = true
              }
              accumulatedAssistantResponse += content
              controller.enqueue(encoder.encode(content))
            }
          }
        }
        // Option B: Groq (Ultra-Fast <100ms TTFT with Qwen / Llama models)
        else if (process.env.GROQ_API_KEY) {
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
          const modelName = process.env.LLM_MODEL || 'qwen/qwen3.6-27b'

          const chatStream = await groq.chat.completions.create({
            messages: messagesPayload,
            model: modelName,
            temperature: 0.6,
            max_completion_tokens: 2048,
            top_p: 0.95,
            stream: true,
          })

          for await (const chunk of chatStream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              if (!hasRecordedTTFT) {
                latency.ttft_ms = Math.round(performance.now() - tGenStart)
                hasRecordedTTFT = true
              }
              accumulatedAssistantResponse += content
              controller.enqueue(encoder.encode(content))
            }
          }
        }
        // Option C: Google Gemini 2.0 Flash
        else if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
          const model = genAI.getGenerativeModel({ model: process.env.LLM_MODEL || 'gemini-2.0-flash' })

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
              accumulatedAssistantResponse += text
              controller.enqueue(encoder.encode(text))
            }
          }
        }
        // Option D: OpenAI GPT-4o-mini
        else if (process.env.OPENAI_API_KEY) {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL
          })
          const openAiStream = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || 'gpt-4o-mini',
            messages: messagesPayload,
            stream: true
          })

          for await (const chunk of openAiStream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              if (!hasRecordedTTFT) {
                latency.ttft_ms = Math.round(performance.now() - tGenStart)
                hasRecordedTTFT = true
              }
              accumulatedAssistantResponse += content
              controller.enqueue(encoder.encode(content))
            }
          }
        } else {
          throw new Error('No LLM API key configured.')
        }

        latency.generation_ms = Math.round(performance.now() - tGenStart)
        latency.total_ms = Math.round(performance.now() - overallStartTime)

        // Persist completed assistant response in Neon DB
        if (accumulatedAssistantResponse) {
          saveChatMessage({
            userId,
            role: 'assistant',
            content: accumulatedAssistantResponse,
            telemetry: latency as unknown as Record<string, unknown>
          }).catch(e => console.error('Failed to persist assistant chat:', e))
        }
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
