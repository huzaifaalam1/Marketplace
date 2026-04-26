'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import CountryCityDropdown from '@/components/CountryCityDropdown'
import IndustriesDropdown from '@/components/IndustriesDropdown'
import WebsiteInput from '@/components/WebsiteInput'
import BioTextarea from '@/components/BioTextarea'

export default function SetupOrganization() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [isOnboarding, setIsOnboarding] = useState(true)

  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [website, setWebsite] = useState('')
  const [marketplaceRole, setMarketplaceRole] = useState<'buyer' | 'supplier' | 'both'>('buyer')

  useEffect(() => {
    const loadOrganization = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!membership?.organization_id) return router.push('/onboarding')

      setOrgId(membership.organization_id)

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .single()

      if (!org) return

      if (org.created_at) setIsOnboarding(false)

      setName(org.name || '')
      setIndustry(org.industry || '')
      setBusinessDescription(org.business_description || '')
      setCountry(org.country || '')
      setCity(org.city || '')
      setWebsite(org.website || '')
      setMarketplaceRole(org.marketplace_role || 'buyer')
    }

    loadOrganization()
  }, [router])

  const handleSave = async () => {
    if (!orgId) return
    setLoading(true)

    const { error } = await supabase
      .from('organizations')
      .update({
        name,
        industry,
        marketplace_role: marketplaceRole,
        business_description: businessDescription,
        country,
        city,
        website,
      })
      .eq('id', orgId)

    setLoading(false)

    if (error) alert(error.message)
    else router.push('/dashboard')
  }

  const content = (
    <div className="max-w-xl mx-auto">

      {!isOnboarding && (
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-4 text-sm text-gray-600 hover:text-amber-600"
        >
          ← Back to Dashboard
        </button>
      )}

      <div className="bg-amber-50 p-10 rounded-3xl shadow-xl space-y-5">

        <h2 className="text-xl font-semibold text-gray-800">
          {isOnboarding ? 'Setup Organization' : 'Edit Organization'}
        </h2>

        <input className="input" placeholder="Organization Name" value={name} onChange={(e) => setName(e.target.value)} />

        <IndustriesDropdown selectedIndustry={industry} onIndustryChange={setIndustry} />

        <select className="input" value={marketplaceRole} onChange={(e) => setMarketplaceRole(e.target.value as any)}>
          <option value="buyer">Buyer</option>
          <option value="supplier">Supplier</option>
          <option value="both">Both</option>
        </select>

        <BioTextarea value={businessDescription} onChange={setBusinessDescription} />

        <CountryCityDropdown
          selectedCountry={country}
          selectedCity={city}
          onCountryChange={setCountry}
          onCityChange={setCity}
        />

        <WebsiteInput value={website} onChange={setWebsite} />

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-500"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

      </div>
    </div>
  )

  return isOnboarding ? content : <DashboardLayout>{content}</DashboardLayout>
}