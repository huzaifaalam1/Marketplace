'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import DashboardLayout from '@/components/DashboardLayout'

interface Risk {
  category: string
  riskLevel: string
  clause: string
  explanation: string
}

export default function RiskScannerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All')
  const [currentStage, setCurrentStage] = useState(1) // 1-5 for progress stages

  const handleAnalyze = async () => {
    if (!file) return
    
    setLoading(true)
    setCurrentStage(3) // Move to Process stage when analysis starts
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockRisks: Risk[] = [
        {
          category: 'Payment Terms',
          riskLevel: 'High',
          clause: 'Payment due 90 days after delivery',
          explanation: 'Extended payment terms increase cash flow risk and may affect working capital.'
        },
        {
          category: 'Liability',
          riskLevel: 'Medium',
          clause: 'Limited liability to contract value',
          explanation: 'Standard limitation clause, but consider if adequate for potential damages.'
        },
        {
          category: 'Termination',
          riskLevel: 'Low',
          clause: '30-day termination notice period',
          explanation: 'Reasonable termination clause providing adequate notice period.'
        }
      ]
      
      const mockSummary = 'This contract presents moderate overall risk. The primary concern is the extended payment terms which may impact cash flow. Liability and termination clauses are within standard industry parameters.'
      
      setRisks(mockRisks)
      setSummary(mockSummary)
      setLoading(false)
      setCurrentStage(4) // Move to AI Summary stage when analysis is complete
      
      // Simulate moving to final stage after a delay
      setTimeout(() => {
        setCurrentStage(5) // Move to Disputes stage
      }, 1500)
    }, 2000)
  }

  const downloadJSON = () => {
    const data = { summary, risks }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contract_risks.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text('Contract Risk Analysis Report', 10, 20)

    doc.setFontSize(12)
    doc.text(summary || 'No summary available', 10, 30, {
      maxWidth: 180
    })

    let yOffset = 50

    doc.setFontSize(16)
    doc.text('Risk Details', 10, yOffset)
    yOffset += 10

    risks.forEach((risk, i) => {
      doc.setFontSize(12)
      doc.text(`${i + 1}. ${risk.category} — ${risk.riskLevel}`, 10, yOffset)
      yOffset += 6

      doc.setFontSize(10)
      doc.text(`Clause: ${risk.clause}`, 10, yOffset, {
        maxWidth: 180
      })
      yOffset += 6

      doc.text(`Explanation: ${risk.explanation}`, 10, yOffset, {
        maxWidth: 180
      })
      yOffset += 12
    })

    doc.save('contract_risks.pdf')
  }

  return (
    <DashboardLayout>
      <main className="min-h-screen p-10 max-w-4xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => window.history.back()}
            className="text-amber-600 hover:text-amber-800 flex items-center gap-2"
          >
            ← Back to Active Deals
          </button>
        </div>

        {/* Amazon-style Progress Bar */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300"></div>
              <div 
                className="absolute top-5 left-0 h-1 bg-amber-400 transition-all duration-500"
                style={{ width: `${((currentStage - 1) / 4) * 100}%` }}
              ></div>
              
              {/* Checkpoints */}
              <div className="relative flex justify-between">
                {[
                  { stage: 1, label: 'Make Contract', description: 'Supplier' },
                  { stage: 2, label: 'View Contract', description: 'Buyer' },
                  { stage: 3, label: 'Process', description: 'Document & Track' },
                  { stage: 4, label: 'AI Summary', description: 'Deal Overview' },
                  { stage: 5, label: 'Disputes', description: 'Resolution & Finalize' }
                ].map((checkpoint) => (
                  <div key={checkpoint.stage} className="flex flex-col items-center">
                    {/* Circle */}
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        currentStage >= checkpoint.stage
                          ? 'bg-amber-400 border-amber-400'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {currentStage >= checkpoint.stage ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-gray-500 text-sm font-medium">{checkpoint.stage}</span>
                      )}
                    </div>
                    
                    {/* Labels */}
                    <div className="mt-3 text-center">
                      <div className={`text-sm font-medium ${
                        currentStage >= checkpoint.stage ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {checkpoint.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {checkpoint.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-8 text-center">AI Contract Risk Scanner</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Contract Document</h2>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null
              setFile(selectedFile)
              if (selectedFile) {
                setCurrentStage(2) // Move to Process stage when file is uploaded
              }
            }}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {file && (
          <div className="text-center mb-6">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transform transition duration-200 font-semibold disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze Contract'}
            </button>
          </div>
        )}

        {(summary || risks.length > 0) && (
          <div className="mb-6 flex gap-4 justify-center">
            <button onClick={downloadJSON} className="bg-gray-800 text-white px-4 py-2 rounded-lg">
              Download JSON
            </button>
            <button onClick={downloadPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Download PDF
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center mt-6">
            <p className="animate-pulse text-gray-600">
              AI is analyzing your contract for risk exposure...
            </p>
          </div>
        )}

        {(summary || risks.length > 0) && (
          <div className="mt-10 space-y-6">
            <div className="flex gap-4 mb-4 justify-center">
              {['All', 'High', 'Medium', 'Low'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level as any)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filter === level ? 'bg-black text-white' : 'bg-gray-200 text-black'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {summary && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-3">Executive Summary</h3>
                <p className="text-gray-700">{summary}</p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-3">Risk Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-red-100 p-3 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {risks.filter(r => r.riskLevel === 'High').length}
                  </div>
                  <div className="text-sm text-gray-600">High Risk</div>
                </div>
                <div className="bg-yellow-100 p-3 rounded">
                  <div className="text-2xl font-bold text-yellow-600">
                    {risks.filter(r => r.riskLevel === 'Medium').length}
                  </div>
                  <div className="text-sm text-gray-600">Medium Risk</div>
                </div>
                <div className="bg-green-100 p-3 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {risks.filter(r => r.riskLevel === 'Low').length}
                  </div>
                  <div className="text-sm text-gray-600">Low Risk</div>
                </div>
              </div>
            </div>

            {risks
              .filter((r) => filter === 'All' || r.riskLevel === filter)
              .map((risk, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold">{risk.category}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      risk.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                      risk.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {risk.riskLevel}
                    </span>
                  </div>
                  <div className="mb-2">
                    <strong>Clause:</strong> {risk.clause}
                  </div>
                  <div>
                    <strong>Explanation:</strong> {risk.explanation}
                  </div>
                </div>
              ))}
            
            {/* Disputes Section - Only show when in stage 5 */}
            {currentStage === 5 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Dispute Resolution</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-amber-400 pl-4">
                    <h4 className="font-medium text-amber-600">No Active Disputes</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      This contract has been reviewed and shows no immediate disputes. All parties are in agreement with the terms.
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Recommended Actions:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Monitor payment terms compliance</li>
                      <li>• Schedule quarterly review meetings</li>
                      <li>• Maintain open communication channels</li>
                      <li>• Document any changes to the agreement</li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button className="bg-amber-400 hover:bg-amber-500 text-white px-4 py-2 rounded-lg">
                      Create Escalation Plan
                    </button>
                    <button className="border border-amber-400 text-amber-600 hover:bg-amber-50 px-4 py-2 rounded-lg">
                      Contact Mediator
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}
