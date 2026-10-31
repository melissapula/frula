import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createTestDatabase, isDenied } from './support/database'
import type { QueryResult, Role } from './support/database'
import {
    ACTIVE_LISTING,
    BUYER,
    DRAFT_LISTING,
    SELLER,
    SOLD_LISTING,
    STRANGER,
    TXN_A,
    TXN_B,
    seedPeople,
} from './support/fixtures'

const OFFER = '20000000-0000-0000-0000-000000000001'
const VIEWING = '20000000-0000-0000-0000-000000000002'
const ANSWERED_OFFER = '20000000-0000-0000-0000-000000000003'
const TEXT = '20000000-0000-0000-0000-000000000004'
const FORGED = '20000000-0000-0000-0000-000000000005'
const SELLER_NOTE = '20000000-0000-0000-0000-000000000006'
const MISSING_MESSAGE = '20000000-0000-0000-0000-000000000099'

const OFFER_PAYLOAD = { status: 'pending', offer_price: 250000, financing: 'cash' }
const VIEWING_PAYLOAD = { status: 'pending', date_primary: '2026-11-01', party_size: 2 }
const PENDING_OFFER = `'offer', '${JSON.stringify(OFFER_PAYLOAD)}'`

const RESPOND_FUNCTION = 'public.respond_to_message(uuid, text)'
const CAN_MESSAGE_FUNCTION = 'public.can_message(uuid, uuid)'
const CLAIM_FUNCTION = 'public.claim_message_notification(uuid)'

const RESPONDENTS: [string, Role, string | null][] = [
    ['sender', 'authenticated', BUYER],
    ['stranger', 'authenticated', STRANGER],
    ['anon', 'anon', null],
]

const PARTIES: [string, string][] = [
    ['sender', BUYER],
    ['recipient', SELLER],
]

const LOCKED_COLUMNS: [string, string][] = [
    ['body', `'forged'`],
    ['payload', `'{"status": "accepted", "offer_price": 1}'`],
    ['recipient_id', `'${STRANGER}'`],
    ['sender_id', `'${STRANGER}'`],
    ['listing_id', `'${ACTIVE_LISTING}'`],
    ['kind', `'text'`],
    ['created_at', `'2020-01-01'`],
    ['notified_at', `'2020-01-01'`],
]

const INBOX_COLUMNS: [string, string][] = [
    ['is_read', 'true'],
    ['flagged', 'true'],
]

const LOCKED_BY_PARTY = PARTIES.flatMap(([party, userId]) =>
    LOCKED_COLUMNS.map(([column, value]) => [party, column, userId, value] as const),
)

const expectDenied = (result: QueryResult) =>
    expect(isDenied(result), JSON.stringify(result)).toBe(true)

// Kept apart from isDenied, which means a missing privilege rather than a failed policy check.
const isBlocked = (result: QueryResult) => /row-level security/.test(result.error ?? '')

const expectBlocked = (result: QueryResult) =>
    expect(isBlocked(result), JSON.stringify(result)).toBe(true)

const updateColumn = (column: string, value: string) =>
    `UPDATE public.messages SET ${column} = ${value} WHERE id = '${OFFER}' RETURNING id`

const deleteOffer = `DELETE FROM public.messages WHERE id = '${OFFER}' RETURNING id`

const respond = (messageId: string, status: string) =>
    `SELECT public.respond_to_message('${messageId}', '${status}') AS payload`

const canExecute = (role: Role, signature: string) =>
    `SELECT has_function_privilege('${role}', '${signature}', 'EXECUTE') AS allowed`

const insertMessage = (
    senderId: string,
    recipientId: string,
    extra = '',
    listingId = ACTIVE_LISTING,
) => {
    const [columns, values] = extra ? [', kind, payload', `, ${extra}`] : ['', '']

    return `INSERT INTO public.messages (listing_id, sender_id, recipient_id, body${columns})
        VALUES ('${listingId}', '${senderId}', '${recipientId}', 'hello'${values})
        RETURNING id`
}

const claim = (messageId: string) => `public.claim_message_notification('${messageId}')`

// sender, recipient, listing, kind and payload
const UNWANTED_MESSAGES: [string, string, string, string, string][] = [
    ['a stranger to a non-owner', STRANGER, TXN_B, ACTIVE_LISTING, ''],
    ['the seller to someone who never wrote', SELLER, STRANGER, ACTIVE_LISTING, ''],
    ['a buyer to the owner of a draft listing', BUYER, TXN_A, DRAFT_LISTING, ''],
    ['a buyer to the owner of a sold listing', STRANGER, SELLER, SOLD_LISTING, ''],
    ['a buyer to themselves', BUYER, BUYER, ACTIVE_LISTING, ''],
    ['the owner to themselves on their own listing', SELLER, SELLER, ACTIVE_LISTING, ''],
    ['an offer to a non-owner', BUYER, TXN_B, ACTIVE_LISTING, PENDING_OFFER],
    ['a reply based on a different listing', SELLER, BUYER, DRAFT_LISTING, ''],
    ['the sender of a forged message to its target', STRANGER, BUYER, ACTIVE_LISTING, ''],
]

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
            ('${TEXT}', '${ACTIVE_LISTING}', '${BUYER}', '${SELLER}', 'hi'),
            ('${FORGED}', '${ACTIVE_LISTING}', '${STRANGER}', '${BUYER}', 'forged'),
            ('${SELLER_NOTE}', '${SOLD_LISTING}', '${SELLER}', '${BUYER}', 'note');
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
            const { rows: anon } = await db.query(canExecute('anon', RESPOND_FUNCTION))
            const { rows: authenticated } = await db.query(
                canExecute('authenticated', RESPOND_FUNCTION),
            )

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

    describe('forged updates', () => {
        it.each(LOCKED_BY_PARTY)('%s cannot change %s', async (_name, column, userId, value) => {
            expectDenied(await as(db, 'authenticated', userId, updateColumn(column, value)))
        })

        it.each([...LOCKED_COLUMNS, ...INBOX_COLUMNS])(
            'anon cannot update %s',
            async (column, value) => {
                expectDenied(await as(db, 'anon', null, updateColumn(column, value)))
            },
        )

        it.each(INBOX_COLUMNS)('stranger updates no rows: %s', async (column, value) => {
            const result = await as(db, 'authenticated', STRANGER, updateColumn(column, value))

            expect(result.rows).toEqual([])
        })
    })

    describe('deletes by outsiders', () => {
        it.each(RESPONDENTS.slice(1))('%s deletes no rows', async (_name, role, userId) => {
            const result = await as(db, role, userId, deleteOffer)

            expect(result.rows).toEqual([])
        })
    })

    describe('forged inserts', () => {
        it.each([
            ['a buyer claiming the seller', BUYER, SELLER, BUYER],
            ['a recipient claiming the sender', SELLER, BUYER, SELLER],
            ['a stranger claiming the buyer', STRANGER, BUYER, SELLER],
        ])('blocks %s', async (_name, userId, senderId, recipientId) => {
            const sql = insertMessage(senderId, recipientId)

            expectBlocked(await as(db, 'authenticated', userId, sql))
        })

        it.each([
            ['an accepted offer', `'offer', '{"status": "accepted"}'`],
            ['a confirmed viewing', `'viewing_request', '{"status": "confirmed"}'`],
            ['an offer with no payload', `'offer', NULL`],
            ['a viewing with no payload', `'viewing_request', NULL`],
            ['a text message with a payload', `'text', '{"status": "pending"}'`],
        ])('blocks %s', async (_name, extra) => {
            const sql = insertMessage(BUYER, SELLER, extra)

            expectBlocked(await as(db, 'authenticated', BUYER, sql))
        })

        // RETURNING would add the SELECT policy's check, which hides a gap in the INSERT policy.
        it('blocks a stranger claiming the buyer when nothing is returned', async () => {
            const sql = `INSERT INTO public.messages (listing_id, sender_id, recipient_id, body)
                VALUES ('${ACTIVE_LISTING}', '${BUYER}', '${SELLER}', 'hello')`

            expectBlocked(await as(db, 'authenticated', STRANGER, sql))
        })

        it('blocks anon', async () => {
            expectBlocked(await as(db, 'anon', null, insertMessage(BUYER, SELLER)))
        })
    })

    describe('who can be messaged', () => {
        describe.each([
            ['with RETURNING', (sql: string) => sql],
            ['without RETURNING', (sql: string) => sql.replace('RETURNING id', '')],
        ])('%s', (_form, toQuery) => {
            it.each(UNWANTED_MESSAGES)(
                'blocks %s',
                async (_name, senderId, recipientId, listingId, extra) => {
                    const sql = toQuery(insertMessage(senderId, recipientId, extra, listingId))

                    expectBlocked(await as(db, 'authenticated', senderId, sql))
                },
            )
        })

        it.each([
            ['a buyer to the owner', STRANGER, SELLER, '', ACTIVE_LISTING],
            ['the seller replying to a buyer who wrote', SELLER, BUYER, '', ACTIVE_LISTING],
            ['a counter offer back to the buyer', SELLER, BUYER, PENDING_OFFER, ACTIVE_LISTING],
            ['a buyer the seller wrote to, once sold', BUYER, SELLER, '', SOLD_LISTING],
        ])('allows %s', async (_name, senderId, recipientId, extra, listingId) => {
            const sql = insertMessage(senderId, recipientId, extra, listingId)

            const result = await as(db, 'authenticated', senderId, sql)

            expect(result.rows).toHaveLength(1)
        })

        it('a blocked message does not reveal the recipient profile', async () => {
            const readProfile = `SELECT id FROM public.profiles WHERE id = '${TXN_B}'`

            expectBlocked(await as(db, 'authenticated', STRANGER, insertMessage(STRANGER, TXN_B)))
            const result = await as(db, 'authenticated', STRANGER, readProfile)

            expect(result.rows).toEqual([])
        })

        // RLS runs the check as the querying role, so authenticated has to keep it.
        it('only authenticated can execute the recipient check', async () => {
            const { rows: anon } = await db.query(canExecute('anon', CAN_MESSAGE_FUNCTION))
            const { rows: authenticated } = await db.query(
                canExecute('authenticated', CAN_MESSAGE_FUNCTION),
            )

            expect(anon).toEqual([{ allowed: false }])
            expect(authenticated).toEqual([{ allowed: true }])
        })
    })

    describe('notification claim', () => {
        // One statement, because as() rolls back and a second call would start clean.
        it('claims a message once', async () => {
            const sql = `SELECT ${claim(TEXT)} AS first, ${claim(TEXT)} AS second`

            const result = await as(db, 'service_role', null, sql)

            expect(result.rows).toEqual([{ first: true, second: false }])
        })

        it('returns false for a missing message', async () => {
            const sql = `SELECT ${claim(MISSING_MESSAGE)} AS claimed`

            const result = await as(db, 'service_role', null, sql)

            expect(result.rows).toEqual([{ claimed: false }])
        })

        it.each([
            ['anon', false],
            ['authenticated', false],
            ['service_role', true],
        ] as const)('execute privilege for %s is %s', async (role, allowed) => {
            const { rows } = await db.query(canExecute(role, CLAIM_FUNCTION))

            expect(rows).toEqual([{ allowed }])
        })
    })

    // Account deletion (audit item 5) relies on the service role keeping these.
    describe('service role', () => {
        it('can update a message', async () => {
            const result = await as(db, 'service_role', null, updateColumn('body', `'edited'`))

            expect(result.rows).toEqual([{ id: OFFER }])
        })

        it('can delete a message', async () => {
            const result = await as(db, 'service_role', null, deleteOffer)

            expect(result.rows).toEqual([{ id: OFFER }])
        })
    })
})
