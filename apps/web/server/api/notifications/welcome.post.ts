/**
 * POST /api/notifications/welcome
 *
 * Sends a one-time welcome email to a newly-confirmed user. Idempotent:
 * uses a `welcomed_at` timestamp on the profile to ensure we never send
 * the welcome email twice (no matter how many times this endpoint is
 * accidentally called from the client).
 *
 * Called from /confirm.vue after Supabase confirms the user's email,
 * and as a safety net from /signup.vue if Supabase has email confirmation
 * disabled in the project settings (so signups go straight to confirmed).
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { checkRateLimit } from '../../utils/rateLimit'

interface ProfileRow {
    id: string
    email: string
    full_name: string | null
    welcomed_at: string | null
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    if (!config.resendApiKey) {
        // Soft-fail when Resend isn't configured locally — don't break signups
        return { sent: false, reason: 'Resend not configured' }
    }

    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
    }

    // Rate limit: 3 welcome attempts per hour per user
    const rl = checkRateLimit(`welcome:${user.id}`, 3, 3_600_000)
    if (!rl.allowed) {
        throw createError({
            statusCode: 429,
            statusMessage: `Too many requests. Try again later.`,
        })
    }

    const admin = serverSupabaseServiceRole(event)

    const { data: profile, error: pErr } = await admin
        .from('profiles')
        .select('id, email, full_name, welcomed_at')
        .eq('id', user.id)
        .maybeSingle<ProfileRow>()

    if (pErr || !profile) {
        return { sent: false, reason: 'Profile not found' }
    }

    // Idempotency guard: if we've already welcomed this user, do nothing.
    if (profile.welcomed_at) {
        return { sent: false, reason: 'Already welcomed' }
    }

    const firstName = profile.full_name?.split(' ')[0] ?? null
    const siteUrl = config.public.siteUrl

    try {
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
                subject: 'Welcome to Frula Homes 💚',
                html: renderWelcomeEmail({ firstName, siteUrl }),
            },
        })
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Welcome email send failed:', e)
        // Don't throw — we still want to mark the user as welcomed so we
        // don't keep retrying a broken send. The user can survive a missed
        // welcome email; they can't survive a perpetual retry loop.
    }

    // Mark as welcomed regardless of Resend success/failure
    await admin.from('profiles').update({ welcomed_at: new Date().toISOString() }).eq('id', user.id)

    return { sent: true }
})

// =====================================================
// Email template
// =====================================================

function escapeHtml(s: string | null): string {
    if (!s) return ''
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function renderWelcomeEmail(opts: { firstName: string | null; siteUrl: string }): string {
    const greeting = opts.firstName ? `Hi ${escapeHtml(opts.firstName)},` : 'Hi there,'
    return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Welcome to Frula Homes</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      Welcome to Frula Homes — sell your home, keep the commission.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:32px 36px 0 36px;">
                <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1D9E75;">Frula Homes</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 12px 36px;">
                <h1 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#0f172a;line-height:1.2;">Welcome aboard 💚</h1>
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#334155;">${greeting}</p>
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#334155;">
                  Thanks for joining Frula Homes — the nationwide for-sale-by-owner platform built to help you sell or buy a home without paying agent commissions. Here's what you can do right now:
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:14px 16px;background:#f8fafc;border-radius:12px;border-left:3px solid #1D9E75;">
                      <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#0f172a;">🏠 Selling a home?</p>
                      <p style="margin:0;font-size:13px;line-height:1.5;color:#475569;">List your property in a few minutes — photos, map, all the details. Always free, no commission, ever.</p>
                      <p style="margin:8px 0 0 0;"><a href="${escapeHtml(opts.siteUrl)}/sell" style="color:#1D9E75;font-size:13px;font-weight:600;text-decoration:underline;">List your home →</a></p>
                    </td>
                  </tr>
                  <tr><td style="height:10px;line-height:10px;">&nbsp;</td></tr>
                  <tr>
                    <td style="padding:14px 16px;background:#f8fafc;border-radius:12px;border-left:3px solid #1D9E75;">
                      <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#0f172a;">✨ Looking for your dream home?</p>
                      <p style="margin:0;font-size:13px;line-height:1.5;color:#475569;">Tell us what your perfect home looks like and we'll rank every nationwide listing by how well it matches.</p>
                      <p style="margin:8px 0 0 0;"><a href="${escapeHtml(opts.siteUrl)}/dream-home" style="color:#1D9E75;font-size:13px;font-weight:600;text-decoration:underline;">Find your dream home →</a></p>
                    </td>
                  </tr>
                  <tr><td style="height:10px;line-height:10px;">&nbsp;</td></tr>
                  <tr>
                    <td style="padding:14px 16px;background:#f8fafc;border-radius:12px;border-left:3px solid #1D9E75;">
                      <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#0f172a;">📄 Need the right paperwork?</p>
                      <p style="margin:0;font-size:13px;line-height:1.5;color:#475569;">Our state directory points you to the official forms for all 50 states — straight from your state's real estate commission.</p>
                      <p style="margin:8px 0 0 0;"><a href="${escapeHtml(opts.siteUrl)}/paperwork" style="color:#1D9E75;font-size:13px;font-weight:600;text-decoration:underline;">Browse paperwork →</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 32px 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0;">
                  <tr>
                    <td style="border-radius:9999px;background:#1D9E75;">
                      <a href="${escapeHtml(opts.siteUrl)}/browse" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Start browsing listings →</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
                  One last honest note: Frula is a small operation built by one person on evenings and weekends. If you have feedback, find a bug, or just want to say hi — replying to this email gets to me directly.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px 32px 36px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
                <strong>Frula Homes</strong> — Sell it yourself.<br>
                <a href="${escapeHtml(opts.siteUrl)}/how-we-make-money" style="color:#94a3b8;">How we make money</a> · <a href="${escapeHtml(opts.siteUrl)}/privacy" style="color:#94a3b8;">Privacy</a> · <a href="${escapeHtml(opts.siteUrl)}/account" style="color:#94a3b8;">Email preferences</a><br>
                Bemidji, MN 56601
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim()
}
