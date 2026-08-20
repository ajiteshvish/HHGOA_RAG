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
      setUploadMessage(`Indexed ${data.chunks} chunks with strategy [${selectedStrategy.toUpperCase()}]!`)
      onUploadComplete({
        id: data.documentId,
        name: data.name,
        chunks: data.chunks,
        strategy: selectedStrategy
      })

      setTimeout(() => {
        setUploadStatus('idle')
        setProgress(0)
      }, 4000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploadStatus('error')
      setUploadMessage(message)
    } finally {
      setIsUploading(false)
    }
  }, [selectedStrategy, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="space-y-3 font-['Space_Grotesk',sans-serif]">
      {/* Chunking Strategy Selector */}
      <div className="bg-[#1f1c0b] border-2 border-black rounded-lg p-2.5 text-xs space-y-1.5 shadow-[3px_3px_0_0_#000]">
        <div className="flex items-center justify-between gap-1">
          <label className="flex items-center gap-1 font-bold text-[#f5f5f0] text-[11px] uppercase">
            <Layers className="w-3.5 h-3.5 text-[#d2691e]" />
            Strategy:
          </label>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value as ChunkingStrategy)}
            disabled={isUploading}
            className="bg-[#171305] border-2 border-black text-[#ffdb3c] font-bold rounded px-2 py-1 text-[11px] focus:outline-none focus:border-[#e91e63] cursor-pointer"
          >
            <option value="auto">Auto-Detect</option>
            <option value="recursive">Recursive (500/100)</option>
            <option value="semantic">Semantic Shift</option>
            <option value="markdown">Markdown Headers</option>
          </select>
        </div>
        <p className="text-[10px] text-zinc-400 font-['Be_Vietnam_Pro',sans-serif]">
          {selectedStrategy === 'auto' && 'Picks optimal chunker based on file format & headers.'}
          {selectedStrategy === 'recursive' && 'Hierarchically splits text on paragraphs and sentences.'}
          {selectedStrategy === 'semantic' && 'Detects semantic topic shifts via sentence embeddings.'}
          {selectedStrategy === 'markdown' && 'Preserves heading breadcrumbs and document structure.'}
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-3 border-dashed rounded-lg p-5 text-center cursor-pointer
          transition-all duration-200 ease-in-out bg-[#1f1c0b]
          ${isDragOver
            ? 'border-[#e91e63] bg-[#e91e63]/15 scale-[1.02] shadow-[4px_4px_0_0_#000]'
            : 'border-black hover:border-[#d2691e] hover:bg-[#1f1c0b]/80 shadow-[3px_3px_0_0_#000]'
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
          <div className="flex flex-col items-center gap-2 py-1">
            <Loader2 className="w-6 h-6 text-[#d2691e] animate-spin" />
            <p className="text-xs text-zinc-200 font-bold">Chunking &amp; pgvector indexing...</p>
            <div className="w-full bg-black rounded-full h-2 mt-1 border border-zinc-700">
              <div
                className="bg-[#d2691e] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div className="w-8 h-8 rounded-full bg-[#d2691e] border-2 border-black flex items-center justify-center text-black font-bold shadow-[2px_2px_0_0_#000]">
              <Upload className="w-4 h-4" />
            </div>
            <p className="text-xs text-[#f5f5f0] font-bold">
              Drop file here or <span className="text-[#ffdb3c] underline">browse</span>
            </p>
            <p className="text-[10px] text-zinc-400">PDF, DOCX, TXT, MD supported</p>
          </div>
        )}
      </div>

      {uploadStatus !== 'idle' && (
        <div
          className={`flex items-start gap-2 text-xs rounded-lg p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000] font-bold ${
            uploadStatus === 'success'
              ? 'bg-[#d2691e] text-black'
              : 'bg-[#e91e63] text-white'
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
