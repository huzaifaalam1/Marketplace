'use client'

import { useRef, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Header({ displayName, accountType, onMenuClick }: any) {
  const router = useRouter()

  const [accountDropdown, setAccountDropdown] = useState(false)
  const accountDropdownRef = useRef<HTMLDivElement>(null)
  const [notificationDropdown, setNotificationDropdown] = useState(false)
  const notificationDropdownRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const loadNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false })

      if (data) setNotifications(data)
    }

    loadNotifications()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setAccountDropdown(false)
      }

      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setNotificationDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleDecision = async (
    notificationId: string,
    decision: 'accepted' | 'rejected'
  ) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (fetchError || !notification) {
      console.error('NOTIFICATION FETCH ERROR:', fetchError)
      return
    }

    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({
        status: decision,
        read: true
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (updateError || !updatedNotification) {
      console.error('UPDATE ERROR:', updateError)
      return
    }

    if (decision === 'accepted') {
      const { data: existingDeal } = await supabase
        .from('deals')
        .select('id')
        .or(
          `listing_id.eq.${notification.related_listing_id},request_id.eq.${notification.related_listing_id}`
        )
        .maybeSingle()

      if (!existingDeal) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .maybeSingle()

        const receiverOrgId = membership?.organization_id || null

        const { data: supplierCheck } = await supabase
          .from('supplier_listings')
          .select('id')
          .eq('id', notification.related_listing_id)
          .maybeSingle()

        const isSupplierFlow = !!supplierCheck

        let payload: any = {
          status: 'active'
        }

        if (isSupplierFlow) {
          // Supplier created the listing; buyer sent the invite; supplier accepted.
          // sender_id = buyer, session.user.id = supplier
          const { data: listing } = await supabase
            .from('supplier_listings')
            .select('user_id,organization_id')
            .eq('id', notification.related_listing_id)
            .maybeSingle()

          payload = {
            ...payload,
            listing_id: notification.related_listing_id,
            buyer_user_id: notification.sender_id,
            buyer_org_id: notification.organization_id || null,
            supplier_user_id: session.user.id,
            supplier_org_id:
              listing?.organization_id || receiverOrgId || null
          }
        } else {
          // Buyer created the request; supplier sent the offer; buyer accepted.
          // sender_id = supplier, session.user.id = buyer
          const { data: request } = await supabase
            .from('buyer_requests')
            .select('user_id,organization_id')
            .eq('id', notification.related_listing_id)
            .maybeSingle()

          payload = {
            ...payload,
            request_id: notification.related_listing_id,
            supplier_user_id: notification.sender_id,
            supplier_org_id: notification.organization_id || null,
            buyer_user_id: session.user.id,
            buyer_org_id:
              request?.organization_id || receiverOrgId || null
          }
        }

        const { error: dealError } = await supabase
          .from('deals')
          .insert(payload)

        if (dealError) {
          console.error('DEAL INSERT ERROR:', dealError)
        }
      }
    }

    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, ...updatedNotification }
          : n
      )
    )
  }

  const handleBellClick = () => {
    setNotificationDropdown(prev => !prev)
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  return (
    <div className="w-full flex items-center justify-between px-6 py-4 bg-amber-100 shadow-md">

      {/* LEFT: MENU */}
      <button
        onClick={onMenuClick}
        className="text-2xl"
      >
        ☰
      </button>

      {/* CENTER: APP NAME */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-semibold text-gray-800">
        Agentic Marketplace
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-8 relative">

        <div className="relative" ref={accountDropdownRef}>
          <button
            onClick={() => setAccountDropdown(prev => !prev)}
            className="font-medium text-gray-700"
          >
            Account Settings
          </button>

          {accountDropdown && (
            <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-lg p-4 w-48 flex flex-col gap-2 z-50">
              <button
                onClick={() =>
                  router.push(
                    accountType === 'individual'
                      ? '/setup-profile'
                      : '/setup-organization'
                  )
                }
                className="text-left hover:text-amber-600"
              >
                Edit Profile
              </button>

              <button className="text-left hover:text-amber-600">
                Reset Password
              </button>

              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="text-left hover:text-amber-600"
              >
                Sign Out
              </button>

              <button className="text-left text-red-500 hover:text-red-600">
                Delete Account
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={notificationDropdownRef}>
          <button
            onClick={handleBellClick}
            className="text-2xl text-gray-800 hover:text-amber-700 translate-y-0.25 p-2 rounded-full border-[1.5px] border-amber-700 hover:border-amber-700 bg-amber-100 hover:bg-amber-200 relative focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-amber-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationDropdown && (
            <div className="absolute right-0 top-12 bg-amber-50 border border-amber-200 rounded-2xl shadow-lg p-4 w-80 max-h-96 overflow-hidden flex flex-col gap-3 z-50">
              <div className="border-b border-amber-200 pb-2">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No notifications</p>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-xl border shadow-sm transition-colors hover:shadow-md hover:-translate-y-[1px] transform ${
                        notification.unread
                          ? 'bg-amber-200/60 border-amber-400 ring-1 ring-amber-300/60'
                          : 'bg-amber-100 border-amber-300'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <p className="text-gray-700 text-sm flex-1">
                            {notification.message}
                          </p>

                          {notification.unread && (
                            <div className="w-2 h-2 bg-amber-700 rounded-full mt-1 ml-2"></div>
                          )}
                        </div>

                        {/* ACTION BUTTONS */}
                        {notification.type === 'deal_invite' && notification.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleDecision(notification.id, 'accepted')}
                              className="px-3 py-1 bg-green-400 hover:bg-green-500 rounded-lg text-sm"
                            >
                              Accept
                            </button>

                            <button
                              onClick={() => handleDecision(notification.id, 'rejected')}
                              className="px-3 py-1 bg-red-400 hover:bg-red-500 rounded-lg text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {notification.type === 'deal_invite' && notification.status !== 'pending' && (
                          <span className="text-xs text-gray-500">
                            {notification.status === 'accepted'
                              ? '✅ Accepted'
                              : '❌ Rejected'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-amber-200 pt-3">
                <button
                  onClick={() => {
                    setNotificationDropdown(false)
                    router.push('/dashboard/notifications')
                  }}
                  className="w-full bg-amber-100 hover:bg-amber-200 text-gray-800 font-medium py-2 rounded-xl border border-amber-200 transition-colors"
                >
                  Show more
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}