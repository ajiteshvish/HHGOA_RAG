'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, Volume2, AlertCircle } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string, sttMs: number) => void
  disabled?: boolean
}

// Extend window for Web Speech API fallback
interface SpeechRecognitionWindow extends Window {
  webkitSpeechRecognition?: any
  SpeechRecognition?: any
}

export default function VoiceRecorder({
  onTranscriptionComplete,
  disabled = false
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  const startRecording = async () => {
    setErrorMessage(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })

      // Audio visualizer setup
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioContextClass()
        audioContextRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 64
        analyserRef.current = analyser
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray)
            const sum = dataArray.reduce((a, b) => a + b, 0)
            const avg = sum / dataArray.length
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)))
            animFrameRef.current = requestAnimationFrame(updateLevel)
          }
        }
        updateLevel()
      } catch {
        // AudioContext visualizer optional
      }

      // MediaRecorder initialization
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop audio tracks
        stream.getTracks().forEach(track => track.stop())
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setAudioLevel(0)

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        if (audioBlob.size < 1000) {
          setErrorMessage('Recording was too short.')
          return
        }

        await handleAudioTranscription(audioBlob)
      }

      mediaRecorder.start(100) // Chunk every 100ms
      setIsRecording(true)
      setRecordingDuration(0)

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.warn('Microphone access denied or error, checking Web Speech API:', err)
      // Fallback: Web Speech API
      tryWebSpeechFallback()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const tryWebSpeechFallback = () => {
    const win = window as SpeechRecognitionWindow
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMessage('Microphone access denied and Web Speech not supported.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsTranscribing(true)
    const tStart = performance.now()

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      const sttMs = Math.round(performance.now() - tStart)
      setIsTranscribing(false)
      if (transcript && transcript.trim().length > 0) {
        onTranscriptionComplete(transcript.trim(), sttMs)
      }
    }

    recognition.onerror = (event: any) => {
      setIsTranscribing(false)
      setErrorMessage(`Speech recognition error: ${event.error}`)
    }

    recognition.onend = () => {
      setIsTranscribing(false)
    }

    recognition.start()
  }

  const handleAudioTranscription = async (blob: Blob) => {
    setIsTranscribing(true)
    const tStart = performance.now()

    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Transcription failed')
      }

      const data = await response.json()
      const totalSttMs = data.duration_ms || Math.round(performance.now() - tStart)

      if (data.text && data.text.trim().length > 0) {
        onTranscriptionComplete(data.text.trim(), totalSttMs)
      } else {
        setErrorMessage('Could not detect any speech in the audio.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transcription error'
      setErrorMessage(message)
    } finally {
      setIsTranscribing(false)
    }
  }

  return (
    <div className="relative flex items-center">
      {/* Visual pulse effect when recording */}
      {isRecording && (
        <div
          className="absolute -inset-1.5 rounded-xl bg-red-500/30 animate-pulse pointer-events-none"
          style={{ transform: `scale(${1 + audioLevel * 0.005})` }}
        />
      )}

      {/* Button */}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isTranscribing}
        title={isRecording ? 'Stop Recording' : 'Speak your question (Voice Input)'}
        className={`relative z-10 p-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
            : isTranscribing
            ? 'bg-zinc-800 text-emerald-400 cursor-wait'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isTranscribing ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        ) : isRecording ? (
          <>
            <Square className="w-4 h-4 fill-white animate-pulse" />
            <span className="text-xs font-semibold tabular-nums text-white pr-1">
              {recordingDuration}s
            </span>
          </>
        ) : (
          <Mic className="w-4 h-4 text-emerald-400 hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Error Tooltip */}
      {errorMessage && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-800 text-red-300 text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1 z-30">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-1.5 text-red-400 hover:text-white font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
