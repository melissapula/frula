import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createTestDatabase, isDenied } from './support/database'
import type { QueryResult, Role } from './support/database'
import { ACTIVE_LISTING, BUYER, SELLER, STRANGER, seedPeople } from './support/fixtures'

const OFFER = '20000000-0000-0000-0000-000000000001'
const VIEWING = '20000000-0000-0000-0000-000000000002'
const ANSWERED_OFFER = '20000000-0000-0000-0000-000000000003'
const TEXT = '20000000-0000-0000-0000-000000000004'
const MISSING_MESSAGE = '20000000-0000-0000-0000-000000000099'

const OFFER_PAYLOAD = { status: 'pending', offer_price: 250000, financing: 'cash' }
const VIEWING_PAYLOAD = { status: 'pending', date_primary: '2026-11-01', party_size: 2 }

const RESPONDENTS: [string, Role, string | null][] = [
    ['sender', 'authenticated', BUYER],
    ['stranger', 'authenticated', STRANGER],
    ['anon', 'anon', null],
]

const expectDenied = (result: QueryResult) =>
    expect(isDenied(result), JSON.stringify(result)).toBe(true)

const respond = (messageId: string, status: string) =>
    `SELECT public.respond_to_message('${messageId}', '${status}') AS payload`

const canExecute = (role: Role) =>
    `SELECT has_function_privilege('${role}', 'public.respond_to_message(uuid, text)', 'EXECUTE')
       AS allowed`

const insertMessage = (senderId: string, recipientId: string, extra = '') => {
    const [columns, values] = extra ? [', kind, payload', `, ${extra}`] : ['', '']

    return `INSERT INTO public.messages (listing_id, sender_id, recipient_id, body${columns})
        VALUES ('${ACTIVE_LISTING}', '${senderId}', '${recipientId}', 'hello'${values})
        RETURNING id`
}

describe('message integrity', () => {
    let db: PGlite

    beforeAll(async () => {
        db = await createTestDatabase()
        await seedPeople(db)
        await db.exec(`
          INSERT INTO public.messages (id, listing_id, sender_id, recipient_id, body, kind, payload) VALUES
            ('${OFFER}', '${ACTIVE_LISTING}', '${BUYER}', '${SELLER}', 'offer', 'offer',
              '${JSON.stringify(OFFER_PAYLOAD)}'),
            ('${VIEWING}', '${ACTIVE_LISTING}', '${BUYER}', '${SELLER}', 'viewing', 'viewing_request',
              '${JSON.stringify(VIEWING_PAYLOAD)}'),
            ('${ANSWERED_OFFER}', '${ACTIVE_LISTING}', '${BUYER}', '${SELLER}', 'offer', 'offer',
              '${JSON.stringify({ ...OFFER_PAYLOAD, status: 'accepted' })}');
          INSERT INTO public.messages (id, listing_id, sender_id, recipient_id, body) VALUES
            ('${TEXT}', '${ACTIVE_LISTING}', '${BUYER}', '${SELLER}', 'hi');
        `)
    })

    afterAll(async () => {
        await db.close()
    })

    describe('responding', () => {
        it.each(['accepted', 'countered', 'declined'])(
            'recipient can mark an offer %s',
            async (status) => {
                const result = await as(db, 'authenticated', SELLER, respond(OFFER, status))

                expect(result.rows).toEqual([{ payload: { ...OFFER_PAYLOAD, status } }])
            },
        )

        it.each(['confirmed', 'declined'])('recipient can mark a viewing %s', async (status) => {
            const result = await as(db, 'authenticated', SELLER, respond(VIEWING, status))

            expect(result.rows).toEqual([{ payload: { ...VIEWING_PAYLOAD, status } }])
        })

        it.each(RESPONDENTS)('%s cannot respond', async (_name, role, userId) => {
            expectDenied(await as(db, role, userId, respond(OFFER, 'accepted')))
        })

        it.each([
            ['an answered offer', ANSWERED_OFFER, 'declined'],
            ['confirmed on an offer', OFFER, 'confirmed'],
            ['accepted on a viewing', VIEWING, 'accepted'],
            ['a text message', TEXT, 'accepted'],
            ['an unknown status', OFFER, 'pending'],
            ['a message that does not exist', MISSING_MESSAGE, 'accepted'],
        ])('recipient is denied: %s', async (_name, messageId, status) => {
            expectDenied(await as(db, 'authenticated', SELLER, respond(messageId, status)))
        })

        // anon's rejection above can't prove this: the function's own error reads the same.
        it('only authenticated can execute the function', async () => {
            const { rows: anon } = await db.query(canExecute('anon'))
            const { rows: authenticated } = await db.query(canExecute('authenticated'))

            expect(anon).toEqual([{ allowed: false }])
            expect(authenticated).toEqual([{ allowed: true }])
        })
    })

    describe('inbox actions still work', () => {
        it.each([true, false])('recipient sets is_read to %s', async (isRead) => {
            const sql = `UPDATE public.messages SET is_read = ${isRead} WHERE id = '${TEXT}'
                RETURNING is_read`

            const result = await as(db, 'authenticated', SELLER, sql)

            expect(result.rows).toEqual([{ is_read: isRead }])
        })

        it.each([
            ['sender', BUYER],
            ['recipient', SELLER],
        ])('%s sets flagged', async (_name, userId) => {
            const sql = `UPDATE public.messages SET flagged = true WHERE id = '${TEXT}'
                RETURNING flagged`

            const result = await as(db, 'authenticated', userId, sql)

            expect(result.rows).toEqual([{ flagged: true }])
        })

        it.each([
            ['sender', BUYER],
            ['recipient', SELLER],
        ])('%s deletes a message', async (_name, userId) => {
            const sql = `DELETE FROM public.messages WHERE id = '${TEXT}' RETURNING id`

            const result = await as(db, 'authenticated', userId, sql)

            expect(result.rows).toEqual([{ id: TEXT }])
        })

        it('sender inserts text', async () => {
            const result = await as(db, 'authenticated', BUYER, insertMessage(BUYER, SELLER))

            expect(result.rows).toHaveLength(1)
        })

        it('sender inserts an offer', async () => {
            const extra = `'offer', '${JSON.stringify(OFFER_PAYLOAD)}'`

            const result = await as(db, 'authenticated', BUYER, insertMessage(BUYER, SELLER, extra))

            expect(result.rows).toHaveLength(1)
        })

        it('sender inserts a viewing request', async () => {
            const extra = `'viewing_request', '${JSON.stringify(VIEWING_PAYLOAD)}'`

            const result = await as(db, 'authenticated', BUYER, insertMessage(BUYER, SELLER, extra))

            expect(result.rows).toHaveLength(1)
        })

        it.each([
            ['buyer', BUYER, SELLER],
            ['seller', SELLER, BUYER],
        ])('%s inserts a system note', async (_name, senderId, recipientId) => {
            const result = await as(
                db,
                'authenticated',
                senderId,
                insertMessage(senderId, recipientId),
            )

            expect(result.rows).toHaveLength(1)
        })
    })
})
