/**
 * POST /api/account/delete
 *
 * Permanently deletes the authenticated user's account and all
 * associated data. Uses the service role to:
 *   1. Delete the profile row (cascades to listings, photos, messages,
 *      saved_listings, search_alerts, transactions, etc.)
 *   2. Delete the auth user from Supabase Auth
 *
 * This is irreversible. The client must confirm before calling.
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { checkRateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
    }

    // Rate limit: 3 attempts per hour (prevent abuse)
    const rl = checkRateLimit(`delete-account:${user.id}`, 3, 3_600_000)
    if (!rl.allowed) {
        throw createError({
            statusCode: 429,
            statusMessage: 'Too many requests. Try again later.',
        })
    }

    const admin = serverSupabaseServiceRole(event)

    // 1. Delete the profile row — foreign key cascades handle:
    //    listings (→ listing_photos, listing_documents, listing_plans)
    //    messages, saved_listings, search_alerts,
    //    transactions (→ transaction_checklists), notifications
    const { error: profileErr } = await admin.from('profiles').delete().eq('id', user.id)

    if (profileErr) {
        // eslint-disable-next-line no-console
        console.error('Failed to delete profile:', profileErr)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete account data. Please try again.',
        })
    }

    // 2. Delete the auth user
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id)

    if (authErr) {
        // eslint-disable-next-line no-console
        console.error('Failed to delete auth user:', authErr)
        // Profile is already gone — log but don't fail the request,
        // since the user's data is deleted and they can't log in
        // to a profile that no longer exists.
    }

    return { deleted: true }
})
