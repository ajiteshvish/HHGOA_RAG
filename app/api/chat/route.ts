import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { executeRAGPipeline } from '@/lib/rag-engine'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user from session
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request payload
    const body = await request.json()
    const { query, sttMs = 0, minSimilarityThreshold = 0.35, conversationHistory = [] } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'No query provided' }, { status: 400 })
    }

    // 3. Execute low-latency RAG pipeline on Neon DB with guardrails & latency instrumentation
    const result = await executeRAGPipeline({
      userId: user.id,
      query: query.trim(),
      sttMs: typeof sttMs === 'number' ? sttMs : 0,
      minSimilarityThreshold: typeof minSimilarityThreshold === 'number' ? minSimilarityThreshold : 0.35,
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : []
    })

    // 4. Send response stream with latency & citation metadata headers
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Latency-STT': result.latency.stt_ms.toString(),
      'X-Latency-Embedding': result.latency.embedding_ms.toString(),
      'X-Latency-Retrieval': result.latency.retrieval_ms.toString(),
      'X-Latency-TTFT': result.latency.ttft_ms.toString(),
      'X-Latency-Total': result.latency.total_ms.toString(),
      'X-Guardrail-Refusal': result.refusal ? 'true' : 'false',
      'X-Guardrail-Confidence': result.confidence.toString(),
      'X-Citations': encodeURIComponent(JSON.stringify(result.citations))
    })

    return new Response(result.stream, { headers })
  } catch (err: unknown) {
    console.error('Chat API error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
