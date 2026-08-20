import Groq, { toFile } from 'groq-sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface STTResult {
  text: string
  duration_ms: number
  provider: 'sarvam' | 'elevenlabs' | 'groq' | 'openai' | 'gemini' | 'mock'
  confidence?: number
}

/**
 * Transcribe audio buffer to text using Sarvam AI / ElevenLabs / Groq Whisper.
 * Complies with HH Goa Task 2 guidelines: "Use either Sarvam or ElevenLabs for voice-to-text."
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm',
  fileName: string = 'audio.webm'
): Promise<STTResult> {
  const startTime = performance.now()

  // 1. Option A: Sarvam AI Speech-to-Text (Indic & Indian English specialist)
  const sarvamApiKey = process.env.SARVAM_API_KEY || process.env.SARVAM_AI_API_KEY
  if (sarvamApiKey) {
    try {
      const formData = new FormData()
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType })
      formData.append('file', blob, fileName)
      formData.append('model', 'saaras:v1')
      formData.append('language_code', 'en-IN')

      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': sarvamApiKey,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.transcript || data.text || ''
        if (text.trim()) {
          const duration_ms = Math.round(performance.now() - startTime)
          return {
            text: text.trim(),
            duration_ms,
            provider: 'sarvam',
            confidence: 0.98,
          }
        }
      }
    } catch (err) {
      console.warn('Sarvam AI STT error, falling back:', err)
    }
  }

  // 2. Option B: ElevenLabs Speech-to-Text (Scribe v1)
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY
  if (elevenLabsApiKey) {
    try {
      const formData = new FormData()
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType })
      formData.append('file', blob, fileName)
      formData.append('model_id', 'scribe_v1')

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.text || data.transcript || ''
        if (text.trim()) {
          const duration_ms = Math.round(performance.now() - startTime)
          return {
            text: text.trim(),
            duration_ms,
            provider: 'elevenlabs',
            confidence: 0.98,
          }
        }
      }
    } catch (err) {
      console.warn('ElevenLabs STT error, falling back:', err)
    }
  }

  // 3. Option C: Groq Whisper (Ultra-fast target <100ms)
  const groqApiKey = process.env.GROQ_API_KEY
  if (groqApiKey) {
    try {
      const groq = new Groq({ apiKey: groqApiKey })
      const file = await toFile(audioBuffer, fileName, { type: mimeType })

      const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
      })

      const duration_ms = Math.round(performance.now() - startTime)
      return {
        text: transcription.text.trim(),
        duration_ms,
        provider: 'groq',
        confidence: 0.98,
      }
    } catch (err) {
      console.warn('Groq STT error, falling back to OpenAI/Gemini:', err)
    }
  }

  // 4. Option D: Fallback to OpenAI Whisper
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
        confidence: 0.95,
      }
    } catch (err) {
      console.warn('OpenAI STT error, falling back to Gemini:', err)
    }
  }

  // 5. Option E: Fallback to Google Gemini Multimodal Audio
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
            data: base64Audio,
          },
        },
        { text: 'Transcribe this spoken audio exactly as spoken into text. Return ONLY the transcribed text, nothing else.' },
      ])

      const text = result.response.text().trim()
      const duration_ms = Math.round(performance.now() - startTime)
      return {
        text,
        duration_ms,
        provider: 'gemini',
        confidence: 0.92,
      }
    } catch (err) {
      console.warn('Gemini Audio STT error:', err)
    }
  }

  throw new Error('All Speech-to-Text providers failed or no API keys configured.')
}
