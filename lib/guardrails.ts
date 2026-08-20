export interface GuardrailCheckResult {
  allowed: boolean
  shouldRefuse: boolean
  reason?: 'INJECTION_ATTEMPT' | 'LOW_SIMILARITY' | 'NO_CONTEXT' | 'EMPTY_QUERY'
  refusalMessage?: string
  confidenceScore: number
}

export interface GuardrailOptions {
  minSimilarityThreshold?: number
  strictGroundedness?: boolean
}

// Known prompt injection and system override patterns
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /reveal\s+(the\s+)?system\s+prompt/i,
  /disregard\s+(all\s+)?prior\s+rules/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /system\s*:\s*override/i,
]

export const STANDARD_REFUSALS = {
  NO_CONTEXT: "I couldn't find any relevant documents in your library to answer this question. Please upload relevant files first.",
  LOW_SIMILARITY: "I could not find sufficient information in your uploaded documents to answer this question accurately. To prevent hallucinations, I only answer questions directly supported by your files.",
  INJECTION_ATTEMPT: "I cannot process queries attempting to alter system safety guardrails or instructions.",
  EMPTY_QUERY: "Please provide a valid question."
}

/**
 * Pre-retrieval input validation guardrail.
 */
export function evaluateInputGuardrails(query: string): GuardrailCheckResult {
  const trimmed = query.trim()

  if (!trimmed || trimmed.length === 0) {
    return {
      allowed: false,
      shouldRefuse: true,
      reason: 'EMPTY_QUERY',
      refusalMessage: STANDARD_REFUSALS.EMPTY_QUERY,
      confidenceScore: 0
    }
  }

  // Check for prompt injections / safety attacks
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        shouldRefuse: true,
        reason: 'INJECTION_ATTEMPT',
        refusalMessage: STANDARD_REFUSALS.INJECTION_ATTEMPT,
        confidenceScore: 0
      }
    }
  }

  return {
    allowed: true,
    shouldRefuse: false,
    confidenceScore: 1.0
  }
}

/**
 * Post-retrieval context relevance and groundedness guardrail.
 */
export function evaluateRetrievalGuardrails(
  chunks: Array<{ content: string; similarity: number }>,
  options: GuardrailOptions = {}
): GuardrailCheckResult {
  const { minSimilarityThreshold = 0.60 } = options

  if (!chunks || chunks.length === 0) {
    return {
      allowed: false,
      shouldRefuse: true,
      reason: 'NO_CONTEXT',
      refusalMessage: STANDARD_REFUSALS.NO_CONTEXT,
      confidenceScore: 0
    }
  }

  const topSimilarity = chunks[0]?.similarity || 0

  // If even the top retrieved chunk doesn't meet the similarity threshold, refuse
  if (topSimilarity < minSimilarityThreshold) {
    return {
      allowed: false,
      shouldRefuse: true,
      reason: 'LOW_SIMILARITY',
      refusalMessage: STANDARD_REFUSALS.LOW_SIMILARITY,
      confidenceScore: Math.max(0, topSimilarity)
    }
  }

  // Calculate composite confidence score based on top chunk similarities
  const avgTopScore = chunks.slice(0, 3).reduce((acc, c) => acc + c.similarity, 0) / Math.min(chunks.length, 3)

  return {
    allowed: true,
    shouldRefuse: false,
    confidenceScore: parseFloat(avgTopScore.toFixed(3))
  }
}
