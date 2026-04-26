import { NextRequest, NextResponse } from 'next/server'
import { extractText } from '@/lib/pdf-service'
import { analyzeWithAI } from '@/lib/gemini-service'
import { detectRisks } from '@/lib/rule-engine'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Extract text from PDF
    const { text: contractText } = await extractText(buffer)

    // Detect risks using rule engine
    const ruleRisks = detectRisks(contractText)

    // Analyze using AI
    const aiResult = await analyzeWithAI(contractText)

    // Combine results
    const finalResult = {
      risks: [
        ...ruleRisks,
        ...(aiResult.risks || [])
      ],
      summary: `Found ${ruleRisks.length + (aiResult.risks?.length || 0)} potential risks in the contract.`
    }

    return NextResponse.json(finalResult)

  } catch (error) {
    console.error('Contract analysis error:', error)
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack
    })
    return NextResponse.json(
      {
        error: 'Contract analysis failed',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}
