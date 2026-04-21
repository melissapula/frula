/**
 * POST /api/alerts/process
 *
 * Processes Dream Home search alerts and sends digest emails for
 * any alerts that have new matching listings since the last send.
 *
 * Authenticated via a shared secret (Authorization: Bearer <ALERTS_SECRET>),
 * NOT via user auth — this is a system job called by a cron trigger.
 *
 * Flow:
 *   1. Fetch all daily alerts that are due (last_sent_at older than 23h)
 *   2. For each alert, query new active listings matching hard filters
 *   3. Score listings against soft preferences
 *   4. Filter by minMatchPercent, take top 5
 *   5. If matches found, send digest email via Resend
 *   6. Update last_sent_at
 *
 * Caps at 50 alerts per run to stay within Resend free tier limits.
 */

import { serverSupabaseServiceRole } from '#supabase/server'
import { type DreamPrefs, scoreDreamListing } from '../../utils/dreamScore'

/** Constant-time string comparison to prevent timing attacks on the secret. */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
}

interface AlertRow {
    id: string
    user_id: string
    filters: DreamPrefs
    email_frequency: string
    last_sent_at: string | null
    created_at: string
}

interface ProfileRow {
    id: string
    email: string
    full_name: string | null
}

interface ListingRow {
    id: string
    address: string
    city: string
    state: string
    zip: string
    price: number
    beds: number | null
    full_baths: number | null
    half_baths: number | null
    sqft: number | null
    lot_size: number | null
    lot_unit: string | null
    year_built: number | null
    single_story: boolean | null
    garage: boolean
    basement: boolean | null
    waterfront: boolean | null
    view_types: string[] | null
    features: string[] | null
    terrain: string[] | null
    property_type: string
    listing_photos: { url: string; is_primary: boolean }[]
}

interface ScoredMatch {
    listing: ListingRow
    score: number
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // Auth: shared secret, not user auth (timing-safe comparison)
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.replace('Bearer ', '') ?? ''
    const secret = config.alertsSecret as string
    if (!secret || !token || token.length !== secret.length || !timingSafeEqual(token, secret)) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    if (!config.resendApiKey) {
        throw createError({ statusCode: 500, statusMessage: 'Resend not configured' })
    }

    const admin = serverSupabaseServiceRole(event)
    const siteUrl = config.public.siteUrl as string

    // Fetch daily alerts that are due (never sent, or last sent 23+ hours ago)
    const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
    const { data: alerts, error: alertErr } = await admin
        .from('search_alerts')
        .select('*')
        .eq('email_frequency', 'daily')
        .or(`last_sent_at.is.null,last_sent_at.lt.${cutoff}`)
        .limit(50)

    if (alertErr) {
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to fetch alerts: ${alertErr.message}`,
        })
    }

    if (!alerts?.length) {
        return { processed: 0, sent: 0, skipped: 0, errors: 0 }
    }

    // Fetch profiles for all alert owners in one query
    const userIds = [...new Set((alerts as AlertRow[]).map((a) => a.user_id))]
    const { data: profiles } = await admin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)
    const profileMap = new Map((profiles ?? []).map((p: ProfileRow) => [p.id, p]))

    let sent = 0
    let skipped = 0
    let errors = 0

    for (const alert of alerts as AlertRow[]) {
        try {
            const profile = profileMap.get(alert.user_id)
            if (!profile?.email) {
                skipped++
                continue
            }

            const prefs = alert.filters
            // Listing cutoff: only new listings since last send (or alert creation)
            const listingSince = alert.last_sent_at ?? alert.created_at

            // Build query with hard filters
            let query = admin
                .from('listings')
                .select(
                    `id, address, city, state, zip, price, beds, full_baths, half_baths,
                     sqft, lot_size, lot_unit, year_built, single_story, garage, basement,
                     waterfront, view_types, features, terrain, property_type,
                     listing_photos ( url, is_primary )`,
                )
                .eq('status', 'active')
                .gte('listed_at', listingSince)
                .order('listed_at', { ascending: false })
                .limit(100)

            if (prefs.maxPrice) query = query.lte('price', prefs.maxPrice)
            if (prefs.state) query = query.eq('state', prefs.state)
            if (prefs.propertyType) query = query.eq('property_type', prefs.propertyType)

            const { data: listings, error: listErr } = await query
            if (listErr) {
                // eslint-disable-next-line no-console
                console.error(`Alert ${alert.id}: query failed:`, listErr)
                errors++
                continue
            }

            if (!listings?.length) {
                skipped++
                continue
            }

            // Score and filter
            const minPct = prefs.minMatchPercent ?? 0
            const scored: ScoredMatch[] = (listings as ListingRow[])
                .map((l) => ({ listing: l, ...scoreDreamListing(l, prefs) }))
                .filter((s) => s.score >= minPct)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)

            if (!scored.length) {
                skipped++
                continue
            }

            // Render and send
            const firstName = profile.full_name?.split(' ')[0] ?? null
            const subject =
                scored.length === 1
                    ? '1 new dream home match on Frula Homes'
                    : `${scored.length} new dream home matches on Frula Homes`

            const html = renderDigestEmail({
                firstName,
                matches: scored,
                siteUrl,
            })

            await $fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${config.resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: {
                    from: config.emailFrom,
                    to: profile.email,
                    reply_to: config.emailReplyTo || undefined,
                    subject,
                    html,
                },
            })

            // Mark as sent
            await admin
                .from('search_alerts')
                .update({ last_sent_at: new Date().toISOString() })
                .eq('id', alert.id)

            sent++
        } catch (e: unknown) {
            // eslint-disable-next-line no-console
            console.error(`Alert ${alert.id}: send failed:`, e)
            errors++
        }
    }

    return { processed: alerts.length, sent, skipped, errors }
})

// =====================================================
// Helpers
// =====================================================

function formatPrice(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(n)
}

function escapeHtml(s: string | null | undefined): string {
    if (!s) return ''
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function scoreBadgeColor(score: number): string {
    if (score >= 80) return '#1D9E75'
    if (score >= 50) return '#d97706'
    return '#64748b'
}

function primaryPhotoUrl(listing: ListingRow): string | null {
    const photos = listing.listing_photos ?? []
    return (photos.find((p) => p.is_primary) ?? photos[0])?.url ?? null
}

function specsLine(l: ListingRow): string {
    const parts: string[] = []
    if (l.beds) parts.push(`${l.beds} bd`)
    if (l.full_baths) parts.push(`${l.full_baths} ba`)
    if (l.sqft) parts.push(`${l.sqft.toLocaleString()} sqft`)
    return parts.join(' · ') || l.property_type
}

// =====================================================
// Email template
// =====================================================

function renderDigestEmail(opts: {
    firstName: string | null
    matches: ScoredMatch[]
    siteUrl: string
}): string {
    const greeting = opts.firstName ? `Hi ${escapeHtml(opts.firstName)},` : 'Hi there,'

    const matchCards = opts.matches
        .map((m) => {
            const photo = primaryPhotoUrl(m.listing)
            const badgeColor = scoreBadgeColor(m.score)
            return `
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:100px;vertical-align:top;">
                      ${
                          photo
                              ? `<img src="${escapeHtml(photo)}" alt="" style="width:100px;height:75px;object-fit:cover;border-radius:8px;display:block;" />`
                              : `<div style="width:100px;height:75px;background:#f1f5f9;border-radius:8px;"></div>`
                      }
                    </td>
                    <td style="padding-left:12px;vertical-align:top;">
                      <div style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:9999px;margin-bottom:4px;">
                        ${m.score}% match
                      </div>
                      <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:2px;">${formatPrice(m.listing.price)}</div>
                      <div style="font-size:12px;color:#475569;margin-top:2px;">${specsLine(m.listing)}</div>
                      <div style="font-size:12px;color:#64748b;margin-top:2px;">${escapeHtml(m.listing.address)}, ${escapeHtml(m.listing.city)}, ${escapeHtml(m.listing.state)}</div>
                      <a href="${escapeHtml(opts.siteUrl)}/listing/${m.listing.id}" style="font-size:12px;color:#1D9E75;font-weight:600;text-decoration:underline;margin-top:4px;display:inline-block;">View listing</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
        })
        .join('')

    return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Your Dream Home Digest</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${opts.matches.length} new listing${opts.matches.length === 1 ? '' : 's'} matching your dream home preferences
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:32px 36px 20px 36px;">
                <p style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1D9E75;">Frula Homes</p>
                <h1 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3;">Your Dream Home Digest</h1>
                <p style="margin:0 0 12px 0;font-size:15px;color:#334155;">${greeting}</p>
                <p style="margin:0 0 20px 0;font-size:15px;color:#334155;">
                  We found <strong>${opts.matches.length}</strong> new listing${opts.matches.length === 1 ? '' : 's'} that match${opts.matches.length === 1 ? 'es' : ''} your dream home preferences.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${matchCards}
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px 0;">
                  <tr>
                    <td style="border-radius:9999px;background:#1D9E75;">
                      <a href="${escapeHtml(opts.siteUrl)}/dream-home" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">See all matches</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px 32px 36px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
                You're receiving this because you set up a Dream Home alert.<br>
                <a href="${escapeHtml(opts.siteUrl)}/dream-home" style="color:#94a3b8;">View matches</a> · <a href="${escapeHtml(opts.siteUrl)}/account" style="color:#94a3b8;">Email preferences</a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:#94a3b8;">Frula Homes · Bemidji, MN 56601</p>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim()
}
