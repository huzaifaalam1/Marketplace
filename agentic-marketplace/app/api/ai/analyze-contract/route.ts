import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { supabaseServer } from '../../../../lib/supabaseServer'

const execFileAsync = promisify(execFile)

// =========================
// 🧠 FIND REAL JSON ONLY
// =========================
function extractFinalJSON(text: string): string | null {
  let start = -1
  let depth = 0

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (start === -1) start = i
      depth++
    } else if (text[i] === '}') {
      depth--

      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1)

        try {
          const parsed = JSON.parse(candidate)

          if (
            parsed &&
            typeof parsed.summary === 'string' &&
            Array.isArray(parsed.risks)
          ) {
            return candidate
          }
        } catch {
          // ignore invalid blocks
        }

        // reset and continue searching
        start = -1
      }
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    console.log('\n===== CONTRACT ANALYSIS HIT =====')

    const formData = await req.formData()
    const file = formData.get('file') as File

    const dealId = formData.get('dealId') as string

    if (!dealId) {
      return NextResponse.json({ error: 'Missing dealId' }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('📄 File:', file.name, file.type)

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''

    // =========================
    // 📄 TEXT EXTRACTION
    // =========================
    if (file.type === 'application/pdf') {
      console.log('📄 Using pdftotext...')

      const tempPath = path.join('/tmp', `${Date.now()}-${file.name}`)
      fs.writeFileSync(tempPath, buffer)

      try {
        const { stdout } = await execFileAsync('pdftotext', [tempPath, '-'])
        extractedText = stdout
      } catch (err) {
        console.error('❌ pdftotext failed:', err)
        return NextResponse.json(
          { error: 'Failed to parse PDF' },
          { status: 500 }
        )
      } finally {
        fs.unlinkSync(tempPath)
      }
    } else {
      console.log('📄 Parsing as plain text...')
      extractedText = buffer.toString('utf-8')
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'No readable content extracted' },
        { status: 400 }
      )
    }

    console.log('📄 Extracted length:', extractedText.length)

    // =========================
    // 🤖 PROMPT (FIXED)
    // =========================
    const prompt = `
You are a strict JSON generator.

CRITICAL RULES:
- Output MUST be valid JSON
- Output MUST start with { and end with }
- Do NOT include explanations
- Do NOT include bullet points
- Do NOT include markdown
- Do NOT include backticks
- Do NOT include schema examples
- Do NOT include validation text
- Do NOT include anything before or after JSON

Structure (DO NOT repeat this, just follow it):
summary: string
risks: array of objects with:
  - category
  - riskLevel (High | Medium | Low)
  - clause
  - reason

Analyze this contract:

${extractedText}
`

    console.log('🤖 Sending to Gemini...')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=${process.env.GEMINI_CONTRACT2_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        })
      }
    )

    if (!res.ok) {
      console.error('❌ Gemini API failed:', res.status)
      return NextResponse.json(
        { error: 'AI request failed' },
        { status: 500 }
      )
    }

    const data = await res.json()

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    console.log('\n🧠 RAW RESPONSE:\n', text)

    if (!text) {
      return NextResponse.json(
        { error: 'Empty AI response' },
        { status: 500 }
      )
    }

    // =========================
    // 🧩 EXTRACT VALID JSON
    // =========================
    const jsonText = extractFinalJSON(text)

    console.log('\n🧩 FINAL JSON:\n', jsonText)

    if (!jsonText) {
      return NextResponse.json({
        summary: 'No valid JSON found in AI response.',
        risks: []
      })
    }

    // =========================
    // ✅ PARSE
    // =========================
    try {
      const parsed = JSON.parse(jsonText)

    // =========================
    // ☁️ Upload to Supabase Storage
    // =========================
    const fileName = `${dealId}-${Date.now()}.pdf`

    const { error: uploadError } = await supabaseServer.storage
      .from('contracts')
      .upload(fileName, buffer, {
        contentType: 'application/pdf'
      })

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      throw new Error('File upload failed')
    }

    const { data: publicUrlData } = supabaseServer
      .storage
      .from('contracts')
      .getPublicUrl(fileName)

    const fileUrl = publicUrlData.publicUrl

    console.log("🔥 BEFORE INSERT")
    if (!dealId || typeof dealId !== "string") {
      return NextResponse.json(
        { error: "Invalid dealId received" },
        { status: 400 }
      )
    }
    // =========================
    // 💾 Save contract to DB
    // =========================
    const { data, error: dbError } = await supabaseServer
      .from('contracts')
      .upsert({
        deal_id: dealId,
        file_url: fileUrl,
        contract_text: extractedText,
        summary: parsed.summary,
        risks: parsed.risks
      }, {
        onConflict: 'deal_id'
      })
      .select()

    console.log("INSERT RESULT:", data)
    console.log("INSERT ERROR:", dbError)

    if (dbError) {
      console.error('❌ DB insert failed:', dbError)

      return NextResponse.json({
        error: "DB insert failed",
        details: dbError
      }, { status: 500 })
    }

    // =========================
    // 🔄 Update deal status
    // =========================
    await supabaseServer
      .from('deals')
      .update({ status: 'contract_uploaded' })
      .eq('id', dealId)

    // =========================
    // 🧾 Log event
    // =========================
    await supabaseServer.from('deal_events').insert({
      deal_id: dealId,
      type: 'CONTRACT_UPLOADED',
      content: `Contract uploaded. ${parsed.risks.length} risks detected.`
    })

    // =========================
    // ✅ Return response
    // =========================
    return NextResponse.json({
      dealId,
      fileUrl,
      summary: parsed.summary,
      risks: parsed.risks,
      contractText: extractedText
    })
    } catch (err) {
      console.error('❌ PARSE FAILED:', err)

      return NextResponse.json({
        summary: 'AI response could not be parsed properly.',
        risks: [],
        contractText: extractedText
      })
    }

  } catch (err) {
    console.error('💥 API ERROR:', err)

    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}
