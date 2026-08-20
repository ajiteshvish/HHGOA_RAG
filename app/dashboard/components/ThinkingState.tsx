'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles, Brain, Check, Loader2 } from 'lucide-react'
import { MessageTelemetry } from './LatencyHUD'

interface ThinkingStateProps {
  variant?: 'Steps' | 'Reasoning' | 'Search' | 'Coding'
  thoughtText?: string | null
  isComplete?: boolean
  telemetry?: MessageTelemetry
}

export default function ThinkingState({
  thoughtText,
  isComplete = false,
  telemetry,
}: ThinkingStateProps) {
  const isWorking = !isComplete
  const [expanded, setExpanded] = useState(false)

  const totalTimeSec = telemetry?.total_ms
    ? (telemetry.total_ms / 1000).toFixed(1)
    : '1.2'

  return (
    <div className="w-full rounded-lg bg-[#171305] border-2 border-black shadow-[2px_2px_0_0_#000] overflow-hidden mb-3 font-['Space_Grotesk',sans-serif]">
      {/* Header Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#1f1c0b] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isWorking ? (
            <Sparkles className="w-4 h-4 text-[#ffdb3c] animate-pulse" />
          ) : (
            <Brain className="w-4 h-4 text-[#e91e63]" />
          )}

          {isWorking ? (
            <span
              className="bg-clip-text text-xs font-bold text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, #ffdb3c 35%, #fafafa 50%, #ffdb3c 65%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer-text 1.4s linear infinite',
              }}
            >
              Thinking &amp; Reasoning (Qwen 3.6)...
            </span>
          ) : (
            <span className="text-xs font-bold text-zinc-200">
              Thought for {totalTimeSec} seconds
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          <span className="text-[11px] font-mono font-bold text-[#ffdb3c]">
            {expanded ? 'Hide trace' : 'View reasoning'}
          </span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Expandable Trace & Reasoning Content */}
      {expanded && (
        <div className="border-t-2 border-black bg-black/40 p-3 space-y-3">
          {/* Real Pipeline Telemetry Steps */}
          {telemetry && (
            <div className="space-y-1.5 pb-2 border-b-2 border-zinc-800">
              <div className="text-[10.5px] font-bold text-[#d2691e] uppercase tracking-wider">
                Pipeline Trace
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                {telemetry.stt_ms !== undefined && telemetry.stt_ms > 0 && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded bg-[#1f1c0b] border border-black text-zinc-200">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Check className="w-3 h-3 text-[#ffdb3c]" /> Voice STT
                    </span>
                    <span className="text-[#ffdb3c] font-bold">{telemetry.stt_ms}ms</span>
                  </div>
                )}
                {telemetry.embedding_ms !== undefined && telemetry.embedding_ms > 0 && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded bg-[#1f1c0b] border border-black text-zinc-200">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Check className="w-3 h-3 text-[#ffdb3c]" /> Gemini Embedding
                    </span>
                    <span className="text-[#ffdb3c] font-bold">{telemetry.embedding_ms}ms</span>
                  </div>
                )}
                {telemetry.retrieval_ms !== undefined && telemetry.retrieval_ms > 0 && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded bg-[#1f1c0b] border border-black text-zinc-200">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Check className="w-3 h-3 text-[#ffdb3c]" /> Neon pgvector ({telemetry.citations?.length || 0} chunks)
                    </span>
                    <span className="text-[#ffdb3c] font-bold">{telemetry.retrieval_ms}ms</span>
                  </div>
                )}
                {telemetry.ttft_ms !== undefined && telemetry.ttft_ms > 0 && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded bg-[#1f1c0b] border border-black text-zinc-200">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Check className="w-3 h-3 text-[#ffdb3c]" /> Qwen 3.6 TTFT
                    </span>
                    <span className="text-[#ffdb3c] font-bold">{telemetry.ttft_ms}ms</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Model Thought Process Prose */}
          {thoughtText ? (
            <div>
              <div className="text-[10.5px] font-bold text-[#d2691e] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Model Reasoning Chain</span>
                <span className="text-[#e91e63] text-[10px] lowercase font-normal font-mono">qwen/qwen3.6-27b</span>
              </div>
              <div className="max-h-60 overflow-y-auto rounded bg-[#171305] border-2 border-black p-3 text-[11.5px] font-mono leading-relaxed text-zinc-300 whitespace-pre-wrap select-text">
                {thoughtText}
              </div>
            </div>
          ) : isWorking ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d2691e]" />
              <span>Analyzing document context and formulating response...</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
