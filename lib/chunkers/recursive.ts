export interface RecursiveChunkerOptions {
  chunkSize?: number
  chunkOverlap?: number
  separators?: string[]
}

/**
 * Recursive character chunker that hierarchically splits text
 * by paragraph -> newline -> sentence -> word -> character boundaries
 * to preserve semantic structure and readability.
 */
export function recursiveChunkText(
  text: string,
  options: RecursiveChunkerOptions = {}
): string[] {
  const {
    chunkSize = 500,
    chunkOverlap = 100,
    separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' ', '']
  } = options

  if (!text || text.trim().length === 0) {
    return []
  }

  if (text.length <= chunkSize) {
    return [text.trim()]
  }

  function splitText(content: string, sepIndex: number): string[] {
    if (content.length <= chunkSize || sepIndex >= separators.length) {
      return content.trim().length > 0 ? [content.trim()] : []
    }

    const separator = separators[sepIndex]
    const splits = separator === '' 
      ? content.split('') 
      : content.split(separator)

    const chunks: string[] = []
    let currentChunk = ''

    for (let i = 0; i < splits.length; i++) {
      const piece = splits[i]
      const pieceWithSep = currentChunk.length > 0 && separator !== ''
        ? separator + piece
        : piece

      if (currentChunk.length + pieceWithSep.length <= chunkSize) {
        currentChunk += pieceWithSep
      } else {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim())
        }

        // If a single piece is larger than chunkSize, recursively split with next finer separator
        if (piece.length > chunkSize) {
          const subChunks = splitText(piece, sepIndex + 1)
          chunks.push(...subChunks)
          currentChunk = ''
        } else {
          currentChunk = piece
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  const rawChunks = splitText(text, 0)
  
  // Apply overlap if required
  if (chunkOverlap <= 0 || rawChunks.length <= 1) {
    return rawChunks.filter(c => c.length > 0)
  }

  const overlappedChunks: string[] = []
  for (let i = 0; i < rawChunks.length; i++) {
    let chunk = rawChunks[i]
    if (i > 0 && chunkOverlap > 0) {
      const prevChunk = rawChunks[i - 1]
      const overlapText = prevChunk.slice(-chunkOverlap)
      chunk = overlapText + ' ' + chunk
    }
    if (chunk.trim().length > 0) {
      overlappedChunks.push(chunk.trim())
    }
  }

  return overlappedChunks
}
