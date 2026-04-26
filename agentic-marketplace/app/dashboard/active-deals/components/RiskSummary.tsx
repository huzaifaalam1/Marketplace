'use client'

interface Risk {
  category: string
  riskLevel: string
  clause: string
  explanation: string
}

interface Props {
  risks: Risk[]
}

export default function RiskSummary({ risks }: Props) {
  if (!risks || risks.length === 0) return null

  const high = risks.filter((r) => r.riskLevel === 'High').length
  const medium = risks.filter((r) => r.riskLevel === 'Medium').length
  const low = risks.filter((r) => r.riskLevel === 'Low').length

  const overallRisk = high > 0 ? 'High Risk' : medium > 0 ? 'Medium Risk' : 'Low Risk'

  const panelColor =
    overallRisk === 'High Risk'
      ? 'bg-red-900 text-red-100 border-red-500'
      : overallRisk === 'Medium Risk'
        ? 'bg-yellow-800 text-yellow-100 border-yellow-400'
        : 'bg-green-900 text-green-100 border-green-500'

  return (
    <div
      className={`p-8 rounded-2xl shadow-xl border-l-4 transition-all duration-300 ${panelColor}`}
    >
      <h2 className="text-4xl font-extrabold mb-6">Overall Contract Risk: {overallRisk}</h2>

      <div className="flex gap-12">
        <div>
          <p className="text-4xl font-bold text-red-400">{high}</p>
          <p className="opacity-80">High Risks</p>
        </div>

        <div>
          <p className="text-4xl font-bold text-yellow-300">{medium}</p>
          <p className="opacity-80">Medium Risks</p>
        </div>

        <div>
          <p className="text-4xl font-bold text-green-400">{low}</p>
          <p className="opacity-80">Low Risks</p>
        </div>
      </div>
    </div>
  )
}
