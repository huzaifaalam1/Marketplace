'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

export default function CreateSupplier() {
    const router = useRouter()

    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [priceMin, setPriceMin] = useState('')
    const [priceMax, setPriceMax] = useState('')
    const [quantity, setQuantity] = useState('')
    const [leadTime, setLeadTime] = useState('')
    const [country, setCountry] = useState('')

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
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .maybeSingle()

        if (!membership) {
            alert('Organization membership not found')
            return
        }

        orgId = membership.organization_id
        } else {
        userId = session.user.id
        }

        const { error } = await supabase
            .from('supplier_listings')
            .insert({
                title,
                product_category: category,
                description,
                price_min: Number(priceMin),
                price_max: Number(priceMax),
                min_order_quant: Number(quantity),
                lead_time_days: Number(leadTime),
                country,
                organization_id: orgId,
                user_id: userId
        })

        if (error) return alert(error.message)

        router.push('/dashboard')
    }

    return (
        <DashboardLayout>
        <div className="max-w-3xl mx-auto mt-10">

            <h1 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
            Create Supplier Listing
            </h1>

            <div className="bg-white rounded-3xl shadow-lg p-8 space-y-8">

            {/* BASIC INFO */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">
                Basic Information
                </h2>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">Title</label>
                    <input
                    value={title || ''}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. Steel rods supplier"
                    />
                </div>

                <div>
                    <label className="label">Category</label>
                    <input
                    value={category || ''}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. Metals"
                    />
                </div>
                </div>

                <div className="mt-4">
                <label className="label">Description</label>
                <textarea
                    value={description || ''}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400 h-28 resize-none"
                    placeholder="Describe your product, quality, certifications..."
                />
                </div>
            </div>

            {/* PRICING */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">
                Pricing & Capacity
                </h2>

                <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="label">Min Price per Unit ($)</label>
                    <input
                    value={priceMin || ''}
                    onChange={(e) => setPriceMin(e.target.value)}
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 10"
                    />
                </div>

                <div>
                    <label className="label">Max Price per Unit ($)</label>
                    <input
                    value={priceMax || ''}
                    onChange={(e) => setPriceMax(e.target.value)}
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 20"
                    />
                </div>

                <div>
                    <label className="label">Min Order Quantity</label>
                    <input
                    value={quantity || ''}
                    onChange={(e) => setQuantity(e.target.value)}
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 500"
                    />
                </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                Revenue range per order:{" "}
                {priceMin && quantity
                    ? `$${Number(priceMin) * Number(quantity)}`
                    : '--'}{" "}
                –{" "}
                {priceMax && quantity
                    ? `$${Number(priceMax) * Number(quantity)}`
                    : '--'}
                </p>
            </div>

            {/* DELIVERY */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">
                Fulfillment
                </h2>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">Lead Time (days)</label>
                    <input
                    value={leadTime || ''}
                    onChange={(e) => setLeadTime(e.target.value)}
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 14"
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
                    <label className="label">Country</label>
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
                Create Listing
                </button>
            </div>

            </div>
        </div>
        </DashboardLayout>
    )
}