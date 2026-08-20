'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface Document {
  id: string
  name: string
  type: string
  created_at: string
}

interface DocumentListProps {
  documents: Document[]
  isLoading?: boolean
  onDelete: (id: string) => void
}

const fileIcon = (type: string) => {
  switch (type) {
    case 'application/pdf':
      return <span className="text-[#e91e63] text-[10px] font-bold">PDF</span>
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return <span className="text-[#38bdf8] text-[10px] font-bold">DOCX</span>
    default:
      return <span className="text-[#ffdb3c] text-[10px] font-bold">TXT</span>
  }
}

export default function DocumentList({ documents, isLoading = false, onDelete }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(id)
      }
    } catch (e) {
      console.error('Delete failed:', e)
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2 py-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#1f1c0b] border-2 border-black shadow-[2px_2px_0_0_#000]">
            <Skeleton className="w-7 h-7 rounded bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-3 w-3/4 bg-zinc-800" />
              <Skeleton className="h-2 w-1/3 bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-500 text-xs font-['Space_Grotesk',sans-serif]">
        No documents uploaded yet.
      </div>
    )
  }

  return (
    <div className="space-y-2 font-['Space_Grotesk',sans-serif]">
      {documents.map(doc => (
        <div
          key={doc.id}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-[#1f1c0b] border-2 border-black hover:border-[#d2691e] hover:bg-[#d2691e] hover:text-black transition-all shadow-[2px_2px_0_0_#000] group"
        >
          <div className="w-7 h-7 rounded bg-black border border-zinc-700 flex items-center justify-center shrink-0">
            {fileIcon(doc.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-[#f5f5f0] group-hover:text-black">{doc.name}</p>
            <p className="text-[10px] text-zinc-400 group-hover:text-black font-mono">
              {new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => handleDelete(doc.id)}
            disabled={deletingId === doc.id}
            className="opacity-0 group-hover:opacity-100 text-black hover:text-white hover:bg-black p-1 rounded transition-all cursor-pointer"
            title="Delete Document"
          >
            {deletingId === doc.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
