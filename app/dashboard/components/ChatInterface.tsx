'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  hasDocuments: boolean
}

export default function ChatInterface({ hasDocuments }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = input.trim()
    if (!query || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Add a placeholder assistant message
    const assistantMessageId = (Date.now() + 1).toString()
    setMessages(prev => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '' },
    ])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Chat request failed')
      }

      // Stream the response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let accumulatedContent = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedContent += chunk

          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          )
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Error: ${message}` }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-emerald-400" />
        <h2 className="font-semibold text-base text-zinc-100">Chat with your data</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center gap-3 py-20">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <Bot className="w-7 h-7 text-zinc-500" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">No messages yet</p>
              <p className="text-zinc-600 text-xs mt-1">
                {hasDocuments
                  ? 'Ask a question about your uploaded documents.'
                  : 'Upload a document first, then ask questions.'}
              </p>
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
              }`}
            >
              {message.content || (
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </span>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-zinc-300" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={!hasDocuments || isLoading}
            placeholder={
              hasDocuments
                ? 'Ask anything about your data...'
                : 'Upload a document to start chatting'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 
                       placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!hasDocuments || isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500
                       text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                       disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
