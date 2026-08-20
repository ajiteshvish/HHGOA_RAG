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

  const isUltraFast = total_ms <= 200

  return (
    <div className="mt-2.5 pt-2 border-t-2 border-black text-xs font-['Space_Grotesk',sans-serif]">
      <div className="flex flex-wrap items-center gap-2">
        {/* Total Latency Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1f1c0b] border-2 border-black shadow-[2px_2px_0_0_#000] font-bold text-zinc-200"
          title="End-to-End Latency"
        >
          <Zap className="w-3.5 h-3.5 text-[#ffdb3c]" />
          <span>{total_ms}ms total</span>
          {isUltraFast && (
            <span className="bg-[#d2691e] text-black text-[9.5px] font-bold px-1.5 py-0.2 rounded border border-black uppercase ml-1">
              &lt;200ms
            </span>
          )}
        </div>

        {/* Guardrail & Groundedness Badge */}
        {is_refusal ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#e91e63] text-white border-2 border-black shadow-[2px_2px_0_0_#000] font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
            <span>Refusal (Grounded Gate)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#d2691e] text-black border-2 border-black shadow-[2px_2px_0_0_#000] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>{Math.round(confidence * 100)}% Grounded</span>
          </div>
        )}

        {/* Citations Count */}
        {citations.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1f1c0b] hover:bg-[#d2691e] text-zinc-300 hover:text-black font-bold transition-all border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{citations.length} sources</span>
            {showDetails ? (
              <ChevronUp className="w-3 h-3 ml-0.5" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-0.5" />
            )}
          </button>
        )}
      </div>

      {/* Stage Breakdown */}
      <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400 font-mono mt-2">
        {stt_ms > 0 && <span>STT: <strong className="text-[#ffdb3c] font-bold">{stt_ms}ms</strong></span>}
        {embedding_ms > 0 && <span>Embed: <strong className="text-[#ffdb3c] font-bold">{embedding_ms}ms</strong></span>}
        {retrieval_ms > 0 && <span>Retrieval: <strong className="text-[#ffdb3c] font-bold">{retrieval_ms}ms</strong></span>}
        {ttft_ms > 0 && <span>TTFT: <strong className="text-[#ffdb3c] font-bold">{ttft_ms}ms</strong></span>}
      </div>

      {/* Citations Details Drawer */}
      {showDetails && citations.length > 0 && (
        <div className="mt-2.5 p-3 bg-[#171305] border-2 border-black rounded-lg shadow-[3px_3px_0_0_#000] space-y-2">
          <p className="text-[10.5px] font-bold text-[#d2691e] uppercase tracking-wider">
            Retrieved Context Chunks
          </p>
          {citations.map((c, i) => (
            <div key={i} className="p-2.5 bg-[#1f1c0b] rounded border border-black text-xs space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span className="font-mono text-[11px] font-bold text-[#ffdb3c]">Chunk #{i + 1}</span>
                <span className="text-[#d2691e] font-bold font-mono text-[11px]">
                  {(c.similarity * 100).toFixed(1)}% match
                </span>
              </div>
              <p className="text-zinc-200 leading-relaxed font-['Be_Vietnam_Pro',sans-serif] text-xs">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
