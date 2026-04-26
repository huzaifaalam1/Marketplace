'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  source?: 'model' | 'fallback'
}

function extractAnswer(raw: string) {
  const text = (raw || '').trim()
  if (!text) return ''

  const fullMatch = text.match(/<answer>\s*([\s\S]*?)\s*<\/answer>/i)
  if (fullMatch?.[1]) return fullMatch[1].trim()

  const openIdx = text.toLowerCase().indexOf('<answer>')
  if (openIdx !== -1) {
    const afterOpen = text.slice(openIdx + '<answer>'.length)
    const closeIdx = afterOpen.toLowerCase().indexOf('</answer>')
    const inner = closeIdx !== -1 ? afterOpen.slice(0, closeIdx) : afterOpen
    return inner.trim()
  }

  return text
}

const STORAGE_KEY = 'agentic_help_chat_v1'

export default function HelpChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hey! I'm your 24/7 AI assistant. How can I help you today?"
    }
  ])

  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed?.messages)) {
        const restored = parsed.messages
          .filter(
            (m: any) =>
              m &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string' &&
              m.content.trim().length > 0
          )
          .map((m: any) => {
            if (m.role !== 'assistant') return m
            return {
              ...m,
              content: extractAnswer(m.content)
            }
          })
          .slice(-50)

        if (restored.length > 0) setMessages(restored)
      }
      if (typeof parsed?.open === 'boolean') setOpen(parsed.open)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ open, messages: messages.slice(-50) })
      )
    } catch {
      // ignore
    }
  }, [open, messages])

  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [open, messages.length, loading])

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !loading
  }, [input, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setError(null)
    setInput('')

    const userMessage: ChatMessage = { role: 'user', content: text }
    const nextMessages: ChatMessage[] = [...messages, userMessage]
    setMessages(nextMessages)

    setLoading(true)

    try {
      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Chat request failed.')
        setLoading(false)
        return
      }

      if (typeof data?.message !== 'string' || !data.message.trim()) {
        setError('Empty response from server.')
        setLoading(false)
        return
      }

      const assistantText = extractAnswer(data.message)
      const source: 'model' | 'fallback' | undefined =
        data?.source === 'fallback' || data?.source === 'model'
          ? data.source
          : undefined
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantText || data.message, source }
      ])
      setLoading(false)
    } catch (e: any) {
      setError(e?.message || 'Chat request failed.')
      setLoading(false)
    }
  }

  const clear = () => {
    setError(null)
    setInput('')
    setLoading(false)
    setMessages([
      {
        role: 'assistant',
        content: "Hey! I'm your 24/7 AI assistant. How can I help you today?"
      }
    ])
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close help chat' : 'Open help chat'}
        className="fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-full shadow-lg bg-amber-400 hover:bg-amber-500 transition flex items-center justify-center"
      >
        <div className="w-8 h-8 relative">
          <Image src="/globe.svg" alt="Help" fill />
        </div>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[1000] w-[360px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-9rem)] bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-amber-100 border-b flex items-center justify-between">
            <div className="font-semibold text-gray-800">Help</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clear}
                className="text-xs px-2 py-1 rounded-lg bg-white border hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm px-2 py-1 rounded-lg hover:bg-amber-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  m.role === 'user'
                    ? 'ml-auto bg-amber-400 text-gray-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {m.content}
                {m.role === 'assistant' && m.source && (
                  <div className="mt-1 text-[10px] text-gray-500">
                    {m.source === 'model' ? 'AI' : 'Fallback'}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-gray-100 text-gray-700">
                Typing...
              </div>
            )}

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={send}
                disabled={!canSend}
                className="px-4 py-2 rounded-xl bg-gray-800 text-white text-sm disabled:bg-gray-300"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
