import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execFileAsync = promisify(execFile)

export async function POST(req: NextRequest) {
  try {
    console.log('\n===== CONTRACT ANALYSIS HIT =====')

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('❌ No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('📄 File:', file.name, file.type)

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''

    // 🔥 PDF PARSING (STABLE)
    if (file.type === 'application/pdf') {
      console.log('📄 Using pdftotext...')

      const tempPath = path.join('/tmp', `${Date.now()}-${file.name}`)
      fs.writeFileSync(tempPath, buffer)

      const { stdout } = await execFileAsync('pdftotext', [
        tempPath,
        '-'
      ])

      extractedText = stdout
      fs.unlinkSync(tempPath)
    } else {
      console.log('📄 Parsing as plain text...')
      extractedText = buffer.toString('utf-8')
    }

    console.log('📄 Extracted length:', extractedText.length)
    console.log('📄 Preview:\n', extractedText.slice(0, 300))

    // 🔥 STRICT PROMPT
    const prompt = `
You are a JSON generator.

Return ONLY valid JSON.

DO NOT:
- explain
- describe
- include markdown
- include examples
- include placeholder values like "..." or "string"

Output MUST be final JSON.

IMPORTANT:
- At the VERY END of your response, output:
FINAL_JSON:
<the JSON object>

Do NOT put FINAL_JSON anywhere else.

Schema:

{
  "summary": "string",
  "risks": [
    {
      "category": "string",
      "riskLevel": "High" | "Medium" | "Low",
      "clause": "string",
      "reason": "string"
    }
  ]
}

If no risks exist:
{
  "summary": "No major risks detected",
  "risks": []
}

Analyze:

${extractedText}
`

    console.log('🤖 Sending to Gemma...')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=${process.env.GEMINI_CONTRACT2_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
            maxOutputTokens: 1024
          }
        })
      }
    )

    console.log('📡 Gemini status:', res.status)

    const data = await res.json()
    console.log('📡 RAW RESPONSE:', JSON.stringify(data, null, 2))

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    console.log('\n🧠 RAW AI TEXT:\n', text)

    // 🔥 CLEAN RESPONSE
    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/\*/g, '')
      .trim()

    console.log('\n🧼 CLEANED TEXT:\n', cleaned)

    // 🔥 EXTRACT ALL JSON BLOCKS
    const marker = 'FINAL_JSON:'

    const index = cleaned.lastIndexOf(marker)

    if (index !== -1) {
    const jsonString = cleaned.slice(index + marker.length).trim()

    try {
        const parsed = JSON.parse(jsonString)
        console.log('✅ PARSED FROM MARKER:', parsed)
        return NextResponse.json(parsed)
    } catch (err) {
        console.error('❌ PARSE FAILED AFTER MARKER:', err)
        console.error('❌ RAW JSON STRING:', jsonString)
    }
    } else {
    console.error('❌ FINAL_JSON marker not found')
    }

    // 🔥 FINAL FALLBACK
    console.warn('🚨 USING FALLBACK RESPONSE')

    return NextResponse.json({
      summary: 'AI response could not be parsed properly.',
      risks: []
    })

  } catch (err) {
    console.error('💥 API ERROR:', err)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}