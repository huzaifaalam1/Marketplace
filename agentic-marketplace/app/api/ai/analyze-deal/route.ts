import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('API HIT')

    const { events, contract } = await req.json()

    const prompt = `
You are a strict JSON generator analyzing a deal execution.

DO NOT:
- explain anything
- include bullet points
- include markdown
- include analysis
- include multiple objects

ONLY return a valid JSON object.

FORMAT EXACTLY:

{
  "supplier_score": number (0-100),
  "buyer_score": number (0-100),
  "verdict": "fulfilled" | "partial" | "failed",
  "issues": string[],
  "escrow_release": string (explain decision),
  "summary": string
}

ANALYSIS INSTRUCTIONS:
- Review the contract text, summary, and risks to understand obligations
- Analyze timeline events (text updates and image evidence) from both buyer and supplier
- Score each party based on contract compliance and communication
- Identify any issues or discrepancies
- Determine if escrow should be released (fulfilled), partially released (partial), or held (failed)

Now generate the JSON for:

Contract Data:
${JSON.stringify(contract)}

Timeline Events:
${JSON.stringify(events)}
`

    const MODEL = 'gemma-4-26b-a4b-it'

    // Robust extraction: scan the text for every balanced {...} block,
    // attempt to JSON.parse each, and keep the last one that matches our schema.
    const findJsonCandidates = (s: string): string[] => {
      const candidates: string[] = []
      let depth = 0
      let start = -1
      let inString = false
      let escape = false
      for (let i = 0; i < s.length; i++) {
        const ch = s[i]
        if (inString) {
          if (escape) { escape = false }
          else if (ch === '\\') { escape = true }
          else if (ch === '"') { inString = false }
          continue
        }
        if (ch === '"') { inString = true; continue }
        if (ch === '{') {
          if (depth === 0) start = i
          depth++
        } else if (ch === '}') {
          depth--
          if (depth === 0 && start !== -1) {
            candidates.push(s.slice(start, i + 1))
            start = -1
          }
        }
      }
      return candidates
    }

    const tryExtract = (text: string): any | null => {
      // Try direct parse first
      try {
        return JSON.parse(text)
      } catch {}

      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '')
      const candidates = findJsonCandidates(cleaned)
      for (let i = candidates.length - 1; i >= 0; i--) {
        try {
          const obj = JSON.parse(candidates[i])
          if (
            obj &&
            typeof obj === 'object' &&
            'supplier_score' in obj &&
            'buyer_score' in obj &&
            'verdict' in obj &&
            'summary' in obj
          ) {
            return obj
          }
        } catch {}
      }
      return null
    }

    const callModel = async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_STAGE4_KEY}`,
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
              temperature: 0.9,
              topP: 0.95,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json'
            }
          })
        }
      )
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      return { status: res.status, data, text }
    }

    const MAX_ATTEMPTS = 3
    let parsed: any = null
    let lastText = ''
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`MODEL CALL ATTEMPT ${attempt}/${MAX_ATTEMPTS}`)
      const { status, text } = await callModel()
      console.log('STATUS:', status)
      lastText = text
      parsed = tryExtract(text)
      if (parsed) {
        console.log(`EXTRACTED JSON SUCCESS (attempt ${attempt}):`, parsed)
        return NextResponse.json(parsed)
      }
      console.log(`Attempt ${attempt} failed to produce valid JSON, retrying...`)
    }

    console.error('NO VALID JSON FOUND AFTER RETRIES. Last text:', lastText.slice(0, 500))
    return NextResponse.json(
      { error: 'AI did not return valid JSON after retries' },
      { status: 502 }
    )

  } catch (err) {
    console.error('API ERROR:', err)
    return NextResponse.json(
      { error: 'AI failed' },
      { status: 500 }
    )
  }
}