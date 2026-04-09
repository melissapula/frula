/**
 * POST /api/notifications/save
 * Body: { listingId: string }
 *
 * Drops an in-app "Someone saved your home" notification for the listing
 * owner. Runs server-side with the service role so we can write a row
 * targeting another user (the listing owner) without exposing a generic
 * "insert any notification" RLS policy that would be a spam vector.
 *
 * Verifies the caller is authenticated and is NOT the listing owner
 * (sellers shouldn't get notified about saving their own listings).
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
    }

    const body = await readBody<{ listingId?: string }>(event)
    const listingId = body?.listingId
    if (!listingId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing listingId' })
    }

    const admin = serverSupabaseServiceRole(event)

    const { data: listing } = await admin
        .from('listings')
        .select('id, user_id, address, city, state')
        .eq('id', listingId)
        .maybeSingle<{
            id: string
            user_id: string
            address: string
            city: string
            state: string
        }>()

    if (!listing) {
        return { sent: false, reason: 'Listing not found' }
    }
    if (listing.user_id === user.id) {
        // Self-save — silently no-op
        return { sent: false, reason: 'Self save' }
    }

    await admin.from('notifications').insert({
        user_id: listing.user_id,
        kind: 'save',
        title: 'Someone saved your home ❤️',
        body: `${listing.address}, ${listing.city}, ${listing.state}`,
        link: `/listing/${listing.id}`,
        payload: { listing_id: listing.id },
    })

    return { sent: true }
})
