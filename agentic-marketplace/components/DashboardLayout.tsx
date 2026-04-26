'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import Header from './Header'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children }: any) {
  const router = useRouter()
  const pathname = usePathname()

  const isDashboardHome = pathname === '/dashboard'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      // GET PROFILE
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profileData) {
        router.push('/onboarding')
        return
      }

      setProfile(profileData)

      let ownerId = profileData.id
      let ownerType = 'individual'
      let orgData = null

      // GET ORG VIA organization_members
      if (profileData.account_type === 'organization') {
        const { data: membership, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', profileData.id)
          .maybeSingle()

        if (membership?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', membership.organization_id)
            .single()

          orgData = org
          setOrganization(org)

          ownerId = membership.organization_id
          ownerType = 'organization'
        } else {
          console.log(' NO MEMBERSHIP FOUND FOR USER')
        }
      }

      // WALLET (works for both now)
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('owner_type', ownerType)
        .maybeSingle()

      setWallet(walletData)
    }

    loadUserData()
  }, [router])

  const handleAddFunds = async (amount: number) => {
    if (!wallet || amount <= 0) return

    const newBalance = wallet.available_balance + amount

    await supabase
      .from('wallets')
      .update({ available_balance: newBalance })
      .eq('id', wallet.id)

    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'deposit',
        amount,
        direction: 'credit',
        description: 'Wallet deposit'
      })

    setWallet((prev: any) => ({
      ...prev,
      available_balance: newBalance
    }))
  }

  // SAFE DISPLAY NAME
  const displayName =
    profile?.account_type === 'individual'
      ? profile?.full_name
      : organization?.name

  return (
    <div
      className={`${
        isDashboardHome ? 'h-screen overflow-hidden' : 'min-h-screen'
      } bg-yellow-50 flex flex-col`}
    >

      {/* HEADER */}
      <Header
        displayName={displayName}
        accountType={profile?.account_type}
        onMenuClick={() => setSidebarOpen(prev => !prev)}
      />

      {/* SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        wallet={wallet}
        onAddFunds={handleAddFunds}
      />

      {/* WELCOME */}
      {profile && (
        <div className="flex justify-center mt-8">
          <h2 className="text-lg font-medium text-gray-700 flex items-center gap-2">
            Welcome back,{' '}
            {profile.account_type === 'individual'
              ? profile.full_name
              : organization?.name || 'Organization'}

            <span className="inline-block origin-bottom-right wave cursor-pointer">
              👋
            </span>
          </h2>
        </div>
      )}

      {isDashboardHome ? (
        <div className="w-full max-w-4xl mx-auto px-8 flex-1 min-h-0 flex flex-col overflow-hidden">

          {/* DASHBOARD CARDS */}
          {profile && (
            <div className="flex justify-center gap-12 mt-10">
              {[
                {
                  label: 'Trust Score',
                  value: `⭐ ${
                    profile.account_type === 'individual'
                      ? profile.trust_score
                      : organization?.trust_score ?? 0
                  }`
                },
                {
                  label: 'Deals Completed',
                  value:
                    profile.account_type === 'individual'
                      ? profile.deals_completed
                      : organization?.deals_completed ?? 0
                },
                {
                  label: 'Disputes',
                  value:
                    profile.account_type === 'individual'
                      ? profile.disputes_count
                      : organization?.disputes_count ?? 0
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-amber-100 rounded-3xl shadow-md w-64 h-40 flex flex-col items-center justify-center"
                >
                  <span className="text-lg font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="text-3xl font-bold text-gray-800 mt-2">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* PAGE CONTENT */}
          <div className="pt-8 flex-1 min-h-0 overflow-hidden h-full">
            {children}
          </div>

        </div>
      ) : (
        <div className="p-8 flex-1">
          {children}
        </div>
      )}

    </div>
  )
}