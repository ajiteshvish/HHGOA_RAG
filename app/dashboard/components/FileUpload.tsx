'use client'

import { useCallback, useState } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle, Layers } from 'lucide-react'
import { ChunkingStrategy } from '@/lib/chunker'

interface UploadedDoc {
  id: string
  name: string
  chunks: number
  strategy?: string
}

interface FileUploadProps {
  onUploadComplete: (doc: UploadedDoc) => void
}

const acceptedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown'
]

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [selectedStrategy, setSelectedStrategy] = useState<ChunkingStrategy>('auto')

  const handleFile = useCallback(async (file: File) => {
    // Check type or extension
    const isTxtOrMd = file.name.endsWith('.txt') || file.name.endsWith('.md')
    if (!acceptedTypes.includes(file.type) && !isTxtOrMd) {
      setUploadStatus('error')
      setUploadMessage('Unsupported file type. Please upload PDF, DOCX, TXT, or MD.')
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')
    setProgress(10)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('strategy', selectedStrategy)

    try {
      setProgress(30)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      setProgress(80)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setProgress(100)
      setUploadStatus('success')
      setUploadMessage(`"${data.document.name}" indexed with ${data.document.strategy || selectedStrategy} chunking (${data.document.chunks} chunks)`)
      onUploadComplete(data.document)
    } catch (err: unknown) {
      setUploadStatus('error')
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploadMessage(message)
    } finally {
      setIsUploading(false)
    }
  }, [onUploadComplete, selectedStrategy])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="space-y-4">
      {/* Chunking Strategy Selector */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Chunking Strategy:
          </label>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value as ChunkingStrategy)}
            disabled={isUploading}
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="auto">Auto-Detect Structure</option>
            <option value="recursive">Recursive Character (500/100)</option>
            <option value="semantic">Semantic Sentence Similarity</option>
            <option value="markdown">Markdown &amp; Header-Aware</option>
          </select>
        </div>
        <p className="text-[11px] text-zinc-500">
          {selectedStrategy === 'auto' && 'Automatically picks optimal chunker based on file format & headers.'}
          {selectedStrategy === 'recursive' && 'Hierarchically splits text on paragraphs, sentences, and words.'}
          {selectedStrategy === 'semantic' && 'Detects semantic topic shifts using sentence similarity analysis.'}
          {selectedStrategy === 'markdown' && 'Preserves heading breadcrumbs and section hierarchies.'}
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragOver
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]'
            : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
          }
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-zinc-400">Processing &amp; embedding chunks...</p>
            <div className="w-full bg-zinc-700 rounded-full h-1.5 mt-1">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="w-8 h-8 text-zinc-500" />
            <p className="text-sm text-zinc-400">
              Drop file here or <span className="text-emerald-400 font-medium">browse</span>
            </p>
            <p className="text-xs text-zinc-600">PDF, DOCX, TXT, MD supported</p>
          </div>
        )}
      </div>

      {uploadStatus !== 'idle' && (
        <div
          className={`flex items-start gap-2 text-sm rounded-lg p-3 ${
            uploadStatus === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {uploadStatus === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <p>{uploadMessage}</p>
        </div>
      )}
    </div>
  )
}
