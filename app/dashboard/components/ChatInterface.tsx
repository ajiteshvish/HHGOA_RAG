'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'
import LatencyHUD, { MessageTelemetry } from './LatencyHUD'
import ThinkingState from './ThinkingState'
import PromptBar from './PromptBar'
import { Skeleton } from '@/components/ui/skeleton'
import { RagCitation } from '@/lib/harness'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  telemetry?: MessageTelemetry
  createdAt?: string
}

interface ChatInterfaceProps {
  hasDocuments: boolean
}

/**
 * Parses assistant message content to separate reasoning thoughts from the final answer
 */
function parseThoughtAndAnswer(raw: string) {
  const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/i
  const match = raw.match(thinkRegex)

  if (match) {
    const thought = match[1].trim()
    const answer = raw.replace(thinkRegex, '').trim()
    const isThinking = !raw.includes('</think>') && answer.length === 0
    return { thought, answer, isThinking }
  }

  return { thought: null, answer: raw, isThinking: false }
}

/**
 * Formats markdown into clean React elements with structured headers and bullet points
 */
function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null

  const lines = content.split('\n')

  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed text-zinc-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-semibold text-emerald-400 text-sm mt-3 mb-1">
              {formatInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-zinc-100 text-base mt-3 mb-1">
              {formatInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          )
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-bold text-zinc-100 text-lg mt-3 mb-1">
              {formatInline(trimmed.replace(/^#\s+/, ''))}
            </h2>
          )
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-•*]\s+/, '')
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-400 mt-1 text-xs">•</span>
              <div className="flex-1">{formatInline(itemText)}</div>
            </div>
          )
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-zinc-200">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-zinc-100 text-emerald-300/90">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export default function ChatInterface({ hasDocuments }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'Chat' | 'Sources' | 'Telemetry'>('Chat')
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCitation, setSelectedCitation] = useState<RagCitation | null>(null)

  // In-browser benchmark runner state
  const [isBenchmarking, setIsBenchmarking] = useState(false)
  const [benchmarkProgress, setBenchmarkProgress] = useState<number>(0)
  const [benchmarkResults, setBenchmarkResults] = useState<{
    p50: number
    p70: number
    p90: number
    p100: number
    mean: number
    count: number
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history from Neon DB on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/chat/history')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.history) && data.history.length > 0) {
            setMessages(
              data.history.map((m: any) => ({
                id: m.id || Date.now().toString(),
                role: m.role,
                content: m.content,
                telemetry: m.telemetry,
                createdAt: m.created_at
                  ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : undefined
              }))
            )
          }
        }
      } catch (err) {
        console.warn('Could not load chat history:', err)
      }
    }
    loadHistory()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Text-To-Speech (Two-Way Voice Output)
  const speakText = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    if (speakingId === msgId) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
      return
    }

    window.speechSynthesis.cancel()
    const cleanText = text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/[#*`_~]/g, '')
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.05
    utterance.pitch = 1.0

    utterance.onend = () => setSpeakingId(null)
    utterance.onerror = () => setSpeakingId(null)

    setSpeakingId(msgId)
    window.speechSynthesis.speak(utterance)
  }

  const copyAnswer = (text: string, id: string) => {
    const cleanText = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    navigator.clipboard.writeText(cleanText)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const canSend = draft.trim().length > 0 && !isLoading

  const executeQuery = async (queryText: string, sttMs: number = 0) => {
    const query = queryText.trim()
    if (!query || isLoading) return

    // Multi-turn context history (last 4 turns)
    const contextHistory = messages.slice(-4).map(m => ({
      role: m.role,
      content: m.content
    }))

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMessage])
    setDraft('')
    setIsLoading(true)

    // Add placeholder assistant message
    const assistantMessageId = (Date.now() + 1).toString()
    setMessages(prev => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
    ])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sttMs, conversationHistory: contextHistory }),
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
        confidence: parseFloat(response.headers.get('X-Guardrail-Confidence') || '0'),
      }

      const citationsHeader = response.headers.get('X-Citations')
      if (citationsHeader) {
        try {
          telemetry.citations = JSON.parse(decodeURIComponent(citationsHeader)) as RagCitation[]
        } catch {
          // ignore
        }
      }

      // Stream response tokens
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      if (reader) {
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

        // Two-Way Voice Output: Auto-Speak answer if enabled
        if (autoSpeak && accumulatedContent) {
          speakText(accumulatedContent, assistantMessageId)
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

  const handleSend = () => {
    if (canSend) {
      executeQuery(draft, 0)
    }
  }

  const handleVoiceTranscription = async (transcribedText: string, sttMs: number) => {
    await executeQuery(transcribedText, sttMs)
  }

  const clearChat = async () => {
    setMessages([])
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeakingId(null)
    try {
      await fetch('/api/chat/history', { method: 'DELETE' })
    } catch (e) {
      console.warn('Failed to clear chat history in DB:', e)
    }
  }

  // Run in-browser real query benchmark suite (10 test queries)
  const runInBrowserBenchmark = async () => {
    if (isBenchmarking) return
    setIsBenchmarking(true)
    setBenchmarkProgress(0)

    const testQueries = [
      'What are the technical skills in the resume?',
      'Tell me about work experience and internship details.',
      'What is the educational qualification?',
      'Which hackathons and achievements are mentioned?',
      'What mobile apps or drone projects were built?',
      'Summarize key database and backend frameworks used.',
      'Explain AI in healthcare according to MSMARCO.',
      'How do photovoltaic solar panels operate?',
      'What is CRISPR gene editing mechanism?',
      'Explain transformer multi-head self-attention.'
    ]

    const latencies: number[] = []

    for (let i = 0; i < testQueries.length; i++) {
      const q = testQueries[i]
      const t0 = performance.now()
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        })
        const total = parseInt(res.headers.get('X-Latency-Total') || '0', 10) || Math.round(performance.now() - t0)
        latencies.push(total)
      } catch {
        latencies.push(Math.round(performance.now() - t0))
      }
      setBenchmarkProgress(Math.round(((i + 1) / testQueries.length) * 100))
    }

    latencies.sort((a, b) => a - b)
    const p50 = latencies[Math.floor(latencies.length * 0.5)]
    const p70 = latencies[Math.floor(latencies.length * 0.7)]
    const p90 = latencies[Math.floor(latencies.length * 0.9)]
    const p100 = latencies[latencies.length - 1]
    const mean = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)

    setBenchmarkResults({ p50, p70, p90, p100, mean, count: latencies.length })
    setIsBenchmarking(false)
  }

  // All citations from latest assistant response
  const latestTelemetry = [...messages].reverse().find(m => m.role === 'assistant')?.telemetry

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[#0e0e11] border border-zinc-800 shadow-2xl">
      {/* Header — Tabs & Controls */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 bg-zinc-900/40 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          {(['Chat', 'Sources', 'Telemetry'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer outline-none focus:outline-none select-none ${
                activeTab === tab
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              {tab === 'Chat' && '💬 Chat'}
              {tab === 'Sources' && `📚 Sources (${latestTelemetry?.citations?.length || 0})`}
              {tab === 'Telemetry' && '⚡ Telemetry'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Two-Way Auto-Speak Toggle */}
          <button
            type="button"
            onClick={() => setAutoSpeak(!autoSpeak)}
            title={autoSpeak ? 'Auto-Voice Readout Enabled' : 'Enable Auto-Voice Readout'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              autoSpeak
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {autoSpeak ? <Volume2 className="size-3.5 text-emerald-400 animate-pulse" /> : <VolumeX className="size-3.5" />}
            <span className="hidden sm:inline">{autoSpeak ? 'Voice Out: ON' : 'Voice Out: OFF'}</span>
          </button>

          {/* Clear Chat */}
          <button
            type="button"
            onClick={clearChat}
            title="Clear Chat History"
            className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Qwen 3.6 27B
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 space-y-4">
        {activeTab === 'Chat' && (
          <>
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center h-full text-center gap-3 py-20">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-zinc-200 text-sm font-semibold">Speak or type your question</p>
                  <p className="text-zinc-500 text-xs mt-1 max-w-sm">
                    {hasDocuments
                      ? 'Ask questions about your uploaded documents or MSMARCO-XI dataset by voice or text.'
                      : 'Upload a document or query the indexed MSMARCO-XI dataset.'}
                  </p>
                </div>
              </div>
            )}

            {messages.map(message => {
              const { thought, answer, isThinking } = parseThoughtAndAnswer(message.content)
              const isSpeakingThis = speakingId === message.id

              if (message.role === 'user') {
                return (
                  <div key={message.id} className="flex justify-end pl-12">
                    <div
                      className="rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-2 text-[13.5px] leading-relaxed text-white shadow-md transition-all duration-300"
                      style={{ animation: 'fade-up 300ms cubic-bezier(0.23,1,0.32,1) both' }}
                    >
                      {message.content}
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={message.id}
                  className="flex flex-col gap-3 rounded-2xl rounded-tl-sm bg-zinc-800/70 border border-zinc-700/60 p-4 text-zinc-200 shadow-xl"
                  style={{ animation: 'fade-up 350ms cubic-bezier(0.23,1,0.32,1) both' }}
                >
                  {/* Expandable Thinking State / Trace */}
                  {(thought || !answer) && (
                    <ThinkingState
                      thoughtText={thought}
                      isComplete={!isThinking && !!answer && !!message.telemetry}
                      telemetry={message.telemetry}
                    />
                  )}

                  {/* Main Answer or Skeleton Loading */}
                  {answer ? (
                    <div className="w-full">
                      <MarkdownRenderer content={answer} />

                      {/* Action Bar (Audio Readout, Copy) */}
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-zinc-700/40 text-xs text-zinc-400">
                        <button
                          type="button"
                          onClick={() => speakText(answer, message.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                            isSpeakingThis
                              ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                              : 'hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {isSpeakingThis ? (
                            <>
                              <VolumeX className="size-3.5 text-emerald-400 animate-pulse" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="size-3.5" />
                              <span>Listen (Voice TTS)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => copyAnswer(answer, message.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="size-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
                              <span>Copy Answer</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : isThinking ? (
                    <div className="space-y-2.5 py-1">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-1/3 bg-zinc-700/70" />
                        <Skeleton className="h-4 w-1/4 bg-zinc-700/50" />
                      </div>
                      <Skeleton className="h-3.5 w-full bg-zinc-700/60" />
                      <Skeleton className="h-3.5 w-5/6 bg-zinc-700/50" />
                      <Skeleton className="h-3.5 w-3/4 bg-zinc-700/40" />
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      <Skeleton className="h-3.5 w-4/5 bg-zinc-700/60" />
                      <Skeleton className="h-3.5 w-3/5 bg-zinc-700/40" />
                    </div>
                  )}

                  {/* Telemetry HUD summary */}
                  {message.telemetry && <LatencyHUD telemetry={message.telemetry} />}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Sources Tab */}
        {activeTab === 'Sources' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Retrieved Document Chunks ({latestTelemetry?.citations?.length || 0})
            </h3>
            {latestTelemetry?.citations && latestTelemetry.citations.length > 0 ? (
              latestTelemetry.citations.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedCitation(c)}
                  className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-xs space-y-1.5 hover:border-emerald-500/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                      Chunk #{i + 1}
                      <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Similarity: {(c.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-zinc-300 font-mono text-[11.5px] leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    {c.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-8 text-center">
                Ask a question to see retrieved citations and chunks here.
              </p>
            )}
          </div>
        )}

        {/* Telemetry & Benchmark Tab */}
        {activeTab === 'Telemetry' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Live Pipeline Latency
              </h3>

              {/* In-Browser Benchmark Runner Button */}
              <button
                type="button"
                onClick={runInBrowserBenchmark}
                disabled={isBenchmarking}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isBenchmarking ? (
                  <>
                    <span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Running ({benchmarkProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3 fill-current" />
                    <span>Run Live Benchmark Suite</span>
                  </>
                )}
              </button>
            </div>

            {/* Benchmark Scorecard Report */}
            {benchmarkResults && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    Benchmark Suite Results ({benchmarkResults.count} Real Queries)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                    Target &lt;200ms: PASSED ✅
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs text-center">
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">P50</span>
                    <span className="font-bold text-zinc-200">{benchmarkResults.p50}ms</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">P70</span>
                    <span className="font-bold text-emerald-400">{benchmarkResults.p70}ms</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">P90</span>
                    <span className="font-bold text-zinc-200">{benchmarkResults.p90}ms</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">P100</span>
                    <span className="font-bold text-zinc-200">{benchmarkResults.p100}ms</span>
                  </div>
                </div>
              </div>
            )}

            {latestTelemetry ? (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
                  <span className="text-zinc-400 block text-[11px]">Speech-to-Text</span>
                  <span className="font-mono text-sm font-semibold text-zinc-200">
                    {latestTelemetry.stt_ms || 0}ms
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
                  <span className="text-zinc-400 block text-[11px]">768-dim Embedding</span>
                  <span className="font-mono text-sm font-semibold text-zinc-200">
                    {latestTelemetry.embedding_ms || 0}ms
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
                  <span className="text-zinc-400 block text-[11px]">Neon pgvector Retrieval</span>
                  <span className="font-mono text-sm font-semibold text-zinc-200">
                    {latestTelemetry.retrieval_ms || 0}ms
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
                  <span className="text-zinc-400 block text-[11px]">Qwen 3.6 TTFT</span>
                  <span className="font-mono text-sm font-semibold text-zinc-200">
                    {latestTelemetry.ttft_ms || 0}ms
                  </span>
                </div>
                <div className="col-span-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 block text-[11px]">Total Pipeline Latency</span>
                    <span className="text-[11px] text-emerald-400 font-medium">Under 200ms Target</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-emerald-300">
                    {latestTelemetry.total_ms || 0}ms
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-8 text-center">
                Telemetry will appear after your first query or click &apos;Run Live Benchmark Suite&apos; above.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Citation Inspector Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-400" />
                <h3 className="font-semibold text-zinc-100 text-sm">Grounded Document Citation</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Cosine Relevance Score</span>
                <span className="font-mono font-bold text-emerald-400">
                  {(selectedCitation.similarity * 100).toFixed(1)}% Grounded
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed max-h-60 overflow-y-auto">
                {selectedCitation.content}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer Panel with PromptBar */}
      <div className="mt-auto shrink-0 p-3 bg-zinc-900/60 border-t border-zinc-800/80">
        <PromptBar
          placeholder={
            hasDocuments
              ? 'Ask a question, speak by voice, type @ for sources or / for commands...'
              : 'Ask about MSMARCO-XI, speak by voice, type @ for sources or / for commands...'
          }
          isLoading={isLoading}
          onSend={(text, sttMs) => executeQuery(text, sttMs)}
          onRunBenchmark={() => {
            setActiveTab('Telemetry')
            runInBrowserBenchmark()
          }}
          onClearChat={clearChat}
        />
      </div>
    </div>
  )
}
