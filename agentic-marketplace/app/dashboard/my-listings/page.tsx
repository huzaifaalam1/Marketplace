'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

export default function MyListings() {
  const router = useRouter()

  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 🔹 modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // 🔹 form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [quantity, setQuantity] = useState('')
  const [leadTime, setLeadTime] = useState('')
  const [country, setCountry] = useState('')

  useEffect(() => {
    const loadListings = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile) {
            alert('Profile not found')
            return
        }
      let orgId = null
      let userId = null

      if (profile.account_type === 'organization') {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .maybeSingle()

        orgId = membership?.organization_id
      } else {
        userId = session.user.id
      }

      const { data: buyers } = await supabase
        .from('buyer_requests')
        .select('*')
        .or(userId ? `user_id.eq.${userId}` : `organization_id.eq.${orgId}`)

      const { data: suppliers } = await supabase
        .from('supplier_listings')
        .select('*')
        .or(userId ? `user_id.eq.${userId}` : `organization_id.eq.${orgId}`)

      const formatted = [
        ...(buyers || []).map((b) => ({ ...b, type: 'buyer' })),
        ...(suppliers || []).map((s) => ({ ...s, type: 'supplier' }))
      ]

      setListings(formatted)
      setLoading(false)
    }

    loadListings()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center mt-20">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto mt-10">

        <h1 className="text-3xl font-semibold mb-8 text-center">
          My Listings
        </h1>

        {/* EMPTY STATE */}
        {listings.length === 0 && (
          <div className="text-center mt-20 bg-white p-10 rounded-3xl shadow-md">
            <h2 className="text-xl font-semibold mb-3">
              No Listings Yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven’t created any listings yet.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/dashboard/create-buyer')}
                className="bg-amber-400 px-5 py-2 rounded-xl"
              >
                Create Buyer Request
              </button>

              <button
                onClick={() => router.push('/dashboard/create-supplier')}
                className="bg-gray-200 px-5 py-2 rounded-xl"
              >
                Create Supplier Listing
              </button>
            </div>
          </div>
        )}

        {/* LISTINGS */}
        {listings.length > 0 && (
          <div className="grid grid-cols-3 gap-6">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-amber-100 rounded-3xl shadow-md p-6 flex flex-col gap-3
                hover:scale-[1.02] hover:shadow-lg transition-transform duration-200"
              >
                <div className="text-xs text-gray-600 uppercase">
                  {item.type === 'buyer' ? 'Buyer Request' : 'Supplier Listing'}
                </div>

                <h2 className="text-lg font-semibold">{item.title}</h2>

                <p className="text-sm text-gray-700 line-clamp-3">
                  {item.description}
                </p>

                {item.type === 'buyer' ? (
                  <div className="text-sm">
                    Budget: ${item.budget_min} - ${item.budget_max}
                  </div>
                ) : (
                  <div className="text-sm">
                    Price: ${item.price_min} - ${item.price_max}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  {item.country}
                </div>

                {/* EDIT BUTTON */}
                <button
                  onClick={() => {
                    setSelectedItem(item)
                    setShowModal(true)

                    setTitle(item.title)
                    setCategory(item.product_category)
                    setDescription(item.description)

                    if (item.type === 'buyer') {
                      setPriceMin(item.budget_min)
                      setPriceMax(item.budget_max)
                      setQuantity(item.quantity)
                    } else {
                      setPriceMin(item.price_min)
                      setPriceMax(item.price_max)
                      setQuantity(item.min_order_quant)
                      setLeadTime(item.lead_time_days)
                    }

                    setCountry(item.country)
                  }}
                  className="mt-3 bg-amber-400 py-2 rounded-xl"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* 🔥 MODAL */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-[500px] space-y-4 shadow-xl">

            <h2 className="text-xl font-semibold">
              Edit {selectedItem.type === 'buyer' ? 'Buyer Request' : 'Supplier Listing'}
            </h2>

            <input className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400" value={category} onChange={(e) => setCategory(e.target.value)} />
            <textarea className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400" value={description} onChange={(e) => setDescription(e.target.value)} />

            <input className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400" type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
            <input className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400" type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
            <input className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

            {selectedItem.type === 'supplier' && (
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                type="number"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="Lead Time"
              />
            )}

            <input className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400" value={country} onChange={(e) => setCountry(e.target.value)} />

            <div className="flex gap-3 pt-3">
              <button
                onClick={async () => {
                  if (selectedItem.type === 'buyer') {
                    await supabase
                      .from('buyer_requests')
                      .update({
                        title,
                        product_category: category,
                        description,
                        budget_min: Number(priceMin),
                        budget_max: Number(priceMax),
                        quantity: Number(quantity),
                        country
                      })
                      .eq('id', selectedItem.id)
                  } else {
                    await supabase
                      .from('supplier_listings')
                      .update({
                        title,
                        product_category: category,
                        description,
                        price_min: Number(priceMin),
                        price_max: Number(priceMax),
                        min_order_quant: Number(quantity),
                        lead_time_days: Number(leadTime),
                        country
                      })
                      .eq('id', selectedItem.id)
                  }

                  setShowModal(false)
                  window.location.reload()
                }}
                className="flex-1 bg-amber-400 py-2 rounded-xl"
              >
                Save Changes
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 py-2 rounded-xl"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  )
}