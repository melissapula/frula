// Decides what the sell form writes to a listing's lat/lng. Pure, so the unit tests can import
// it outside Nuxt; that's why address.ts comes in by relative path.
import { type AddressFields, normalizeAddress } from './address'

export type GeocodePlan = 'geocode' | 'keep'

export interface SaveSituation {
    isEdit: boolean
    isAddressChanged: boolean
    hasExistingPin: boolean
}

export interface CoordinateMatch {
    lat: number
    lng: number
}

/**
 * The lat/lng part of the listing payload. `{}` leaves the stored values alone. Clearing also
 * nulls `location`, because the sync trigger skips null coordinates and would keep the old point.
 */
export type CoordinateFragment =
    | Record<string, never>
    | CoordinateMatch
    | { lat: null; lng: null; location: null }

const CLEARED_COORDINATES = { lat: null, lng: null, location: null } as const

/** 'keep' only for an edit whose address is unchanged and already pinned. */
export function planGeocode({
    isEdit,
    isAddressChanged,
    hasExistingPin,
}: SaveSituation): GeocodePlan {
    return isEdit && !isAddressChanged && hasExistingPin ? 'keep' : 'geocode'
}

/** Coordinates to save, given the geocode match (null when nothing matched or it wasn't run). */
export function coordinatesForSave(
    situation: SaveSituation & { match: CoordinateMatch | null },
): CoordinateFragment {
    const { match, ...rest } = situation
    if (planGeocode(rest) === 'keep') return {}
    if (match) return { lat: match.lat, lng: match.lng }
    // An unchanged address that was already unpinned has nothing to clear.
    if (rest.isEdit && !rest.isAddressChanged) return {}
    return { ...CLEARED_COORDINATES }
}

/** Same place after normalizing; street and city ignore case, like the dedupe index. */
export function isSameAddress(a: Readonly<AddressFields>, b: Readonly<AddressFields>): boolean {
    const left = normalizeAddress(a)
    const right = normalizeAddress(b)
    return (
        left.address.toLowerCase() === right.address.toLowerCase() &&
        left.city.toLowerCase() === right.city.toLowerCase() &&
        left.state === right.state &&
        left.zip === right.zip
    )
}
