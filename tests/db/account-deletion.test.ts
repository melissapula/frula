import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase, readAfterDelete } from './support/database'
import type { QueryResult } from './support/database'
import {
    ACTIVE_LISTING,
    BUYER,
    DRAFT_LISTING,
    SELLER,
    SOLD_LISTING,
    STRANGER,
    seedPeople,
} from './support/fixtures'

const DELETE_ACTIONS_MIGRATION = 'migrations/20261113_profile_delete_actions.sql'

// BUYER is the departing user. Each row below is one way a profile gets referenced.
const BUYER_LISTING = '10000000-0000-0000-0000-000000000010'
const SELLER_REPLY = '20000000-0000-0000-0000-000000000001'
const BUYER_OFFER = '20000000-0000-0000-0000-000000000002'
const STRANGER_ON_BUYER_LISTING = '20000000-0000-0000-0000-000000000003'
const STRANGER_TO_SELLER = '20000000-0000-0000-0000-000000000004'
const BUYER_PURCHASE = '30000000-0000-0000-0000-000000000001'
const FABRICATED_SALE = '30000000-0000-0000-0000-000000000002'
const SELLER_CHECKLIST = '40000000-0000-0000-0000-000000000001'
const BUYER_CHECKLIST = '40000000-0000-0000-0000-000000000002'
const BUYER_PLAN = '50000000-0000-0000-0000-000000000001'

const OFFER_PAYLOAD = { status: 'pending', offer_price: 250000, financing: 'cash' }

async function seedDepartingBuyer(db: PGlite): Promise<void> {
    await seedPeople(db)
    await db.exec(`
      INSERT INTO public.listings (id, user_id, status, address, city, zip, price) VALUES
        ('${BUYER_LISTING}', '${BUYER}', 'active', '4 Main', 'Town', '00000', 1);
      INSERT INTO public.messages (id, listing_id, sender_id, recipient_id, body, kind, payload) VALUES
        ('${SELLER_REPLY}', '${ACTIVE_LISTING}', '${SELLER}', '${BUYER}', 'hello', 'text', NULL),
        ('${BUYER_OFFER}', '${ACTIVE_LISTING}', '${BUYER}', '${SELLER}', 'offer', 'offer',
          '${JSON.stringify(OFFER_PAYLOAD)}'),
        ('${STRANGER_ON_BUYER_LISTING}', '${BUYER_LISTING}', '${STRANGER}', '${BUYER}', 'hi', 'text', NULL),
        ('${STRANGER_TO_SELLER}', '${ACTIVE_LISTING}', '${STRANGER}', '${SELLER}', 'hi', 'text', NULL);
      INSERT INTO public.transactions (id, listing_id, seller_id, buyer_id) VALUES
        ('${BUYER_PURCHASE}', '${ACTIVE_LISTING}', '${SELLER}', '${BUYER}'),
        ('${FABRICATED_SALE}', '${SOLD_LISTING}', '${BUYER}', '${STRANGER}');
      INSERT INTO public.transaction_checklists (id, transaction_id, user_id, role, items) VALUES
        ('${SELLER_CHECKLIST}', '${BUYER_PURCHASE}', '${SELLER}', 'seller', '[]'),
        ('${BUYER_CHECKLIST}', '${BUYER_PURCHASE}', '${BUYER}', 'buyer', '[]');
      INSERT INTO public.listing_plans (id, listing_id, user_id, plan, amount_cents) VALUES
        ('${BUYER_PLAN}', '${ACTIVE_LISTING}', '${BUYER}', 'basic', 0);
    `)
}

const deleteAuthUser = (userId: string) => `DELETE FROM auth.users WHERE id = '${userId}'`
const deleteProfile = (userId: string) => `DELETE FROM public.profiles WHERE id = '${userId}'`

const exists = (table: string, id: string, extra = '') =>
    `EXISTS (SELECT 1 FROM public.${table} WHERE id = '${id}'${extra})`

const expectRows = (result: QueryResult, rows: Record<string, unknown>[]) =>
    expect(result, JSON.stringify(result)).toEqual({ rows })

describe('deleting a user who has messaged, offered and transacted', () => {
    let db: PGlite

    beforeAll(async () => {
        db = await createTestDatabase()
        await seedDepartingBuyer(db)
    })

    afterAll(async () => {
        await db.close()
    })

    const afterBuyerLeaves = (readSql: string) =>
        readAfterDelete(db, deleteAuthUser(BUYER), readSql)

    it('deleting the auth user removes the profile', async () => {
        expectRows(await afterBuyerLeaves(`SELECT ${exists('profiles', BUYER)} AS profile`), [
            { profile: false },
        ])
    })

    it('deleting the profile directly succeeds', async () => {
        const result = await readAfterDelete(
            db,
            deleteProfile(BUYER),
            `SELECT ${exists('profiles', BUYER)} AS profile`,
        )

        expectRows(result, [{ profile: false }])
    })

    it('deleting a seller with only own-listing rows succeeds', async () => {
        const result = await readAfterDelete(
            db,
            deleteAuthUser(SELLER),
            `SELECT ${exists('profiles', SELLER)} AS profile`,
        )

        expectRows(result, [{ profile: false }])
    })

    it("removes the departed user's messages in both directions", async () => {
        const result = await afterBuyerLeaves(
            `SELECT id FROM public.messages
             WHERE sender_id = '${BUYER}' OR recipient_id = '${BUYER}'`,
        )

        expectRows(result, [])
    })

    it("keeps the seller's transaction with no buyer", async () => {
        const result = await afterBuyerLeaves(`SELECT
            ${exists('transactions', BUYER_PURCHASE, ' AND buyer_id IS NULL')} AS transaction,
            ${exists('transaction_checklists', SELLER_CHECKLIST)} AS seller_checklist,
            ${exists('listings', ACTIVE_LISTING)} AS listing`)

        expectRows(result, [{ transaction: true, seller_checklist: true, listing: true }])
    })

    it("removes the departed user's checklist, listing plans and fabricated seller transactions", async () => {
        const result = await afterBuyerLeaves(`SELECT
            ${exists('transaction_checklists', BUYER_CHECKLIST)} AS checklist,
            ${exists('listing_plans', BUYER_PLAN)} AS plan,
            ${exists('transactions', FABRICATED_SALE)} AS fabricated_sale`)

        expectRows(result, [{ checklist: false, plan: false, fabricated_sale: false }])
    })

    it("leaves other users' messages and listings alone", async () => {
        const result = await afterBuyerLeaves(`SELECT
            ${exists('messages', STRANGER_TO_SELLER)} AS stranger_to_seller,
            ${exists('listings', ACTIVE_LISTING)} AS active_listing,
            ${exists('listings', DRAFT_LISTING)} AS draft_listing,
            ${exists('listings', SOLD_LISTING)} AS sold_listing,
            (SELECT count(*)::int FROM public.transactions WHERE listing_id = '${DRAFT_LISTING}')
              AS draft_transactions,
            (SELECT count(*)::int FROM public.profiles) AS profiles,
            ${exists('listings', BUYER_LISTING)} AS buyer_listing,
            ${exists('messages', STRANGER_ON_BUYER_LISTING)} AS stranger_on_buyer_listing`)

        expectRows(result, [
            {
                stranger_to_seller: true,
                active_listing: true,
                draft_listing: true,
                sold_listing: true,
                draft_transactions: 1,
                profiles: 4,
                // These go with BUYER's own listing.
                buyer_listing: false,
                stranger_on_buyer_listing: false,
            },
        ])
    })
})

describe('before the delete actions migration', () => {
    let db: PGlite

    beforeAll(async () => {
        db = await createTestDatabase({ without: [DELETE_ACTIONS_MIGRATION] })
        await seedDepartingBuyer(db)
    })

    afterAll(async () => {
        await db.close()
    })

    // Every row referencing SELLER sits on SELLER's own listings, and the listing cascade would
    // remove them. It still fails: Postgres queues the cascaded message deletes behind the
    // NO ACTION check on profiles, so the check still sees the messages.
    it('a seller with only own-listing rows also fails today', async () => {
        const result = await readAfterDelete(db, deleteAuthUser(SELLER), 'SELECT 1')

        expect(result.error).toMatch(/violates foreign key constraint/)
    })

    // Control: shows the tests above can fail, so their passing means something.
    it('without the migration, the same delete fails on a foreign key', async () => {
        const result = await readAfterDelete(db, deleteAuthUser(BUYER), 'SELECT 1')

        expect(result.error).toMatch(/violates foreign key constraint/)
    })
})
