'use client'

import { useCallback, useState } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadedDoc {
  id: string
  name: string
  chunks: number
}

interface FileUploadProps {
  onUploadComplete: (doc: UploadedDoc) => void
}

const acceptedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [progress, setProgress] = useState(0)


  const handleFile = useCallback(async (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      setUploadStatus('error')
      setUploadMessage('Unsupported file type. Please upload PDF, DOCX, or TXT.')
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')
    setProgress(10)

    const formData = new FormData()
    formData.append('file', file)

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
      setUploadMessage(`"${data.document.name}" processed (${data.document.chunks} chunks)`)
      onUploadComplete(data.document)
    } catch (err: unknown) {
      setUploadStatus('error')
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploadMessage(message)
    } finally {
      setIsUploading(false)
    }
  }, [onUploadComplete])

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
    <div className="space-y-3">
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
          accept=".pdf,.docx,.txt"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-zinc-400">Processing document...</p>
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
            <p className="text-xs text-zinc-600">PDF, DOCX, TXT supported</p>
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
