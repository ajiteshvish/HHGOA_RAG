"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Sparkles, Brain, Check, Loader2 } from "lucide-react";
import { MessageTelemetry } from "./LatencyHUD";

interface ThinkingStateProps {
  variant?: "Steps" | "Reasoning" | "Search" | "Coding";
  thoughtText?: string | null;
  isComplete?: boolean;
  telemetry?: MessageTelemetry;
}

export default function ThinkingState({
  thoughtText,
  isComplete = false,
  telemetry,
}: ThinkingStateProps) {
  const isWorking = !isComplete;
  // Default to collapsed when done, open while working
  const [expanded, setExpanded] = useState(false);

  const totalTimeSec = telemetry?.total_ms
    ? (telemetry.total_ms / 1000).toFixed(1)
    : "1.2";

  return (
    <div className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden mb-3">
      {/* Header Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isWorking ? (
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          ) : (
            <Brain className="w-4 h-4 text-purple-400" />
          )}

          {isWorking ? (
            <span
              className="bg-clip-text text-xs font-medium text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #a1a1aa 35%, #fafafa 50%, #a1a1aa 65%)",
                backgroundSize: "200% 100%",
                animation: "shimmer-text 1.4s linear infinite",
              }}
            >
              Thinking &amp; Reasoning (Qwen 3.6)...
            </span>
          ) : (
            <span className="text-xs font-medium text-zinc-300">
              Thought for {totalTimeSec} seconds
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-500">
          <span className="text-[11px] font-mono text-zinc-500">
            {expanded ? "Hide trace" : "View reasoning"}
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
        <div className="border-t border-zinc-800/80 bg-black/20 p-3 space-y-3">
          {/* Real Pipeline Telemetry Steps */}
          {telemetry && (
            <div className="space-y-1.5 pb-2 border-b border-zinc-800/60">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Pipeline Trace
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                {telemetry.stt_ms !== undefined && telemetry.stt_ms > 0 && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded bg-zinc-800/40 text-zinc-300">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Check className="w-3 h-3 text-emerald-400" /> Voice STT
                    </span>
                    <span className="text-emerald-400 font-semibold">{telemetry.stt_ms}ms</span>
                  </div>
                )}
                {telemetry.embedding_ms !== undefined && telemetry.embedding_ms > 0 && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded bg-zinc-800/40 text-zinc-300">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Check className="w-3 h-3 text-emerald-400" /> Gemini Embedding
                    </span>
                    <span className="text-emerald-400 font-semibold">{telemetry.embedding_ms}ms</span>
                  </div>
                )}
                {telemetry.retrieval_ms !== undefined && telemetry.retrieval_ms > 0 && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded bg-zinc-800/40 text-zinc-300">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Check className="w-3 h-3 text-emerald-400" /> Neon pgvector ({telemetry.citations?.length || 0} chunks)
                    </span>
                    <span className="text-emerald-400 font-semibold">{telemetry.retrieval_ms}ms</span>
                  </div>
                )}
                {telemetry.ttft_ms !== undefined && telemetry.ttft_ms > 0 && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded bg-zinc-800/40 text-zinc-300">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Check className="w-3 h-3 text-emerald-400" /> Qwen 3.6 TTFT
                    </span>
                    <span className="text-emerald-400 font-semibold">{telemetry.ttft_ms}ms</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Model Thought Process Prose */}
          {thoughtText ? (
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Model Reasoning Chain</span>
                <span className="text-purple-400 text-[10px] lowercase font-normal">qwen/qwen3.6-27b</span>
              </div>
              <div className="max-h-60 overflow-y-auto rounded-lg bg-zinc-950/80 border border-zinc-800 p-3 text-[12px] font-mono leading-relaxed text-zinc-300 whitespace-pre-wrap select-text">
                {thoughtText}
              </div>
            </div>
          ) : isWorking ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Analyzing document context and formulating response...</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
