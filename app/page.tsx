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
          <Link href="/" className="font-['Anton','Anybody',sans-serif] text-3xl md:text-5xl text-[#d2691e] tracking-tighter uppercase text-3d-goan-sm hover:scale-105 transition-transform">
            HH GOA AI
          </Link>

          <nav className="hidden md:flex gap-6 items-center font-['Space_Grotesk',sans-serif] text-sm uppercase font-semibold">
            <Link className="text-[#f5f5f0] hover:text-[#e91e63] transition-colors px-2 py-1 border-2 border-transparent hover:border-[#e91e63]" href="#retrieval">
              Retrieval
            </Link>
            <Link className="text-[#f5f5f0] hover:text-[#e91e63] transition-colors px-2 py-1 border-2 border-transparent hover:border-[#e91e63]" href="#augment">
              Augment
            </Link>
            <Link className="text-[#f5f5f0] hover:text-[#e91e63] transition-colors px-2 py-1 border-2 border-transparent hover:border-[#e91e63]" href="#generation">
              Generation
            </Link>
            <Link className="text-[#d2691e] border-b-4 border-[#d2691e] pb-1 font-bold" href="#tearoom">
              Community
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="bg-[#d2691e] text-[#f5f5f0] font-['Space_Grotesk',sans-serif] text-xs md:text-sm px-4 md:px-6 py-2.5 md:py-3 uppercase btn-neubrutalist hover:bg-[#e91e63] font-bold"
            >
              Launch RAG 🚀
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 relative max-w-[1280px] mx-auto w-full">
        {/* SideNavBar */}
        <aside className="hidden lg:flex flex-col h-[calc(100vh-100px)] sticky left-0 top-[100px] w-64 border-r-4 border-black bg-[#171305] z-40 text-[#f5f5f0]">
          <div className="p-4 flex flex-col gap-2 border-b-4 border-black bg-[#d2691e] text-black">
            <div
              className="w-14 h-14 rounded-full border-4 border-black overflow-hidden bg-[#f5f5f0] shadow-[3px_3px_0_0_#000]"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBOakEMOP8nqrcRIWeSSvzKRn95eU_5Y6g4ry8kAf2hraJELJSUOS6T2dshfX9aIkMVPNCD9z_p0W14j-35zHno_I6-sUTzHt1Mf6z9l_iIETCinrYc6RvCOxtY9s-dZ9I2KK305KCN2ltMhx3CMrojD72p1zSu-uXBTo-ILn_sRBVt_XwFxFfz32eaU5OTUxypBo_TnBg8IKxoWiAyKcnG8voPn8_m-LjvYR4HNGYSnwuNOzb-YnjljGfxa-9urMByC6o')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <h2 className="font-['Anton','Anybody',sans-serif] text-2xl leading-tight mt-1 uppercase text-3d-goan-sm">
              RAG TOOLS
            </h2>
            <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-black">Culture meets Code</p>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2 bg-[#171305]">
            <Link
              className="flex items-center gap-3 px-4 py-3 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-sm uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] duration-100 hover:border-2 hover:border-black font-semibold"
              href="/dashboard"
            >
              <span className="material-symbols-outlined">database</span>
              Knowledge Base
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-sm uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] duration-100 hover:border-2 hover:border-black font-semibold"
              href="/dashboard"
            >
              <span className="material-symbols-outlined">hub</span>
              Neural Links
            </Link>
            <a
              className="flex items-center gap-3 px-4 py-3 bg-[#e91e63] text-black font-bold shadow-[4px_4px_0px_0px_#000000] translate-x-[-2px] translate-y-[-2px] font-['Space_Grotesk',sans-serif] text-sm uppercase border-2 border-black"
              href="#tearoom"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>coffee</span>
              Tea Room
            </a>
            <div className="mt-auto flex flex-col gap-2">
              <Link
                className="flex items-center gap-3 px-4 py-2 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-xs uppercase hover:border-2 hover:border-black font-semibold"
                href="/dashboard"
              >
                <span className="material-symbols-outlined text-sm">settings</span>
                Settings
              </Link>
              <Link
                className="flex items-center gap-3 px-4 py-2 text-[#f5f5f0] hover:bg-[#d2691e] hover:text-black transition-all font-['Space_Grotesk',sans-serif] text-xs uppercase hover:border-2 hover:border-black font-semibold"
                href="https://github.com/ajiteshvish/HHGOA_RAG"
                target="_blank"
              >
                <span className="material-symbols-outlined text-sm">terminal</span>
                API Docs
              </Link>
            </div>
          </nav>

          <div className="p-4 border-t-4 border-black bg-[#d2691e]">
            <Link
              href="/dashboard"
              className="w-full block text-center bg-[#e91e63] text-black font-['Space_Grotesk',sans-serif] text-xs uppercase font-bold py-3 btn-neubrutalist hover:bg-white"
            >
              Brew New Data
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full px-4 md:px-8 py-8 flex flex-col gap-10 z-10 bg-[#171305]/95 backdrop-blur-md border-l-4 border-black text-black">
          {/* Hero Section */}
          <section className="relative min-h-[55vh] flex flex-col items-center justify-center text-center neubrutalist-border bg-[#f5f5f0] p-6 md:p-12 overflow-hidden">
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCZ3fPHq_5xh9Ko79bXMSgFiud0g1Gn014isL-El0I1EQvYVpNR1AOLkz2BlOxm9Ezod3PdVFzA18NibyFlqrcK8Wac0bQZY8NZ6Da13uWo-6M5Jyi2PV3fxpwMkgR_G2j9vYdQW28MWKcS2RTASVA0rDc8LjWva9QgOW9fmb3i65kfBTDymvs-i4CWAmqencthmrl6HEYlkCcvB1vJm4nGQYjEoKNxaGktxgByw5WBYta_VUEAyDcEwAACETlgoybIeh8')`,
                backgroundSize: 'cover',
                backgroundBlendMode: 'multiply',
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-4 w-full">
              <div className="inline-flex items-center justify-center bg-[#e91e63] text-white px-5 py-2 border-4 border-black font-['Space_Grotesk',sans-serif] text-xs md:text-sm uppercase tracking-wider shadow-[6px_6px_0px_0px_#000000] -rotate-2 font-bold">
                <span className="material-symbols-outlined mr-2 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>coffee</span>
                Welcome to the Tapestry
              </div>

              <h1 className="font-['Anton','Anybody',sans-serif] text-5xl sm:text-7xl md:text-8xl uppercase text-3d-goan leading-none mt-2 mb-4">
                SPILL THE <br />CHAI ON AI
              </h1>

              <p className="font-['Be_Vietnam_Pro',sans-serif] text-sm md:text-base text-black bg-[#d2691e] p-4 md:p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000000] max-w-2xl font-bold leading-relaxed">
                A brutalist Voice RAG engine woven into the cultural fabric of Goa. Query the collective knowledge, augment your reality, and generate insights steeped in tradition under 200ms.
              </p>

              {/* Hero Oracle Search Bar */}
              <form onSubmit={handleQuerySubmit} className="w-full max-w-2xl mt-4 relative neubrutalist-border bg-white p-2 transform rotate-1">
                <div className="flex items-center bg-white border-4 border-black p-1 focus-within:border-[#e91e63] transition-colors">
                  <span className="material-symbols-outlined text-black text-2xl ml-2">search</span>
                  <input
                    value={oracleQuery}
                    onChange={e => setOracleQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none text-black font-['Space_Grotesk',sans-serif] font-bold focus:ring-0 placeholder:text-zinc-500 px-3 py-2 text-sm md:text-base outline-none"
                    placeholder="Ask the Oracle anything (or click Launch RAG)..."
                    type="text"
                  />
                  <button
                    type="submit"
                    className="bg-[#e91e63] text-white font-bold px-6 py-2.5 uppercase font-['Space_Grotesk',sans-serif] text-xs md:text-sm btn-neubrutalist hover:bg-[#d2691e] cursor-pointer"
                  >
                    Query
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Bento Grid: Core Pillars */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Retrieval Card */}
            <div id="retrieval" className="bg-[#f5f5f0] neubrutalist-border p-6 flex flex-col gap-3 relative group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -top-3 -right-3 bg-[#d2691e] text-black p-3 border-4 border-black rounded-full shadow-[4px_4px_0px_0px_#000000] z-10 group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>database</span>
              </div>
              <h3 className="font-['Anton','Anybody',sans-serif] text-2xl md:text-3xl text-black uppercase border-b-4 border-black pb-1">
                Retrieval
              </h3>
              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs md:text-sm text-black flex-1 font-bold leading-relaxed">
                Dive deep into historical archives and AI4Bharat MSMARCO-XI. Multi-strategy splitters (Recursive, Markdown, Semantic) extract raw data with zero naive fragmentation.
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="border-3 border-black bg-white text-black px-2.5 py-0.5 font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase shadow-[3px_3px_0px_0px_#000000]">Vector</span>
                <span className="border-3 border-black bg-white text-black px-2.5 py-0.5 font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase shadow-[3px_3px_0px_0px_#000000]">768-Dim</span>
              </div>
            </div>

            {/* Augment Card */}
            <div id="augment" className="bg-[#d2691e] neubrutalist-border p-6 flex flex-col gap-3 relative group hover:-translate-y-2 transition-transform duration-300 md:-translate-y-3">
              <div className="absolute -top-3 -left-3 bg-[#e91e63] text-white p-3 border-4 border-black rounded-full shadow-[4px_4px_0px_0px_#000000] z-10 group-hover:-rotate-12 transition-transform">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
              </div>
              <h3 className="font-['Anton','Anybody',sans-serif] text-2xl md:text-3xl text-black uppercase border-b-4 border-black pb-1 text-right">
                Augment
              </h3>
              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs md:text-sm text-black flex-1 text-right font-bold leading-relaxed">
                Context is king. Grounded guardrails calibrate cosine relevance thresholds and block prompt injections, weaving interwoven facts ready for flawless synthesis.
              </p>
              <div className="flex gap-2 mt-2 flex-wrap justify-end">
                <span className="border-3 border-black bg-white text-black px-2.5 py-0.5 font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase shadow-[3px_3px_0px_0px_#000000]">Guardrail</span>
                <span className="border-3 border-black bg-white text-black px-2.5 py-0.5 font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase shadow-[3px_3px_0px_0px_#000000]">Context</span>
              </div>
            </div>

            {/* Generation Card */}
            <div id="generation" className="bg-[#f5f5f0] neubrutalist-border p-6 flex flex-col gap-3 relative group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -bottom-3 right-6 bg-[#e91e63] text-white p-3 border-4 border-black rounded-full shadow-[4px_4px_0px_0px_#000000] z-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <h3 className="font-['Anton','Anybody',sans-serif] text-2xl md:text-3xl text-black uppercase border-b-4 border-black pb-1">
                Generation
              </h3>
              <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs md:text-sm text-black flex-1 font-bold leading-relaxed">
                The final bloom. Qwen 3.6 27B reasons over verified chunks with expandable thinking traces, sub-200ms latency, and natural Two-Way Voice output.
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="border-3 border-black bg-white text-black px-2.5 py-0.5 font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase shadow-[3px_3px_0px_0px_#000000]">Qwen 3.6</span>
                <span className="border-3 border-black bg-white text-black px-2.5 py-0.5 font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase shadow-[3px_3px_0px_0px_#000000]">&lt;200ms</span>
              </div>
            </div>
          </section>

          {/* The Tea Room Section (Community) */}
          <section id="tearoom" className="mt-4 bg-[#d2691e] border-4 border-black p-6 md:p-10 shadow-[10px_10px_0px_0px_#000000] relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDTF78tOxNP7HM5XIbPT2OOeb37bsoGS8Xeq_2lDBsLV472wHQXJGXicoicxH6tVwxNwUMS_L6hCYZlhTi6eKrZmGwZNN2VD0HrdbiI0ieO4WIsp6IZqjOkBLXTHQQDTTr8AjDHEOKRaUk1Xq1tmKflzZLCEyyWJULuc79MO3DgDBw4hqB4Mjoixs_Ydt1ZolGcdu-4y10NKImInMgk6e9Y2-27dpZCMJD8NO3KC2pyfrBNDOs7msIxPO6tpj_O0KHwh6E')`,
                backgroundSize: 'cover',
                mixBlendMode: 'color-burn',
              }}
            />
            <div className="relative z-10 flex items-center gap-4 mb-6">
              <h2 className="font-['Anton','Anybody',sans-serif] text-3xl md:text-5xl uppercase text-3d-goan inline-block">
                The Tea Room
              </h2>
              <div className="h-3 flex-1 bg-black ml-2" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Visual Anchor */}
              <div className="relative h-[360px] md:h-[420px] neubrutalist-border overflow-hidden group bg-[#f5f5f0]">
                <img
                  alt="Cups of Chai with expressive Goan visual aesthetics"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQPzc9UBEESW_7OD4i5VaD8ozI4lKAlxYvMrqltzxaHlN7m5WQRjRhZI7ZQn_EsMiT7OCLj6EDT5oKf6Giupv2MR_QNgRYWKGiXog3qsjywK7qscyKk_cZ8unvJCp_UGLM6HOMCNY115fTsMH1msnVAiPT4xmE19gRrw0p7QTjBv2w87wwpiAOdSSQlqbR2d5kQjZAPC5MmvVmuDeGhNH8_P-sza3MVSjA72ekFfOp3n4pc6SRAdv9hu3c1l4rc4yZ1XA"
                />
                <div className="absolute bottom-0 left-0 w-full p-4 bg-[#171305] border-t-4 border-black">
                  <h4 className="font-['Anton','Anybody',sans-serif] text-xl text-[#f5f5f0] uppercase text-3d-goan-sm">
                    Brewing Knowledge
                  </h4>
                  <p className="font-['Space_Grotesk',sans-serif] text-xs text-[#f5f5f0] mt-1 font-bold">
                    Where chunks of data become sips of wisdom.
                  </p>
                </div>
              </div>

              {/* Discussion List */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/dashboard"
                  className="bg-[#f5f5f0] neubrutalist-border p-3.5 flex gap-3 items-start hover:bg-[#e91e63] hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="bg-[#d2691e] text-black w-10 h-10 flex items-center justify-center border-3 border-black shrink-0 group-hover:bg-white">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
                  </div>
                  <div>
                    <h5 className="font-['Space_Grotesk',sans-serif] text-xs uppercase font-bold text-black group-hover:text-white">
                      Optimizing Chunk Size for Goan History
                    </h5>
                    <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs mt-0.5 text-black font-bold line-clamp-2">
                      Discussing ideal token limits when indexing long-form historical texts. 400 tokens with 80 overlap captures maximum precision.
                    </p>
                    <span className="text-[10px] mt-1 block font-['Space_Grotesk',sans-serif] uppercase font-black text-black">24 Replies • Active Now</span>
                  </div>
                </Link>

                <Link
                  href="/dashboard"
                  className="bg-[#f5f5f0] neubrutalist-border p-3.5 flex gap-3 items-start hover:bg-[#e91e63] hover:text-white transition-colors cursor-pointer ml-0 md:ml-3 group"
                >
                  <div className="bg-[#d2691e] text-black w-10 h-10 flex items-center justify-center border-3 border-black shrink-0 group-hover:bg-white">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bug_report</span>
                  </div>
                  <div>
                    <h5 className="font-['Space_Grotesk',sans-serif] text-xs uppercase font-bold text-black group-hover:text-white">
                      Zero Hallucination with Cosine Gating
                    </h5>
                    <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs mt-0.5 text-black font-bold line-clamp-2">
                      How our calibrated 0.35 similarity gate successfully blocks ungrounded questions and out-of-scope prompts.
                    </p>
                    <span className="text-[10px] mt-1 block font-['Space_Grotesk',sans-serif] uppercase font-black text-black">12 Replies • 2 hours ago</span>
                  </div>
                </Link>

                <Link
                  href="/dashboard"
                  className="bg-[#f5f5f0] neubrutalist-border p-3.5 flex gap-3 items-start hover:bg-[#e91e63] hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="bg-[#d2691e] text-black w-10 h-10 flex items-center justify-center border-3 border-black shrink-0 group-hover:bg-white">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>model_training</span>
                  </div>
                  <div>
                    <h5 className="font-['Space_Grotesk',sans-serif] text-xs uppercase font-bold text-black group-hover:text-white">
                      Voice RAG on Indic & Konkani Passages
                    </h5>
                    <p className="font-['Be_Vietnam_Pro',sans-serif] text-xs mt-0.5 text-black font-bold line-clamp-2">
                      Evaluating Sarvam AI STT and Gemini 768-dim embeddings across Indian accents and multilingual MSMARCO-XI benchmarks.
                    </p>
                    <span className="text-[10px] mt-1 block font-['Space_Grotesk',sans-serif] uppercase font-black text-black">89 Replies • Pinned</span>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 md:px-12 py-8 bg-black text-[#f5f5f0] w-full border-t-8 border-[#d2691e] z-50 relative mt-auto">
        <div className="flex flex-col gap-2">
          <div className="font-['Anton','Anybody',sans-serif] text-2xl text-[#e91e63] text-3d-goan-sm uppercase">
            HH GOA AI
          </div>
          <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold">
            © 2026 Hacker House Goa. Spill the Chai, Scale the RAG. #RAGInGoa
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 font-['Space_Grotesk',sans-serif] text-xs md:justify-end items-center uppercase font-bold">
          <Link className="hover:text-[#e91e63] transition-colors" href="/dashboard">
            Launch RAG
          </Link>
          <Link className="hover:text-[#e91e63] transition-colors" href="https://github.com/ajiteshvish/HHGOA_RAG" target="_blank">
            GitHub Repo
          </Link>
          <Link className="hover:text-[#e91e63] transition-colors" href="https://huggingface.co/datasets/ai4bharat/MSMARCO-XI" target="_blank">
            MSMARCO-XI Dataset
          </Link>
          <Link className="hover:text-[#e91e63] transition-colors" href="/login">
            Sign In
          </Link>
        </nav>
      </footer>
    </div>
  )
}
