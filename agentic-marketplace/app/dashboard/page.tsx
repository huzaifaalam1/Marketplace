'use client'

import DashboardLayout from '@/components/DashboardLayout'
import Messages from '@/components/Messages'
import { useSearchParams } from 'next/navigation'

export default function Dashboard() {
  const searchParams = useSearchParams()
  const initialChatId = searchParams.get('chat')

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-0 h-full">
        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="col-span-3 min-h-0">
            <Messages initialChatId={initialChatId} />
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}