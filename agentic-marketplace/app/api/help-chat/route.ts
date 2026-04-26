import { NextRequest, NextResponse } from 'next/server'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function extractAnswer(raw: string) {
  const text = (raw || '').trim()
  if (!text) return ''

  const tagMatch = text.match(/<answer>\s*([\s\S]*?)\s*<\/answer>/i)
  if (tagMatch?.[1]) return tagMatch[1].trim()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch?.[0]) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (typeof parsed?.answer === 'string') return parsed.answer.trim()
    } catch {
      // ignore
    }
  }

  return text
}

function hasAnswerTag(raw: string) {
  return /<answer>[\s\S]*<\/answer>/i.test((raw || '').trim())
}

function isPlaceholderAnswer(text: string) {
  const t = (text || '').trim().toLowerCase()
  if (!t) return true

  const short = t.length <= 40
  const onlyDots = /^[. …]+$/.test(t)
  const containsYourReply = t.includes('your reply')
  const containsEllipses = t.includes('...') || t.includes('…')

  return onlyDots || containsYourReply || (short && containsEllipses)
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_CHAT_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GOOGLE_CHAT_KEY in server environment.' },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))

    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
      : typeof body?.message === 'string'
        ? [{ role: 'user', content: body.message }]
        : []

    const normalized = (messages || [])
      .filter(
        (m: any) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim().length > 0
      )
      .slice(-24)

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided.' },
        { status: 400 }
      )
    }

    const MODEL = process.env.GOOGLE_CHAT_MODEL || 'gemma-4-26b-a4b-it'

    const sanitized = normalized.map((m) => {
      if (m.role !== 'assistant') return m
      return {
        ...m,
        content: extractAnswer(m.content)
      }
    })

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text:
              "You are a 24/7 help chatbot for the Agentic Marketplace web app.\n\nOutput format rules (critical):\n- You MUST return ONLY the final answer wrapped in XML tags exactly like this (no extra text before/after):\n  <answer>Hello! How can I help?</answer>\n- Do NOT output anything outside of the <answer> and </answer> tags.\n- Do NOT include your reasoning, analysis, scratchpad, or meta-commentary.\n- Do NOT use placeholders (for example: 'your reply'). Write the real answer.\n- Never ask for secrets (API keys, passwords, private keys).\n- If you don't know, say so briefly and suggest what to check next.\n\nAbout the app (use this to give precise directions):\n- It's a marketplace connecting buyers and suppliers and managing deals from the dashboard.\n- Use the app's sidebar group names when guiding users:\n  - Initiate Deals → Find Buyers (/dashboard/find-buyers)\n  - Initiate Deals → Find Suppliers (/dashboard/find-suppliers)\n  - Add Products → Create Listing (/dashboard/create-supplier)\n  - Add Products → Create Request (/dashboard/create-buyer)\n  - Add Products → Edit Requests/Listings (/dashboard/my-listings)\n  - Active Deals (/dashboard/active-deals)\n\nStyle: concise, friendly, actionable."
          }
        ]
      },
      ...sanitized.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ]

    const callModel = async (contentsToSend: any[]) => {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contentsToSend,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 512
            }
          })
        }
      )

      const data = await upstream.json().catch(() => ({}))

      if (!upstream.ok) {
        const message =
          data?.error?.message || `Upstream model error (${upstream.status})`
        return { ok: false as const, error: message, raw: '' }
      }

      const textParts = data?.candidates?.[0]?.content?.parts
      const raw = Array.isArray(textParts)
        ? textParts.map((p: any) => p?.text || '').join('')
        : ''

      return { ok: true as const, raw }
    }

    const first = await callModel(contents)
    if (!first.ok) {
      return NextResponse.json({ error: first.error }, { status: 500 })
    }

    const firstHasTag = hasAnswerTag(first.raw)
    let cleaned = extractAnswer(first.raw)
    let valid = firstHasTag && !isPlaceholderAnswer(cleaned)
    let source: 'model' | 'fallback' = 'model'

    if (!firstHasTag || isPlaceholderAnswer(cleaned)) {
      const retryContents = [
        ...contents,
        {
          role: 'user',
          parts: [
            {
              text:
                'IMPORTANT: Reply to the last user message with a real, helpful answer. Do not use placeholders or strings of dots. Output only a single <answer> element containing the real answer (example: <answer>Hi! How can I help?</answer>), with nothing else.'
            }
          ]
        }
      ]

      const retry = await callModel(retryContents)
      if (retry.ok) {
        const retryHasTag = hasAnswerTag(retry.raw)
        const retryCleaned = extractAnswer(retry.raw)
        if (retryHasTag && !isPlaceholderAnswer(retryCleaned)) {
          cleaned = retryCleaned
          valid = true
        }
      }
    }

    if (!valid || !cleaned.trim() || isPlaceholderAnswer(cleaned)) {
      cleaned =
        "Agentic Marketplace is a dashboard-based marketplace that connects buyers and suppliers and helps you manage active deals.\n\nTo browse products to buy (suppliers): Sidebar → Initiate Deals → Find Suppliers (/dashboard/find-suppliers).\nTo find buyers to sell to: Sidebar → Initiate Deals → Find Buyers (/dashboard/find-buyers).\nTo create a listing: Sidebar → Add Products → Create Listing (/dashboard/create-supplier).\nTo manage/edit your listings/requests: Sidebar → Add Products → Edit Requests/Listings (/dashboard/my-listings)."
      source = 'fallback'
    }

    if (!cleaned.trim()) {
      return NextResponse.json(
        { error: 'Empty response from model.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: cleaned, source })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Chat request failed.' },
      { status: 500 }
    )
  }
}
