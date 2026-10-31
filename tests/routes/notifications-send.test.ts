import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sessionCookieFor, startFakeServices } from './support/fake-services'

const ROUTE = '/api/notifications/send'
const EMAILS = '/emails'
const NOTIFICATIONS = '/rest/v1/notifications'
const USER_LOOKUP = '/auth/v1/user'

let fake: Awaited<ReturnType<typeof startFakeServices>>

const postRoute = (body: unknown, cookie?: string) =>
    fetch(ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify(body),
    })

// Each test gets its own sender, because the route allows 5 calls a minute per user.
const seedMessage = () => {
    const senderId = fake.addUser()
    const recipientId = fake.addUser()
    const listingId = randomUUID()
    const messageId = randomUUID()
    const recipientEmail = `${recipientId}@example.test`

    fake.seed('profiles', { id: senderId, full_name: 'Sam Sender' })
    fake.seed('profiles', { id: recipientId, email: recipientEmail, full_name: 'Rae Recipient' })
    fake.seed('listings', {
        id: listingId,
        address: '1 Lake St',
        city: 'Bemidji',
        state: 'MN',
        price: 250000,
    })
    fake.seed('messages', {
        id: messageId,
        listing_id: listingId,
        sender_id: senderId,
        recipient_id: recipientId,
        body: 'Is it still available?',
        kind: 'text',
        payload: null,
    })

    return { senderId, recipientId, messageId, recipientEmail }
}

const emailsTo = (address: string) =>
    fake.callsTo(EMAILS).filter((call) => (call.body as { to: string }).to === address)

const bellRowsFor = (userId: string) =>
    fake
        .callsTo(NOTIFICATIONS)
        .filter((call) => (call.body as { user_id: string }).user_id === userId)

describe('POST /api/notifications/send', async () => {
    beforeAll(async () => {
        fake = await startFakeServices()
    })

    afterAll(async () => {
        await fake.stop()
    })

    await setup({ rootDir: fileURLToPath(new URL('../../apps/web', import.meta.url)) })

    // serverSupabaseUser throws when there is no session, so the route's own 401 is never reached.
    it('returns 500 with no session, and sends no email', async () => {
        const { messageId, recipientEmail } = seedMessage()

        const response = await postRoute({ messageId })

        expect(response.status).toBe(500)
        expect(emailsTo(recipientEmail)).toHaveLength(0)
    })

    it('returns 400 with no messageId', async () => {
        const response = await postRoute({}, sessionCookieFor(fake.addUser()))

        expect(response.status).toBe(400)
    })

    it('returns 403 when the caller is not the sender, and sends no email', async () => {
        const { recipientId, messageId, recipientEmail } = seedMessage()

        const response = await postRoute({ messageId }, sessionCookieFor(recipientId))

        expect(response.status).toBe(403)
        expect(emailsTo(recipientEmail)).toHaveLength(0)
    })

    it('creates one bell row and one email when the sender calls it', async () => {
        const { senderId, recipientId, messageId, recipientEmail } = seedMessage()

        const response = await postRoute({ messageId }, sessionCookieFor(senderId))

        expect(await response.json()).toEqual({ sent: true })
        expect(bellRowsFor(recipientId)).toHaveLength(1)
        expect(emailsTo(recipientEmail)).toHaveLength(1)
    })

    it('reaches the fakes rather than the real services', async () => {
        const { senderId, messageId, recipientEmail } = seedMessage()

        await postRoute({ messageId }, sessionCookieFor(senderId))

        expect(fake.callsTo(USER_LOOKUP, 'GET').length).toBeGreaterThan(0)
        expect(emailsTo(recipientEmail)[0]?.authorization).toBe('Bearer fake-resend-key')
    })

    it('returns sent false when Resend fails, and the bell row still exists', async () => {
        const { senderId, recipientId, messageId } = seedMessage()
        fake.failResend(true)

        const response = await postRoute({ messageId }, sessionCookieFor(senderId))
        fake.failResend(false)

        expect(await response.json()).toEqual({ sent: false, reason: 'Resend API error' })
        expect(bellRowsFor(recipientId)).toHaveLength(1)
    })

    it('sends nothing more when a messageId is replayed', async () => {
        const { senderId, recipientId, messageId, recipientEmail } = seedMessage()
        const cookie = sessionCookieFor(senderId)

        await postRoute({ messageId }, cookie)
        const replay = await postRoute({ messageId }, cookie)

        expect(await replay.json()).toEqual({ sent: false, reason: 'Already notified' })
        expect(bellRowsFor(recipientId)).toHaveLength(1)
        expect(emailsTo(recipientEmail)).toHaveLength(1)
    })

    // The fake models the claim, so this proves the route obeys it. Atomicity is the database's.
    it('sends one email when two calls arrive together', async () => {
        const { senderId, recipientId, messageId, recipientEmail } = seedMessage()
        const cookie = sessionCookieFor(senderId)

        await Promise.all([postRoute({ messageId }, cookie), postRoute({ messageId }, cookie)])

        expect(bellRowsFor(recipientId)).toHaveLength(1)
        expect(emailsTo(recipientEmail)).toHaveLength(1)
    })

    it('returns 500 with no email or bell row when the claim fails', async () => {
        const { senderId, recipientId, messageId, recipientEmail } = seedMessage()
        fake.failClaim(true)

        const response = await postRoute({ messageId }, sessionCookieFor(senderId))
        fake.failClaim(false)

        expect(response.status).toBe(500)
        expect(bellRowsFor(recipientId)).toHaveLength(0)
        expect(emailsTo(recipientEmail)).toHaveLength(0)
    })

    it('does not retry an email that Resend failed to send', async () => {
        const { senderId, recipientId, messageId, recipientEmail } = seedMessage()
        const cookie = sessionCookieFor(senderId)
        fake.failResend(true)

        await postRoute({ messageId }, cookie)
        fake.failResend(false)
        const retry = await postRoute({ messageId }, cookie)

        expect(await retry.json()).toEqual({ sent: false, reason: 'Already notified' })
        expect(bellRowsFor(recipientId)).toHaveLength(1)
        expect(emailsTo(recipientEmail)).toHaveLength(1)
    })
})
