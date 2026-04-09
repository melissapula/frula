export type MessageKind = 'text' | 'offer' | 'viewing_request'

export interface OfferPayload {
    offer_price: number
    earnest_money: number | null
    financing: 'cash' | 'conventional' | 'fha' | 'va' | 'usda'
    closing_date: string | null
    contingencies: {
        inspection: boolean
        appraisal: boolean
        financing: boolean
        saleOfHome: boolean
    }
    note: string | null
    asking_price_at_offer: number | null
    /** Set when seller responds; the OfferCard switches into a read-only state. */
    status?: 'pending' | 'accepted' | 'declined' | 'countered'
}

export interface ViewingPayload {
    date_primary: string
    date_backup: string | null
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'anytime'
    party_size: number
    note: string | null
    status?: 'pending' | 'confirmed' | 'declined'
}

export interface Message {
    id: string
    listing_id: string
    sender_id: string
    recipient_id: string
    body: string
    is_read: boolean
    flagged?: boolean
    created_at: string
    kind?: MessageKind
    payload?: OfferPayload | ViewingPayload | null
}

export interface Thread {
    listing_id: string
    other_user_id: string
    last_message: Message
    unread_count: number
    flagged: boolean
    /** Most recent message I received in this thread — used for "mark as unread". */
    last_received_id: string | null
    listing: {
        id: string
        address: string
        city: string
        state: string
        price: number
        listing_photos: { url: string; is_primary: boolean }[]
    } | null
    other_user: {
        id: string
        full_name: string | null
        email: string
    } | null
}

/**
 * Group flat messages into threads keyed by (listing_id, other_user_id).
 */
export function buildThreads(messages: Message[], myId: string): Thread[] {
    const map = new Map<string, Thread>()

    for (const m of messages) {
        const otherId = m.sender_id === myId ? m.recipient_id : m.sender_id
        const key = `${m.listing_id}:${otherId}`
        const existing = map.get(key)
        if (!existing) {
            map.set(key, {
                listing_id: m.listing_id,
                other_user_id: otherId,
                last_message: m,
                unread_count: m.recipient_id === myId && !m.is_read ? 1 : 0,
                flagged: !!m.flagged,
                last_received_id: m.recipient_id === myId ? m.id : null,
                listing: null,
                other_user: null,
            })
        } else {
            if (new Date(m.created_at) > new Date(existing.last_message.created_at)) {
                existing.last_message = m
            }
            if (m.recipient_id === myId && !m.is_read) existing.unread_count += 1
            if (m.flagged) existing.flagged = true
            if (m.recipient_id === myId) {
                // Track newest received message id (messages arrive newest-first)
                if (!existing.last_received_id) existing.last_received_id = m.id
            }
        }
    }

    return Array.from(map.values()).sort(
        (a, b) =>
            new Date(b.last_message.created_at).getTime() -
            new Date(a.last_message.created_at).getTime(),
    )
}
