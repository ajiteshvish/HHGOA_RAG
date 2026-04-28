export function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  // Simple word-based chunker with overlap
  const words = text.split(/\s+/)
  const chunks: string[] = []
  
  let i = 0
  while (i < words.length) {
    const end = Math.min(i + maxChunkSize, words.length)
    const chunkWords = words.slice(i, end)
    chunks.push(chunkWords.join(' '))
    
    if (end === words.length) {
      break
    }
    
    // Move forward by chunk size minus overlap
    i += (maxChunkSize - overlap)
  }
  
  return chunks
}
