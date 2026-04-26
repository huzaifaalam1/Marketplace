'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      alert(error.message)
      return
    }

    setLoading(false)

    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-amber-50 p-10 rounded-3xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Create Account
        </h1>

        <p className="text-gray-600 mb-8">
          Start trading securely with AI-powered escrow.
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full p-3 rounded-xl border border-gray-300 bg-white
                       focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl border border-gray-300 bg-white
                       focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-400 text-gray-900 font-medium
                       hover:bg-amber-500 transition duration-200"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Already have an account?{' '}
          <a href="/login" className="text-amber-600 font-medium hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  )
}