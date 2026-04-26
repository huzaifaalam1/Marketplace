'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressBar from '@/components/ProgressBar'

export default function ViewContract() {
    const router = useRouter()
    const { dealId } = useParams()
    const pathname = usePathname()
    const [contractText, setContractText] = useState('')
    const [loading, setLoading] = useState(true)
    const [analysisResults, setAnalysisResults] = useState<any>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [currentRole, setCurrentRole] = useState<'buyer' | 'supplier' | null>(null)
    const [dealStatus, setDealStatus] = useState<string | null>(null)

    const roleLabel = currentRole === 'buyer' ? 'Buyer' : 'Supplier'
    const canAnalyzeAndApprove = currentRole === 'buyer'

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
        const loadContract = async () => {
            if (!dealId) return

            setLoading(true)

            const { data: { session } } = await supabase.auth.getSession()

            const { data: deal } = await supabase
                .from('deals')
                .select('buyer_user_id,supplier_user_id,buyer_org_id,supplier_org_id,status')
                .eq('id', dealId)
                .maybeSingle()

            setDealStatus((deal as any)?.status ?? null)

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
                    setCurrentRole('buyer')
                } else {
                    setCurrentRole('supplier')
                }
            }

            const { data, error } = await supabase
                .from('contracts')
                .select('contract_text')
                .eq('deal_id', dealId)
                .maybeSingle()

            if (error) {
                console.error('SUPABASE ERROR:', JSON.stringify(error, null, 2))
            } else if (data?.contract_text) {
                setContractText(data.contract_text)
                setLoading(false)
                return
            }

            const { data: contractEvent, error: contractEventError } =
                await supabase
                    .from('deal_events')
                    .select('content')
                    .eq('deal_id', dealId)
                    .in('type', ['CONTRACT_UPLOADED', 'contract'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

            if (contractEventError) {
                console.error(contractEventError)
                setContractText('')
                setLoading(false)
                return
            }

            setContractText(contractEvent?.content || '')
            setLoading(false)
        }

        loadContract()
    }, [dealId])

    const handleAnalyse = async () => {
        if (!contractText) return

        setIsAnalyzing(true)

        try {
            // Create a file from the contract text
            const blob = new Blob([contractText], { type: 'text/plain' })
            const file = new File([blob], 'contract.txt', { type: 'text/plain' })

            const formData = new FormData()
            formData.append('file', file)
            formData.append('dealId', String(dealId))

            const res = await fetch('/api/ai/analyze-contract', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            setAnalysisResults(data)

        } catch (err) {
            console.error(err)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleDownload = () => {
        if (contractText) {
            const blob = new Blob([contractText], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'contract.txt'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }
    }

    const handleProceedToProcess = async () => {
        if (!dealId) return

        if (!canAnalyzeAndApprove) {
            alert('Only the buyer can accept the contract.')
            return
        }

        const { data: { session } } = await supabase.auth.getSession()

        await supabase.from('deal_events').insert({
            deal_id: dealId,
            user_id: session?.user.id,
            type: 'CONTRACT_ACCEPTED',
            content: 'Buyer accepted the contract.',
            role: 'buyer'
        })

        const { data: updateAccepted, error: updateAcceptedError } = await supabase
            .from('deals')
            .update({ status: 'contract_accepted' })
            .eq('id', dealId)
            .select()

        console.log('DEAL ACCEPT UPDATE:', updateAccepted, updateAcceptedError)

        if (updateAcceptedError) {
            alert('Failed to update deal status: ' + updateAcceptedError.message)
            return
        }

        setDealStatus('contract_accepted')

        router.push(`/dashboard/active-deals/${dealId}/process`)
    }

    const handleSendBackToMakeContract = async () => {
        if (!dealId) return

        if (!canAnalyzeAndApprove) {
            alert('Only the buyer can decline the contract.')
            return
        }

        const { data: { session } } = await supabase.auth.getSession()

        await supabase.from('deal_events').insert({
            deal_id: dealId,
            user_id: session?.user.id,
            type: 'CONTRACT_DECLINED',
            content: 'Buyer declined the contract.',
            role: 'buyer'
        })

        const { data: updateDeclined, error: updateDeclinedError } = await supabase
            .from('deals')
            .update({ status: 'contract_declined' })
            .eq('id', dealId)
            .select()

        console.log('DEAL DECLINE UPDATE:', updateDeclined, updateDeclinedError)

        if (updateDeclinedError) {
            alert('Failed to update deal status: ' + updateDeclinedError.message)
            return
        }

        setDealStatus('contract_declined')

        router.push(`/dashboard/active-deals/${dealId}/make-contract`)
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

            <h1 className="text-2xl font-bold mb-6">Review Contract</h1>

            <div className="bg-white p-6 rounded shadow space-y-4">
                {currentRole === 'supplier' && dealStatus === 'contract_accepted' && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                        <p className="text-sm text-green-900">
                            Buyer accepted your contract. Move to the next page to proceed.
                        </p>

                        <button
                            onClick={() => router.push(`/dashboard/active-deals/${dealId}/process`)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg"
                            >
                            Go to Process
                        </button>
                    </div>
                )}

                {currentRole === 'supplier' && dealStatus === 'contract_declined' && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <p className="text-sm text-red-900">
                            Buyer declined your contract. Go back to the previous page to revise and re-upload.
                        </p>

                        <button
                            onClick={() => router.push(`/dashboard/active-deals/${dealId}/make-contract`)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg"
                            >
                            New Contract
                        </button>
                    </div>
                )}

                {currentRole === 'supplier' && dealStatus !== 'contract_accepted' && dealStatus !== 'contract_declined' && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                        <p className="text-sm text-blue-900">
                            Waiting for the buyer to analyze and accept or decline this contract.
                        </p>
                    </div>
                )}

                {loading ? (
                    <p className="text-gray-500">Loading contract...</p>
                ) : contractText ? (
                    <pre className="whitespace-pre-wrap text-sm border rounded p-4 bg-gray-50">
                        {contractText}
                    </pre>
                ) : (
                    <p className="text-gray-500">
                        No saved contract found for this deal yet.
                    </p>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={handleDownload}
                        disabled={!contractText}
                        className="bg-amber-400 px-4 py-2 rounded hover:bg-amber-500 disabled:bg-gray-400"
                    >
                        Download Contract
                    </button>

                    <button
                        onClick={handleAnalyse}
                        disabled={isAnalyzing || !contractText || !canAnalyzeAndApprove}
                        className="bg-amber-400 px-4 py-2 rounded hover:bg-amber-500 disabled:bg-gray-400"
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                    <p className="text-sm text-amber-900">
                        <strong>Note:</strong> If you have any issues with the contract, please press <span className="font-semibold">Decline</span> and message your concerns to the supplier.
                    </p>
                </div>

                {/* Analysis Results */}
                {analysisResults && (
                    <div className="mt-6 border-t pt-6 space-y-4">
                        <h3 className="font-semibold text-lg">Risk Analysis</h3>

                        <p className="text-gray-700">
                            {analysisResults.summary}
                        </p>

                        <div className="space-y-3">
                            {analysisResults.risks?.map((risk: any, i: number) => (
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
            </div>

            {currentRole === 'buyer' && (
                <div className="mt-6 flex gap-4">
                    <button
                    onClick={handleSendBackToMakeContract}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                    >
                    Decline
                    </button>

                    <button
                    onClick={handleProceedToProcess}
                    disabled={!canAnalyzeAndApprove}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                    >
                    Accept
                    </button>
                </div>
            )}

        </div>
        </DashboardLayout>
    )
}
