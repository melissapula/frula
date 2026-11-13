import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createTestDatabase, isDenied, readAfterDelete } from './support/database'
import type { QueryResult } from './support/database'
import { ACTIVE_LISTING, BUYER, SELLER, STRANGER, seedPeople } from './support/fixtures'

// BUYER also uses ChoreQuest; STRANGER uses only Frula. Each gets a listing, messages both ways
// and a saved listing, so a close shows what goes.
const BUYER_LISTING = '10000000-0000-0000-0000-000000000010'
const STRANGER_LISTING = '10000000-0000-0000-0000-000000000011'
const SELLER_TO_BUYER = '20000000-0000-0000-0000-000000000001'
const BUYER_TO_SELLER = '20000000-0000-0000-0000-000000000002'
const SELLER_TO_STRANGER = '20000000-0000-0000-0000-000000000003'
const STRANGER_TO_SELLER = '20000000-0000-0000-0000-000000000004'

// Stands in for ChoreQuest's table (chore-app/supabase/migrations/0001_initial_schema.sql:58),
// reduced to the key that matters: it cascades from auth.users.
const CHORE_STUB = `
  CREATE SCHEMA chore;
  CREATE TABLE chore.users (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
`

async function seedFrulaActivity(db: PGlite): Promise<void> {
    await seedPeople(db)
    await db.exec(`
      UPDATE public.profiles SET phone = '555-0102', welcomed_at = NOW() WHERE id = '${BUYER}';
      INSERT INTO public.listings (id, user_id, status, address, city, zip, price) VALUES
        ('${BUYER_LISTING}', '${BUYER}', 'active', '4 Main', 'Town', '00000', 1),
        ('${STRANGER_LISTING}', '${STRANGER}', 'active', '5 Main', 'Town', '00000', 1);
      INSERT INTO public.messages (id, listing_id, sender_id, recipient_id, body) VALUES
        ('${SELLER_TO_BUYER}', '${ACTIVE_LISTING}', '${SELLER}', '${BUYER}', 'hello'),
        ('${BUYER_TO_SELLER}', '${ACTIVE_LISTING}', '${BUYER}', '${SELLER}', 'hi'),
        ('${SELLER_TO_STRANGER}', '${ACTIVE_LISTING}', '${SELLER}', '${STRANGER}', 'hello'),
        ('${STRANGER_TO_SELLER}', '${ACTIVE_LISTING}', '${STRANGER}', '${SELLER}', 'hi');
      INSERT INTO public.saved_listings (user_id, listing_id) VALUES
        ('${BUYER}', '${ACTIVE_LISTING}'),
        ('${STRANGER}', '${ACTIVE_LISTING}');
    `)
}

const closeAccount = (userId: string) => `SELECT public.close_frula_account('${userId}') AS closed`

// Calls the function, then reads, in one transaction that is rolled back. Runs as the database
// owner, like readAfterDelete; the privilege tests below cover who may call it.
async function closeThenRead(
    db: PGlite,
    userId: string,
    readSql: string,
): Promise<{ closed?: unknown; read: QueryResult }> {
    await db.exec('BEGIN')
    try {
        const { rows } = await db.query<{ closed: boolean }>(closeAccount(userId))
        const read = await db.query<Record<string, unknown>>(readSql)
        return { closed: rows[0]?.closed, read: { rows: read.rows } }
    } catch (error) {
        return { read: { error: error instanceof Error ? error.message : String(error) } }
    } finally {
        await db.exec('ROLLBACK')
    }
}

const frulaDataOf = (userId: string) => `SELECT
    EXISTS (SELECT 1 FROM public.profiles WHERE id = '${userId}') AS profile,
    EXISTS (SELECT 1 FROM public.listings WHERE user_id = '${userId}') AS listing,
    EXISTS (SELECT 1 FROM public.messages
            WHERE sender_id = '${userId}' OR recipient_id = '${userId}') AS messages,
    EXISTS (SELECT 1 FROM public.saved_listings WHERE user_id = '${userId}') AS saved,
    EXISTS (SELECT 1 FROM auth.users WHERE id = '${userId}') AS auth_user`

const expectRead = (result: { read: QueryResult }, rows: Record<string, unknown>[]) =>
    expect(result.read, JSON.stringify(result.read)).toEqual({ rows })

describe('closing a Frula account when ChoreQuest shares the project', () => {
    let db: PGlite

    beforeAll(async () => {
        db = await createTestDatabase()
        await db.exec(CHORE_STUB)
        await seedFrulaActivity(db)
        await db.exec(`INSERT INTO chore.users (id) VALUES ('${BUYER}')`)
    })

    afterAll(async () => {
        await db.close()
    })

    it('returns true and removes all Frula data for a Frula-only user', async () => {
        const result = await closeThenRead(db, STRANGER, frulaDataOf(STRANGER))

        expect(result.closed).toBe(true)
        // The function leaves auth.users to the route.
        expectRead(result, [
            { profile: false, listing: false, messages: false, saved: false, auth_user: true },
        ])
    })

    it('returns false for a ChoreQuest user and keeps their chore and auth rows', async () => {
        const result = await closeThenRead(
            db,
            BUYER,
            `SELECT EXISTS (SELECT 1 FROM chore.users WHERE id = '${BUYER}') AS chore,
                    EXISTS (SELECT 1 FROM auth.users WHERE id = '${BUYER}') AS auth_user`,
        )

        expect(result.closed).toBe(false)
        expectRead(result, [{ chore: true, auth_user: true }])
    })

    it("removes the ChoreQuest user's Frula data", async () => {
        const result = await closeThenRead(
            db,
            BUYER,
            `SELECT
               EXISTS (SELECT 1 FROM public.listings WHERE id = '${BUYER_LISTING}') AS listing,
               EXISTS (SELECT 1 FROM public.messages
                       WHERE id IN ('${SELLER_TO_BUYER}', '${BUYER_TO_SELLER}')) AS messages,
               EXISTS (SELECT 1 FROM public.saved_listings WHERE user_id = '${BUYER}') AS saved`,
        )

        expectRead(result, [{ listing: false, messages: false, saved: false }])
    })

    it('recreates a blank profile with the same id and email', async () => {
        const result = await closeThenRead(
            db,
            BUYER,
            `SELECT id, email, full_name, phone, welcomed_at, role
             FROM public.profiles WHERE id = '${BUYER}'`,
        )

        expectRead(result, [
            {
                id: BUYER,
                email: 'bea@example.com',
                full_name: null,
                phone: null,
                welcomed_at: null,
                role: 'user',
            },
        ])
    })

    it('leaves other users alone', async () => {
        const result = await closeThenRead(
            db,
            BUYER,
            `SELECT
               EXISTS (SELECT 1 FROM public.listings WHERE id = '${STRANGER_LISTING}') AS listing,
               EXISTS (SELECT 1 FROM public.messages
                       WHERE id IN ('${SELLER_TO_STRANGER}', '${STRANGER_TO_SELLER}')) AS messages,
               (SELECT count(*)::int FROM public.profiles WHERE id <> '${BUYER}') AS others`,
        )

        expectRead(result, [{ listing: true, messages: true, others: 4 }])
    })

    // Phase 2's route retries after a failed auth delete; by then the profile is gone.
    it('works when called again after the profile is already gone', async () => {
        await db.exec('BEGIN')
        try {
            await db.exec(`DELETE FROM public.profiles WHERE id IN ('${STRANGER}', '${BUYER}')`)
            const { rows } = await db.query<Record<string, unknown>>(`SELECT
                public.close_frula_account('${STRANGER}') AS frula_only,
                public.close_frula_account('${BUYER}') AS chore_user`)
            // A separate statement: one SELECT reads a single snapshot, so a count beside the
            // calls wouldn't see the profile the function inserts.
            const { rows: profiles } = await db.query<Record<string, unknown>>(
                `SELECT count(*)::int AS chore_profiles FROM public.profiles WHERE id = '${BUYER}'`,
            )

            expect([{ ...rows[0], ...profiles[0] }]).toEqual([
                { frula_only: true, chore_user: false, chore_profiles: 1 },
            ])
        } finally {
            await db.exec('ROLLBACK')
        }
    })

    // Control: shows the stub reproduces the cascade the function avoids.
    it('deleting the auth user still erases the chore row', async () => {
        const result = await readAfterDelete(
            db,
            `DELETE FROM auth.users WHERE id = '${BUYER}'`,
            `SELECT EXISTS (SELECT 1 FROM chore.users WHERE id = '${BUYER}') AS chore`,
        )

        expect(result).toEqual({ rows: [{ chore: false }] })
    })
})

describe('closing a Frula account without a chore schema', () => {
    let db: PGlite

    beforeAll(async () => {
        db = await createTestDatabase()
        await seedFrulaActivity(db)
    })

    afterAll(async () => {
        await db.close()
    })

    it('works when the chore schema does not exist', async () => {
        const result = await closeThenRead(db, BUYER, frulaDataOf(BUYER))

        expect(result.closed).toBe(true)
        expectRead(result, [
            { profile: false, listing: false, messages: false, saved: false, auth_user: true },
        ])
    })

    describe('only service_role can execute it', () => {
        it('refuses anon', async () => {
            expect(isDenied(await as(db, 'anon', null, closeAccount(BUYER)))).toBe(true)
        })

        it('refuses an authenticated user closing their own account', async () => {
            expect(isDenied(await as(db, 'authenticated', BUYER, closeAccount(BUYER)))).toBe(true)
        })

        it('allows service_role', async () => {
            expect(await as(db, 'service_role', null, closeAccount(BUYER))).toEqual({
                rows: [{ closed: true }],
            })
        })
    })
})
