import { describe, expect, it } from 'vitest'
import { US_STATES } from '../../apps/web/app/composables/useStates'
import {
    type AddressFields,
    hasAddressErrors,
    normalizeAddress,
    validateAddress,
} from '../../apps/web/app/utils/address'

const VALID: AddressFields = {
    address: '13109 Lola Drive',
    city: 'Spring Hill',
    state: 'FL',
    zip: '34609',
}

const withField = (field: keyof AddressFields, value: string): AddressFields => ({
    ...VALID,
    [field]: value,
})

describe('normalizeAddress', () => {
    it.each([
        ['trailing space', '13109 Lola Drive ', '13109 Lola Drive'],
        ['leading and repeated spaces', '  13109   Lola  Drive', '13109 Lola Drive'],
        ['trailing comma', '114 Saddle Lake Dr,', '114 Saddle Lake Dr'],
        ['trailing comma and space', '114 Saddle Lake Dr, ', '114 Saddle Lake Dr'],
    ])('cleans the street: %s', (_label, input, expected) => {
        expect(normalizeAddress(withField('address', input)).address).toBe(expected)
    })

    it.each([
        ['trailing comma', 'Alabaster,', 'Alabaster'],
        ['padding and repeated spaces', ' Spring   Hill ', 'Spring Hill'],
    ])('cleans the city: %s', (_label, input, expected) => {
        expect(normalizeAddress(withField('city', input)).city).toBe(expected)
    })

    it('uppercases and trims the state, and trims the ZIP', () => {
        const result = normalizeAddress({ ...VALID, state: ' fl ', zip: ' 34609 ' })

        expect(result.state).toBe('FL')
        expect(result.zip).toBe('34609')
    })

    it('leaves the input object unchanged', () => {
        const input = { address: ' 1 Main St, ', city: 'Town, ', state: 'mn', zip: ' 12345 ' }
        const snapshot = { ...input }

        normalizeAddress(input)

        expect(input).toEqual(snapshot)
    })
})

describe('validateAddress', () => {
    it('accepts a well-formed address', () => {
        const errors = validateAddress(VALID)

        expect(errors).toEqual({})
        expect(hasAddressErrors(errors)).toBe(false)
    })

    it.each(['34609', '34609-1234'])('accepts ZIP %s', (zip) => {
        expect(validateAddress(withField('zip', zip)).zip).toBeUndefined()
    })

    it.each(['1234', '123456', '12345-12', 'ABCDE'])('rejects ZIP %s', (zip) => {
        const errors = validateAddress(withField('zip', zip))

        expect(errors.zip).toBeTruthy()
        expect(hasAddressErrors(errors)).toBe(true)
    })

    it.each([
        ['a comma', 'Tecopa, CA'],
        ['a trailing state code', 'Tecopa CA'],
        ['a digit', 'Spring Hill 2'],
    ])('rejects a city with %s', (_label, city) => {
        expect(validateAddress(withField('city', city)).city).toBeTruthy()
    })

    it('points a city ending in a state code at the state menu', () => {
        expect(validateAddress(withField('city', 'Tecopa CA')).city).toMatch(/state/i)
    })

    it.each(['Winston-Salem', 'St. Paul', "Coeur d'Alene", "O'Fallon"])(
        'accepts city %s',
        (city) => {
            expect(validateAddress(withField('city', city)).city).toBeUndefined()
        },
    )

    it.each([
        ['no letter', '12345'],
        ['over 100 characters', `1 ${'A'.repeat(99)}`],
    ])('rejects a street with %s', (_label, address) => {
        expect(validateAddress(withField('address', address)).address).toBeTruthy()
    })

    it('accepts a street of exactly 100 characters', () => {
        const address = `1 ${'A'.repeat(98)}`

        expect(validateAddress(withField('address', address)).address).toBeUndefined()
    })

    it('rejects an unknown state code', () => {
        expect(validateAddress(withField('state', 'XX')).state).toBeTruthy()
    })

    it.each(US_STATES.map((s) => s.code))('accepts state %s', (state) => {
        expect(validateAddress(withField('state', state)).state).toBeUndefined()
    })

    it.each(['address', 'city', 'state', 'zip'] as const)(
        'reports %s as required when empty',
        (field) => {
            expect(validateAddress(withField(field, ''))[field]).toMatch(/required/i)
        },
    )
})
