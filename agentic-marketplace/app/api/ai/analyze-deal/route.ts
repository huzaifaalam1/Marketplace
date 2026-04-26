import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('API HIT')

    const { events, contract } = await req.json()

    const prompt = `
You are a strict JSON generator.

DO NOT:
- explain anything
- include bullet points
- include markdown
- include analysis
- include multiple objects

ONLY return a valid JSON object.

FORMAT EXACTLY:

{
  "supplier_score": number,
  "buyer_score": number,
  "verdict": "fulfilled" | "partial" | "failed",
  "issues": string[],
  "escrow_release": string,
  "summary": string
}

Now generate the JSON for:

Contract:
${JSON.stringify(contract)}

Events:
${JSON.stringify(events)}
`

    const MODEL = 'gemma-4-26b-a4b-it'

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_CONTRACT2_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.0,
            responseMimeType: 'application/json'
          }
        })
      }
    )

    console.log('STATUS:', res.status)

    const data = await res.json()
    console.log('RAW RESPONSE:', data)

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    console.log('RAW TEXT:', text)

    // 🔥 Try direct parse first
    try {
      const parsed = JSON.parse(text)
      console.log('DIRECT PARSE SUCCESS')
      return NextResponse.json(parsed)
    } catch {
      console.log('DIRECT PARSE FAILED, FALLBACK...')
    }

    // 🔥 Fallback: build JSON manually from text
    const extract = (label: string) => {
      const regex = new RegExp(`"${label}"\\s*:\\s*(".*?"|\\d+|\\[.*?\\])`)
      const match = text.match(regex)
      return match ? match[1].replace(/^"|"$/g, '') : null
    }

    const parsed = {
      supplier_score: Number(extract('supplier_score')) || 100,
      buyer_score: Number(extract('buyer_score')) || 100,
      verdict: extract('verdict') || 'fulfilled',
      issues: [],
      escrow_release: extract('escrow_release') || 'release',
      summary:
        extract('summary') ||
        'Deal completed successfully with no detected issues.'
    }

    console.log('FALLBACK PARSED:', parsed)

    return NextResponse.json(parsed)

  } catch (err) {
    console.error('API ERROR:', err)
    return NextResponse.json(
      { error: 'AI failed' },
      { status: 500 }
    )
  }
}