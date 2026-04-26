'use client'

import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressBar from '@/components/ProgressBar'

export default function DisputesPage() {
    const pathname = usePathname()

    const step = pathname.split('/').pop() ?? ''

    const stageMap: Record<string, number> = {
        'make-contract': 1,
        'view-contract': 2,
        'process': 3,
        'ai-summary': 4,
        'disputes': 5
    }

    const currentStage = stageMap[step] ?? 1

    return (
        <DashboardLayout>
        <div className="p-10 max-w-3xl mx-auto">

            <ProgressBar stage={currentStage} />

            <h1 className="text-2xl font-bold mb-6">Dispute Resolution</h1>

            <div className="bg-white p-6 rounded shadow">
            <p>No disputes. Everything looks good.</p>
            </div>

        </div>
        </DashboardLayout>
    )
}