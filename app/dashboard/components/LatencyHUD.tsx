'use client'

import { useState } from 'react'
import { Zap, ShieldCheck, ShieldAlert, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { RagCitation } from '@/lib/harness'

export interface MessageTelemetry {
  stt_ms?: number
  embedding_ms?: number
  retrieval_ms?: number
  ttft_ms?: number
  total_ms?: number
  is_refusal?: boolean
  confidence?: number
  citations?: RagCitation[]
}

interface LatencyHUDProps {
  telemetry?: MessageTelemetry
}

export default function LatencyHUD({ telemetry }: LatencyHUDProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (!telemetry || !telemetry.total_ms) {
    return null
  }

  const {
    stt_ms = 0,
    embedding_ms = 0,
    retrieval_ms = 0,
    ttft_ms = 0,
    total_ms = 0,
    is_refusal = false,
    confidence = 1,
    citations = []
  } = telemetry

  // Latency styling
  const isUltraFast = total_ms <= 200
  const isFast = total_ms <= 500

  const badgeColor = isUltraFast
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
    : isFast
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
    : 'bg-zinc-800 text-zinc-400 border-zinc-700'

  return (
    <div className="mt-2.5 pt-2 border-t border-zinc-700/50 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        {/* Total Latency Badge */}
        <div
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-medium tabular-nums ${badgeColor}`}
          title="End-to-End Latency"
        >
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>{total_ms}ms total</span>
          {isUltraFast && (
            <span className="bg-emerald-500 text-zinc-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase ml-1">
              &lt;200ms
            </span>
          )}
        </div>

        {/* Guardrail & Groundedness Badge */}
        {is_refusal ? (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border bg-red-500/10 text-red-400 border-red-500/25 font-medium">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>Refusal (Grounded Gate)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border bg-teal-500/10 text-teal-400 border-teal-500/25 font-medium">
            <ShieldCheck className="w-3 h-3 text-teal-400" />
            <span>{Math.round(confidence * 100)}% Grounded</span>
          </div>
        )}

        {/* Citations Count */}
        {citations.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700"
          >
            <FileText className="w-3 h-3 text-zinc-400" />
            <span>{citations.length} sources</span>
            {showDetails ? (
              <ChevronUp className="w-3 h-3 ml-0.5" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-0.5" />
            )}
          </button>
        )}
      </div>

      {/* Stage Breakdown Pill bar */}
      <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500 mt-1.5 tabular-nums">
        {stt_ms > 0 && <span>STT: <strong className="text-zinc-300">{stt_ms}ms</strong></span>}
        {embedding_ms > 0 && <span>Embed: <strong className="text-zinc-300">{embedding_ms}ms</strong></span>}
        {retrieval_ms > 0 && <span>Retrieval: <strong className="text-zinc-300">{retrieval_ms}ms</strong></span>}
        {ttft_ms > 0 && <span>TTFT: <strong className="text-zinc-300">{ttft_ms}ms</strong></span>}
      </div>

      {/* Citations Details Drawer */}
      {showDetails && citations.length > 0 && (
        <div className="mt-2.5 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-2">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Retrieved Context Chunks
          </p>
          {citations.map((c, i) => (
            <div key={i} className="p-2 bg-zinc-950/70 rounded border border-zinc-800/80 text-[11px]">
              <div className="flex justify-between text-zinc-400 mb-1">
                <span className="font-mono text-zinc-500">Chunk #{i + 1}</span>
                <span className="text-emerald-400 font-medium font-mono">
                  {(c.similarity * 100).toFixed(1)}% match
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed font-sans">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
