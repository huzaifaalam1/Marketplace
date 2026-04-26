'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressBar from '@/components/ProgressBar'
import FileUpload from '../../components/FileUpload'

type ContractRisk = {
    category: string
    riskLevel: string
    clause: string
    reason: string
}

type ContractAnalysis = {
    summary?: string
    risks?: ContractRisk[]
    contractText?: string
}

type DealContractData = {
    contract_text?: string | null
    buyer_org?: { name?: string | null } | null
    supplier_org?: { name?: string | null } | null
    buyer_user?: { full_name?: string | null } | null
    supplier_user?: { full_name?: string | null } | null
    buyer_user_id?: string | null
    supplier_user_id?: string | null
    buyer_org_id?: string | null
    supplier_org_id?: string | null
}

export default function MakeContract() {
    const router = useRouter()
    const { dealId } = useParams()
    const pathname = usePathname()

    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [contractContent, setContractContent] = useState('')
    const [extractedContractText, setExtractedContractText] = useState('')
    const [analysisResults, setAnalysisResults] =
        useState<ContractAnalysis | null>(null)

    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [supplierTerms] = useState('')
    const [buyerName, setBuyerName] = useState('Buyer')
    const [supplierName, setSupplierName] = useState('Supplier')
    const [currentRole, setCurrentRole] = useState<'buyer' | 'supplier' | null>(null)

    const roleLabel = currentRole === 'buyer' ? 'Buyer' : 'Supplier'
    const canEditContract = currentRole === 'supplier'

    const [contractSource, setContractSource] =
        useState<'upload' | 'generate' | 'saved' | null>(null)

    const [dealStatus, setDealStatus] = useState<string | null>(null)

    const step = pathname.split('/').pop() ?? ''

    const stageMap: Record<string, number> = {
        'make-contract': 1,
        'view-contract': 2,
        'process': 3,
        'ai-summary': 4,
        'disputes': 5
    }

    const currentStage = stageMap[step] ?? 1

    useEffect(() => {
        async function loadDeal() {
            if (!dealId) return

            const { data: { session } } = await supabase.auth.getSession()

            const { data } = await supabase
                .from('deals')
                .select(`
                    *,
                    buyer_org:buyer_org_id ( name ),
                    supplier_org:supplier_org_id ( name ),
                    buyer_user:buyer_user_id ( full_name ),
                    supplier_user:supplier_user_id ( full_name )
                `)
                .eq('id', dealId)
                .single()

            const deal = data as DealContractData | null

            setDealStatus((deal as any)?.status ?? null)

            const buyer =
                deal?.buyer_org?.name ||
                deal?.buyer_user?.full_name ||
                'Buyer'

            const supplier =
                deal?.supplier_org?.name ||
                deal?.supplier_user?.full_name ||
                'Supplier'

            setBuyerName(buyer)
            setSupplierName(supplier)

            if (session?.user.id) {
                const userId = session.user.id

                const { data: membership } = await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', userId)
                    .maybeSingle()

                const myOrgId = membership?.organization_id || null

                const isBuyer =
                    deal?.buyer_user_id === userId ||
                    (!!myOrgId && deal?.buyer_org_id === myOrgId)

                const isSupplier =
                    deal?.supplier_user_id === userId ||
                    (!!myOrgId && deal?.supplier_org_id === myOrgId)

                if (isBuyer && !isSupplier) {
                    setCurrentRole('buyer')
                } else if (isSupplier && !isBuyer) {
                    setCurrentRole('supplier')
                } else if (isBuyer && isSupplier) {
                    // edge case: same org on both sides; default to buyer
                    setCurrentRole('buyer')
                }
            }

            const { data: contractRow, error: contractError } = await supabase
                .from('contracts')
                .select('contract_text')
                .eq('deal_id', dealId)
                .maybeSingle()

            if (contractError) {
                console.error('CONTRACT LOAD ERROR:', JSON.stringify(contractError, null, 2))
            } else if (contractRow?.contract_text) {
                setContractContent(contractRow.contract_text)
                setExtractedContractText(contractRow.contract_text)
                setContractSource('saved')
                return
            }

            if (deal?.contract_text) {
                setContractContent(deal.contract_text)
                setExtractedContractText(deal.contract_text)
                setContractSource('saved')
                return
            }

            const { data: contractEvent } = await supabase
                .from('deal_events')
                .select('content')
                .eq('deal_id', dealId)
                .eq('type', 'contract')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (contractEvent?.content) {
                setContractContent(contractEvent.content)
                setExtractedContractText(contractEvent.content)
                setContractSource('saved')
            }
        }

        loadDeal()
    }, [dealId])

    const handleFileSelect = async (file: File) => {
        setUploadedFile(file)
        setContractSource('upload')
        setAnalysisResults(null)

        if (file.type === 'application/pdf') {
            setContractContent('PDF uploaded')
            setExtractedContractText('')
        } else {
            const text = await file.text()
            setContractContent(text)
            setExtractedContractText(text)
        }
    }

    const handleGenerate = async () => {
        setIsGenerating(true)
        setUploadedFile(null)
        setContractSource('generate')
        setAnalysisResults(null)
        setContractContent('') // 🔥 important

        try {
            const res = await fetch('/api/ai/generate-contract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyer: buyerName,
                    supplier: supplierName,
                    terms: supplierTerms,
                    context: 'Active deal'
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setContractContent(data.contract)
            setExtractedContractText(data.contract)

        } catch (err) {
            console.error(err)
            alert('Failed to generate contract')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAnalyse = async () => {
        if (contractSource !== 'upload' || !uploadedFile) return

        setIsAnalyzing(true)

        try {
            const formData = new FormData()
            formData.append('file', uploadedFile)
            formData.append('dealId', String(dealId))

            const res = await fetch('/api/ai/analyze-contract', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            setAnalysisResults(data)
            setExtractedContractText(data.contractText || '')

        } catch (err) {
            console.error(err)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleProceed = async () => {
        if (!dealId || !contractContent) return

        setIsSaving(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            let contractTextToSave = extractedContractText || contractContent

            // Extract text from uploaded file if not already done
            if (
                contractSource === 'upload' &&
                uploadedFile &&
                !extractedContractText.trim()
            ) {
                if (uploadedFile.type === 'application/pdf') {
                    // For PDFs, call the API to extract text
                    const formData = new FormData()
                    formData.append('file', uploadedFile)
                    formData.append('dealId', String(dealId))

                    const res = await fetch('/api/ai/analyze-contract', {
                        method: 'POST',
                        body: formData
                    })

                    const data = await res.json()

                    if (!res.ok) {
                        throw new Error(data.error || 'Failed to process contract')
                    }

                    setAnalysisResults(data)
                    contractTextToSave = data.contractText || ''
                    setExtractedContractText(contractTextToSave)
                } else {
                    // For text files, read directly
                    const text = await uploadedFile.text()
                    contractTextToSave = text
                    setExtractedContractText(text)
                }
            }

            if (!contractTextToSave.trim()) {
                throw new Error('No readable contract text available to save.')
            }

            const { data: savedContract, error } = await supabase
                .from('contracts')
                .upsert(
                    {
                        deal_id: dealId,
                        contract_text: contractTextToSave
                    },
                    { onConflict: 'deal_id' }
                )

            if (error) {
                const { error: eventError } = await supabase
                    .from('deal_events')
                    .insert({
                        deal_id: dealId,
                        user_id: session?.user.id,
                        type: 'contract',
                        content: contractTextToSave,
                        role: currentRole
                    })

                if (eventError) {
                    throw new Error(
                        `${error.message}. Fallback save failed: ${eventError.message}`
                    )
                }
            }

            router.push(`/dashboard/active-deals/${dealId}/view-contract`)
        } catch (err) {
            console.error(err)
            alert(
                err instanceof Error
                    ? err.message
                    : 'Failed to save contract'
            )
        } finally {
            setIsSaving(false)
        }
    }

    const resetAll = () => {
        setUploadedFile(null)
        setContractContent('')
        setExtractedContractText('')
        setAnalysisResults(null)
        setContractSource(null)
    }

    return (
        <DashboardLayout>
        <div className="p-10 max-w-3xl mx-auto relative">

            {currentRole && (
                <div className="absolute top-2 right-2 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700 border">
                    {roleLabel}
                </div>
            )}

            <ProgressBar stage={currentStage} />

            <h1 className="text-2xl font-bold mb-6">Create Contract</h1>

            <div className="bg-white p-6 rounded shadow space-y-4">

                {currentRole === 'buyer' && contractSource === null && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                        <p className="text-sm text-blue-900">
                            Waiting for the supplier to upload or create a contract.
                        </p>
                    </div>
                )}

                {currentRole === 'buyer' && contractSource === 'saved' && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                        <p className="text-sm text-green-900">
                            Supplier made a contract. Move to the next page to analyze it and choose to accept or decline.
                        </p>
                    </div>
                )}

                {currentRole === 'supplier' && contractSource === 'saved' && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                        <p className="text-sm text-blue-900">
                            You’ve offered a contract. Please proceed to the next step for buyer review.
                        </p>
                    </div>
                )}

                {currentRole === 'supplier' && dealStatus === 'contract_accepted' && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                        <p className="text-sm text-green-900">
                            The buyer accepted the contract.
                        </p>
                    </div>
                )}

                {currentRole === 'supplier' && dealStatus === 'contract_declined' && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <p className="text-sm text-red-900">
                            The buyer declined the contract. Please revise and re-upload.
                        </p>
                    </div>
                )}

                {contractSource === null && (
                    <>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !canEditContract}
                            className="w-full bg-amber-400 px-6 py-3 rounded-lg"
                        >
                            {isGenerating ? 'Generating...' : 'Generate Contract'}
                        </button>

                        <div className="text-center text-gray-500">or</div>

                        {canEditContract ? (
                            <FileUpload onFileSelect={handleFileSelect} />
                        ) : (
                            <div className="text-center text-gray-500 text-sm">
                                Only the seller can upload or generate the contract.
                            </div>
                        )}
                    </>
                )}

                {/* 🔥 GENERATING STATE */}
                {isGenerating && (
                    <div className="border rounded h-80 flex items-center justify-center text-gray-500">
                        Generating contract...
                    </div>
                )}

                {/* 🔥 PREVIEW */}
                {!isGenerating && contractContent && (
                    <>
                        <div className="border rounded h-80 overflow-y-auto p-4">
                            {contractSource === 'upload' &&
                             uploadedFile?.type === 'application/pdf' ? (
                                <iframe
                                    src={URL.createObjectURL(uploadedFile)}
                                    className="w-full h-full border"
                                />
                            ) : (
                                <pre className="whitespace-pre-wrap text-sm">
                                    {contractContent}
                                </pre>
                            )}
                        </div>

                        <div className="flex gap-4">

                            {contractSource === 'upload' && (
                                <button
                                    onClick={handleAnalyse}
                                    disabled={isAnalyzing || !canEditContract}
                                    className="bg-purple-500 text-white px-4 py-2 rounded"
                                >
                                    {isAnalyzing ? 'Analyzing...' : 'Analyze Contract'}
                                </button>
                            )}

                            <button
                                onClick={resetAll}
                                className="bg-gray-500 text-white px-4 py-2 rounded"
                            >
                                Reset
                            </button>
                        </div>

                        {analysisResults && (
                            <div className="mt-6 border-t pt-6 space-y-4">
                                <h3 className="font-semibold text-lg">Risk Analysis</h3>

                                <p className="text-gray-700">
                                    {analysisResults.summary}
                                </p>

                                <div className="space-y-3">
                                    {analysisResults.risks?.map((risk, i) => (
                                        <div key={i} className="p-3 border rounded bg-gray-50">
                                            <div className="font-semibold">
                                                {risk.category} ({risk.riskLevel})
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {risk.clause}
                                            </div>
                                            <div className="text-sm mt-2">
                                                {risk.reason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <button
                onClick={handleProceed}
                className="mt-6 bg-amber-400 px-6 py-2 rounded"
                disabled={!contractContent || isSaving}
            >
                {isSaving ? 'Saving...' : 'Proceed'}
            </button>

        </div>
        </DashboardLayout>
    )
}
