import { recursiveChunkText } from './recursive'

export interface MarkdownChunkerOptions {
  maxChunkSize?: number
  chunkOverlap?: number
}

interface MarkdownSection {
  level: number
  title: string
  content: string
  breadcrumbs: string[]
}

/**
 * Markdown-aware chunker that preserves document headers, code blocks,
 * and section hierarchies.
 */
export function markdownChunkText(
  text: string,
  options: MarkdownChunkerOptions = {}
): string[] {
  const { maxChunkSize = 600, chunkOverlap = 100 } = options

  if (!text || text.trim().length === 0) {
    return []
  }

  const lines = text.split('\n')
  const sections: MarkdownSection[] = []
  const headerStack: { level: number; title: string }[] = []

  let currentContent: string[] = []
  let currentLevel = 0
  let currentTitle = 'Document Header'

  const saveCurrentSection = () => {
    const rawContent = currentContent.join('\n').trim()
    if (rawContent.length > 0) {
      sections.push({
        level: currentLevel,
        title: currentTitle,
        content: rawContent,
        breadcrumbs: headerStack.map(h => h.title)
      })
    }
    currentContent = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)

    if (headerMatch) {
      saveCurrentSection()

      const level = headerMatch[1].length
      const title = headerMatch[2].trim()

      // Pop headers from stack that are deeper or at same level
      while (headerStack.length > 0 && headerStack[headerStack.length - 1].level >= level) {
        headerStack.pop()
      }

      headerStack.push({ level, title })
      currentLevel = level
      currentTitle = title
      currentContent.push(line)
    } else {
      currentContent.push(line)
    }
  }

  saveCurrentSection()

  const finalChunks: string[] = []

  for (const section of sections) {
    const breadcrumbPrefix = section.breadcrumbs.length > 0
      ? `[Context: ${section.breadcrumbs.join(' > ')}]\n`
      : ''

    const sectionWithBreadcrumbs = breadcrumbPrefix + section.content

    if (sectionWithBreadcrumbs.length <= maxChunkSize) {
      finalChunks.push(sectionWithBreadcrumbs.trim())
    } else {
      // Chunk the section recursively while retaining breadcrumb header
      const subChunks = recursiveChunkText(section.content, {
        chunkSize: maxChunkSize - breadcrumbPrefix.length,
        chunkOverlap
      })

      for (const sub of subChunks) {
        finalChunks.push((breadcrumbPrefix + sub).trim())
      }
    }
  }

  // If no markdown headers were detected, fallback directly to recursive chunker
  if (finalChunks.length === 0) {
    return recursiveChunkText(text, { chunkSize: maxChunkSize, chunkOverlap })
  }

  return finalChunks
}
