/**
 * POST /api/account/delete
 *
 * Permanently deletes the authenticated user's Frula data, and their sign-in when no other app
 * uses it. Uses the service role to:
 *   1. Call public.close_frula_account (20261114_close_frula_account.sql), which deletes the
 *      profile row. The cascade chain is in 20261113_profile_delete_actions.sql.
 *   2. Delete the auth user, only when the function returns true. Frula and ChoreQuest share one
 *      auth.users table, and chore.users cascades from it, so deleting a sign-in ChoreQuest uses
 *      would erase the person's ChoreQuest account (audit item 20).
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

    // 1. Delete the profile row. Foreign keys cascade it to listings and their children, messages
    //    in both directions, saved listings, search alerts, notifications, the user's checklists
    //    and listing plans, and transactions where they are the seller. The user's
    //    listing_views.viewer_id and transactions.buyer_id are set to null.
    const { data: isSignInDeletable, error: closeErr } = await admin.rpc('close_frula_account', {
        p_user: user.id,
    })

    if (closeErr) {
        // eslint-disable-next-line no-console
        console.error('Failed to close Frula account:', closeErr)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete account data. Please try again.',
        })
    }

    // ChoreQuest uses this sign-in, so it stays. The function left a blank profile behind.
    // Only a clear true deletes it: an unexpected answer keeps the sign-in rather than risk
    // erasing a ChoreQuest account.
    if (isSignInDeletable !== true) {
        return { deleted: true, signInKept: true }
    }

    // 2. Delete the auth user
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id)

    if (authErr) {
        // eslint-disable-next-line no-console
        console.error('Failed to delete auth user:', authErr)
        // A retry is safe: the function finds no profile, returns true, and this runs again.
        throw createError({
            statusCode: 500,
            statusMessage:
                "Your data was deleted, but we couldn't close your sign-in. Please try again.",
        })
    }

    return { deleted: true, signInKept: false }
})
