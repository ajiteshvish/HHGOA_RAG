'use client'

import { useState, useEffect, useCallback } from 'react'
import FileUpload from './FileUpload'
import ChatInterface from './ChatInterface'
import DocumentList from './DocumentList'
import { LogOut, FileStack, X, Menu, UploadCloud } from 'lucide-react'
import Link from 'next/link'

interface Document {
  id: string
  name: string
  type: string
  created_at: string
}

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(true)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents')
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (e) {
      console.error('Failed to fetch documents:', e)
    } finally {
      setIsLoadingDocs(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleUploadComplete = () => {
    fetchDocuments()
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0e0e11] overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex shrink-0 items-center justify-between px-4 sm:px-6 py-3 border-b-4 border-black bg-[#171305] text-[#f5f5f0] z-30">
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg bg-[#d2691e] text-black border-2 border-black font-bold shadow-[2px_2px_0_0_#000] cursor-pointer"
            title="Toggle Documents Drawer"
          >
            {isMobileDrawerOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#d2691e] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_0_#000] font-bold text-black text-sm group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-['Anton','Anybody',sans-serif] tracking-tight uppercase text-retro-3d-pop-sm">
                HH GOA • VOICE RAG
              </h1>
              <p className="text-[10px] text-zinc-400 font-['Space_Grotesk',sans-serif] hidden sm:block">
                Sub-200ms Qwen 3.6 &amp; Neon pgvector
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile quick upload badge */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 font-medium cursor-pointer"
          >
            <UploadCloud className="size-3.5 text-emerald-400" />
            <span>Docs ({documents.length})</span>
          </button>

          <span className="text-xs text-zinc-400 font-mono hidden lg:block">{userEmail}</span>

          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs text-black font-bold bg-[#e91e63] hover:bg-white px-3 py-1.5 rounded border-2 border-black shadow-[2px_2px_0_0_#000] transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Sidebar - Desktop */}
        <aside className="w-80 border-r-4 border-black flex flex-col bg-[#171305] text-[#f5f5f0] shrink-0 hidden md:flex">
          {/* Upload Section */}
          <div className="p-4 border-b-2 border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <FileStack className="w-4 h-4 text-[#d2691e]" />
              <h2 className="text-xs font-['Space_Grotesk',sans-serif] uppercase font-bold text-zinc-200">
                Upload &amp; Chunk Documents
              </h2>
            </div>
            <FileUpload onUploadComplete={handleUploadComplete} />
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-['Space_Grotesk',sans-serif] font-bold">
                Your Documents ({documents.length})
              </p>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">pgvector active</span>
            </div>
            <DocumentList
              documents={documents}
              isLoading={isLoadingDocs}
              onDelete={handleDeleteDocument}
            />
          </div>
        </aside>

        {/* Mobile Slide-over Drawer */}
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Drawer Panel */}
            <div className="relative w-4/5 max-w-xs bg-[#171305] text-[#f5f5f0] border-r-4 border-black h-full flex flex-col z-10 shadow-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileStack className="w-4 h-4 text-[#d2691e]" />
                  <h2 className="text-sm font-['Space_Grotesk',sans-serif] font-bold uppercase">
                    Documents &amp; Upload
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Mobile File Upload */}
              <div>
                <FileUpload onUploadComplete={handleUploadComplete} />
              </div>

              {/* Mobile Document List */}
              <div className="flex-1 overflow-y-auto">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-2">
                  Indexed Files ({documents.length})
                </p>
                <DocumentList
                  documents={documents}
                  isLoading={isLoadingDocs}
                  onDelete={handleDeleteDocument}
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Area - Fits 100% Screen */}
        <div className="flex-1 flex flex-col min-w-0 h-full p-2 sm:p-4 bg-[#0e0e11]">
          <ChatInterface hasDocuments={documents.length > 0} />
        </div>
      </div>
    </div>
  )
}
