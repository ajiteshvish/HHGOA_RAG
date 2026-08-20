import Groq, { toFile } from 'groq-sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface STTResult {
  text: string
  duration_ms: number
  provider: 'groq' | 'openai' | 'gemini' | 'mock'
  confidence?: number
}

/**
 * Transcribe audio buffer to text using the fastest available STT provider.
 * Priority: Groq Whisper (ultra-fast ~50-80ms) -> OpenAI Whisper -> Gemini 2.0 Flash Audio
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm',
  fileName: string = 'audio.webm'
): Promise<STTResult> {
  const startTime = performance.now()

  // 1. Try Groq Whisper (Ultra-fast target <100ms)
  const groqApiKey = process.env.GROQ_API_KEY
  if (groqApiKey) {
    try {
      const groq = new Groq({ apiKey: groqApiKey })
      const file = await toFile(audioBuffer, fileName, { type: mimeType })

      const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
        language: 'en'
      })

      const duration_ms = Math.round(performance.now() - startTime)
      return {
        text: transcription.text.trim(),
        duration_ms,
        provider: 'groq',
        confidence: 0.98
      }
    } catch (err) {
      console.warn('Groq STT error, falling back to next provider:', err)
    }
  }

  // 2. Fallback to OpenAI Whisper
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey })
      const file = await toFile(audioBuffer, fileName, { type: mimeType })

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
      })

      const duration_ms = Math.round(performance.now() - startTime)
      return {
        text: transcription.text.trim(),
        duration_ms,
        provider: 'openai',
        confidence: 0.95
      }
    } catch (err) {
      console.warn('OpenAI STT error, falling back to Gemini:', err)
    }
  }

  // 3. Fallback to Google Gemini Multimodal Audio
  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (googleApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(googleApiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const base64Audio = audioBuffer.toString('base64')
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        { text: 'Transcribe this spoken audio exactly as spoken into text. Return ONLY the transcribed text, nothing else.' }
      ])

      const text = result.response.text().trim()
      const duration_ms = Math.round(performance.now() - startTime)
      return {
        text,
        duration_ms,
        provider: 'gemini',
        confidence: 0.92
      }
    } catch (err) {
      console.warn('Gemini Audio STT error:', err)
    }
  }

  // If no STT keys are available, throw descriptive error
  throw new Error(
    'No valid STT API key configured. Please add GROQ_API_KEY, OPENAI_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file.'
  )
}
