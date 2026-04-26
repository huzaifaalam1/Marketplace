'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        return
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const orgId = membership?.organization_id

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (orgId) {
        query = query.or(
          `user_id.eq.${session.user.id},organization_id.eq.${orgId}`
        )
      } else {
        query = query.eq('user_id', session.user.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('NOTIFICATIONS ERROR:', error)
      }

      setNotifications(data || [])
      setLoading(false)
    }

    loadNotifications()
  }, [])

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Notifications
        </h1>

        {loading && (
          <p className="text-gray-600">Loading notifications...</p>
        )}

        {!loading && notifications.length === 0 && (
          <div className="p-6 rounded-2xl border border-amber-200 bg-amber-100 shadow-sm text-center">
            <p className="text-gray-700">You have no notifications yet.</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="flex flex-col gap-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 rounded-2xl border border-amber-200 bg-amber-100 shadow-sm"
              >
                <p className="text-gray-700">{notification.message}</p>

                {notification.status && (
                  <p className="text-xs text-gray-500 mt-2 capitalize">
                    Status: {notification.status}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}