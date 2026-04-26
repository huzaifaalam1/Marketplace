'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressBar from '@/components/ProgressBar'

export default function AISummaryPage() {
  const { dealId } = useParams()
  const pathname = usePathname()

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    const runAnalysis = async () => {
      setLoading(true)

      // Fetch contract data from Supabase
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('deal_id', dealId)
        .maybeSingle()

      if (contractError) {
        console.error('Error fetching contract:', contractError)
        setLoading(false)
        return
      }

      if (!contractData) {
        console.error('No contract found for this deal')
        setLoading(false)
        return
      }

      // Fetch timeline events from Supabase
      const { data: eventsData, error: eventsError } = await supabase
        .from('deal_events')
        .select('*')
        .eq('deal_id', dealId)
        .in('type', ['text', 'image'])
        .order('created_at', { ascending: true })

      if (eventsError) {
        console.error('Error fetching events:', eventsError)
        setLoading(false)
        return
      }

      // Prepare contract object for AI
      const contract = {
        text: contractData.contract_text,
        summary: contractData.summary,
        risks: contractData.risks,
        file_url: contractData.file_url
      }

      // Prepare events for AI
      const events = eventsData?.map((event: any) => ({
        role: event.role,
        type: event.type,
        content: event.content,
        created_at: event.created_at
      })) || []

      const res = await fetch('/api/ai/analyze-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract,
          events
        })
      })

      const data = await res.json()
      console.log('FRONTEND RESPONSE:', data)

      if (data.error) {
        console.error('API ERROR:', data.error)
        setLoading(false)
        return
      }

      setResult(data)
      setLoading(false)
    }

    runAnalysis()
  }, [dealId])

  return (
    <DashboardLayout>
      <div className="p-10 max-w-4xl mx-auto">

        <ProgressBar stage={currentStage} />

        <h1 className="text-3xl font-bold mb-6">AI Deal Analysis</h1>

        {loading ? (
          <p className="text-gray-500">Analyzing deal...</p>
        ) : result ? (
          <>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="font-semibold text-gray-600">Supplier Score</h2>
                <p className="text-3xl font-bold text-amber-600">
                  {result.supplier_score ?? '—'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="font-semibold text-gray-600">Buyer Score</h2>
                <p className="text-3xl font-bold text-amber-600">
                  {result.buyer_score ?? '—'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow mb-6">
              <h2 className="font-semibold mb-2">Verdict</h2>
              <p className="capitalize text-lg">
                {result.verdict ?? 'Unknown'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow mb-6">
              <h2 className="font-semibold mb-2">Issues</h2>

              {Array.isArray(result.issues) && result.issues.length > 0 ? (
                <ul className="list-disc ml-5">
                  {result.issues.map((issue: string, idx: number) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No issues detected</p>
              )}
            </div>

            <div className="bg-green-100 p-6 rounded-xl mb-6">
              <h2 className="font-semibold">Escrow Decision</h2>
              <p className="text-lg">
                {result.escrow_release ?? '—'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-semibold mb-2">Summary</h2>
              <p className="text-gray-700">
                {result.summary ?? 'No summary available'}
              </p>
            </div>
          </>
        ) : (
          <p className="text-red-500">Failed to load AI analysis</p>
        )}

      </div>
    </DashboardLayout>
  )
}