/**
 * Free geocoding. Street addresses (kind=address) try the US Census geocoder first and fall back
 * to Nominatim (OpenStreetMap). Everything else, such as the browse "near" search's free text,
 * goes to Nominatim only, because Census matches street addresses and nothing looser.
 * Nominatim requires a User-Agent header identifying the app, max ~1 request/second.
 *
 * GET /api/geocode?q=Bemidji,MN
 * GET /api/geocode?q=13109 Lola Drive, Spring Hill, FL 34609&kind=address
 *   → { lat, lng, display_name, source: 'census' | 'nominatim' }
 */

import { checkRateLimit } from '../utils/rateLimit'

const QUERY_MAX_LENGTH = 200
const CENSUS_TIMEOUT_MS = 5_000
const CENSUS_BENCHMARK = 'Public_AR_Current'

type GeocodeKind = 'address' | 'place'

interface GeocodeQuery {
    q: string
    kind: GeocodeKind
}

interface GeocodeMatch {
    lat: number
    lng: number
    display_name: string
}

interface NominatimResult {
    lat: string
    lon: string
    display_name: string
}

interface CensusResponse {
    result?: {
        addressMatches?: {
            matchedAddress: string
            // x is longitude, y is latitude.
            coordinates: { x: number; y: number }
        }[]
    }
}

/** Accepts a trimmed q of 1-200 characters and kind 'address' or 'place' (the default). */
const validateGeocodeQuery = (data: unknown): GeocodeQuery => {
    const query = (data ?? {}) as Record<string, unknown>
    const q = typeof query.q === 'string' ? query.q.trim() : ''
    if (!q || q.length > QUERY_MAX_LENGTH) {
        throw new Error(`q must be 1-${QUERY_MAX_LENGTH} characters`)
    }
    const kind = query.kind ?? 'place'
    if (kind !== 'address' && kind !== 'place') {
        throw new Error("kind must be 'address' or 'place'")
    }
    return { q, kind }
}

/** Returns the Census match, or null when there is none or Census fails, so the caller falls back. */
const geocodeWithCensus = async (baseUrl: string, q: string): Promise<GeocodeMatch | null> => {
    const url =
        `${baseUrl}/geocoder/locations/onelineaddress?` +
        new URLSearchParams({ address: q, benchmark: CENSUS_BENCHMARK, format: 'json' }).toString()

    let response: CensusResponse
    try {
        response = await $fetch<CensusResponse>(url, { timeout: CENSUS_TIMEOUT_MS })
    } catch (e) {
        const status = (e as { statusCode?: number }).statusCode ?? 'no response'
        console.error('Census geocoder failed, falling back to Nominatim:', status)
        return null
    }

    const top = response?.result?.addressMatches?.[0]
    if (!top) return null
    return { lat: top.coordinates.y, lng: top.coordinates.x, display_name: top.matchedAddress }
}

/** Returns the Nominatim match or null, and throws a 502 when Nominatim fails. */
const geocodeWithNominatim = async (baseUrl: string, q: string): Promise<GeocodeMatch | null> => {
    const url =
        `${baseUrl}/search?` +
        new URLSearchParams({
            q,
            format: 'json',
            limit: '1',
            countrycodes: 'us',
            addressdetails: '0',
        }).toString()

    let results: NominatimResult[]
    try {
        results = await $fetch<NominatimResult[]>(url, {
            headers: {
                'User-Agent': 'FrulaHomes/1.0 (https://frulahomes.com)',
                Accept: 'application/json',
            },
        })
    } catch {
        throw createError({ statusCode: 502, statusMessage: 'Geocoding service unavailable' })
    }

    const top = results?.[0]
    if (!top) return null
    return { lat: parseFloat(top.lat), lng: parseFloat(top.lon), display_name: top.display_name }
}

export default defineEventHandler(async (event) => {
    // Rate limit: 10 geocode requests per minute per IP (Nominatim asks for ~1/sec)
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
    const rl = checkRateLimit(`geocode:${ip}`, 10, 60_000)
    if (!rl.allowed) {
        throw createError({
            statusCode: 429,
            statusMessage: `Too many requests. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
        })
    }

    const { q, kind } = await getValidatedQuery(event, validateGeocodeQuery)
    const config = useRuntimeConfig(event)

    if (kind === 'address') {
        const census = await geocodeWithCensus(config.censusGeocoderUrl, q)
        if (census) return { ...census, source: 'census' as const }
    }

    const nominatim = await geocodeWithNominatim(config.nominatimUrl, q)
    if (!nominatim) {
        throw createError({ statusCode: 404, statusMessage: 'Location not found' })
    }
    return { ...nominatim, source: 'nominatim' as const }
})
