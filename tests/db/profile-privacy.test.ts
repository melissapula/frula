import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createTestDatabase, isDenied } from './support/database'
import type { QueryResult, Role } from './support/database'
import { BUYER, SELLER, STRANGER, TXN_A, TXN_B, seedPeople } from './support/fixtures'

const HIDDEN_COLUMNS = ['email', 'phone', 'role', 'welcomed_at', 'updated_at']
const NEW_USER = '00000000-0000-0000-0000-000000000006'
const BLANK_USER = '00000000-0000-0000-0000-000000000007'

const expectDenied = (result: QueryResult) =>
    expect(isDenied(result), JSON.stringify(result)).toBe(true)

const profileOf = (userId: string) =>
    `SELECT id, full_name FROM public.profiles WHERE id = '${userId}'`

describe('profile privacy', () => {
    let db: PGlite

    beforeAll(async () => {
        db = await createTestDatabase()
        await seedPeople(db)
    })

    afterAll(async () => {
        await db.close()
    })

    describe('hidden columns', () => {
        it.each(HIDDEN_COLUMNS)('anon denied %s', async (column) => {
            const sql = `SELECT ${column} FROM public.profiles WHERE id = '${SELLER}'`

            expectDenied(await as(db, 'anon', null, sql))
        })

        it.each(HIDDEN_COLUMNS)("authenticated denied another user's %s", async (column) => {
            const sql = `SELECT ${column} FROM public.profiles WHERE id = '${SELLER}'`

            expectDenied(await as(db, 'authenticated', STRANGER, sql))
        })

        it.each(HIDDEN_COLUMNS)('authenticated denied own %s', async (column) => {
            const sql = `SELECT ${column} FROM public.profiles WHERE id = '${BUYER}'`

            expectDenied(await as(db, 'authenticated', BUYER, sql))
        })

        it.each<[Role, string | null]>([
            ['anon', null],
            ['authenticated', BUYER],
        ])('%s denied select *', async (role, userId) => {
            expectDenied(await as(db, role, userId, 'SELECT * FROM public.profiles'))
        })

        it('anon cannot filter on email', async () => {
            const sql = `SELECT id FROM public.profiles WHERE email = 'sam@example.com'`

            expectDenied(await as(db, 'anon', null, sql))
        })

        it('the old app query (with email) is denied', async () => {
            const sql = 'SELECT id, full_name, email FROM public.profiles'

            expectDenied(await as(db, 'authenticated', BUYER, sql))
        })
    })

    describe('reads', () => {
        it('seller page read works for anon', async () => {
            const sql = `SELECT id, full_name, created_at FROM public.profiles WHERE id = '${SELLER}'`

            const result = await as(db, 'anon', null, sql)

            expect(result.rows?.[0]?.full_name).toBe('Sam Seller')
        })

        it('inbox query returns both people', async () => {
            const sql = `SELECT id, full_name FROM public.profiles WHERE id IN ('${SELLER}', '${BUYER}')`

            const result = await as(db, 'authenticated', BUYER, sql)

            expect(result.rows).toHaveLength(2)
        })

        it('transaction query returns both parties', async () => {
            const sql = `SELECT id, full_name FROM public.profiles WHERE id IN ('${TXN_A}', '${TXN_B}')`

            const result = await as(db, 'authenticated', TXN_A, sql)

            expect(result.rows).toHaveLength(2)
        })
    })

    describe('rows', () => {
        it('anon gets no row for a non-seller', async () => {
            const result = await as(db, 'anon', null, profileOf(STRANGER))

            expect(result.rows).toHaveLength(0)
        })

        it('anon lists only the active seller', async () => {
            const result = await as(db, 'anon', null, 'SELECT id FROM public.profiles')

            expect(result.rows).toEqual([{ id: SELLER }])
        })

        it('no thread, no row', async () => {
            const result = await as(db, 'authenticated', STRANGER, profileOf(BUYER))

            expect(result.rows).toHaveLength(0)
        })

        it('seller sees buyer once a message exists', async () => {
            const result = await as(db, 'authenticated', SELLER, profileOf(BUYER))

            expect(result.rows).toHaveLength(1)
        })

        it('a user gets their own row', async () => {
            const result = await as(db, 'authenticated', STRANGER, profileOf(STRANGER))

            expect(result.rows?.[0]?.full_name).toBe('Stan Stranger')
        })
    })

    describe('writes', () => {
        it.each([
            ['role', `UPDATE public.profiles SET role = 'admin' WHERE id = '${BUYER}'`],
            ['email', `UPDATE public.profiles SET email = 'x@y.z' WHERE id = '${BUYER}'`],
            ['full_name', `UPDATE public.profiles SET full_name = 'x' WHERE id = '${BUYER}'`],
            ['delete', `DELETE FROM public.profiles WHERE id = '${BUYER}'`],
        ])('user write denied: %s', async (_name, sql) => {
            expectDenied(await as(db, 'authenticated', BUYER, sql))
        })
    })

    describe('service role', () => {
        it('reads all rows and contact columns', async () => {
            const sql = `SELECT id, email, phone, role FROM public.profiles
                WHERE id IN ('${SELLER}', '${BUYER}', '${STRANGER}', '${TXN_A}', '${TXN_B}')`

            const result = await as(db, 'service_role', null, sql)

            expect(result.rows).toHaveLength(5)
            expect(result.rows).toContainEqual(
                expect.objectContaining({
                    id: SELLER,
                    email: 'sam@example.com',
                    phone: '555-0100',
                }),
            )
        })

        it('can set welcomed_at', async () => {
            const sql = `UPDATE public.profiles SET welcomed_at = NOW() WHERE id = '${BUYER}' RETURNING id`

            const result = await as(db, 'service_role', null, sql)

            expect(result.rows).toHaveLength(1)
        })
    })

    describe('signup', () => {
        // Rolls back so the new user can't affect any other test.
        async function signUp(userId: string, email: string, metadata: object) {
            await db.exec('BEGIN')
            try {
                await db.query('INSERT INTO auth.users VALUES ($1, $2, $3)', [
                    userId,
                    email,
                    JSON.stringify(metadata),
                ])
                const { rows } = await db.query<{ full_name: string | null }>(
                    'SELECT full_name FROM public.profiles WHERE id = $1',
                    [userId],
                )
                return rows
            } finally {
                await db.exec('ROLLBACK')
            }
        }

        it('copies the name', async () => {
            const rows = await signUp(NEW_USER, 'new@example.com', { full_name: ' New Person ' })

            expect(rows).toEqual([{ full_name: 'New Person' }])
        })

        it('still works with no name', async () => {
            const rows = await signUp(BLANK_USER, 'blank@example.com', {})

            expect(rows).toEqual([{ full_name: null }])
        })
    })
})
