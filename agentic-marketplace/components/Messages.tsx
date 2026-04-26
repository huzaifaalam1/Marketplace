'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Paperclip } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Messages({ initialChatId }: any) {
  const router = useRouter()

  const lastManualChatIdRef = useRef<string | null>(null)
  const lastManualAtRef = useRef<number>(0)
  const openChatSeqRef = useRef(0)
  const shouldScrollToBottomRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)

  const [conversations, setConversations] = useState<any[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [profileMap, setProfileMap] = useState<Record<string, any>>({})
  const [unreadByConversationId, setUnreadByConversationId] = useState<Record<string, number>>({})
  const [lastReadAtByConversationId, setLastReadAtByConversationId] = useState<Record<string, string | null>>({})
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  // 🔐 GET USER
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUserId(session?.user?.id || null)
    }

    getUser()
  }, [])

  // 📥 LOAD CONVERSATIONS
  const loadConversations = async (uid: string) => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    setConversations(data || [])
  }

  const hydrateProfilesForConversations = async (uid: string, convos: any[]) => {
    const ids = new Set<string>()
    for (const c of convos) {
      if (c?.user1_id && c.user1_id !== uid) ids.add(c.user1_id)
      if (c?.user2_id && c.user2_id !== uid) ids.add(c.user2_id)
    }

    const idsToFetch = [...ids]
    if (idsToFetch.length === 0) return

    setProfileMap((prev) => {
      const next = { ...prev }
      for (const id of idsToFetch) {
        if (!(id in next)) next[id] = null
      }
      return next
    })

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, organization_name')
      .in('id', idsToFetch)

    if (!data) return

    setProfileMap((prev) => {
      const next = { ...prev }
      for (const p of data) next[p.id] = p
      return next
    })
  }

  useEffect(() => {
    if (!userId) return
    loadConversations(userId)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadReadStateAndUnreadCounts(userId, conversations)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, conversations])

  useEffect(() => {
    if (!userId) return
    hydrateProfilesForConversations(userId, conversations)
  }, [userId, conversations])

  // 💬 OPEN CHAT
  const openChat = async (conversation: any, opts?: { syncUrl?: boolean }) => {
    const seq = ++openChatSeqRef.current

    const syncUrl = opts?.syncUrl === true

    // update URL so deep-link state matches manual selection
    if (syncUrl && conversation?.id != null) {
      lastManualChatIdRef.current = String(conversation.id)
      lastManualAtRef.current = Date.now()
      router.replace(`/dashboard?chat=${conversation.id}`)
    }

    if (conversation?.id != null) {
      setActiveChatId(String(conversation.id))
    }

    setActiveChat(conversation)

    // clear immediately for smoother transition while loading
    shouldScrollToBottomRef.current = false
    setMessages([])

    setUnreadByConversationId((prev) => {
      const next = { ...prev }
      if (conversation?.id != null) delete next[String(conversation.id)]
      return next
    })

    if (conversation?.id != null && userId) {
      const nowIso = new Date().toISOString()
      setLastReadAtByConversationId((prev) => ({
        ...prev,
        [String(conversation.id)]: nowIso
      }))

      await supabase
        .from('conversation_reads')
        .upsert({
          user_id: userId,
          conversation_id: conversation.id,
          last_read_at: nowIso
        }, {
          onConflict: 'user_id,conversation_id'
        })
    }

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (seq !== openChatSeqRef.current) return

    // ensure we jump to the latest message after the list renders
    shouldScrollToBottomRef.current = true
    setMessages(data || [])

    // If this is still the latest open request, allow the scroll effect below to run.
    // (We keep the flag true until after setMessages so the DOM has a chance to render.)
  }

  useEffect(() => {
    if (!activeChatId) return
    if (!shouldScrollToBottomRef.current) return

    const raf = requestAnimationFrame(() => {
      const el = messagesScrollRef.current
      if (el) {
        el.scrollTop = el.scrollHeight
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }
      shouldScrollToBottomRef.current = false
    })

    return () => cancelAnimationFrame(raf)
  }, [activeChatId, messages.length])

  const activeConversation =
    (activeChatId
      ? conversations.find((c) => String(c.id) === String(activeChatId))
      : null) || activeChat

  const loadReadStateAndUnreadCounts = async (uid: string, convos: any[]) => {
    const convIds = convos.map((c) => c.id).filter(Boolean)
    if (convIds.length === 0) return

    const { data: reads, error: readsError } = await supabase
      .from('conversation_reads')
      .select('conversation_id,last_read_at')
      .eq('user_id', uid)
      .in('conversation_id', convIds)

    if (readsError) {
      console.error('LOAD READ STATE ERROR:', readsError)
      return
    }

    const readsMap: Record<string, string | null> = {}
    for (const r of reads || []) {
      readsMap[String(r.conversation_id)] = r.last_read_at
    }

    setLastReadAtByConversationId((prev) => ({
      ...prev,
      ...readsMap
    }))

    // compute unread counts by fetching messages after the earliest last_read_at
    const allReadTimes = Object.values(readsMap).filter(Boolean) as string[]
    const earliest = allReadTimes.length > 0
      ? allReadTimes.reduce((min, cur) => (cur < min ? cur : min), allReadTimes[0])
      : '1970-01-01T00:00:00.000Z'

    const { data: recentMessages, error: msgError } = await supabase
      .from('messages')
      .select('id,conversation_id,sender_id,created_at')
      .in('conversation_id', convIds)
      .neq('sender_id', uid)
      .gt('created_at', earliest)

    if (msgError) {
      console.error('LOAD UNREAD COUNTS ERROR:', msgError)
      return
    }

    const counts: Record<string, number> = {}
    for (const m of recentMessages || []) {
      const cid = String(m.conversation_id)
      const readAt = readsMap[cid] || null
      if (!readAt || (m.created_at && m.created_at > readAt)) {
        counts[cid] = (counts[cid] || 0) + 1
      }
    }

    setUnreadByConversationId((prev) => ({
      ...prev,
      ...counts
    }))
  }

  const fetchConversationById = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle()

    if (error) {
      console.error('FETCH CONVERSATION ERROR:', error)
      return null
    }

    return data
  }

  const getOtherUserId = (conversation: any) => {
    if (!conversation || !userId) return null
    return conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id
  }

  const getOtherUserLabel = (conversation: any) => {
    const otherId = getOtherUserId(conversation)
    if (!otherId) return 'Unknown'
    const p = profileMap[otherId]
    return p?.display_name || p?.full_name || p?.organization_name || `User ${otherId.slice(0, 6)}`
  }

  // 📤 SEND MESSAGE (OPTIMISTIC UI)
  const sendMessage = async () => {
    if ((!text.trim() && !pendingFile) || !activeChat || !userId) return

    const messageText = text

    setText('')

    let attachment: {
      url: string
      name: string
      mime: string
      size: number
    } | null = null

    if (pendingFile) {
      const file = pendingFile
      setPendingFile(null)

      const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
      const path = `${activeChat.id}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`

      const { error: uploadError } = await supabase
        .storage
        .from('chat-attachments')
        .upload(path, file, {
          contentType: file.type || undefined,
          upsert: false
        })

      if (uploadError) {
        console.error('UPLOAD ERROR:', uploadError)
        alert(uploadError.message)
        return
      }

      const { data: publicUrlData } = supabase
        .storage
        .from('chat-attachments')
        .getPublicUrl(path)

      const publicUrl = publicUrlData?.publicUrl
      if (!publicUrl) {
        alert('Failed to generate attachment URL')
        return
      }

      attachment = {
        url: publicUrl,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size
      }
    }

    const finalContent = messageText.trim()
      ? messageText
      : attachment
        ? attachment.name
        : ''

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeChat.id,
        sender_id: userId,
        content: finalContent,
        attachment_url: attachment?.url ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_mime: attachment?.mime ?? null,
        attachment_size: attachment?.size ?? null
      })
      .select()
      .single()

    if (error) {
      console.error('SEND MESSAGE ERROR:', error)
      alert(error.message)
      return
    }

    if (data) {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id && data.id && m.id === data.id)
        if (exists) return prev
        return [...prev, data]
      })
    }
  }

  // 💥 REALTIME MESSAGES (ACTIVE CHAT)
  useEffect(() => {
    if (!activeChat?.id) return

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeChat.id}`
        },
        (payload) => {
          // Ignore our own messages; we already append after insert
          if (payload.new?.sender_id === userId) return

          setMessages((prev) => {
            const existsById =
              payload.new?.id && prev.some((m) => m.id === payload.new.id)
            if (existsById) return prev

            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChat, userId])

  // 💥 REALTIME: UNREAD COUNTS + LIVE UPDATES FOR LIST
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('messages-unread-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg: any = payload.new
          if (!newMsg?.conversation_id) return
          if (newMsg.sender_id === userId) return

          const convId = String(newMsg.conversation_id)
          const isActive = activeChat?.id != null && String(activeChat.id) === convId

          if (isActive) {
            setMessages((prev) => {
              const existsById = newMsg?.id && prev.some((m) => m.id === newMsg.id)
              if (existsById) return prev
              return [...prev, newMsg]
            })

            const nowIso = new Date().toISOString()
            setLastReadAtByConversationId((prev) => ({
              ...prev,
              [convId]: nowIso
            }))

            supabase
              .from('conversation_reads')
              .upsert({
                user_id: userId,
                conversation_id: newMsg.conversation_id,
                last_read_at: nowIso
              }, {
                onConflict: 'user_id,conversation_id'
              })

            return
          }

          const readAt = lastReadAtByConversationId[convId] || null
          if (readAt && newMsg.created_at && newMsg.created_at <= readAt) return

          setUnreadByConversationId((prev) => ({
            ...prev,
            [convId]: (prev[convId] || 0) + 1
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, activeChat, lastReadAtByConversationId])

  // 💥 REALTIME CONVERSATIONS
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          loadConversations(userId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // ⚡ AUTO OPEN CHAT FROM NAVIGATION
  useEffect(() => {
    const run = async () => {
      if (!initialChatId || !userId) return

      // If the user just manually selected a chat, don't let deep-linking override clicks.
      if (Date.now() - lastManualAtRef.current < 1000) {
        return
      }

      // If the user manually selected a different chat than what's currently in the URL,
      // don't let deep-linking override their choice.
      if (
        lastManualChatIdRef.current &&
        String(lastManualChatIdRef.current) !== String(initialChatId)
      ) {
        return
      }

      // don't re-open the same chat
      if (activeChatId && String(activeChatId) === String(initialChatId)) return

      // 1) try local list first (handles normal case)
      const existing = conversations.find(
        (c) => String(c.id) === String(initialChatId)
      )

      if (existing) {
        await openChat(existing)
        return
      }

      // 2) fallback: fetch from DB (handles slow conversation loading)
      const fetched = await fetchConversationById(String(initialChatId))
      if (!fetched) return

      const isParticipant =
        fetched.user1_id === userId || fetched.user2_id === userId
      if (!isParticipant) return

      setConversations((prev) => {
        const already = prev.some((c) => String(c.id) === String(fetched.id))
        if (already) return prev
        return [fetched, ...prev]
      })

      await openChat(fetched)
    }

    run()
  }, [initialChatId, conversations, userId, activeChatId])

  return (
    <div className="flex h-full bg-amber-100 rounded-2xl overflow-hidden border border-black/15 ring-1 ring-black/10 shadow-lg min-h-0">

      {/* LEFT */}
      <div className="w-1/4 bg-amber-100 p-4 overflow-y-auto border-r border-black">
        <h2 className="font-bold mb-4">Messages</h2>

        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => openChat(c, { syncUrl: true })}
            className={`p-3 mb-2 rounded-xl cursor-pointer transition ${
              activeChatId != null && String(activeChatId) === String(c.id)
                ? 'bg-amber-300'
                : 'bg-white hover:bg-amber-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{getOtherUserLabel(c)}</span>
              {!!unreadByConversationId[String(c.id)] && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadByConversationId[String(c.id)] > 9 ? '9+' : unreadByConversationId[String(c.id)]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex flex-col min-h-0">

        <div className="p-3 bg-amber-100 border-b text-sm font-semibold">
          {activeConversation ? getOtherUserLabel(activeConversation) : 'No conversation selected'}
        </div>

        {/* messages */}
        <div ref={messagesScrollRef} className="flex-1 min-h-0 p-4 overflow-y-auto bg-amber-100 space-y-2 overscroll-contain">

          {activeChat ? (
            messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-xl w-fit max-w-[80%] text-sm break-words whitespace-pre-wrap ${
                  m.sender_id === userId
                    ? 'bg-amber-400 ml-auto'
                    : 'bg-white'
                }`}
              >
                {m.content}

                {m.attachment_url && (
                  <div className="mt-2">
                    {typeof m.attachment_mime === 'string' && m.attachment_mime.startsWith('image/') ? (
                      <div className="flex flex-col gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.attachment_url}
                          alt={m.attachment_name || 'attachment'}
                          className="max-w-[240px] w-full rounded-lg"
                        />
                        <a
                          href={`${m.attachment_url}?download=${encodeURIComponent(m.attachment_name || 'image')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs underline"
                        >
                          Download image
                        </a>
                      </div>
                    ) : (
                      <a
                        href={m.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline"
                      >
                        {m.attachment_name || 'Download file'}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm">Select a conversation to start chatting.</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* input */}
        {activeChat && (
          <div className="p-3 bg-white border-t">
            {pendingFile && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 bg-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-700 truncate">
                    {pendingFile.name}
                  </span>
                </div>

                <button
                  onClick={() => setPendingFile(null)}
                  className="text-red-600 text-sm font-bold px-2"
                  aria-label="Remove attachment"
                  type="button"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex gap-2">

              <label className="cursor-pointer px-2 py-2 rounded-lg border bg-white hover:bg-gray-50">
                <input
                  type="file"
                  onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Paperclip size={18} />
              </label>

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="Type a message..."
              />

              <button
                onClick={sendMessage}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Send
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  )
} 