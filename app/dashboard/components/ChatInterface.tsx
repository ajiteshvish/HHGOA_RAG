'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Clock, MoreHorizontal, Sparkles, Trash2, FileText, Activity } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'
import LatencyHUD, { MessageTelemetry } from './LatencyHUD'
import ThinkingState from './ThinkingState'
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
                createdAt: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
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
      { id: assistantMessageId, role: 'assistant', content: '', createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
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
    try {
      await fetch('/api/chat/history', { method: 'DELETE' })
    } catch (e) {
      console.warn('Failed to clear chat history in DB:', e)
    }
  }

  // All citations from latest assistant response
  const latestTelemetry = [...messages].reverse().find(m => m.role === 'assistant')?.telemetry

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[#0e0e11] border border-zinc-800 shadow-2xl">
      {/* Header — Tabs & Quick Actions */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 bg-zinc-900/40 backdrop-blur-md">
        <div className="flex items-center gap-1">
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

        <div className="flex items-center gap-1">
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
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-zinc-300 text-sm font-medium">Speak or type your question</p>
                  <p className="text-zinc-500 text-xs mt-1 max-w-sm">
                    {hasDocuments
                      ? 'Ask questions about your uploaded documents using voice or text.'
                      : 'Upload a document first, then ask questions directly supported by your files.'}
                  </p>
                </div>
              </div>
            )}

            {messages.map(message => {
              const { thought, answer, isThinking } = parseThoughtAndAnswer(message.content)

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

                  {/* Main Answer */}
                  {answer ? (
                    <div className="w-full">
                      <MarkdownRenderer content={answer} />
                    </div>
                  ) : isThinking ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                      <span className="size-3 rounded-full border-[1.5px] border-zinc-600 border-t-emerald-400 animate-spin" />
                      Synthesizing response...
                    </div>
                  ) : null}

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
              Retrieved Document Chunks
            </h3>
            {latestTelemetry?.citations && latestTelemetry.citations.length > 0 ? (
              latestTelemetry.citations.map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-medium text-emerald-400">Chunk #{i + 1}</span>
                    <span className="font-mono text-[11px] text-zinc-500">
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

        {/* Telemetry Tab */}
        {activeTab === 'Telemetry' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Live Pipeline Latency
            </h3>
            {latestTelemetry ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
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
                  <span className="text-emerald-400 block text-[11px]">Total Pipeline Latency</span>
                  <span className="font-mono text-base font-bold text-emerald-300">
                    {latestTelemetry.total_ms || 0}ms
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-8 text-center">
                Telemetry will appear after your first query.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Composer Panel */}
      <div className="mt-auto shrink-0 p-3 bg-zinc-900/60 border-t border-zinc-800/80">
        <div
          role="presentation"
          onClick={() => inputRef.current?.focus()}
          className="flex cursor-text flex-col gap-2.5 rounded-xl border border-zinc-700/80 bg-zinc-800/70 p-3 shadow-sm transition-all duration-150 focus-within:border-emerald-500/70 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend()
            }}
            placeholder={
              hasDocuments
                ? 'Ask a question or click the mic to speak...'
                : 'Upload a document above to begin...'
            }
            disabled={isLoading}
            aria-label="Chat prompt"
            className="min-h-5 bg-transparent text-[13.5px] leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500"
          />

          <div className="flex items-center justify-between pt-1">
            {/* Voice Input Recorder */}
            <VoiceRecorder
              onTranscriptionComplete={handleVoiceTranscription}
              disabled={isLoading}
            />

            {/* Floating Send Icon */}
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              onClick={handleSend}
              className="flex size-7 items-center justify-center rounded-lg transition-all duration-200 enabled:active:scale-[0.96] cursor-pointer"
              style={{
                background: canSend ? '#34d399' : '#27272a',
                color: canSend ? '#09090b' : '#71717a',
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
