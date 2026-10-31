import type { PGlite } from '@electric-sql/pglite'

export const SELLER = '00000000-0000-0000-0000-000000000001'
export const BUYER = '00000000-0000-0000-0000-000000000002'
export const STRANGER = '00000000-0000-0000-0000-000000000003'
export const TXN_A = '00000000-0000-0000-0000-000000000004'
export const TXN_B = '00000000-0000-0000-0000-000000000005'

export const ACTIVE_LISTING = '10000000-0000-0000-0000-000000000001'
export const DRAFT_LISTING = '10000000-0000-0000-0000-000000000002'
export const SOLD_LISTING = '10000000-0000-0000-0000-000000000003'

const PEOPLE = [
    { id: SELLER, name: 'Sam Seller', email: 'sam@example.com' },
    { id: BUYER, name: 'Bea Buyer', email: 'bea@example.com' },
    { id: STRANGER, name: 'Stan Stranger', email: 'stan@example.com' },
    { id: TXN_A, name: 'Tia Party', email: 'tia@example.com' },
    { id: TXN_B, name: 'Ty Party', email: 'ty@example.com' },
]

export async function seedPeople(db: PGlite): Promise<void> {
    for (const { id, name, email } of PEOPLE) {
        await db.query('INSERT INTO auth.users VALUES ($1, $2, $3)', [
            id,
            email,
            JSON.stringify({ full_name: name }),
        ])
    }

    await db.exec(`
      UPDATE public.profiles SET phone = '555-0100' WHERE id = '${SELLER}';
      INSERT INTO public.listings (id, user_id, status, address, city, zip, price) VALUES
        ('${ACTIVE_LISTING}', '${SELLER}', 'active', '1 Main', 'Town', '00000', 1),
        ('${DRAFT_LISTING}', '${TXN_A}', 'draft', '2 Main', 'Town', '00000', 1),
        ('${SOLD_LISTING}', '${SELLER}', 'sold', '3 Main', 'Town', '00000', 1);
      INSERT INTO public.messages (listing_id, sender_id, recipient_id, body) VALUES
        ('${ACTIVE_LISTING}', '${BUYER}', '${SELLER}', 'hi');
      INSERT INTO public.transactions (listing_id, seller_id, buyer_id) VALUES
        ('${DRAFT_LISTING}', '${TXN_A}', '${TXN_B}');
    `)
}
