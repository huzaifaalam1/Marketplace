'use client'

interface ContractSummaryProps {
  summary: string
}

export default function ContractSummary({ summary }: ContractSummaryProps) {
  if (!summary) return null

  return (
    <div className="p-6 bg-blue-50 rounded-xl shadow-sm mb-6">
      <h2 className="text-2xl font-semibold mb-2">Executive Summary</h2>
      <p className="text-gray-800">{summary}</p>
    </div>
  )
}
