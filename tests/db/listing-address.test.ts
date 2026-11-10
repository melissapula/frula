import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { US_STATES } from '../../apps/web/app/composables/useStates'
import { as, createTestDatabase } from './support/database'
import type { QueryResult } from './support/database'
import { ACTIVE_LISTING, SELLER, seedPeople } from './support/fixtures'

const GOOD_ADDRESS = {
    address: '9 Oak St',
    city: 'St. Paul',
    state: 'MN',
    zip: '12345-6789',
}

type AddressColumn = keyof typeof GOOD_ADDRESS

// label, column, value and the constraint expected to reject it
const BAD_VALUES: [string, AddressColumn, string, string][] = [
    ['a four-digit ZIP', 'zip', '1234', 'listings_zip_format'],
    ['a letter ZIP', 'zip', 'ABCDE', 'listings_zip_format'],
    ['a short ZIP+4', 'zip', '12345-12', 'listings_zip_format'],
    ['an unknown state', 'state', 'XX', 'listings_state_code'],
    ['a lowercase state', 'state', 'mn', 'listings_state_code'],
    ['a comma in the city', 'city', 'Tecopa, CA', 'listings_city_no_comma'],
    ['a padded address', 'address', ' 1 Main', 'listings_address_trimmed'],
    ['a padded city', 'city', 'Town ', 'listings_city_trimmed'],
    ['a 101-character address', 'address', `1 ${'a'.repeat(99)}`, 'listings_address_length'],
]

const violates = (result: QueryResult, constraint: string) =>
    expect(result.error ?? '', JSON.stringify(result)).toMatch(
        `violates check constraint "${constraint}"`,
    )

const insertListing = (fields: Partial<typeof GOOD_ADDRESS> = {}) => {
    const { address, city, state, zip } = { ...GOOD_ADDRESS, ...fields }

    return `INSERT INTO public.listings (user_id, address, city, state, zip, price)
        VALUES ('${SELLER}', '${address}', '${city}', '${state}', '${zip}', 1)
        RETURNING id`
}

const updateListing = (column: AddressColumn, value: string) =>
    `UPDATE public.listings SET ${column} = '${value}' WHERE id = '${ACTIVE_LISTING}' RETURNING id`

describe('listing address rules', () => {
    let db: PGlite

    beforeAll(async () => {
        db = await createTestDatabase()
        await seedPeople(db)
    })

    afterAll(async () => {
        await db.close()
    })

    it.each(BAD_VALUES)(
        'owner insert is rejected: %s',
        async (_label, column, value, constraint) => {
            const result = await as(db, 'authenticated', SELLER, insertListing({ [column]: value }))

            violates(result, constraint)
        },
    )

    it.each(BAD_VALUES)(
        'owner update is rejected: %s',
        async (_label, column, value, constraint) => {
            const result = await as(db, 'authenticated', SELLER, updateListing(column, value))

            violates(result, constraint)
        },
    )

    it('accepts a well-formed address', async () => {
        const result = await as(db, 'authenticated', SELLER, insertListing())

        expect(result.rows, JSON.stringify(result)).toHaveLength(1)
    })

    // Drift guard: the constraint's state list is a copy of US_STATES.
    it.each(US_STATES.map(({ code }) => code))('accepts state %s', async (state) => {
        const result = await as(db, 'authenticated', SELLER, insertListing({ state }))

        expect(result.rows, JSON.stringify(result)).toHaveLength(1)
    })
})
