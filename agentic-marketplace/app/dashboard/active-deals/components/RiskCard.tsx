'use client'

interface Risk {
  category: string
  riskLevel: string
  clause: string
  explanation: string
}

export default function RiskCard({ risk }: { risk: Risk }) {
  const color =
    risk.riskLevel === 'High'
      ? 'bg-red-600 text-white border-red-800'
      : risk.riskLevel === 'Medium'
        ? 'bg-yellow-500 text-black border-yellow-700'
        : 'bg-green-600 text-white border-green-800'

  return (
    <div className={`border-l-4 p-5 rounded-xl ${color}`}>
      <h3 className="font-semibold text-lg">
        {risk.category} — {risk.riskLevel} Risk
      </h3>
      <p className="mt-2 text-sm italic">{risk.clause}</p>
      <p className="mt-2">{risk.explanation}</p>
    </div>
  )
}
