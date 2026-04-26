import { Risk } from './rule-engine'

export interface AIAnalysisResult {
  risks: Risk[]
  error?: string
}

const GEMMA_API_KEY = process.env.GEMMA_API_KEY

/**
 * Analyze contract text using Gemma 4 AI
 * @param text - Contract text to analyze
 * @returns Promise<AIAnalysisResult>
 */
export async function analyzeWithAI(text: string): Promise<AIAnalysisResult> {
  try {
    const prompt = `
You are a legal risk detection AI built for SMB founders.

Analyze the contract below and identify ONLY risk-related clauses.

For each risk return:
- category (Termination, Liability, Financial, Renewal, Restriction, Other)
- riskLevel (Low, Medium, High)
- clause (Exact excerpt from contract)
- reason (Why this is risky in plain English)

Respond ONLY in valid JSON with this exact format:

{
  "risks": [
    {
      "category": "...",
      "riskLevel": "...",
      "clause": "...",
      "reason": "..."
    }
  ]
}

Do not include markdown.
Do not include explanations.
Do not include backticks.

Contract:
${text}
`

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemma-1.1-7b-it:generateContent?key=' + GEMMA_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API')
    }

    let rawText = data.candidates[0].content.parts[0].text

    // Clean up the response
    rawText = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    // Parse the JSON response
    const parsed = JSON.parse(rawText)

    return parsed

  } catch (error) {
    console.error('Gemini Service Error:', error)
    return {
      risks: [],
      error: 'AI analysis failed'
    }
  }
}
