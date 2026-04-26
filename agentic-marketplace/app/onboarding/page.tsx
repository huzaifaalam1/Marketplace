'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const [accountType, setAccountType] =
    useState<'individual' | 'organization' | null>(null)

  const [fullName, setFullName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, profile_completed')
        .eq('id', session.user.id)
        .maybeSingle()

      // If profile exists and already completed → go to dashboard
      if (profile && profile.profile_completed) {
        router.push('/dashboard')
      }

      // If profile exists but not completed,
      // let them continue onboarding/setup
    }

    checkProfile()
  }, [router])

  const handleSubmit = async () => {
    if (!accountType) {
      alert('Please select account type')
      return
    }

    if (accountType === 'individual' && !fullName.trim()) {
      alert('Please enter your full name')
      return
    }

    if (accountType === 'organization' && !organizationName.trim()) {
      alert('Please enter organization name')
      return
    }

    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      router.push('/login')
      return
    }

    const userId = session.user.id

    // ==========================
    // 🟢 INDIVIDUAL FLOW
    // ==========================
    if (accountType === 'individual') {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          account_type: 'individual',
          full_name: fullName,
          profile_completed: false,
        })

      setLoading(false)

      if (error) {
        alert(error.message)
      } else {
        router.push('/setup-profile')
      }

      return
    }

    // ==========================
    // 🟡 ORGANIZATION FLOW
    // ==========================
    if (accountType === 'organization') {

      // 1️⃣ Create Profile (User Identity)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          account_type: 'organization',
          full_name: null,
          profile_completed: false,
        })

      if (profileError) {
        setLoading(false)
        alert(profileError.message)
        return
      }

      // 2️⃣ Create Organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          owner_id: userId,
        })
        .select()
        .single()

      if (orgError || !org) {
        setLoading(false)
        alert(orgError?.message || 'Failed to create organization')
        return
      }

      // 3️⃣ Attach User to Organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: userId,
          role: 'owner',
        })

      setLoading(false)

      if (memberError) {
        alert(memberError.message)
      } else {
        router.push('/setup-organization')
      }
    }
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-6">
      <div className="bg-amber-50 p-10 rounded-3xl shadow-xl w-full max-w-lg">

        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Set Up Your Account
        </h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setAccountType('individual')}
            className={`flex-1 py-3 rounded-xl border font-medium transition
              ${
                accountType === 'individual'
                  ? 'bg-amber-400 border-amber-400'
                  : 'border-gray-300 hover:bg-amber-100'
              }`}
          >
            Individual
          </button>

          <button
            onClick={() => setAccountType('organization')}
            className={`flex-1 py-3 rounded-xl border font-medium transition
              ${
                accountType === 'organization'
                  ? 'bg-amber-400 border-amber-400'
                  : 'border-gray-300 hover:bg-amber-100'
              }`}
          >
            Organization
          </button>
        </div>

        {accountType === 'individual' && (
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 rounded-xl border border-gray-300 mb-4
                       focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        {accountType === 'organization' && (
          <input
            type="text"
            placeholder="Organization Name"
            className="w-full p-3 rounded-xl border border-gray-300 mb-4
                       focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-400 text-gray-900 font-medium
                     hover:bg-amber-500 transition"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>

      </div>
    </div>
  )
}