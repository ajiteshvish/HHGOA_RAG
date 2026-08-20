import { recursiveChunkText } from './recursive'

export interface SemanticChunkerOptions {
  maxChunkSize?: number
  minChunkSize?: number
  similarityThreshold?: number
  embeddingFn?: (text: string) => Promise<number[]>
}

/**
 * Calculates cosine similarity between two numeric vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Splits text into individual sentences while preserving sentence boundaries.
 */
export function splitIntoSentences(text: string): string[] {
  // Regex to match sentence boundaries (. ! ?) without breaking acronyms or decimals easily
  const sentenceRegex = /([.!?]+(?:\s+|$)|(?:\n\s*\n))/g
  const parts = text.split(sentenceRegex)
  const sentences: string[] = []

  let current = ''
  for (let i = 0; i < parts.length; i++) {
    current += parts[i]
    if (i % 2 === 1 || i === parts.length - 1) {
      if (current.trim().length > 0) {
        sentences.push(current.trim())
      }
      current = ''
    }
  }

  if (current.trim().length > 0) {
    sentences.push(current.trim())
  }

  return sentences
}

/**
 * Semantic Chunker: Evaluates semantic cohesion across sentence boundaries
 * and creates chunks when topical divergence is detected or size limits are reached.
 */
export async function semanticChunkText(
  text: string,
  options: SemanticChunkerOptions = {}
): Promise<string[]> {
  const {
    maxChunkSize = 600,
    minChunkSize = 150,
    similarityThreshold = 0.65,
    embeddingFn
  } = options

  if (!text || text.trim().length === 0) {
    return []
  }

  const sentences = splitIntoSentences(text)
  if (sentences.length <= 1) {
    return [text.trim()]
  }

  // If no embedding function is supplied, group sentences by length & natural flow
  if (!embeddingFn) {
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
        currentChunk = currentChunk.length > 0 ? `${currentChunk} ${sentence}` : sentence
      } else {
        if (currentChunk.length >= minChunkSize) {
          chunks.push(currentChunk)
          currentChunk = sentence
        } else {
          currentChunk = `${currentChunk} ${sentence}`
          chunks.push(currentChunk)
          currentChunk = ''
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }

    return chunks.length > 0 ? chunks : recursiveChunkText(text, { chunkSize: maxChunkSize })
  }

  // Compute embeddings for each sentence to detect semantic shift points
  try {
    const embeddings: number[][] = []
    for (const sentence of sentences) {
      const emb = await embeddingFn(sentence)
      embeddings.push(emb)
    }

    const chunks: string[] = []
    let currentGroup: string[] = [sentences[0]]
    let currentGroupLength = sentences[0].length

    for (let i = 0; i < sentences.length - 1; i++) {
      const similarity = cosineSimilarity(embeddings[i], embeddings[i + 1])
      const nextSentence = sentences[i + 1]
      const combinedLength = currentGroupLength + nextSentence.length + 1

      // Split if similarity drops below threshold (topic change) or max size exceeded
      const isTopicShift = similarity < similarityThreshold && currentGroupLength >= minChunkSize
      const isTooLarge = combinedLength > maxChunkSize

      if (isTopicShift || isTooLarge) {
        chunks.push(currentGroup.join(' '))
        currentGroup = [nextSentence]
        currentGroupLength = nextSentence.length
      } else {
        currentGroup.push(nextSentence)
        currentGroupLength = combinedLength
      }
    }

    if (currentGroup.length > 0) {
      chunks.push(currentGroup.join(' '))
    }

    return chunks
  } catch {
    // Graceful fallback to sentence-based grouping
    return semanticChunkText(text, { ...options, embeddingFn: undefined })
  }
}
