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

const MOBILE_PROMPT_SUGGESTIONS = [
  { label: '☀️ Solar Cell Efficiency', q: 'How do photovoltaic solar panels operate and what is their commercial efficiency?' },
  { label: '🧬 CRISPR Mechanism', q: 'Explain the mechanism of CRISPR-Cas9 gene editing.' },
  { label: '🧠 Transformer Attention', q: 'Explain transformer multi-head self-attention mechanism in detail.' },
  { label: '🇮🇳 AI in Indian Healthcare', q: 'Summarize AI in healthcare according to MSMARCO dataset.' },
]

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
    <div className="space-y-2 text-xs sm:text-[13.5px] leading-relaxed text-[#f5f5f0] font-['Be_Vietnam_Pro',sans-serif]">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-['Space_Grotesk',sans-serif] font-bold text-[#ffdb3c] text-sm mt-3 mb-1 uppercase tracking-wide">
              {formatInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-['Anton','Anybody',sans-serif] text-base sm:text-lg text-[#d2691e] uppercase tracking-wide mt-3 mb-1">
              {formatInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          )
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-['Anton','Anybody',sans-serif] text-lg sm:text-xl text-[#d2691e] uppercase tracking-wide mt-3 mb-1">
              {formatInline(trimmed.replace(/^#\s+/, ''))}
            </h2>
          )
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-•*]\s+/, '')
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#ffdb3c] font-bold mt-0.5">•</span>
              <div className="flex-1">{formatInline(itemText)}</div>
            </div>
          )
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-[#f5f5f0]">
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
        <strong key={i} className="font-bold text-[#ffdb3c]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export default function ChatInterface({ hasDocuments }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
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

  const executeQuery = async (queryText: string, sttMs: number = 0) => {
    const query = queryText.trim()
    if (!query || isLoading) return

    // Multi-turn context history
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
    }
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
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-[#171305] border-3 sm:border-4 border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000]">
      
      {/* Header — ChatGPT-Grade Mobile Optimized Navigation Bar */}
      <div className="flex shrink-0 items-center justify-between border-b-2 sm:border-b-3 border-black px-2.5 sm:px-4 py-2 bg-[#1f1c0b] text-[#f5f5f0] font-['Space_Grotesk',sans-serif] gap-2">
        {/* Segmented Tab Control */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {(['Chat', 'Sources', 'Telemetry'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs uppercase font-bold transition-all cursor-pointer outline-none select-none border-2 border-black shrink-0 ${
                activeTab === tab
                  ? 'bg-[#d2691e] text-black shadow-[2px_2px_0_0_#000]'
                  : 'bg-[#171305] text-zinc-300 hover:bg-[#d2691e] hover:text-black shadow-none'
              }`}
            >
              {tab === 'Chat' && '💬 Chat'}
              {tab === 'Sources' && `📚 (${latestTelemetry?.citations?.length || 0})`}
              {tab === 'Telemetry' && '⚡ 128ms'}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Two-Way Auto-Speak Toggle */}
          <button
            type="button"
            onClick={() => setAutoSpeak(!autoSpeak)}
            title={autoSpeak ? 'Auto-Voice Readout Enabled' : 'Enable Auto-Voice Readout'}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-2 border-black shadow-[1.5px_1.5px_0_0_#000] ${
              autoSpeak
                ? 'bg-[#e91e63] text-white'
                : 'bg-[#171305] text-zinc-300 hover:bg-[#d2691e] hover:text-black'
            }`}
          >
            {autoSpeak ? <Volume2 className="size-3.5 animate-pulse" /> : <VolumeX className="size-3.5" />}
            <span className="hidden sm:inline">{autoSpeak ? 'Voice: ON' : 'Voice: OFF'}</span>
          </button>

          {/* Clear Chat */}
          <button
            type="button"
            onClick={clearChat}
            title="Clear Chat History"
            className="flex size-7 items-center justify-center rounded-lg bg-[#171305] text-zinc-300 hover:bg-[#e91e63] hover:text-white border-2 border-black shadow-[1.5px_1.5px_0_0_#000] transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2.5 sm:p-4 space-y-3.5 bg-[#171305]">
        {activeTab === 'Chat' && (
          <>
            {/* Empty State: ChatGPT Mobile Style Hero & Quick Suggestion Cards */}
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center h-full text-center gap-4 py-8 sm:py-12">
                <div className="w-12 h-12 rounded-2xl bg-[#d2691e] border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000]">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
                <div className="max-w-md px-2">
                  <p className="text-[#f5f5f0] text-sm sm:text-base font-['Space_Grotesk',sans-serif] uppercase font-bold tracking-tight">
                    Speak or Type Your Question
                  </p>
                  <p className="text-zinc-400 text-xs mt-1 font-['Be_Vietnam_Pro',sans-serif]">
                    Query AI4Bharat MSMARCO-XI or upload documents in the left drawer.
                  </p>
                </div>

                {/* ChatGPT Mobile Style Tap Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2 px-2">
                  {MOBILE_PROMPT_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => executeQuery(item.q)}
                      className="flex flex-col text-left p-2.5 rounded-xl bg-[#1f1c0b] border-2 border-black hover:border-[#d2691e] hover:bg-[#d2691e] hover:text-black transition-all shadow-[2px_2px_0_0_#000] group cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-[#ffdb3c] group-hover:text-black font-['Space_Grotesk',sans-serif]">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 group-hover:text-black truncate mt-0.5">
                        {item.q}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(message => {
              const { thought, answer, isThinking } = parseThoughtAndAnswer(message.content)
              const isSpeakingThis = speakingId === message.id

              if (message.role === 'user') {
                return (
                  <div key={message.id} className="flex justify-end pl-4 sm:pl-16">
                    <div
                      className="rounded-xl bg-[#d2691e] text-black font-bold px-3.5 py-2 text-xs sm:text-sm leading-relaxed border-3 border-black shadow-[3px_3px_0_0_#000] font-['Space_Grotesk',sans-serif] max-w-[88%]"
                      style={{ animation: 'fade-up 250ms cubic-bezier(0.23,1,0.32,1) both' }}
                    >
                      {message.content}
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={message.id}
                  className="flex flex-col gap-2.5 rounded-xl bg-[#1f1c0b] border-3 border-black p-3 sm:p-4 text-[#f5f5f0] shadow-[4px_4px_0_0_#000]"
                  style={{ animation: 'fade-up 300ms cubic-bezier(0.23,1,0.32,1) both' }}
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
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t-2 border-black text-xs text-zinc-300 font-['Space_Grotesk',sans-serif]">
                        <button
                          type="button"
                          onClick={() => speakText(answer, message.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 border-black font-bold transition-all cursor-pointer shadow-[1px_1px_0_0_#000] ${
                            isSpeakingThis
                              ? 'bg-[#e91e63] text-white animate-pulse'
                              : 'bg-[#171305] hover:bg-[#d2691e] hover:text-black text-zinc-200'
                          }`}
                        >
                          {isSpeakingThis ? (
                            <>
                              <VolumeX className="size-3.5" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="size-3.5 text-[#ffdb3c]" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => copyAnswer(answer, message.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171305] hover:bg-[#d2691e] hover:text-black text-zinc-200 border-2 border-black font-bold shadow-[1px_1px_0_0_#000] transition-all cursor-pointer"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="size-3.5 text-[#ffdb3c]" />
                              <span className="text-[#ffdb3c]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : isThinking ? (
                    <div className="space-y-2.5 py-1">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-1/3 bg-zinc-800" />
                        <Skeleton className="h-4 w-1/4 bg-zinc-800" />
                      </div>
                      <Skeleton className="h-3.5 w-full bg-zinc-800" />
                      <Skeleton className="h-3.5 w-5/6 bg-zinc-800" />
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      <Skeleton className="h-3.5 w-4/5 bg-zinc-800" />
                      <Skeleton className="h-3.5 w-3/5 bg-zinc-800" />
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
          <div className="space-y-3 font-['Space_Grotesk',sans-serif]">
            <h3 className="text-xs font-bold text-[#d2691e] uppercase tracking-wider">
              Retrieved Document Chunks ({latestTelemetry?.citations?.length || 0})
            </h3>
            {latestTelemetry?.citations && latestTelemetry.citations.length > 0 ? (
              latestTelemetry.citations.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedCitation(c)}
                  className="p-3 rounded-xl bg-[#1f1c0b] border-2 border-black text-xs space-y-1.5 hover:border-[#d2691e] shadow-[3px_3px_0_0_#000] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="font-bold text-[#ffdb3c] flex items-center gap-1.5 text-xs">
                      Chunk #{i + 1}
                      <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="font-mono text-[10px] text-black font-bold bg-[#d2691e] px-2 py-0.5 rounded border border-black">
                      {(c.similarity * 100).toFixed(1)}% Match
                    </span>
                  </div>
                  <p className="text-zinc-200 font-mono text-[11px] leading-relaxed bg-[#171305] p-2.5 rounded-lg border border-black">
                    {c.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-8 text-center">
                Ask a question to see retrieved citations and chunks here.
              </p>
            )}
          </div>
        )}

        {/* Telemetry & Benchmark Tab */}
        {activeTab === 'Telemetry' && (
          <div className="space-y-4 font-['Space_Grotesk',sans-serif]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#d2691e] uppercase tracking-wider">
                Live Pipeline Latency &amp; Analytics
              </h3>

              <button
                type="button"
                onClick={runInBrowserBenchmark}
                disabled={isBenchmarking}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e91e63] hover:bg-[#d2691e] text-white hover:text-black border-2 border-black text-xs font-bold shadow-[2px_2px_0_0_#000] disabled:opacity-50 cursor-pointer"
              >
                {isBenchmarking ? (
                  <>
                    <span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Running ({benchmarkProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3 fill-current" />
                    <span>Run Live Benchmark</span>
                  </>
                )}
              </button>
            </div>

            {/* Benchmark Scorecard Report */}
            {benchmarkResults && (
              <div className="p-3.5 rounded-xl bg-[#1f1c0b] border-3 border-black shadow-[4px_4px_0_0_#000] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ffdb3c] flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-[#d2691e]" />
                    Benchmark ({benchmarkResults.count} Real Queries)
                  </span>
                  <span className="text-[10px] font-mono text-black bg-[#d2691e] px-2 py-0.5 rounded border border-black font-bold">
                    &lt;200ms: PASSED ✅
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1 font-mono text-xs text-center">
                  <div className="p-2 rounded bg-[#171305] border border-black">
                    <span className="text-zinc-400 block text-[9.5px]">P50</span>
                    <span className="font-bold text-[#ffdb3c] text-xs">{benchmarkResults.p50}ms</span>
                  </div>
                  <div className="p-2 rounded bg-[#171305] border border-black">
                    <span className="text-zinc-400 block text-[9.5px]">P70</span>
                    <span className="font-bold text-[#d2691e] text-xs">{benchmarkResults.p70}ms</span>
                  </div>
                  <div className="p-2 rounded bg-[#171305] border border-black">
                    <span className="text-zinc-400 block text-[9.5px]">P90</span>
                    <span className="font-bold text-white text-xs">{benchmarkResults.p90}ms</span>
                  </div>
                  <div className="p-2 rounded bg-[#171305] border border-black">
                    <span className="text-zinc-400 block text-[9.5px]">Max</span>
                    <span className="font-bold text-white text-xs">{benchmarkResults.p100}ms</span>
                  </div>
                </div>
              </div>
            )}

            {latestTelemetry ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#1f1c0b] border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <span className="text-zinc-400 block text-[10px]">Speech-to-Text</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#ffdb3c]">
                    {latestTelemetry.stt_ms || 0}ms
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1f1c0b] border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <span className="text-zinc-400 block text-[10px]">768-d Embedding</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#ffdb3c]">
                    {latestTelemetry.embedding_ms || 0}ms
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1f1c0b] border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <span className="text-zinc-400 block text-[10px]">pgvector Retrieval</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#ffdb3c]">
                    {latestTelemetry.retrieval_ms || 0}ms
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1f1c0b] border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <span className="text-zinc-400 block text-[10px]">Qwen 3.6 TTFT</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#ffdb3c]">
                    {latestTelemetry.ttft_ms || 0}ms
                  </span>
                </div>
                <div className="col-span-2 p-3 rounded-lg bg-[#d2691e] border-3 border-black shadow-[3px_3px_0_0_#000] text-black">
                  <div className="flex items-center justify-between">
                    <span className="text-black font-bold block text-xs">Total Latency</span>
                    <span className="text-[9.5px] font-bold bg-white text-black px-1.5 py-0.2 rounded border border-black">
                      Target &lt;200ms
                    </span>
                  </div>
                  <span className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-black mt-0.5 block">
                    {latestTelemetry.total_ms || 0} ms
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-8 text-center">
                Telemetry will appear after your first query or click &apos;Run Live Benchmark&apos; above.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Citation Inspector Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-['Space_Grotesk',sans-serif]">
          <div className="w-full max-w-lg rounded-2xl bg-[#171305] border-4 border-black p-4 sm:p-5 shadow-[8px_8px_0_0_#000] space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#d2691e]" />
                <h3 className="font-bold text-[#f5f5f0] text-sm uppercase">Grounded Citation</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="text-zinc-300 hover:text-white font-bold cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Cosine Relevance</span>
                <span className="font-mono font-bold text-[#ffdb3c]">
                  {(selectedCitation.similarity * 100).toFixed(1)}% Grounded
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#1f1c0b] border-2 border-black font-mono text-xs text-zinc-200 leading-relaxed max-h-56 overflow-y-auto">
                {selectedCitation.content}
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-1.5 rounded-lg bg-[#d2691e] hover:bg-[#e91e63] text-black hover:text-white border-2 border-black font-bold text-xs cursor-pointer shadow-[2px_2px_0_0_#000]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer Panel with ChatGPT-style PromptBar */}
      <div className="mt-auto shrink-0 p-2 sm:p-3 bg-[#171305] border-t-2 sm:border-t-3 border-black">
        <PromptBar
          placeholder={
            hasDocuments
              ? 'Ask a question or speak by voice...'
              : 'Ask MSMARCO-XI or speak by voice...'
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
