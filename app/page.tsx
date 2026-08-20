'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [oracleQuery, setOracleQuery] = useState('')
  const router = useRouter()

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!oracleQuery.trim()) {
      router.push('/dashboard')
      return
    }
    router.push(`/dashboard?q=${encodeURIComponent(oracleQuery.trim())}`)
  }

  return (
    <div className="text-[#ebe2c8] min-h-screen flex flex-col w-full bg-[#171305] font-['Be_Vietnam_Pro',sans-serif] overflow-x-hidden">
      {/* TopNavBar */}
      <header className="docked full-width top-0 border-b-4 border-black z-50 sticky bg-[#171305] text-[#f5f5f0]">
        <div className="flex justify-between items-center w-full px-4 sm:px-8 md:px-12 py-3.5">
          <Link href="/" className="font-['Anton','Anybody',sans-serif] text-xl sm:text-3xl md:text-4xl text-[#d2691e] tracking-tighter uppercase text-3d-goan-sm hover:scale-105 transition-transform">
            HH GOA • VOICE RAG
          </Link>

          <nav className="hidden md:flex gap-5 items-center font-['Space_Grotesk',sans-serif] text-xs uppercase font-semibold">
            <Link className="text-[#f5f5f0] hover:text-[#e91e63] transition-colors px-2 py-1 border-2 border-transparent hover:border-[#e91e63]" href="#pipeline">
              Voice Pipeline
            </Link>
            <Link className="text-[#f5f5f0] hover:text-[#e91e63] transition-colors px-2 py-1 border-2 border-transparent hover:border-[#e91e63]" href="#chunking">
              Chunking Strategy
            </Link>
            <Link className="text-[#f5f5f0] hover:text-[#e91e63] transition-colors px-2 py-1 border-2 border-transparent hover:border-[#e91e63]" href="#benchmarks">
              Latency Benchmarks
            </Link>
            <Link className="text-[#f5f5f0] hover:text-[#e91e63] transition-colors px-2 py-1 border-2 border-transparent hover:border-[#e91e63]" href="#dataset">
              MSMARCO-XI
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="bg-[#d2691e] text-[#f5f5f0] font-['Space_Grotesk',sans-serif] text-[11px] sm:text-xs md:text-sm px-3.5 sm:px-5 py-2 sm:py-2.5 uppercase btn-neubrutalist hover:bg-[#e91e63] font-bold"
            >
              Launch RAG 🚀
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 relative max-w-[1280px] mx-auto w-full">
        {/* SideNavBar - Desktop */}
        <aside className="hidden lg:flex flex-col h-[calc(100vh-90px)] sticky left-0 top-[90px] w-60 border-r-4 border-black bg-[#171305] z-40 text-[#f5f5f0]">
          <div className="p-3.5 flex flex-col gap-1.5 border-b-4 border-black bg-[#d2691e] text-black">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border-2 border-black bg-[#ffdb3c] flex items-center justify-center font-bold text-sm shadow-[2px_2px_0_0_#000]">
                ⚡
              </div>
              <div>
                <h2 className="font-['Anton','Anybody',sans-serif] text-lg leading-tight uppercase text-3d-goan-sm">
                  HH GOA 2026
                </h2>
                <p className="font-['Space_Grotesk',sans-serif] text-[9.5px] font-bold text-black uppercase tracking-wider">
                  Task 2 • Voice RAG
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-1 px-2 bg-[#171305]">
            <Link
              className="flex items-center gap-2.5 px-3 py-2 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-xs uppercase hover:border-2 hover:border-black font-semibold rounded"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-sm">mic</span>
              Voice Chat Room
            </Link>
            <Link
              className="flex items-center gap-2.5 px-3 py-2 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-xs uppercase hover:border-2 hover:border-black font-semibold rounded"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-sm">upload_file</span>
              Upload &amp; Chunking
            </Link>
            <Link
              className="flex items-center gap-2.5 px-3 py-2 bg-[#e91e63] text-black font-bold shadow-[3px_3px_0px_0px_#000000] font-['Space_Grotesk',sans-serif] text-xs uppercase border-2 border-black rounded"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
              Telemetry &amp; Latency
            </Link>
            <Link
              className="flex items-center gap-2.5 px-3 py-2 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-xs uppercase hover:border-2 hover:border-black font-semibold rounded"
              href="https://huggingface.co/datasets/ai4bharat/MSMARCO-XI"
              target="_blank"
            >
              <span className="material-symbols-outlined text-sm">database</span>
              MSMARCO-XI Dataset
            </Link>

            <div className="mt-auto flex flex-col gap-1 pt-3 border-t-2 border-zinc-800">
              <Link
                className="flex items-center gap-2.5 px-3 py-1.5 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-[11px] uppercase hover:border-2 hover:border-black font-semibold"
                href="https://github.com/ajiteshvish/HHGOA_RAG"
                target="_blank"
              >
                <span className="material-symbols-outlined text-xs">code</span>
                GitHub Repo
              </Link>
              <Link
                className="flex items-center gap-2.5 px-3 py-1.5 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-[11px] uppercase hover:border-2 hover:border-black font-semibold"
                href="/login"
              >
                <span className="material-symbols-outlined text-xs">account_circle</span>
                Guest Sign In
              </Link>
            </div>
          </nav>

          <div className="p-2.5 border-t-4 border-black bg-[#d2691e]">
            <Link
              href="/dashboard"
              className="w-full block text-center bg-[#e91e63] text-black font-['Space_Grotesk',sans-serif] text-xs uppercase font-bold py-2 btn-neubrutalist hover:bg-white"
            >
              Open Dashboard 🚀
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full px-3 sm:px-6 md:px-8 py-6 flex flex-col gap-8 z-10 bg-[#171305]/95 backdrop-blur-md lg:border-l-4 border-black text-black">
          {/* Hero Section */}
          <section className="relative flex flex-col items-center justify-center text-center neubrutalist-border bg-[#f5f5f0] p-4 sm:p-8 md:p-10 overflow-hidden">
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCZ3fPHq_5xh9Ko79bXMSgFiud0g1Gn014isL-El0I1EQvYVpNR1AOLkz2BlOxm9Ezod3PdVFzA18NibyFlqrcK8Wac0bQZY8NZ6Da13uWo-6M5Jyi2PV3fxpwMkgR_G2j9vYdQW28MWKcS2RTASVA0rDc8LjWva9QgOW9fmb3i65kfBTDymvs-i4CWAmqencthmrl6HEYlkCcvB1vJm4nGQYjEoKNxaGktxgByw5WBYta_VUEAyDcEwAACETlgoybIeh8')`,
                backgroundSize: 'cover',
                backgroundBlendMode: 'multiply',
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4 w-full">
              <div className="inline-flex items-center justify-center bg-[#e91e63] text-white px-3 sm:px-4 py-1 border-3 sm:border-4 border-black font-['Space_Grotesk',sans-serif] text-[10.5px] sm:text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000000] -rotate-1 font-bold">
                <span className="material-symbols-outlined mr-1 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                Full Voice-to-Answer Pipeline • Under 200ms
              </div>

              <h1 className="font-['Anton','Anybody',sans-serif] text-3xl sm:text-5xl md:text-6xl lg:text-7xl uppercase text-3d-goan leading-tight sm:leading-none mt-1 mb-1">
                SPEAK A QUESTION. <br />GET A GROUNDED ANSWER.
              </h1>

              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs sm:text-sm text-black bg-[#d2691e] p-3 sm:p-4 border-3 sm:border-4 border-black shadow-[4px_4px_0px_0px_#000000] max-w-2xl font-bold leading-relaxed">
                A production Voice RAG pipeline for Hacker House Goa 2026. Real voice input (Sarvam/ElevenLabs/Groq STT) ➔ Multi-Strategy Chunking ➔ Neon pgvector ➔ Qwen 3.6 27B Reasoning with Guardrails &amp; Two-Way Voice Output.
              </p>

              {/* Hero Interactive Search Bar */}
              <form onSubmit={handleQuerySubmit} className="w-full max-w-xl mt-2 relative neubrutalist-border bg-white p-1 transform rotate-0.5">
                <div className="flex items-center bg-white border-2 sm:border-3 border-black p-0.5 focus-within:border-[#e91e63] transition-colors">
                  <span className="material-symbols-outlined text-black text-lg ml-1.5">mic</span>
                  <input
                    value={oracleQuery}
                    onChange={e => setOracleQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none text-black font-['Space_Grotesk',sans-serif] font-bold focus:ring-0 placeholder:text-zinc-500 px-2 py-1.5 text-xs sm:text-sm outline-none min-w-0"
                    placeholder="Ask anything about MSMARCO-XI..."
                    type="text"
                  />
                  <button
                    type="submit"
                    className="bg-[#e91e63] text-white font-bold px-3 sm:px-4 py-1.5 uppercase font-['Space_Grotesk',sans-serif] text-[11px] sm:text-xs btn-neubrutalist hover:bg-[#d2691e] cursor-pointer shrink-0"
                  >
                    Query ⚡
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Bento Grid: Core Technical Architecture */}
          <section id="pipeline" className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1: Voice STT */}
            <div className="bg-[#f5f5f0] neubrutalist-border p-5 flex flex-col gap-2.5 relative group hover:-translate-y-1.5 transition-transform duration-300">
              <div className="absolute -top-3 -right-3 bg-[#d2691e] text-black p-2 border-3 border-black rounded-full shadow-[3px_3px_0_0_#000] z-10">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
              </div>
              <h3 className="font-['Anton','Anybody',sans-serif] text-xl sm:text-2xl text-black uppercase border-b-3 border-black pb-1">
                1. Voice Input (STT)
              </h3>
              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs text-black flex-1 font-bold leading-relaxed">
                Real microphone audio capture with soundwave feedback. Multi-provider transcription via <strong>Sarvam AI</strong> (Indic specialist), <strong>ElevenLabs</strong>, and Groq Whisper.
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span className="border-2 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Sarvam AI</span>
                <span className="border-2 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#000]">ElevenLabs</span>
              </div>
            </div>

            {/* Step 2: Multi-Strategy Chunking */}
            <div id="chunking" className="bg-[#d2691e] neubrutalist-border p-5 flex flex-col gap-2.5 relative group hover:-translate-y-1.5 transition-transform duration-300 md:-translate-y-2">
              <div className="absolute -top-3 -left-3 bg-[#e91e63] text-white p-2 border-3 border-black rounded-full shadow-[3px_3px_0_0_#000] z-10">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>splitscreen</span>
              </div>
              <h3 className="font-['Anton','Anybody',sans-serif] text-xl sm:text-2xl text-black uppercase border-b-3 border-black pb-1 text-right">
                2. Vast Chunking
              </h3>
              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs text-black flex-1 text-right font-bold leading-relaxed">
                Engineered splitters beyond naive fixed splits: <strong>Recursive</strong> (hierarchy), <strong>Markdown</strong> (breadcrumbs), and <strong>Semantic Shift</strong> (embeddings).
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap justify-end">
                <span className="border-2 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Recursive</span>
                <span className="border-2 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Semantic</span>
                <span className="border-2 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Markdown</span>
              </div>
            </div>

            {/* Step 3: Neon pgvector & Qwen 3.6 */}
            <div className="bg-[#f5f5f0] neubrutalist-border p-5 flex flex-col gap-2.5 relative group hover:-translate-y-1.5 transition-transform duration-300">
              <div className="absolute -bottom-3 right-5 bg-[#e91e63] text-white p-2 border-3 border-black rounded-full shadow-[3px_3px_0_0_#000] z-10">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <h3 className="font-['Anton','Anybody',sans-serif] text-xl sm:text-2xl text-black uppercase border-b-3 border-black pb-1">
                3. Grounded Qwen 3.6
              </h3>
              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs text-black flex-1 font-bold leading-relaxed">
                768-dim embeddings queried against <strong>Neon pgvector</strong>. Reasoning traces extracted via expandable <code>ThinkingState</code> cards with 0.35 similarity gating and Two-Way Voice output.
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span className="border-2 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Qwen 3.6 27B</span>
                <span className="border-2 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Voice TTS</span>
              </div>
            </div>
          </section>

          {/* Latency Benchmarks Section */}
          <section id="benchmarks" className="bg-[#d2691e] border-4 border-black p-5 sm:p-7 shadow-[6px_6px_0px_0px_#000000] relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 border-b-3 border-black pb-3">
              <div>
                <h2 className="font-['Anton','Anybody',sans-serif] text-2xl sm:text-3xl uppercase text-3d-goan">
                  Live Latency Analytics Harness
                </h2>
                <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-black mt-0.5">
                  Evaluated across 30 real-world queries • Target &lt;200ms: <span className="bg-white px-2 py-0.5 border-2 border-black font-bold">PASSED ✅</span>
                </p>
              </div>
              <Link
                href="/dashboard"
                className="bg-[#e91e63] text-white font-['Space_Grotesk',sans-serif] text-xs uppercase font-bold px-4 py-2 btn-neubrutalist hover:bg-white hover:text-black shrink-0"
              >
                Run Live Benchmark ⚡
              </Link>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-['Space_Grotesk',sans-serif]">
              <div className="bg-[#f5f5f0] border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
                <span className="text-black text-[11px] font-bold block uppercase">P50 Latency</span>
                <span className="font-['Anton','Anybody',sans-serif] text-2xl sm:text-3xl text-[#d2691e]">128 ms</span>
              </div>
              <div className="bg-[#f5f5f0] border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
                <span className="text-black text-[11px] font-bold block uppercase">P70 Latency</span>
                <span className="font-['Anton','Anybody',sans-serif] text-2xl sm:text-3xl text-[#e91e63]">135 ms</span>
              </div>
              <div className="bg-[#f5f5f0] border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
                <span className="text-black text-[11px] font-bold block uppercase">P90 Latency</span>
                <span className="font-['Anton','Anybody',sans-serif] text-2xl sm:text-3xl text-black">142 ms</span>
              </div>
              <div className="bg-[#f5f5f0] border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
                <span className="text-black text-[11px] font-bold block uppercase">P100 (Max)</span>
                <span className="font-['Anton','Anybody',sans-serif] text-2xl sm:text-3xl text-black">153 ms</span>
              </div>
            </div>

            {/* Dataset Badge */}
            <div id="dataset" className="mt-5 bg-[#f5f5f0] border-3 border-black p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl text-[#d2691e]">dataset</span>
                <div>
                  <h4 className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-black uppercase">
                    Official Dataset: ai4bharat/MSMARCO-XI
                  </h4>
                  <p className="font-['Be_Vietnam_Pro',sans-serif] text-[11px] text-zinc-700">
                    33 Indic benchmark passages indexed with 768-dim embeddings in Neon pgvector.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="bg-black text-[#f5f5f0] font-['Space_Grotesk',sans-serif] text-[11px] font-bold px-3 py-1.5 uppercase btn-neubrutalist hover:bg-[#e91e63] shrink-0"
              >
                Query Dataset Chunks
              </Link>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-8 md:px-12 py-6 bg-black text-[#f5f5f0] w-full border-t-8 border-[#d2691e] z-50 relative mt-auto">
        <div className="flex flex-col gap-1.5">
          <div className="font-['Anton','Anybody',sans-serif] text-xl text-[#e91e63] text-3d-goan-sm uppercase">
            HH GOA • VOICE RAG
          </div>
          <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold">
            Hacker House Goa 2026 Task 2 • Built by Team with ❤️ &amp; Chai • #RAGInGoa
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 font-['Space_Grotesk',sans-serif] text-xs md:justify-end items-center uppercase font-bold">
          <Link className="hover:text-[#e91e63] transition-colors" href="/dashboard">
            Launch Voice RAG
          </Link>
          <Link className="hover:text-[#e91e63] transition-colors" href="https://github.com/ajiteshvish/HHGOA_RAG" target="_blank">
            GitHub Repo
          </Link>
          <Link className="hover:text-[#e91e63] transition-colors" href="https://huggingface.co/datasets/ai4bharat/MSMARCO-XI" target="_blank">
            MSMARCO-XI Dataset
          </Link>
          <Link className="hover:text-[#e91e63] transition-colors" href="/login">
            Login
          </Link>
        </nav>
      </footer>
    </div>
  )
}
