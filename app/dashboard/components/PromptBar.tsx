'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import VoiceRecorder from './VoiceRecorder'

function Icon({
  children,
  size = 15,
  strokeWidth = 1.8,
}: {
  children: React.ReactNode
  size?: number
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const GLYPHS: Record<string, React.ReactNode> = {
  clip: (
    <path d="m21.4 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  layers: (
    <g>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </g>
  ),
  globe: (
    <g>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </g>
  ),
}

export type Source = {
  key: string
  name: string
  desc: string
  glyph?: string
  attach?: boolean
  connect?: boolean
}

const SOURCES: Source[] = [
  { key: 'attach', name: 'Add photos & files', desc: 'Upload documents (.pdf, .docx, .txt)', glyph: 'clip', attach: true },
  { key: 'msmarco', name: 'MSMARCO-XI Dataset', desc: 'AI4Bharat Indic benchmark passages', glyph: 'layers' },
  { key: 'docs', name: 'My Documents', desc: 'Active user-uploaded knowledge base', glyph: 'chart' },
  { key: 'vector', name: 'pgvector 768-dim', desc: 'Neon Serverless vector similarity index', glyph: 'globe' },
]

const COMMANDS = [
  { key: 'benchmark', name: '/benchmark', desc: 'Run live latency & accuracy test suite' },
  { key: 'summarize', name: '/summarize', desc: 'Summarize key retrieved passages' },
  { key: 'compare', name: '/compare', desc: 'Compare chunking strategies' },
  { key: 'citations', name: '/citations', desc: 'Inspect source chunk similarity scores' },
  { key: 'clear', name: '/clear', desc: 'Reset conversation thread' },
]

export const MODELS = [
  { key: 'qwen3.6-27b', name: 'Qwen 3.6 27B', tag: 'Flagship' },
  { key: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Fast' },
  { key: 'llama-3.3-70b', name: 'Llama 3.3 70B', tag: 'Versatile' },
]

function parseToken(draft: string): { kind: 'at' | 'slash'; query: string; start: number } | null {
  const match = /(^|\s)([@/])([\w-]*)$/.exec(draft)
  if (!match) return null
  return {
    kind: match[2] === '@' ? 'at' : 'slash',
    query: match[3].toLowerCase(),
    start: match.index + match[1].length,
  }
}

interface PromptBarProps {
  variant?: 'Rounded' | 'Pill'
  placeholder?: string
  isLoading?: boolean
  onSend: (text: string, sttMs?: number) => void
  onRunBenchmark?: () => void
  onClearChat?: () => void
  onOpenUpload?: () => void
}

export default function PromptBar({
  placeholder = 'Ask a question or speak by voice...',
  isLoading = false,
  onSend,
  onRunBenchmark,
  onClearChat,
  onOpenUpload,
}: PromptBarProps) {
  const [draft, setDraft] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [plusOpen, setPlusOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [model, setModel] = useState(MODELS[0])
  const [attachments, setAttachments] = useState<string[]>([])
  const [active, setActive] = useState(0)
  const [rowBox, setRowBox] = useState<{ top: number; height: number } | null>(null)
  const [engaged, setEngaged] = useState(false)
  const [modelHovered, setModelHovered] = useState<number | null>(null)

  const composerAnchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const modelRef = useRef<HTMLButtonElement>(null)
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([])
  const modelRowRefs = useRef<(HTMLButtonElement | null)[]>([])

  const token = dismissed ? null : parseToken(draft)
  const menu: 'at' | 'slash' | null = plusOpen ? 'at' : token?.kind ?? null
  const query = plusOpen ? '' : token?.query ?? ''

  const rows =
    menu === 'at'
      ? SOURCES.filter(s => s.name.toLowerCase().includes(query))
      : menu === 'slash'
      ? COMMANDS.filter(c => c.name.slice(1).startsWith(query))
      : []

  useEffect(() => {
    setActive(0)
    setEngaged(false)
  }, [menu, query])

  useLayoutEffect(() => {
    const target = rowRefs.current[active]
    if (target) setRowBox({ top: target.offsetTop, height: target.offsetHeight })
  }, [menu, query, active, rows.length])

  useEffect(() => {
    if (!modelOpen) setModelHovered(null)
  }, [modelOpen])

  const selectModel = (next: (typeof MODELS)[number]) => {
    setModel(next)
    setModelOpen(false)
  }

  // Auto-resize textarea smoothly
  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return

    input.style.height = 'auto'
    const nextHeight = Math.min(Math.max(input.scrollHeight, 24), 120)
    input.style.height = `${nextHeight}px`
  }, [draft])

  useEffect(() => {
    if (!modelOpen && !plusOpen) return
    const close = (event: PointerEvent) => {
      if (!(event.target as Element).closest('[data-promptbar]')) {
        setModelOpen(false)
        setPlusOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [modelOpen, plusOpen])

  const closeMenus = () => {
    setPlusOpen(false)
    setModelOpen(false)
  }

  const pick = (row: { key: string; name: string }) => {
    if (row.key === 'attach') {
      onOpenUpload?.()
      setPlusOpen(false)
      return
    }
    if (row.key === 'benchmark') {
      onRunBenchmark?.()
      setDraft('')
      closeMenus()
      return
    }
    if (row.key === 'clear') {
      onClearChat?.()
      setDraft('')
      closeMenus()
      return
    }

    if (menu === 'at') {
      setDraft(`${token ? draft.slice(0, token.start) : draft}@${row.name} `)
    } else {
      setDraft(`${token ? draft.slice(0, token.start) : draft}${row.name} `)
    }
    setPlusOpen(false)
    setDismissed(false)
    inputRef.current?.focus()
  }

  const canSend = (draft.trim().length > 0 || attachments.length > 0) && !isLoading

  const send = () => {
    if (!canSend) return
    onSend(draft.trim())
    setDraft('')
    setAttachments([])
    closeMenus()
  }

  const handleVoiceTranscription = (text: string, sttMs: number) => {
    onSend(text, sttMs)
  }

  return (
    <div data-promptbar className="w-full font-['Space_Grotesk',sans-serif]">
      <div ref={composerAnchorRef} className="relative">
        {/* @ / slash menu */}
        {menu && (
          <div
            onMouseLeave={() => setEngaged(false)}
            className="absolute inset-x-0 bottom-full z-30 mb-2 rounded-xl bg-[#171305] border-3 border-black p-1.5 shadow-[6px_6px_0_0_#000] backdrop-blur-md max-h-56 overflow-y-auto"
            style={{ animation: 'pop-in 180ms cubic-bezier(0.23,1,0.32,1) both', transformOrigin: 'bottom center' }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-1.5 rounded bg-[#1f1c0b]"
              style={{
                top: rowBox?.top ?? 0,
                height: rowBox?.height ?? 0,
                opacity: rowBox && engaged && rows.length > 0 ? 1 : 0,
                transition:
                  'top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease',
              }}
            />
            {rows.map((row, i) => {
              const source = menu === 'at' ? SOURCES.find(s => s.key === row.key) : undefined
              return (
                <button
                  key={row.key}
                  type="button"
                  ref={el => {
                    rowRefs.current[i] = el
                  }}
                  onMouseDown={event => event.preventDefault()}
                  onMouseEnter={() => {
                    setActive(i)
                    setEngaged(true)
                  }}
                  onClick={() => pick(row)}
                  className="relative z-10 flex h-8.5 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-[#d2691e] hover:text-black transition-colors cursor-pointer group"
                >
                  {source && (
                    <span className="flex size-4 shrink-0 items-center justify-center text-[#ffdb3c] group-hover:text-black">
                      <Icon size={14}>{GLYPHS[source.glyph ?? 'clip']}</Icon>
                    </span>
                  )}
                  <span className="shrink-0 text-xs font-bold text-[#f5f5f0] group-hover:text-black">
                    {row.name}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-400 group-hover:text-black font-['Be_Vietnam_Pro',sans-serif]">{row.desc}</span>
                </button>
              )
            })}
            {rows.length === 0 && (
              <div className="flex h-8 items-center px-2 text-xs text-zinc-400">
                No matches for “{query}”
              </div>
            )}
            <div className="mt-1 border-t border-black px-2 pt-1 pb-0.5 text-[10px] text-zinc-400 font-mono">
              {menu === 'at' ? 'Type to search sources & files' : 'Type to search commands'}
            </div>
          </div>
        )}

        {/* Model Menu Dropdown */}
        {modelOpen && (
          <div
            onMouseLeave={() => setModelHovered(null)}
            className="absolute left-0 bottom-full z-30 mb-2 w-48 rounded-xl bg-[#171305] border-3 border-black p-1.5 shadow-[6px_6px_0_0_#000] backdrop-blur-md"
            style={{
              animation: 'pop-in 180ms cubic-bezier(0.23,1,0.32,1) both',
              transformOrigin: 'bottom left',
            }}
          >
            {MODELS.map((m, i) => (
              <button
                key={m.key}
                type="button"
                ref={el => {
                  modelRowRefs.current[i] = el
                }}
                onMouseDown={event => event.preventDefault()}
                onMouseEnter={() => setModelHovered(i)}
                onClick={() => {
                  selectModel(m)
                  inputRef.current?.focus()
                }}
                className="relative z-10 flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-[#d2691e] hover:text-black transition-colors cursor-pointer group"
              >
                <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-200 group-hover:text-black">{m.name}</span>
                <span className="shrink-0 text-[10px] text-zinc-400 group-hover:text-black font-mono">{m.tag}</span>
                <span className={`shrink-0 text-[#ffdb3c] group-hover:text-black ${m.key === model.key ? '' : 'invisible'}`}>
                  <Icon size={12} strokeWidth={2.5}>
                    <path d="M20 6L9 17l-5-5" />
                  </Icon>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ChatGPT-Native Mobile Responsive Composer Box */}
        <div className="flex flex-col border-3 border-black bg-[#1f1c0b] shadow-[4px_4px_0_0_#000] rounded-xl p-2.5 transition-all focus-within:border-[#d2691e] gap-2">
          
          {/* Row 1: Full-Width Multiline Textarea */}
          <div className="w-full">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={event => {
                setDraft(event.target.value)
                setDismissed(false)
                setPlusOpen(false)
              }}
              onKeyDown={event => {
                if (menu && rows.length > 0) {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    setEngaged(true)
                    setActive(current => (current + (event.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length)
                    return
                  }
                  if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') {
                    event.preventDefault()
                    pick(rows[active])
                    return
                  }
                }
                if (event.key === 'Escape') {
                  setDismissed(true)
                  closeMenus()
                  return
                }
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  send()
                }
              }}
              placeholder={placeholder}
              aria-label="Ask Voice RAG"
              className="w-full resize-none bg-transparent text-[#f5f5f0] text-xs sm:text-sm leading-relaxed outline-none font-bold placeholder:text-zinc-500 font-['Be_Vietnam_Pro',sans-serif] px-1 py-1 max-h-28 overflow-y-auto"
            />
          </div>

          {/* Row 2: Controls Toolbar (ChatGPT Mobile Pattern) */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-black/50">
            {/* Left Controls: Plus + Model Selector */}
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Plus Button */}
              <button
                type="button"
                aria-label="Add attachments and sources"
                aria-expanded={plusOpen}
                onClick={() => {
                  setModelOpen(false)
                  setPlusOpen(current => !current)
                  inputRef.current?.focus()
                }}
                className={`flex size-8 shrink-0 items-center justify-center text-[#ffdb3c] hover:bg-[#d2691e] hover:text-black border-2 border-black rounded-lg shadow-[1px_1px_0_0_#000] transition-all cursor-pointer ${
                  plusOpen ? 'bg-[#d2691e] text-black' : 'bg-[#171305]'
                }`}
              >
                <Icon size={15} strokeWidth={2.5}>
                  <path d="M12 5v14M5 12h14" />
                </Icon>
              </button>

              {/* Model Picker Pill */}
              <button
                ref={modelRef}
                type="button"
                aria-expanded={modelOpen}
                aria-label="Choose model"
                onClick={() => {
                  setPlusOpen(false)
                  setModelOpen(current => !current)
                }}
                className="flex h-8 shrink-0 items-center gap-1 px-2.5 text-[11px] font-bold text-black bg-[#ffdb3c] border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000] hover:bg-white transition-all cursor-pointer truncate max-w-[130px] sm:max-w-none"
              >
                <span className="truncate">⚡ {model.name}</span>
                <Icon size={10} strokeWidth={2.5}>
                  <path d="M6 9l6 6 6-6" />
                </Icon>
              </button>
            </div>

            {/* Right Controls: Mic + Send Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Voice Microphone */}
              <VoiceRecorder
                onTranscriptionComplete={handleVoiceTranscription}
                disabled={isLoading}
              />

              {/* Send Button */}
              <button
                type="button"
                aria-label="Send"
                disabled={!canSend}
                onClick={send}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-black shadow-[2px_2px_0_0_#000] transition-all cursor-pointer font-bold disabled:opacity-40"
                style={{
                  background: canSend ? '#e91e63' : '#2b2715',
                  color: canSend ? '#ffffff' : '#71717a',
                }}
              >
                <Icon size={15} strokeWidth={2.5}>
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </Icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
