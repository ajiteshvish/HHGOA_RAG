import { z } from 'zod'

export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  backoffFactor?: number
  jitter?: boolean
  timeoutMs?: number
}

/**
 * Executes an async function with exponential backoff retries, jitter, and timeout protection.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 150,
    backoffFactor = 2,
    jitter = true,
    timeoutMs = 15000
  } = options

  let attempt = 0
  let delay = initialDelayMs

  while (attempt <= maxRetries) {
    try {
      // Execute with timeout promise race
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          clearTimeout(timer)
          reject(new Error(`Operation timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      })

      return await Promise.race([fn(), timeoutPromise])
    } catch (err: unknown) {
      attempt++
      if (attempt > maxRetries) {
        console.error(`Execution failed after ${maxRetries} retries:`, err)
        throw err
      }

      // Compute next delay with exponential backoff & jitter
      const actualDelay = jitter
        ? delay * (0.75 + Math.random() * 0.5)
        : delay

      console.warn(`Attempt ${attempt} failed. Retrying in ${Math.round(actualDelay)}ms...`, err)
      await new Promise(resolve => setTimeout(resolve, actualDelay))
      delay *= backoffFactor
    }
  }

  throw new Error('Retry exhausted without result')
}

// ----------------------------------------------------
// Structured I/O Schemas with Zod
// ----------------------------------------------------

export const RagCitationSchema = z.object({
  chunk_id: z.string().optional(),
  document_id: z.string().optional(),
  document_name: z.string().optional(),
  content: z.string(),
  similarity: z.number().min(0).max(1)
})

export type RagCitation = z.infer<typeof RagCitationSchema>

export const LatencyBreakdownSchema = z.object({
  stt_ms: z.number().default(0),
  embedding_ms: z.number().default(0),
  retrieval_ms: z.number().default(0),
  ttft_ms: z.number().default(0),
  generation_ms: z.number().default(0),
  total_ms: z.number().default(0)
})

export type LatencyBreakdown = z.infer<typeof LatencyBreakdownSchema>

export const RagResponseSchema = z.object({
  answer: z.string(),
  is_grounded: z.boolean(),
  refusal: z.boolean(),
  refusal_reason: z.string().optional(),
  confidence: z.number().min(0).max(1),
  citations: z.array(RagCitationSchema),
  latency: LatencyBreakdownSchema
})

export type RagResponse = z.infer<typeof RagResponseSchema>
