import { GoogleGenerativeAI } from '@google/generative-ai'
import { withRetry } from './harness'

// In-memory LRU-like cache for frequent query embeddings to save 100-200ms
const embeddingCache = new Map<string, number[]>()
const MAX_CACHE_SIZE = 500

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      'Missing GOOGLE_GENERATIVE_AI_API_KEY in .env.local. Please get your free API key at https://aistudio.google.com/app/apikey'
    )
  }

  const input = text.replace(/\n/g, ' ').trim()

  if (embeddingCache.has(input)) {
    return embeddingCache.get(input)!
  }

  return await withRetry(async () => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
      const result = await model.embedContent({
        content: { role: 'user', parts: [{ text: input }] },
        // 768 dimensions to match our Neon pgvector schema
        outputDimensionality: 768
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      const embedding = result.embedding.values

      if (embeddingCache.size >= MAX_CACHE_SIZE) {
        const firstKey = embeddingCache.keys().next().value
        if (firstKey) embeddingCache.delete(firstKey)
      }
      embeddingCache.set(input, embedding)

      return embedding
    } catch (error) {
      console.error('Gemini embedding error:', error)
      throw error
    }
  }, { maxRetries: 2, initialDelayMs: 100, timeoutMs: 8000 })
}
