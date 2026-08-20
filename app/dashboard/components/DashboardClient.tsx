'use client'

import { useState, useEffect, useCallback } from 'react'
import FileUpload from './FileUpload'
import ChatInterface from './ChatInterface'
import DocumentList from './DocumentList'
import { LogOut, Brain, FileStack } from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  created_at: string
}

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(true)

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocuments()
  }, [fetchDocuments])

  const handleUploadComplete = () => {
    // Add the doc to the list (we refetch for accurate data)
    fetchDocuments()
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Personal RAG AI</h1>
            <p className="text-[11px] text-zinc-500">Chat with your documents</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 hidden sm:block">{userEmail}</span>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Documents */}
        <aside className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950 shrink-0 hidden md:flex">
          {/* Upload Section */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <FileStack className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-medium text-zinc-300">Upload Documents</h2>
            </div>
            <FileUpload onUploadComplete={handleUploadComplete} />
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium px-2 mb-2">
              Your Documents ({documents.length})
            </p>
            <DocumentList
              documents={documents}
              isLoading={isLoadingDocs}
              onDelete={handleDeleteDocument}
            />
          </div>
        </aside>

        {/* Mobile upload toggle (shown on small screens) */}
        <div className="md:hidden absolute bottom-20 right-4 z-40">
          {/* Could add a floating action button for mobile upload */}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface hasDocuments={documents.length > 0} />
        </div>
      </div>
    </div>
  )
}
