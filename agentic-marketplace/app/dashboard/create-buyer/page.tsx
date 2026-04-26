'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

export default function CreateBuyer() {
    const router = useRouter()

    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [priceMin, setPriceMin] = useState('')
    const [priceMax, setPriceMax] = useState('')
    const [quantity, setQuantity] = useState('')
    const [country, setCountry] = useState('')
    const [deadline, setDeadline] = useState('')

    const handleSubmit = async () => {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            alert('Not authenticated')
            return
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('account_type')
            .eq('id', session.user.id)
            .single()

        if (profileError || !profile) {
            alert('Profile not found')
            return
        }

        let orgId = null
        let userId = null

        if (profile.account_type === 'organization') {
            const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .maybeSingle()

            if (membershipError || !membership) {
            alert('Organization membership not found')
            return
            }

            orgId = membership.organization_id
        } else {
            userId = session.user.id
        }

        const { error } = await supabase.from('buyer_requests').insert({
            title,
            product_category: category,
            description,
            budget_min: Number(priceMin),
            budget_max: Number(priceMax),
            quantity: Number(quantity),
            country,
            delivery_deadline: deadline || null,
            organization_id: orgId,
            user_id: userId
        })

        if (error) {
            console.error(error)
            alert(error.message)
            return
        }

        router.push('/dashboard')
    }

    return (
        <DashboardLayout>
        <div className="max-w-3xl mx-auto mt-10">

            {/* TITLE */}
            <h1 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
            Create Buyer Request
            </h1>

            <div className="bg-white rounded-3xl shadow-lg p-8 space-y-8">

            {/* BASIC INFO */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">
                Basic Information
                </h2>

                <div className="grid grid-cols-2 gap-4">

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                    Title
                    </label>
                    <input
                    value={title || ''}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. Steel rods bulk order"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                    Category
                    </label>
                    <input
                    value={category || ''}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. Metals"
                    />
                </div>

                </div>

                <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    Description
                </label>
                <textarea
                    value={description || ''}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white h-28 resize-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Describe what you're looking for..."
                />
                </div>
            </div>

            {/* PRICING */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">
                Pricing & Quantity
                </h2>

                <div className="grid grid-cols-3 gap-4">

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                    Min Price per Unit ($)
                    </label>
                    <input
                    value={priceMin || ''}
                    onChange={(e) => setPriceMin(e.target.value)}
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 10"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                    Max Price per Unit ($)
                    </label>
                    <input
                    value={priceMax || ''}
                    onChange={(e) => setPriceMax(e.target.value)}
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 20"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                    Quantity (Units)
                    </label>
                    <input
                    value={quantity || ''}
                    onChange={(e) => setQuantity(e.target.value)}
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 500"
                    />
                </div>

                </div>

                {/* LIVE TOTAL */}
                <p className="text-xs text-gray-500 mt-2">
                Estimated deal value:{" "}
                {priceMin && quantity
                    ? `$${Number(priceMin) * Number(quantity)}`
                    : '--'}
                {" "}–{" "}
                {priceMax && quantity
                    ? `$${Number(priceMax) * Number(quantity)}`
                    : '--'}
                </p>
            </div>

            {/* DELIVERY DEADLINE */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">
                Delivery
                </h2>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">Delivery Deadline</label>
                    <input
                        type="date"
                        value={deadline || ''}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    />
                </div>
                </div>
            </div>
            {/* LOCATION */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">
                Location
                </h2>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                    Country
                    </label>
                    <input
                        value={country || ''}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                        placeholder="e.g. USA"
                    />
                </div>
                </div>
            </div>

            {/* CTA */}
            <div>
                <button
                onClick={handleSubmit}
                className="w-full bg-amber-400 hover:bg-amber-500 transition-all py-3 rounded-xl font-semibold text-gray-900 shadow-md hover:shadow-lg"
                >
                Create Request
                </button>
            </div>

            </div>
        </div>
        </DashboardLayout>
    )
}