import { NextRequest, NextResponse } from 'next/server'

// =========================
// 🧠 CLEAN OUTPUT (MINIMAL)
// =========================
function cleanGeneratedContract(text: string): string {
    const matches: number[] = []

    let idx = text.indexOf('SERVICE AGREEMENT')
    while (idx !== -1) {
        matches.push(idx)
        idx = text.indexOf('SERVICE AGREEMENT', idx + 1)
    }

    if (matches.length === 0) return text.trim()

    // 🔥 try from LAST occurrence backwards
    for (let i = matches.length - 1; i >= 0; i--) {
        const start = matches[i]
        let contract = text.slice(start)

        // cut off trailing garbage
        const badMarkers = [
        '*Final',
        '*Check',
        '*Constraint',
        '*Refining',
        '*Wait'
        ]

        for (const marker of badMarkers) {
        const cut = contract.indexOf(marker)
        if (cut !== -1) {
            contract = contract.slice(0, cut)
        }
    }

    contract = contract.trim()

    // ✅ VALID CONTRACT CHECK
    // ✅ VALID CONTRACT CHECK
    if (
        contract.includes('SCOPE OF WORK') &&
        contract.includes('LIABILITY') &&
        contract.length > 800
    ) {
    // trim after last signature Date
    const lastDateIndex = contract.lastIndexOf('Date:')

    if (lastDateIndex !== -1) {
        const endOfLine = contract.indexOf('\n', lastDateIndex)

        if (endOfLine !== -1) {
        contract = contract.slice(0, endOfLine)
        } else {
        contract = contract.slice(0, lastDateIndex + 5)
        }
    }

    return contract.trim()
    }
  }

  // fallback
  return text.trim()
}

export async function POST(req: NextRequest) {
  try {
    const { buyer, supplier, terms, context } = await req.json()

    const prompt = `
Return ONLY a complete SERVICE AGREEMENT.

Start EXACTLY with:
SERVICE AGREEMENT

Do not include explanations, notes, reasoning, checks, or planning.

Write a formal legal contract between:

Buyer: ${buyer}
Supplier: ${supplier}

Include sections:
SCOPE OF WORK
DELIVERY AND TIMELINE
SUPPLIER TERMS
OBLIGATIONS
TERMINATION
LIABILITY
DISPUTE RESOLUTION
CONFIDENTIALITY
GOVERNING LAW
SIGNATURES

No bullet points.
No commentary.
Only the contract text.
`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=${process.env.GEMINI_CONTRACT1_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 4096,
            stopSequences: [
              '*',
              'Constraint',
              'Check',
              'Drafting',
              'Word Count'
            ]
          }
        })
      }
    )

    if (!res.ok) {
      console.error('❌ Gemini failed:', res.status)
      return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
    }

    const data = await res.json()

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    console.log('\n🧠 RAW CONTRACT:\n', text)

    const cleanedContract = cleanGeneratedContract(text)

    console.log('\n🧼 CLEANED CONTRACT:\n', cleanedContract)

    return NextResponse.json({
      contract: cleanedContract
    })

  } catch (err) {
    console.error('💥 ERROR:', err)

    return NextResponse.json(
      { error: 'Contract generation failed' },
      { status: 500 }
    )
  }
}