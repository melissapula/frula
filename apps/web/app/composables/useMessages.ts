export interface Message {
    id: string
    listing_id: string
    sender_id: string
    recipient_id: string
    body: string
    is_read: boolean
    created_at: string
}

export interface Thread {
    listing_id: string
    other_user_id: string
    last_message: Message
    unread_count: number
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
                listing: null,
                other_user: null,
            })
        } else {
            if (new Date(m.created_at) > new Date(existing.last_message.created_at)) {
                existing.last_message = m
            }
            if (m.recipient_id === myId && !m.is_read) existing.unread_count += 1
        }
    }

    return Array.from(map.values()).sort(
        (a, b) =>
            new Date(b.last_message.created_at).getTime() -
            new Date(a.last_message.created_at).getTime(),
    )
}
