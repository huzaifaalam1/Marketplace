'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'

export default function ActiveDeals() {
  const [deals, setDeals] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const filterRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const loadDeals = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const orgId = membership?.organization_id

      let query = supabase
        .from('deals')
        .select(`*, buyer_org:buyer_org_id ( name, trust_score, city ), supplier_org:supplier_org_id ( name, trust_score, city ), buyer_user:buyer_user_id ( full_name ), supplier_user:supplier_user_id ( full_name ), supplier_listings:listing_id ( title, country ), buyer_requests:request_id ( title, country )`)
        .order('created_at', { ascending: false })

      if (orgId) {
        query = query.or(`buyer_org_id.eq.${orgId},supplier_org_id.eq.${orgId}`)
      } else {
        query = query.or(`buyer_user_id.eq.${session.user.id},supplier_user_id.eq.${session.user.id}`)
      }

      const { data, error } = await query

      console.log('JOINED DEALS:', data, error)

      if (error) {
        console.error('DEALS ERROR:', error)
        return
      }

      setDeals(data || [])
    }

    loadDeals()
  }, [])

  const filteredDeals = deals.filter(deal =>
    deal.id.toLowerCase().includes(search.toLowerCase())
  )

  const handleViewDetails = (dealId: string) => {
    router.push(`/dashboard/active-deals/${dealId}/make-contract`)
  }

  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold mb-10">Active Deals</h1>

      <div className="flex gap-4 mb-8 items-center">
        <input
          type="text"
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 w-64"
        />
      </div>

      {filteredDeals.length === 0 ? (
        <div className="text-center text-gray-600 mt-20">
          <p className="text-lg">No active deals yet</p>
          <p className="text-sm mt-2">Accept an invite to start a deal</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filteredDeals.map((deal) => {

            const listing = deal.supplier_listings
            const request = deal.buyer_requests

            const title = listing?.title || request?.title || 'Deal'

            // 🔥 determine partner correctly
            let partnerName = 'Unknown'
            let trust = '—'
            let location = '—'

            if (deal.supplier_org) {
              partnerName = deal.supplier_org.name
              trust = deal.supplier_org.trust_score ?? '—'
              location = deal.supplier_org.city || '—'
            } else if (deal.buyer_org) {
              partnerName = deal.buyer_org.name
              trust = deal.buyer_org.trust_score ?? '—'
              location = deal.buyer_org.city || '—'
            } else if (deal.supplier_user) {
              partnerName = deal.supplier_user.full_name
            } else if (deal.buyer_user) {
              partnerName = deal.buyer_user.full_name
            }

            return (
              <div
                key={deal.id}
                className="bg-amber-100 rounded-3xl shadow-md p-6 flex flex-col gap-3 hover:scale-[1.02] transition"
              >

                <h2 className="text-xl font-semibold">{title}</h2>

                <div className="text-sm">
                  Partner: {partnerName}
                </div>

                <div className="text-sm">
                  Location: {
                    location !== '—'
                      ? location
                      : listing?.country || request?.country || '—'
                  }
                </div>

                <div className="text-sm">
                  ⭐ Trust: {trust}
                </div>

                <div className="text-sm">
                  Status: <span className="text-green-600 font-medium capitalize">{deal.status}</span>
                </div>

                <div className="text-sm">
                  Created: {new Date(deal.created_at).toLocaleDateString()}
                </div>

                <button
                  onClick={() => handleViewDetails(deal.id)}
                  className="mt-4 bg-amber-400 hover:bg-amber-500 px-4 py-2 rounded-xl"
                >
                  View Details
                </button>

              </div>
            )
          })}
        </div>
      )}

    </DashboardLayout>
  )
}