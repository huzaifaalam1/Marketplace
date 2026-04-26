'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DealModal({ open, onClose, supplier }: any) {
    const [accepted, setAccepted] = useState(false)
    const [loading, setLoading] = useState(false)

    if (!open) return null

    const handleSend = async () => {
        if (!accepted) return alert("You must accept terms")

        setLoading(true)

        const { data: { session } } = await supabase.auth.getSession()

        let recipientId = null

        // 🟡 CASE 1: ORGANIZATION
        if (supplier.organization_id) {
            const { data: member, error } = await supabase
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', supplier.organization_id)
                .limit(1)
                .single()

            if (error || !member) {
                console.error('ORG MEMBER ERROR:', error)
                alert('Could not find organization user')
                setLoading(false)
                return
            }

            recipientId = member.user_id
        }

        // 🟢 CASE 2: INDIVIDUAL
        else if (supplier.user_id) {
            recipientId = supplier.user_id
        }

        // 🔴 FAIL SAFE
        if (!recipientId) {
            alert('No valid recipient found')
            setLoading(false)
            return
        }

        let senderName = 'Someone'

        // 🔹 Try org first
        const { data: membership } = await supabase
            .from('organization_members')
            .select(`
                organization_id,
                organizations (
                    name
                )
            `)
            .eq('user_id', session?.user.id)
            .limit(1)
            .single()

        let orgName: string | undefined
        if (membership?.organizations) {
            if (Array.isArray(membership.organizations)) {
                orgName = membership.organizations[0]?.name
            } else {
                orgName = (membership.organizations as any)?.name
            }
        }

        if (orgName) {
            senderName = orgName
        } else {
            // 🔹 fallback → individual
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', session?.user.id)
                .maybeSingle()

            senderName = profile?.full_name || 'A user'
        }

        const message = `${senderName} invited you to a deal for "${supplier.title}"`

        const { error } = await supabase.from('notifications').insert({
            user_id: recipientId,
            sender_id: session?.user.id,
            related_listing_id: supplier.id,
            organization_id: membership?.organization_id || null,
            message: message,
            type: 'deal_invite',
            status: 'pending',
            read: false
        })

        
        if (error) {
            console.error('NOTIFICATION ERROR:', error)
            alert(error.message)
        }

        setLoading(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[420px] shadow-xl">
                <h2 className="text-lg font-semibold mb-4">Confirm Deal</h2>
                <p className="text-sm text-gray-600 mb-3">
                    You are inviting this supplier to a deal:
                </p>

                <div className="text-sm mb-4">
                    <b>{supplier.title}</b><br/>
                    ${supplier.price_min} - ${supplier.price_max}
                </div>

                <a href="/terms.pdf" target="_blank" className="text-amber-600 underline text-sm">
                    View Terms & Conditions
                </a>

                <div className="flex items-center gap-2 mt-3">
                    <input type="checkbox" checked={accepted} onChange={() => setAccepted(!accepted)}/>
                    <span className="text-sm">I accept the terms</span>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-3 py-1 text-gray-600">
                        Cancel
                    </button>

                    <button onClick={handleSend} className="bg-amber-400 px-4 py-2 rounded-xl">
                        {loading ? 'Sending...' : 'Send Invite'}
                    </button>
                </div>
            </div>
        </div>
    )
}