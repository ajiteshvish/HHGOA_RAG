import { GoogleGenerativeAI } from '@google/generative-ai'

// Using Google Gemini for embeddings
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

export async function generateEmbedding(text: string) {
  // Replace newlines with spaces for better embedding results
  const input = text.replace(/\n/g, ' ')

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' })
    const result = await model.embedContent({
      content: { parts: [{ text: input }] },
      outputDimensionality: 1536
    })
    const embedding = result.embedding.values

    return embedding
  } catch (error) {
    console.error('Gemini embedding error:', error)
    throw error
  }
}
