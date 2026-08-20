import Link from 'next/link'
import { Brain, FileText, MessageSquare, Search, Zap, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col bg-zinc-950 min-h-screen">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="flex flex-col items-center text-center max-w-3xl gap-6">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-2">
            <Brain className="w-8 h-8 text-white" />
          </div>

          {/* Badge */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-4 py-1.5 rounded-full">
            Powered by RAG + Vector Search
          </div>

          {/* Title */}
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-zinc-100 leading-tight">
            Your Personal
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"> AI Memory</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-zinc-400 max-w-xl leading-relaxed">
            Upload your documents — PDFs, notes, chats, books — and ask questions.
            Get instant, context-aware answers from your own data.
          </p>

          {/* CTA */}
          <div className="flex gap-4 mt-4">
            <Link
              href="/login"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-medium text-sm
                         transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 hover:scale-[1.02]"
            >
              Get Started Free
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-24 max-w-4xl w-full px-4">
          {[
            {
              icon: <FileText className="w-5 h-5" />,
              title: 'Upload Anything',
              desc: 'PDF, DOCX, TXT files — your resume, notes, books, and chats.',
            },
            {
              icon: <Search className="w-5 h-5" />,
              title: 'Vector Search',
              desc: 'Documents are chunked and embedded for semantic similarity search.',
            },
            {
              icon: <MessageSquare className="w-5 h-5" />,
              title: 'Chat with Data',
              desc: 'Ask natural language questions and get context-aware answers.',
            },
            {
              icon: <Zap className="w-5 h-5" />,
              title: 'Instant Processing',
              desc: 'Files are processed, chunked, and indexed in seconds.',
            },
            {
              icon: <Shield className="w-5 h-5" />,
              title: 'Private & Secure',
              desc: 'Your data stays in your database with row-level security.',
            },
            {
              icon: <Brain className="w-5 h-5" />,
              title: 'Smart AI',
              desc: 'Powered by state-of-the-art LLMs via OpenRouter.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:bg-emerald-500/15 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">{feature.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 text-center text-xs text-zinc-600">
          Built with Next.js • Neon DB (PostgreSQL) • pgvector • Groq
        </div>
      </div>
    </div>
  )
}
