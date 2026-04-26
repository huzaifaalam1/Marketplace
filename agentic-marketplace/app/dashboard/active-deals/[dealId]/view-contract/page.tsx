'use client'

import { useRouter, useParams, usePathname } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressBar from '@/components/ProgressBar'

export default function ViewContract() {
    const router = useRouter()
    const { dealId } = useParams()
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

            <h1 className="text-2xl font-bold mb-6">Review Contract</h1>

            <div className="bg-white p-6 rounded shadow">
            <p>Mock contract preview goes here...</p>
            </div>

            <button
            onClick={() => router.push(`/dashboard/active-deals/${dealId}/process`)}
            className="mt-6 bg-amber-400 px-6 py-2 rounded-lg"
            >
            Proceed to Processing
            </button>

        </div>
        </DashboardLayout>
    )
}