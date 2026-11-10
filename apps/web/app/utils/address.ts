// Format rules for the sell form's address fields. Pure, so the unit tests can
// import it outside Nuxt; that's why US_STATES comes in by relative path.
import { US_STATES } from '../composables/useStates'

export const ZIP_PATTERN = /^\d{5}(-\d{4})?$/
export const ADDRESS_MAX_LENGTH = 100
/** A city whose last word is two capitals, like "Tecopa CA", has the state typed into it. */
export const CITY_ENDS_IN_STATE_PATTERN = /\s[A-Z]{2}$/

export const REQUIRED_MESSAGE = 'Required.'
export const ZIP_MESSAGE = 'Enter a 5-digit ZIP, or ZIP+4 like 12345-6789.'
export const CITY_COMMA_MESSAGE = 'Enter only the city name, without a comma.'
export const CITY_DIGIT_MESSAGE = "City names don't contain numbers."
export const CITY_STATE_MESSAGE = 'Enter only the city name, and pick the state from the menu.'
export const ADDRESS_LENGTH_MESSAGE = `Keep the street address to ${ADDRESS_MAX_LENGTH} characters or fewer.`
export const ADDRESS_LETTER_MESSAGE = 'Include the street name, not just the number.'
export const STATE_MESSAGE = 'Pick a state from the menu.'

const STATE_CODES = new Set(US_STATES.map((s) => s.code))

export interface AddressFields {
    address: string
    city: string
    state: string
    zip: string
}

export type AddressErrors = Partial<Record<keyof AddressFields, string>>

/** Collapses whitespace runs, trims, and drops trailing commas. */
function cleanText(value: string): string {
    return value
        .replace(/\s+/g, ' ')
        .replace(/[,\s]+$/, '')
        .trim()
}

/** New, cleaned values; the input is left alone. Matches the dedupe index's trim. */
export function normalizeAddress(fields: Readonly<AddressFields>): AddressFields {
    return {
        address: cleanText(fields.address),
        city: cleanText(fields.city),
        state: fields.state.trim().toUpperCase(),
        zip: fields.zip.trim(),
    }
}

/** One message per failing field. Expects values from `normalizeAddress`. */
export function validateAddress(fields: Readonly<AddressFields>): AddressErrors {
    return {
        ...pick('address', addressError(fields.address)),
        ...pick('city', cityError(fields.city)),
        ...pick('state', stateError(fields.state)),
        ...pick('zip', zipError(fields.zip)),
    }
}

/** True when any field has a message. */
export function hasAddressErrors(errors: AddressErrors): boolean {
    return Object.keys(errors).length > 0
}

function pick(field: keyof AddressFields, message: string | null): AddressErrors {
    return message ? { [field]: message } : {}
}

function addressError(address: string): string | null {
    if (!address) return REQUIRED_MESSAGE
    if (address.length > ADDRESS_MAX_LENGTH) return ADDRESS_LENGTH_MESSAGE
    if (!/\p{L}/u.test(address)) return ADDRESS_LETTER_MESSAGE
    return null
}

function cityError(city: string): string | null {
    if (!city) return REQUIRED_MESSAGE
    if (city.includes(',')) return CITY_COMMA_MESSAGE
    if (/\d/.test(city)) return CITY_DIGIT_MESSAGE
    if (CITY_ENDS_IN_STATE_PATTERN.test(city)) return CITY_STATE_MESSAGE
    return null
}

function stateError(state: string): string | null {
    if (!state) return REQUIRED_MESSAGE
    return STATE_CODES.has(state) ? null : STATE_MESSAGE
}

function zipError(zip: string): string | null {
    if (!zip) return REQUIRED_MESSAGE
    return ZIP_PATTERN.test(zip) ? null : ZIP_MESSAGE
}
