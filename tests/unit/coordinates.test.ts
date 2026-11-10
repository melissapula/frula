import { describe, expect, it } from 'vitest'
import type { AddressFields } from '../../apps/web/app/utils/address'
import {
    coordinatesForSave,
    isSameAddress,
    planGeocode,
} from '../../apps/web/app/utils/coordinates'

const MATCH = { lat: 28.4709, lng: -82.5332 }
const CLEARED = { lat: null, lng: null, location: null }

const NEW_LISTING = { isEdit: false, isAddressChanged: true, hasExistingPin: false }
const EDIT_UNCHANGED_PINNED = { isEdit: true, isAddressChanged: false, hasExistingPin: true }
const EDIT_UNCHANGED_UNPINNED = { isEdit: true, isAddressChanged: false, hasExistingPin: false }
const EDIT_CHANGED = { isEdit: true, isAddressChanged: true, hasExistingPin: true }

describe('planGeocode', () => {
    it.each([
        ['a new listing', NEW_LISTING, 'geocode'],
        ['an edit with the address unchanged and a pin', EDIT_UNCHANGED_PINNED, 'keep'],
        ['an edit with the address unchanged and no pin', EDIT_UNCHANGED_UNPINNED, 'geocode'],
        ['an edit with the address changed', EDIT_CHANGED, 'geocode'],
    ] as const)('plans %s', (_label, situation, expected) => {
        expect(planGeocode(situation)).toBe(expected)
    })
})

describe('coordinatesForSave', () => {
    it.each([
        ['a new listing with a match', NEW_LISTING, MATCH, MATCH],
        ['a new listing with no match', NEW_LISTING, null, CLEARED],
        ['an unchanged, pinned edit', EDIT_UNCHANGED_PINNED, null, {}],
        ['an unchanged, unpinned edit with a match', EDIT_UNCHANGED_UNPINNED, MATCH, MATCH],
        ['an unchanged, unpinned edit with no match', EDIT_UNCHANGED_UNPINNED, null, {}],
        ['a changed edit with a match', EDIT_CHANGED, MATCH, MATCH],
        ['a changed edit with no match', EDIT_CHANGED, null, CLEARED],
    ] as const)('saves %s', (_label, situation, match, expected) => {
        expect(coordinatesForSave({ ...situation, match })).toEqual(expected)
    })

    it('keeps the stored pin on an unchanged edit even if a match is passed', () => {
        expect(coordinatesForSave({ ...EDIT_UNCHANGED_PINNED, match: MATCH })).toEqual({})
    })
})

describe('isSameAddress', () => {
    const STORED: AddressFields = {
        address: '13109 Lola Drive',
        city: 'Spring Hill',
        state: 'FL',
        zip: '34609',
    }

    it('ignores case and padding', () => {
        const typed = {
            address: ' 13109  lola drive ',
            city: 'SPRING HILL ',
            state: 'fl',
            zip: ' 34609',
        }

        expect(isSameAddress(STORED, typed)).toBe(true)
    })

    it.each([
        ['street', { ...STORED, address: '13111 Lola Drive' }],
        ['city', { ...STORED, city: 'Brooksville' }],
        ['state', { ...STORED, state: 'GA' }],
        ['ZIP', { ...STORED, zip: '34610' }],
    ])('reports a different %s as a change', (_label, other) => {
        expect(isSameAddress(STORED, other)).toBe(false)
    })
})
