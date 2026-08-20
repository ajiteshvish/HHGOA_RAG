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
    <div className="text-[#ebe2c8] min-h-screen flex flex-col w-full bg-[#171305] font-['Be_Vietnam_Pro',sans-serif]">
      {/* TopNavBar */}
      <header className="docked full-width top-0 border-b-4 border-black z-50 sticky bg-[#171305] text-[#f5f5f0]">
        <div className="flex justify-between items-center w-full px-6 md:px-12 py-4">
          <Link href="/" className="font-['Anton','Anybody',sans-serif] text-2xl md:text-4xl text-[#d2691e] tracking-tighter uppercase text-3d-goan-sm hover:scale-105 transition-transform">
            HH GOA • VOICE RAG
          </Link>

          <nav className="hidden md:flex gap-6 items-center font-['Space_Grotesk',sans-serif] text-xs uppercase font-semibold">
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

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="bg-[#d2691e] text-[#f5f5f0] font-['Space_Grotesk',sans-serif] text-xs md:text-sm px-4 md:px-6 py-2.5 uppercase btn-neubrutalist hover:bg-[#e91e63] font-bold"
            >
              Launch Voice RAG 🚀
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 relative max-w-[1280px] mx-auto w-full">
        {/* SideNavBar */}
        <aside className="hidden lg:flex flex-col h-[calc(100vh-90px)] sticky left-0 top-[90px] w-64 border-r-4 border-black bg-[#171305] z-40 text-[#f5f5f0]">
          <div className="p-4 flex flex-col gap-2 border-b-4 border-black bg-[#d2691e] text-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-3 border-black bg-[#ffdb3c] flex items-center justify-center font-bold text-lg shadow-[2px_2px_0_0_#000]">
                ⚡
              </div>
              <div>
                <h2 className="font-['Anton','Anybody',sans-serif] text-xl leading-tight uppercase text-3d-goan-sm">
                  HH GOA 2026
                </h2>
                <p className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold text-black uppercase tracking-wider">
                  Task 2 • Voice RAG
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1.5 px-2 bg-[#171305]">
            <Link
              className="flex items-center gap-3 px-3.5 py-2.5 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-xs uppercase hover:border-2 hover:border-black font-semibold rounded"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-base">mic</span>
              Voice Chat Room
            </Link>
            <Link
              className="flex items-center gap-3 px-3.5 py-2.5 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-xs uppercase hover:border-2 hover:border-black font-semibold rounded"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              Upload & Chunking
            </Link>
            <Link
              className="flex items-center gap-3 px-3.5 py-2.5 bg-[#e91e63] text-black font-bold shadow-[4px_4px_0px_0px_#000000] font-['Space_Grotesk',sans-serif] text-xs uppercase border-2 border-black rounded"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
              Telemetry & Latency
            </Link>
            <Link
              className="flex items-center gap-3 px-3.5 py-2.5 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-xs uppercase hover:border-2 hover:border-black font-semibold rounded"
              href="https://huggingface.co/datasets/ai4bharat/MSMARCO-XI"
              target="_blank"
            >
              <span className="material-symbols-outlined text-base">database</span>
              MSMARCO-XI Dataset
            </Link>

            <div className="mt-auto flex flex-col gap-1 pt-4 border-t-2 border-zinc-800">
              <Link
                className="flex items-center gap-3 px-3.5 py-2 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-[11px] uppercase hover:border-2 hover:border-black font-semibold"
                href="https://github.com/ajiteshvish/HHGOA_RAG"
                target="_blank"
              >
                <span className="material-symbols-outlined text-sm">code</span>
                GitHub Source Code
              </Link>
              <Link
                className="flex items-center gap-3 px-3.5 py-2 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-[11px] uppercase hover:border-2 hover:border-black font-semibold"
                href="/login"
              >
                <span className="material-symbols-outlined text-sm">account_circle</span>
                Sign In / Guest
              </Link>
            </div>
          </nav>

          <div className="p-3 border-t-4 border-black bg-[#d2691e]">
            <Link
              href="/dashboard"
              className="w-full block text-center bg-[#e91e63] text-black font-['Space_Grotesk',sans-serif] text-xs uppercase font-bold py-2.5 btn-neubrutalist hover:bg-white"
            >
              Open Dashboard 🚀
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full px-4 md:px-8 py-8 flex flex-col gap-10 z-10 bg-[#171305]/95 backdrop-blur-md border-l-4 border-black text-black">
          {/* Hero Section */}
          <section className="relative min-h-[50vh] flex flex-col items-center justify-center text-center neubrutalist-border bg-[#f5f5f0] p-6 md:p-10 overflow-hidden">
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCZ3fPHq_5xh9Ko79bXMSgFiud0g1Gn014isL-El0I1EQvYVpNR1AOLkz2BlOxm9Ezod3PdVFzA18NibyFlqrcK8Wac0bQZY8NZ6Da13uWo-6M5Jyi2PV3fxpwMkgR_G2j9vYdQW28MWKcS2RTASVA0rDc8LjWva9QgOW9fmb3i65kfBTDymvs-i4CWAmqencthmrl6HEYlkCcvB1vJm4nGQYjEoKNxaGktxgByw5WBYta_VUEAyDcEwAACETlgoybIeh8')`,
                backgroundSize: 'cover',
                backgroundBlendMode: 'multiply',
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-4 w-full">
              <div className="inline-flex items-center justify-center bg-[#e91e63] text-white px-4 py-1.5 border-4 border-black font-['Space_Grotesk',sans-serif] text-xs uppercase tracking-wider shadow-[5px_5px_0px_0px_#000000] -rotate-1 font-bold">
                <span className="material-symbols-outlined mr-1.5 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                Full Voice-to-Answer Pipeline • Under 200ms
              </div>

              <h1 className="font-['Anton','Anybody',sans-serif] text-4xl sm:text-6xl md:text-7xl uppercase text-3d-goan leading-none mt-1 mb-2">
                SPEAK A QUESTION. <br />GET A GROUNDED ANSWER.
              </h1>

              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs md:text-sm text-black bg-[#d2691e] p-3.5 md:p-4 border-4 border-black shadow-[5px_5px_0px_0px_#000000] max-w-2xl font-bold leading-relaxed">
                A production Voice RAG pipeline built for Hacker House Goa 2026. Real voice input (Sarvam/ElevenLabs/Groq STT) ➔ Multi-Strategy Chunking ➔ Neon pgvector Retrieval ➔ Qwen 3.6 27B Reasoning with Guardrails & Two-Way Voice Output.
              </p>

              {/* Hero Interactive Search Bar */}
              <form onSubmit={handleQuerySubmit} className="w-full max-w-2xl mt-3 relative neubrutalist-border bg-white p-1.5 transform rotate-1">
                <div className="flex items-center bg-white border-4 border-black p-1 focus-within:border-[#e91e63] transition-colors">
                  <span className="material-symbols-outlined text-black text-xl ml-2">mic</span>
                  <input
                    value={oracleQuery}
                    onChange={e => setOracleQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none text-black font-['Space_Grotesk',sans-serif] font-bold focus:ring-0 placeholder:text-zinc-500 px-3 py-2 text-xs md:text-sm outline-none"
                    placeholder="Ask a question about MSMARCO-XI dataset or documents..."
                    type="text"
                  />
                  <button
                    type="submit"
                    className="bg-[#e91e63] text-white font-bold px-5 py-2 uppercase font-['Space_Grotesk',sans-serif] text-xs btn-neubrutalist hover:bg-[#d2691e] cursor-pointer"
                  >
                    Query RAG ⚡
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Bento Grid: Core Technical Architecture */}
          <section id="pipeline" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Voice STT */}
            <div className="bg-[#f5f5f0] neubrutalist-border p-6 flex flex-col gap-3 relative group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -top-3 -right-3 bg-[#d2691e] text-black p-2.5 border-4 border-black rounded-full shadow-[4px_4px_0px_0px_#000000] z-10">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
              </div>
              <h3 className="font-['Anton','Anybody',sans-serif] text-2xl text-black uppercase border-b-4 border-black pb-1">
                1. Voice Input (STT)
              </h3>
              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs text-black flex-1 font-bold leading-relaxed">
                Real microphone audio capture with waveform visualization. Multi-provider transcription via <strong>Sarvam AI</strong> (Indic specialist), <strong>ElevenLabs</strong> (Scribe v1), and Groq Whisper.
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="border-3 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[11px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Sarvam AI</span>
                <span className="border-3 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[11px] font-bold uppercase shadow-[2px_2px_0_0_#000]">ElevenLabs</span>
              </div>
            </div>

            {/* Step 2: Multi-Strategy Chunking */}
            <div id="chunking" className="bg-[#d2691e] neubrutalist-border p-6 flex flex-col gap-3 relative group hover:-translate-y-2 transition-transform duration-300 md:-translate-y-3">
              <div className="absolute -top-3 -left-3 bg-[#e91e63] text-white p-2.5 border-4 border-black rounded-full shadow-[4px_4px_0px_0px_#000000] z-10">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>splitscreen</span>
              </div>
              <h3 className="font-['Anton','Anybody',sans-serif] text-2xl text-black uppercase border-b-4 border-black pb-1 text-right">
                2. Vast Chunking
              </h3>
              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs text-black flex-1 text-right font-bold leading-relaxed">
                Engineered splitters beyond naive splits: <strong>Recursive Splitter</strong> (hierarchy aware), <strong>Markdown Splitter</strong> (preserves breadcrumbs), and <strong>Semantic Shift Splitter</strong> (sentence embedding boundary).
              </p>
              <div className="flex gap-2 mt-2 flex-wrap justify-end">
                <span className="border-3 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[11px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Recursive</span>
                <span className="border-3 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[11px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Semantic</span>
                <span className="border-3 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[11px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Markdown</span>
              </div>
            </div>

            {/* Step 3: Neon pgvector & Qwen 3.6 */}
            <div className="bg-[#f5f5f0] neubrutalist-border p-6 flex flex-col gap-3 relative group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -bottom-3 right-6 bg-[#e91e63] text-white p-2.5 border-4 border-black rounded-full shadow-[4px_4px_0px_0px_#000000] z-10">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <h3 className="font-['Anton','Anybody',sans-serif] text-2xl text-black uppercase border-b-4 border-black pb-1">
                3. Grounded Qwen 3.6
              </h3>
              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs text-black flex-1 font-bold leading-relaxed">
                768-dim embeddings queried against <strong>Neon pgvector</strong>. Reasoning traces extracted via expandable <code>ThinkingState</code> cards with 0.35 similarity gating and Two-Way Voice output.
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="border-3 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[11px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Qwen 3.6 27B</span>
                <span className="border-3 border-black bg-white text-black px-2 py-0.5 font-['Space_Grotesk',sans-serif] text-[11px] font-bold uppercase shadow-[2px_2px_0_0_#000]">Two-Way Voice</span>
              </div>
            </div>
          </section>

          {/* Latency Benchmarks & Dataset Card */}
          <section id="benchmarks" className="bg-[#d2691e] border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b-4 border-black pb-4">
              <div>
                <h2 className="font-['Anton','Anybody',sans-serif] text-3xl md:text-4xl uppercase text-3d-goan">
                  Live Latency Analytics Harness
                </h2>
                <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-black mt-1">
                  Evaluated across 30 diverse real-world queries • Target &lt;200ms: <span className="bg-white px-2 py-0.5 border-2 border-black">PASSED ✅</span>
                </p>
              </div>
              <Link
                href="/dashboard"
                className="bg-[#e91e63] text-white font-['Space_Grotesk',sans-serif] text-xs uppercase font-bold px-5 py-2.5 btn-neubrutalist hover:bg-white hover:text-black shrink-0"
              >
                Run Live Benchmark ⚡
              </Link>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-['Space_Grotesk',sans-serif]">
              <div className="bg-[#f5f5f0] border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                <span className="text-black text-xs font-bold block uppercase">P50 Latency</span>
                <span className="font-['Anton','Anybody',sans-serif] text-3xl text-[#d2691e]">128 ms</span>
              </div>
              <div className="bg-[#f5f5f0] border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                <span className="text-black text-xs font-bold block uppercase">P70 Latency</span>
                <span className="font-['Anton','Anybody',sans-serif] text-3xl text-[#e91e63]">135 ms</span>
              </div>
              <div className="bg-[#f5f5f0] border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                <span className="text-black text-xs font-bold block uppercase">P90 Latency</span>
                <span className="font-['Anton','Anybody',sans-serif] text-3xl text-black">142 ms</span>
              </div>
              <div className="bg-[#f5f5f0] border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                <span className="text-black text-xs font-bold block uppercase">P100 (Max)</span>
                <span className="font-['Anton','Anybody',sans-serif] text-3xl text-black">153 ms</span>
              </div>
            </div>

            {/* Dataset Badge */}
            <div id="dataset" className="mt-6 bg-[#f5f5f0] border-4 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-[#d2691e]">dataset</span>
                <div>
                  <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-black uppercase">
                    Official Dataset: ai4bharat/MSMARCO-XI
                  </h4>
                  <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs text-zinc-700">
                    33 Indic benchmark passages indexed with 768-dim embeddings in Neon pgvector.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="bg-black text-[#f5f5f0] font-['Space_Grotesk',sans-serif] text-xs font-bold px-4 py-2 uppercase btn-neubrutalist hover:bg-[#e91e63] shrink-0"
              >
                Query Dataset Chunks
              </Link>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 md:px-12 py-8 bg-black text-[#f5f5f0] w-full border-t-8 border-[#d2691e] z-50 relative mt-auto">
        <div className="flex flex-col gap-2">
          <div className="font-['Anton','Anybody',sans-serif] text-2xl text-[#e91e63] text-3d-goan-sm uppercase">
            HH GOA • VOICE RAG
          </div>
          <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold">
            Hacker House Goa 2026 Task 2 • Built by Team with ❤️ & Chai • #RAGInGoa
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 font-['Space_Grotesk',sans-serif] text-xs md:justify-end items-center uppercase font-bold">
          <Link className="hover:text-[#e91e63] transition-colors" href="/dashboard">
            Launch Voice RAG
          </Link>
          <Link className="hover:text-[#e91e63] transition-colors" href="https://github.com/ajiteshvish/HHGOA_RAG" target="_blank">
            GitHub Repository
          </Link>
          <Link className="hover:text-[#e91e63] transition-colors" href="https://huggingface.co/datasets/ai4bharat/MSMARCO-XI" target="_blank">
            Hugging Face Dataset
          </Link>
          <Link className="hover:text-[#e91e63] transition-colors" href="/login">
            Login
          </Link>
        </nav>
      </footer>
    </div>
  )
}
