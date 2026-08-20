'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'
import LatencyHUD, { MessageTelemetry } from './LatencyHUD'
import { RagCitation } from '@/lib/harness'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  telemetry?: MessageTelemetry
}

interface ChatInterfaceProps {
  hasDocuments: boolean
}

export default function ChatInterface({ hasDocuments }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const executeQuery = async (queryText: string, sttMs: number = 0) => {
    const query = queryText.trim()
    if (!query || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Add placeholder assistant message
    const assistantMessageId = (Date.now() + 1).toString()
    setMessages(prev => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '' },
    ])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sttMs }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Chat request failed')
      }

      // Parse latency & guardrail telemetry headers
      const telemetry: MessageTelemetry = {
        stt_ms: parseInt(response.headers.get('X-Latency-STT') || '0', 10),
        embedding_ms: parseInt(response.headers.get('X-Latency-Embedding') || '0', 10),
        retrieval_ms: parseInt(response.headers.get('X-Latency-Retrieval') || '0', 10),
        ttft_ms: parseInt(response.headers.get('X-Latency-TTFT') || '0', 10),
        total_ms: parseInt(response.headers.get('X-Latency-Total') || '0', 10),
        is_refusal: response.headers.get('X-Guardrail-Refusal') === 'true',
        confidence: parseFloat(response.headers.get('X-Guardrail-Confidence') || '1'),
        citations: []
      }

      const citationsHeader = response.headers.get('X-Citations')
      if (citationsHeader) {
        try {
          telemetry.citations = JSON.parse(decodeURIComponent(citationsHeader)) as RagCitation[]
        } catch {
          // Ignore citation parse errors
        }
      }

      // Stream the response body
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let accumulatedContent = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedContent += chunk

          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent, telemetry }
                : msg
            )
          )
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Error: ${message}` }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await executeQuery(input, 0)
  }

  const handleVoiceTranscription = async (transcribedText: string, sttMs: number) => {
    await executeQuery(transcribedText, sttMs)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-base text-zinc-100">Voice-Enabled RAG</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Fast Pipeline &lt;200ms
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center gap-3 py-20">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <Bot className="w-7 h-7 text-zinc-500" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Speak or type your question</p>
              <p className="text-zinc-600 text-xs mt-1">
                {hasDocuments
                  ? 'Click the microphone to speak, or type below.'
                  : 'Upload a document first, then ask questions by voice or text.'}
              </p>
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md whitespace-pre-wrap'
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
              }`}
            >
              {message.content ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing voice &amp; retrieval...
                </span>
              )}

              {/* Real-time Latency & Groundedness HUD */}
              {message.role === 'assistant' && message.telemetry && (
                <LatencyHUD telemetry={message.telemetry} />
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-zinc-300" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar with Voice Recorder */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Voice Microphone Recorder */}
          <VoiceRecorder
            onTranscriptionComplete={handleVoiceTranscription}
            disabled={!hasDocuments || isLoading}
          />

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={!hasDocuments || isLoading}
            placeholder={
              hasDocuments
                ? 'Speak with mic or type your question...'
                : 'Upload a document to start chatting'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 
                       placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />

          <button
            type="submit"
            disabled={!hasDocuments || isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500
                       text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                       disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
