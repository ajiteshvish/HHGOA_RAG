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
      return <span className="text-red-400 text-xs font-bold">PDF</span>
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return <span className="text-blue-400 text-xs font-bold">DOCX</span>
    default:
      return <span className="text-zinc-400 text-xs font-bold">TXT</span>
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
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
            <Skeleton className="w-8 h-8 rounded-md shrink-0 bg-zinc-800/60" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-3.5 w-3/4 bg-zinc-800/60" />
              <Skeleton className="h-2.5 w-1/3 bg-zinc-800/40" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-600 text-sm">
        No documents uploaded yet.
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {documents.map(doc => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-800/70 transition-colors group border border-transparent hover:border-zinc-700/40"
        >
          <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
            {fileIcon(doc.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-200 truncate">{doc.name}</p>
            <p className="text-xs text-zinc-600">
              {new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => handleDelete(doc.id)}
            disabled={deletingId === doc.id}
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1 rounded cursor-pointer"
          >
            {deletingId === doc.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
