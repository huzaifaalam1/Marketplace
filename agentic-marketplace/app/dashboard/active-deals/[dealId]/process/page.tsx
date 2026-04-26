'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressBar from '@/components/ProgressBar'

export default function ProcessPage() {
  const router = useRouter()
  const { dealId } = useParams()
  const pathname = usePathname()

  const [events, setEvents] = useState<any[]>([])
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isBuyer, setIsBuyer] = useState(false)
  const [loading, setLoading] = useState(false)

  // 🔥 stage logic
  const step = pathname.split('/').pop() ?? ''

  const stageMap: Record<string, number> = {
    'make-contract': 1,
    'view-contract': 2,
    'process': 3,
    'ai-summary': 4,
    'disputes': 5
  }

  const currentStage = stageMap[step] ?? 1

  // 🔥 load role + events
  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: deal } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single()

      if (!deal) return

      if (deal.buyer_user_id === session.user.id) {
        setIsBuyer(true)
      }

      const { data: eventsData } = await supabase
        .from('deal_events')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })

      setEvents(eventsData || [])
    }

    loadData()
  }, [dealId])

  // 🔥 SINGLE HANDLER (text + image)
    const handleAddUpdate = async () => {
        if (!text.trim() && !file) {
            alert('Add text or upload an image')
            return
        }

        const { data: { session } } = await supabase.auth.getSession()

        let imageUrl = null

        // 🔹 upload image if exists
        if (file) {
            const filePath = `${dealId}/${Date.now()}-${file.name}`

            const { error } = await supabase.storage
            .from('deal-evidence')
            .upload(filePath, file)

            if (error) {
            alert(error.message)
            return
            }

            const { data } = supabase.storage
            .from('deal-evidence')
            .getPublicUrl(filePath)

            imageUrl = data.publicUrl
        }

        const inserts = []

        // 🔹 insert TEXT separately
        if (text.trim()) {
            inserts.push({
            deal_id: dealId,
            user_id: session?.user.id,
            type: 'text',
            content: text,
            role: isBuyer ? 'buyer' : 'supplier'
            })
        }

        // 🔹 insert IMAGE separately
        if (imageUrl) {
            inserts.push({
            deal_id: dealId,
            user_id: session?.user.id,
            type: 'image',
            content: imageUrl,
            role: isBuyer ? 'buyer' : 'supplier'
            })
        }

        const { error: insertError } = await supabase
            .from('deal_events')
            .insert(inserts)

        if (insertError) {
            console.error(insertError)
            alert(insertError.message)
            return
        }

        setText('')
        setFile(null)

        window.location.reload()
    }

  // 🔹 confirm delivery (buyer only)
  const handleConfirmDelivery = async () => {
    if (!isBuyer) return

    setLoading(true)

    await supabase
      .from('deals')
      .update({ status: 'completed' })
      .eq('id', dealId)

    setLoading(false)

    router.push(`/dashboard/active-deals/${dealId}/ai-summary`)
  }

  return (
    <DashboardLayout>
      <div className="p-10 max-w-4xl mx-auto">

        <ProgressBar stage={currentStage} />

        <h1 className="text-2xl font-bold mb-6">Deal Execution</h1>

        {/* 🔥 COMBINED CARD */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">

          <h2 className="font-semibold mb-4">Add Update / Evidence</h2>

          {/* TEXT */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Shipment dispatched, warehouse update..."
            className="w-full border rounded-lg p-3 mb-4"
          />

          {/* FILE UPLOAD */}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-amber-400 transition mb-4">
            <span className="text-gray-500 text-sm mb-2">
              Click to upload image (optional)
            </span>

            <span className="text-xs text-gray-400">
              PNG, JPG supported
            </span>

            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {/* FILE NAME */}
          {file && (
            <div className="mb-4 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </div>
          )}

          {/* SINGLE BUTTON */}
          <button
            onClick={handleAddUpdate}
            className="bg-amber-400 hover:bg-amber-500 px-6 py-2 rounded-lg font-medium"
          >
            Add Update
          </button>

        </div>

        {/* 🔹 TIMELINE */}
        <div className="bg-white p-6 rounded-2xl shadow mb-6">

            <h2 className="font-semibold mb-4">Timeline</h2>

            {/* 🔥 SCROLL CONTAINER */}
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">

                {events.length === 0 ? (
                <p className="text-gray-500">No updates yet</p>
                ) : (
                events.map(e => (
                    <div key={e.id} className="border p-4 rounded-xl bg-white shadow-sm">

                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700 capitalize">
                        {e.role === 'buyer' ? '🟢 Buyer' : '🟠 Supplier'}
                        </span>

                        <span className="text-xs text-gray-400">
                        {new Date(e.created_at).toLocaleString()}
                        </span>
                    </div>

                    {e.type === 'text' && <p>{e.content}</p>}

                    {e.type === 'image' && (
                        <img src={e.content} className="rounded-lg w-full mt-2" />
                    )}

                    </div>
                ))
                )}

            </div>
        </div>

        {/* 🔹 BUYER ONLY */}
        {isBuyer && (
          <div className="text-center mt-8">
            <button
              onClick={handleConfirmDelivery}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {loading ? 'Confirming...' : 'Confirm Delivery'}
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}