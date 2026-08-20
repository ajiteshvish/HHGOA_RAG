import { recursiveChunkText, RecursiveChunkerOptions } from './chunkers/recursive'
import { markdownChunkText, MarkdownChunkerOptions } from './chunkers/markdown'
import { semanticChunkText, SemanticChunkerOptions } from './chunkers/semantic'

export type ChunkingStrategy = 'auto' | 'recursive' | 'semantic' | 'markdown'

export interface ChunkDocumentOptions {
  strategy?: ChunkingStrategy
  maxChunkSize?: number
  chunkOverlap?: number
  similarityThreshold?: number
  embeddingFn?: (text: string) => Promise<number[]>
}

export interface ChunkResult {
  content: string
  chunkIndex: number
  strategy: ChunkingStrategy
  metadata?: Record<string, unknown>
}

/**
 * Detects whether content has strong markdown structure.
 */
function isMarkdownContent(text: string): boolean {
  const headingRegex = /^#{1,6}\s+.+$/m
  const listRegex = /^[\s]*[-*+]\s+.+$/m
  const tableRegex = /\|.+\|.+\|/m
  return headingRegex.test(text) || (listRegex.test(text) && tableRegex.test(text))
}

/**
 * High-level multi-strategy document chunker.
 */
export async function chunkDocument(
  text: string,
  options: ChunkDocumentOptions = {}
): Promise<ChunkResult[]> {
  const {
    strategy = 'auto',
    maxChunkSize = 600,
    chunkOverlap = 100,
    similarityThreshold = 0.65,
    embeddingFn
  } = options

  let effectiveStrategy: ChunkingStrategy = strategy

  if (effectiveStrategy === 'auto') {
    if (isMarkdownContent(text)) {
      effectiveStrategy = 'markdown'
    } else {
      effectiveStrategy = 'recursive'
    }
  }

  let rawChunks: string[] = []

  switch (effectiveStrategy) {
    case 'markdown':
      rawChunks = markdownChunkText(text, { maxChunkSize, chunkOverlap })
      break

    case 'semantic':
      rawChunks = await semanticChunkText(text, {
        maxChunkSize,
        similarityThreshold,
        embeddingFn
      })
      break

    case 'recursive':
    default:
      rawChunks = recursiveChunkText(text, {
        chunkSize: maxChunkSize,
        chunkOverlap
      })
      break
  }

  return rawChunks.map((content, chunkIndex) => ({
    content,
    chunkIndex,
    strategy: effectiveStrategy,
    metadata: {
      charCount: content.length,
      wordCount: content.split(/\s+/).filter(Boolean).length
    }
  }))
}

/**
 * Backward compatibility wrapper matching the original chunkText signature.
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 600,
  overlap: number = 100
): string[] {
  return recursiveChunkText(text, {
    chunkSize: maxChunkSize,
    chunkOverlap: overlap
  })
}

export { recursiveChunkText, markdownChunkText, semanticChunkText }
