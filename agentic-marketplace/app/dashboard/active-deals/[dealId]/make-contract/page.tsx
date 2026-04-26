'use client'

import { useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressBar from '@/components/ProgressBar'
import FileUpload from '../../components/FileUpload'

export default function MakeContract() {
    const router = useRouter()
    const { dealId } = useParams()
    const pathname = usePathname()

    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [contractContent, setContractContent] = useState<string>('')
    const [contractSource, setContractSource] = useState<'upload' | 'generate' | null>(null)
    const [analysisResults, setAnalysisResults] = useState<any>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const step = pathname.split('/').pop() ?? ''

    const stageMap: Record<string, number> = {
        'make-contract': 1,
        'view-contract': 2,
        'process': 3,
        'ai-summary': 4,
        'disputes': 5
    }

    const currentStage = stageMap[step] ?? 1

    // 🔥 FILE UPLOAD (FIXED)
    const handleFileSelect = async (file: File) => {
        setUploadedFile(file)
        setContractSource('upload')

        if (file.type === 'application/pdf') {
            // ❌ DON'T read PDF as text
            setContractContent('PDF uploaded — preview below')
        } else {
            const text = await file.text()
            setContractContent(text)
        }
    }

    // 🔥 DOWNLOAD
    const handleDownload = () => {
        if (uploadedFile) {
            const url = URL.createObjectURL(uploadedFile)
            const a = document.createElement('a')
            a.href = url
            a.download = uploadedFile.name
            a.click()
            URL.revokeObjectURL(url)
        }
    }

    // 🔥 GENERATE CONTRACT
    const handleGenerate = () => {
        setContractSource('generate')
        setUploadedFile(null)

        const generatedContract = `
SAMPLE AGREEMENT

Product: Shoes
Quantity: 100
Delivery Time: 7 days
Payment: Escrow

Supplier must deliver goods within agreed timeline.
Buyer must confirm receipt upon delivery.
        `.trim()

        setContractContent(generatedContract)
    }

    // 🔥 ANALYZE
    const handleAnalyse = async () => {
        if (!uploadedFile && !contractContent) return

        setIsAnalyzing(true)

        try {
            const formData = new FormData()

            if (uploadedFile) {
                formData.append('file', uploadedFile)
            } else {
                const blob = new Blob([contractContent], { type: 'text/plain' })
                const fakeFile = new File([blob], 'generated.txt')
                formData.append('file', fakeFile)
            }

            const response = await fetch('/api/ai/analyze-contract', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed')
            }

            setAnalysisResults(data)

        } catch (error) {
            console.error('Analysis error:', error)
            alert('Contract analysis failed. Try again.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <DashboardLayout>
        <div className="p-10 max-w-3xl mx-auto">

            <ProgressBar stage={currentStage} />

            <h1 className="text-2xl font-bold mb-6">Create Contract</h1>

            <div className="bg-white p-6 rounded shadow">

                {!contractContent ? (
                    <div className="space-y-4">
                        <FileUpload onFileSelect={handleFileSelect} />

                        <div className="text-center text-gray-500">or</div>

                        <button
                            onClick={handleGenerate}
                            className="w-full bg-amber-400 hover:bg-amber-500 px-6 py-3 rounded-lg font-medium"
                        >
                            Generate Contract
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">

                        {uploadedFile && (
                            <div className="p-4 bg-green-50 border rounded">
                                ✅ {uploadedFile.name}
                            </div>
                        )}

                        {contractSource === 'generate' && (
                            <div className="p-4 bg-blue-50 border rounded">
                                📝 Generated Contract
                            </div>
                        )}

                        {/* 🔥 PREVIEW FIXED */}
                        <div className="border rounded">
                            <div className="bg-gray-50 px-4 py-2 border-b">
                                Contract Preview
                            </div>

                            <div className="h-80 overflow-y-auto p-4">

                                {uploadedFile?.type === 'application/pdf' ? (
                                    <iframe
                                        src={URL.createObjectURL(uploadedFile)}
                                        className="w-full h-full border"
                                    />
                                ) : (
                                    <pre className="text-sm whitespace-pre-wrap">
                                        {contractContent}
                                    </pre>
                                )}

                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-4">

                            {uploadedFile && (
                                <button
                                    onClick={handleDownload}
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                >
                                    Download
                                </button>
                            )}

                            <button
                                onClick={handleAnalyse}
                                disabled={isAnalyzing}
                                className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Contract'}
                            </button>

                            <button
                                onClick={() => {
                                    setUploadedFile(null)
                                    setContractContent('')
                                    setContractSource(null)
                                    setAnalysisResults(null)
                                }}
                                className="bg-gray-500 text-white px-4 py-2 rounded"
                            >
                                Reset
                            </button>
                        </div>

                        {/* RESULTS */}
                        {analysisResults && (
                            <div className="mt-6 border-t pt-6">
                                <h3 className="font-semibold mb-4">Risk Analysis</h3>

                                <p className="mb-4">{analysisResults.summary}</p>

                                {analysisResults.risks?.length > 0 ? (
                                    analysisResults.risks.map((risk: any, i: number) => (
                                        <div key={i} className="border p-3 rounded mb-3">
                                            <b>{risk.category}</b> ({risk.riskLevel})
                                            <p className="text-sm">{risk.reason}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p>No risks found</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* KEEP THIS EXACT */}
            <button
                onClick={() => router.push(`/dashboard/active-deals/${dealId}/view-contract`)}
                className="mt-6 bg-amber-400 px-6 py-2 rounded"
                disabled={!contractContent}
            >
                Proceed to Buyer Review
            </button>

        </div>
        </DashboardLayout>
    )
}