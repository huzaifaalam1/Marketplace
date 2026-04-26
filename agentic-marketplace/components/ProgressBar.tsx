'use client'

import { useRouter } from 'next/navigation'

export default function ProgressBar({ stage }: { stage: number }) {
  const router = useRouter()

  const steps = [
    'Make Contract',
    'View Contract',
    'Process',
    'AI Summary',
    'Disputes'
  ]

  return (
    <div className="mb-10 max-w-4xl mx-auto">

      {/* 🔙 BACK BUTTON */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/active-deals')}
          className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors"
        >
          <span className="text-lg">←</span>
          Back to Active Deals
        </button>
      </div>

      {/* PROGRESS BAR */}
      <div className="flex items-center justify-between relative">

        {/* Base line */}
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-300" />

        {/* Active progress */}
        <div
          className="absolute top-5 left-0 h-[2px] bg-amber-400 transition-all duration-300"
          style={{ width: `${((stage - 1) / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {steps.map((label, index) => {
          const stepNumber = index + 1
          const isActive = stage >= stepNumber

          return (
            <div key={index} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 text-sm font-semibold transition-all
                  ${
                    isActive
                      ? 'bg-amber-400 border-amber-400 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }
                `}
              >
                {stage > stepNumber ? '✓' : stepNumber}
              </div>

              <span
                className={`mt-2 text-sm text-center ${
                  isActive ? 'text-gray-800 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}