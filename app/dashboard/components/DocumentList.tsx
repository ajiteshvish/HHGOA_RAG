'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Document {
  id: string
  name: string
  type: string
  created_at: string
}

interface DocumentListProps {
  documents: Document[]
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

export default function DocumentList({ documents, onDelete }: DocumentListProps) {
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
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-800/70 transition-colors group"
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
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1 rounded"
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
