import { GoogleGenerativeAI } from '@google/generative-ai'

// Using Google Gemini for embeddings
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

export async function generateEmbedding(text: string) {
  // Replace newlines with spaces for better embedding results
  const input = text.replace(/\n/g, ' ')

  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text: input }] },
      // outputDimensionality is supported by text-embedding-004 but missing in current SDK types.
      // We are using 768 dimensions to match text-embedding-004 and our database schema.
      outputDimensionality: 768
    } as any)
    const embedding = result.embedding.values

    return embedding
  } catch (error) {
    console.error('Gemini embedding error:', error)
    throw error
  }
}
