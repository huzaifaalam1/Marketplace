'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import CountryCityDropdown from '@/components/CountryCityDropdown'
import PhoneInput from '@/components/PhoneInput'
import IndustriesDropdown from '@/components/IndustriesDropdown'
import WebsiteInput from '@/components/WebsiteInput'
import BioTextarea from '@/components/BioTextarea'

export default function SetupProfile() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<'individual' | 'organization' | null>(null)
  const [isOnboarding, setIsOnboarding] = useState(true)

  const [fullName, setFullName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyRole, setCompanyRole] = useState('')
  const [industry, setIndustry] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [marketplaceRole, setMarketplaceRole] = useState<'buyer' | 'supplier' | 'both'>('buyer')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile) return router.push('/onboarding')

      setAccountType(profile.account_type)

      if (profile.profile_completed) {
        setIsOnboarding(false)
      }

      setFullName(profile.full_name || '')
      setOrganizationName(profile.organization_name || '')
      setJobTitle(profile.job_title || '')
      setCompanyRole(profile.company_role || '')
      setIndustry(profile.industry || '')
      setBusinessDescription(profile.business_description || '')
      setCountry(profile.country || '')
      setCity(profile.city || '')
      setPhone(profile.phone || '')
      setWebsite(profile.website || '')
      setMarketplaceRole(profile.marketplace_role || 'buyer')
    }

    fetchProfile()
  }, [router])

  const handleSave = async () => {
    if (!accountType) return
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: accountType === 'individual' ? fullName : organizationName,
        full_name: accountType === 'individual' ? fullName : null,
        organization_name: accountType === 'organization' ? organizationName : null,
        job_title: accountType === 'individual' ? jobTitle : null,
        company_role: accountType === 'organization' ? companyRole : null,
        industry,
        marketplace_role: marketplaceRole,
        business_description: businessDescription,
        country,
        city,
        phone,
        website,
        profile_completed: true,
      })
      .eq('id', session?.user.id)

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
          {isOnboarding ? 'Complete Your Profile' : 'Edit Profile'}
        </h2>

        {accountType === 'individual' && (
          <div className="grid grid-cols-2 gap-4">
            <input className="input" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input className="input" placeholder="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        )}

        {accountType === 'organization' && (
          <div className="grid grid-cols-2 gap-4">
            <input className="input" placeholder="Organization Name" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
            <input className="input" placeholder="Your Role" value={companyRole} onChange={(e) => setCompanyRole(e.target.value)} />
          </div>
        )}

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

        <PhoneInput value={phone} onChange={setPhone} />

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