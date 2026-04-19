/**
 * POST /api/notifications/send
 * Body: { messageId: string }
 *
 * Looks up a message in Supabase, builds the right email template based on
 * its kind (offer / viewing_request / text), and sends it via Resend.
 *
 * This route runs server-side so the Resend API key never touches the
 * browser. It uses the SERVICE ROLE key to bypass RLS (so it can read
 * recipient profiles even though the requester wouldn't normally have
 * access). For that reason it MUST validate that the caller is the
 * sender of the message — otherwise anyone could spam emails to anyone.
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { checkRateLimit } from '../../utils/rateLimit'

interface MessageRow {
    id: string
    listing_id: string
    sender_id: string
    recipient_id: string
    body: string
    kind: 'text' | 'offer' | 'viewing_request' | null
    payload: Record<string, unknown> | null
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
    price: number
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    if (!config.resendApiKey) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Resend not configured (RESEND_API_KEY missing)',
        })
    }

    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
    }

    // Rate limit: 5 emails per minute per user
    const rl = checkRateLimit(`send:${user.id}`, 5, 60_000)
    if (!rl.allowed) {
        throw createError({
            statusCode: 429,
            statusMessage: `Too many requests. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
        })
    }

    const body = await readBody<{ messageId?: string }>(event)
    const messageId = body?.messageId
    if (!messageId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing messageId' })
    }

    const admin = serverSupabaseServiceRole(event)

    // Pull the message
    const { data: message, error: msgErr } = await admin
        .from('messages')
        .select('id, listing_id, sender_id, recipient_id, body, kind, payload')
        .eq('id', messageId)
        .maybeSingle<MessageRow>()
    if (msgErr || !message) {
        throw createError({ statusCode: 404, statusMessage: 'Message not found' })
    }

    // Authorization: only the sender can ask us to fire the notification.
    // Without this check anyone could call this endpoint with any message id
    // to spam emails to recipients.
    if (message.sender_id !== user.id) {
        throw createError({
            statusCode: 403,
            statusMessage: 'You can only send notifications for your own messages',
        })
    }

    // Pull the recipient profile + listing in parallel
    const [recipientRes, senderRes, listingRes] = await Promise.all([
        admin
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', message.recipient_id)
            .maybeSingle<ProfileRow>(),
        admin
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', message.sender_id)
            .maybeSingle<ProfileRow>(),
        admin
            .from('listings')
            .select('id, address, city, state, price')
            .eq('id', message.listing_id)
            .maybeSingle<ListingRow>(),
    ])

    const recipient = recipientRes.data
    const sender = senderRes.data
    const listing = listingRes.data

    if (!recipient?.email || !listing) {
        // Silently no-op rather than 500 — listing or profile may have been
        // deleted. We don't want to break the message-send flow.
        return { sent: false, reason: 'Missing recipient or listing' }
    }

    const senderName = sender?.full_name || sender?.email?.split('@')[0] || 'A buyer'
    const siteUrl = config.public.siteUrl
    const threadUrl = `${siteUrl}/inbox/${listing.id}/${message.sender_id}`
    const listingUrl = `${siteUrl}/listing/${listing.id}`

    // Drop an in-app notification so the recipient's bell badge ticks up.
    // Use the relative inbox path for the link (same domain), not the full URL.
    const notifLink = `/inbox/${listing.id}/${message.sender_id}`
    let notifKind: string
    let notifTitle: string
    switch (message.kind) {
        case 'offer': {
            const price = (message.payload as { offer_price?: number } | null)?.offer_price
            notifKind = 'offer'
            notifTitle = price
                ? `${senderName} made an offer of ${formatPrice(price)}`
                : `${senderName} made an offer`
            break
        }
        case 'viewing_request':
            notifKind = 'viewing_request'
            notifTitle = `${senderName} requested a viewing`
            break
        default:
            notifKind = 'message'
            notifTitle = `${senderName} sent you a message`
    }
    await admin.from('notifications').insert({
        user_id: recipient.id,
        kind: notifKind,
        title: notifTitle,
        body: `${listing.address}, ${listing.city}, ${listing.state}`,
        link: notifLink,
        payload: { listing_id: listing.id, message_id: message.id },
    })

    // Pick template based on kind
    let subject: string
    let html: string

    switch (message.kind) {
        case 'offer': {
            const payload = (message.payload ?? {}) as Record<string, unknown>
            const offerPrice = payload.offer_price as number | undefined
            subject = offerPrice
                ? `💰 New offer on ${listing.address} — ${formatPrice(offerPrice)}`
                : `💰 New offer on ${listing.address}`
            html = renderOfferEmail({
                recipientName: recipient.full_name,
                senderName,
                listing,
                body: message.body,
                threadUrl,
                listingUrl,
                siteUrl,
            })
            break
        }
        case 'viewing_request': {
            subject = `📅 Viewing request for ${listing.address}`
            html = renderViewingEmail({
                recipientName: recipient.full_name,
                senderName,
                listing,
                body: message.body,
                threadUrl,
                listingUrl,
                siteUrl,
            })
            break
        }
        default: {
            subject = `💬 New message about ${listing.address}`
            html = renderMessageEmail({
                recipientName: recipient.full_name,
                senderName,
                listing,
                body: message.body,
                threadUrl,
                listingUrl,
                siteUrl,
            })
        }
    }

    // Fire the email via Resend's REST API
    try {
        await $fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: {
                from: config.emailFrom,
                to: recipient.email,
                reply_to: config.emailReplyTo || undefined,
                subject,
                html,
            },
        })
        return { sent: true }
    } catch (e: unknown) {
        // eslint-disable-next-line no-console
        console.error('Resend send failed:', e)
        // Don't throw — we don't want to break the user's message-send flow
        // just because email failed. They still see the message in the thread.
        return { sent: false, reason: 'Resend API error' }
    }
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

interface TemplateContext {
    recipientName: string | null
    senderName: string
    listing: ListingRow
    body: string
    threadUrl: string
    listingUrl: string
    siteUrl: string
}

function emailShell(opts: {
    heading: string
    preheader: string
    content: string
    ctaUrl: string
    ctaLabel: string
    siteUrl: string
}): string {
    return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${escapeHtml(opts.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${escapeHtml(opts.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:32px 36px 20px 36px;">
                <p style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1D9E75;">Frula Homes</p>
                <h1 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3;">${escapeHtml(opts.heading)}</h1>
                ${opts.content}
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px 0;">
                  <tr>
                    <td style="border-radius:9999px;background:#1D9E75;">
                      <a href="${escapeHtml(opts.ctaUrl)}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(opts.ctaLabel)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px 32px 36px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
                You're receiving this because you have an account on Frula Homes.<br>
                <a href="${escapeHtml(opts.ctaUrl)}" style="color:#94a3b8;">View in browser</a> · <a href="${escapeHtml(opts.siteUrl)}/account" style="color:#94a3b8;">Email preferences</a>
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

function bodyBlock(body: string): string {
    return `<div style="margin:16px 0;padding:16px 20px;background:#f8fafc;border-radius:12px;border-left:3px solid #1D9E75;font-size:14px;line-height:1.6;color:#334155;white-space:pre-wrap;">${escapeHtml(body)}</div>`
}

function renderOfferEmail(ctx: TemplateContext): string {
    const greeting = ctx.recipientName
        ? `Hi ${escapeHtml(ctx.recipientName.split(' ')[0])},`
        : 'Hi there,'
    return emailShell({
        heading: `💰 New offer on your home`,
        preheader: `${ctx.senderName} just made an offer on ${ctx.listing.address}.`,
        ctaUrl: ctx.threadUrl,
        ctaLabel: 'View offer & respond',
        siteUrl: ctx.siteUrl,
        content: `
<p style="margin:0 0 12px 0;font-size:15px;color:#334155;">${greeting}</p>
<p style="margin:0 0 12px 0;font-size:15px;color:#334155;">
  <strong>${escapeHtml(ctx.senderName)}</strong> just made an offer on your listing at
  <a href="${escapeHtml(ctx.listingUrl)}" style="color:#1D9E75;text-decoration:underline;">${escapeHtml(ctx.listing.address)}, ${escapeHtml(ctx.listing.city)}, ${escapeHtml(ctx.listing.state)}</a>.
</p>
${bodyBlock(ctx.body)}
<p style="margin:0 0 0 0;font-size:14px;color:#64748b;">
  You can accept, counter, or decline directly from your inbox. Remember — this is an expression of interest, not a binding contract.
</p>
        `.trim(),
    })
}

function renderViewingEmail(ctx: TemplateContext): string {
    const greeting = ctx.recipientName
        ? `Hi ${escapeHtml(ctx.recipientName.split(' ')[0])},`
        : 'Hi there,'
    return emailShell({
        heading: `📅 Someone wants to tour your home`,
        preheader: `${ctx.senderName} requested a viewing at ${ctx.listing.address}.`,
        ctaUrl: ctx.threadUrl,
        ctaLabel: 'View request & respond',
        siteUrl: ctx.siteUrl,
        content: `
<p style="margin:0 0 12px 0;font-size:15px;color:#334155;">${greeting}</p>
<p style="margin:0 0 12px 0;font-size:15px;color:#334155;">
  <strong>${escapeHtml(ctx.senderName)}</strong> requested a viewing of
  <a href="${escapeHtml(ctx.listingUrl)}" style="color:#1D9E75;text-decoration:underline;">${escapeHtml(ctx.listing.address)}</a>.
</p>
${bodyBlock(ctx.body)}
<p style="margin:0 0 0 0;font-size:14px;color:#64748b;">
  You can confirm or suggest a different time from your inbox.
</p>
        `.trim(),
    })
}

function renderMessageEmail(ctx: TemplateContext): string {
    const greeting = ctx.recipientName
        ? `Hi ${escapeHtml(ctx.recipientName.split(' ')[0])},`
        : 'Hi there,'
    return emailShell({
        heading: `💬 New message from ${escapeHtml(ctx.senderName)}`,
        preheader: ctx.body.slice(0, 120),
        ctaUrl: ctx.threadUrl,
        ctaLabel: 'Reply in inbox',
        siteUrl: ctx.siteUrl,
        content: `
<p style="margin:0 0 12px 0;font-size:15px;color:#334155;">${greeting}</p>
<p style="margin:0 0 12px 0;font-size:15px;color:#334155;">
  <strong>${escapeHtml(ctx.senderName)}</strong> sent you a message about
  <a href="${escapeHtml(ctx.listingUrl)}" style="color:#1D9E75;text-decoration:underline;">${escapeHtml(ctx.listing.address)}</a>.
</p>
${bodyBlock(ctx.body)}
        `.trim(),
    })
}
