'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'
import DealModal from '@/components/DealModal'
import { useRouter } from 'next/navigation'

export default function FindSuppliers() {
  const router = useRouter()

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [country, setCountry] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [sentInvites, setSentInvites] = useState<string[]>([])

  const filterRef = useRef<HTMLDivElement>(null)

  const startChat = async (targetUserId: string | null | undefined) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('GET SESSION ERROR:', sessionError)
      alert(sessionError.message)
      return
    }

    const currentUserId = session?.user?.id
    if (!currentUserId) {
      alert('Not authenticated')
      return
    }

    if (!targetUserId) {
      alert('Could not determine the recipient user id for this listing')
      return
    }

    const { data: existing, error: existingError } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(user1_id.eq.${currentUserId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUserId})`
      )
      .maybeSingle()

    if (existingError) {
      console.error('FIND EXISTING CONVERSATION ERROR:', existingError)
      alert(existingError.message)
      return
    }

    let chatId = existing?.id

    if (!existing) {
      const { data, error: createError } = await supabase
        .from('conversations')
        .insert({
          user1_id: currentUserId,
          user2_id: targetUserId
        })
        .select()
        .single()

      if (createError) {
        console.error('CREATE CONVERSATION ERROR:', createError)
        alert(createError.message)
        return
      }

      chatId = data?.id
    }

    if (!chatId) {
      alert('Failed to create or find a conversation')
      return
    }

    router.push(`/dashboard?chat=${chatId}`)
  }

  useEffect(() => {
    const loadSuppliers = async () => {
      let query = supabase
        .from('supplier_listings')
        .select(`
          id,
          title,
          product_category,
          description,
          price_min,
          price_max,
          min_order_quant,
          lead_time_days,
          country,
          organization_id,
          user_id,
          organizations (
            name,
            trust_score,
            deals_completed,
            city
          )
        `)

      if (search) query = query.ilike('title', `%${search}%`)
      if (category) query = query.eq('product_category', category)
      if (country) query = query.eq('country', country)

      const { data } = await query
      if (data) setSuppliers(data)
    }

    const loadSentInvites = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session?.user.id)
        .maybeSingle()

      const orgId = membership?.organization_id

      let query = supabase
        .from('notifications')
        .select('related_listing_id')
        .eq('type', 'deal_invite')

      if (orgId) {
        query = query.eq('organization_id', orgId)
      } else {
        query = query.eq('sender_id', session?.user.id)
      }

      const { data } = await query

      if (data) {
        setSentInvites(data.map((n: any) => String(n.related_listing_id)))
      }
    }

    const loadFilters = async () => {
      const { data: categoryData } = await supabase
        .from('supplier_listings')
        .select('product_category')

      const { data: countryData } = await supabase
        .from('supplier_listings')
        .select('country')

      if (categoryData) {
        setCategories([...new Set(categoryData.map(c => c.product_category))])
      }

      if (countryData) {
        setCountries([...new Set(countryData.map(c => c.country))])
      }
    }

    loadSuppliers()
    loadFilters()
    loadSentInvites()
  }, [search, category, country])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold mb-10">Find Suppliers</h1>

      {/* SAME FILTER UI (unchanged) */}
      <div className="flex gap-4 mb-8 items-center">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 w-64"
        />

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-amber-200 hover:bg-amber-300 rounded-lg"
          >
            ⚙ Filters
          </button>

          {showFilters && (
            <div className="absolute top-12 left-0 bg-white rounded-2xl shadow-lg p-4 w-64 z-50">

              <div className="mb-3">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-2 py-1"
                >
                  <option value="">All</option>
                  {categories.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-2 py-1"
                >
                  <option value="">All</option>
                  {countries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-amber-100 rounded-3xl shadow-md p-6 flex flex-col gap-3 hover:scale-[1.02] transition">

            <h2 className="text-xl font-semibold">{supplier.title}</h2>
            <p className="text-sm text-gray-700">{supplier.description}</p>

            <div className="text-sm">Supplier: {supplier.organizations?.name}</div>

            <div className="text-sm">
              Location: {supplier.organizations?.city
                ? `${supplier.organizations.city}, ${supplier.country}`
                : supplier.country}
            </div>

            <div className="text-sm">
              Price: ${supplier.price_min} - ${supplier.price_max}
            </div>

            <div className="text-sm">Min Order: {supplier.min_order_quant}</div>
            <div className="text-sm">Lead Time: {supplier.lead_time_days} days</div>

            <div className="mt-3 font-medium">
              ⭐ Trust: {supplier.organizations?.trust_score}
            </div>

            <div className="mt-4 flex gap-2">
              {sentInvites.includes(String(supplier.id)) ? (
                <button
                  disabled
                  className="flex-1 bg-gray-300 px-3 py-2 rounded-xl text-sm cursor-not-allowed"
                >
                  Invite Sent
                </button>
              ) : (
                <button
                  onClick={() => setSelectedSupplier(supplier)}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 px-3 py-2 rounded-xl text-sm"
                >
                  Invite to Deal
                </button>
              )}

              <button
                onClick={() => startChat(supplier.user_id)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-xl text-sm"
              >
                Message
              </button>
            </div>
          </div>
        ))}

        {/* ONE modal */}
        <DealModal
          open={!!selectedSupplier}
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      </div>

    </DashboardLayout>
  )
}