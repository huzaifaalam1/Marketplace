export interface Risk {
  category: string
  riskLevel: 'Low' | 'Medium' | 'High'
  clause: string
  reason: string
}

export interface Rule {
  category: string
  riskLevel: 'Low' | 'Medium' | 'High'
  regex: RegExp
  explanation: string
}

/**
 * Detect deterministic legal risks using regex patterns
 * @param text - Contract text to analyze
 * @returns Array of detected risks
 */
export function detectRisks(text: string): Risk[] {
  if (!text) return []

  const risks: Risk[] = []

  const rules: Rule[] = [
    {
      category: 'Renewal',
      riskLevel: 'High',
      regex: /.{0,150}(automatically renew|auto-renew|renewal term|successive terms).{0,150}/gi,
      explanation: 'This contract may automatically renew unless properly terminated.'
    },
    {
      category: 'Liability',
      riskLevel: 'High',
      regex: /.{0,150}(indemnify|hold harmless|defend and indemnify).{0,150}/gi,
      explanation: 'You may be responsible for covering legal claims or losses.'
    },
    {
      category: 'Restriction',
      riskLevel: 'Medium',
      regex: /.{0,150}(sole discretion|absolute discretion|at its discretion).{0,150}/gi,
      explanation: 'One party has unilateral decision-making authority.'
    },
    {
      category: 'Termination',
      riskLevel: 'High',
      regex: /.{0,150}(terminate at any time|without cause|may terminate this agreement).{0,150}/gi,
      explanation: 'The agreement may be terminated without mutual consent.'
    },
    {
      category: 'Financial',
      riskLevel: 'Medium',
      regex: /.{0,150}(increase fees|adjust pricing|escalate|subject to change|price revision).{0,150}/gi,
      explanation: 'Pricing or fees may increase over time.'
    }
  ]

  rules.forEach(rule => {
    const matches = text.match(rule.regex)

    if (matches) {
      matches.forEach(match => {
        risks.push({
          category: rule.category,
          riskLevel: rule.riskLevel,
          clause: match.trim(),
          reason: rule.explanation
        })
      })
    }
  })

  return risks
}
