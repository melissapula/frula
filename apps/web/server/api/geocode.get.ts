/**
 * Free geocoding via Nominatim (OpenStreetMap).
 * Required: User-Agent header identifying the app, max ~1 request/second.
 *
 * GET /api/geocode?q=Bemidji,MN
 *   → { lat, lng, display_name }
 */

import { checkRateLimit } from '../utils/rateLimit'

interface NominatimResult {
    lat: string
    lon: string
    display_name: string
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

    const q = (getQuery(event).q as string | undefined)?.trim()
    if (!q) {
        throw createError({ statusCode: 400, statusMessage: 'Missing q parameter' })
    }

    const url =
        `https://nominatim.openstreetmap.org/search?` +
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

    if (!results?.length) {
        throw createError({ statusCode: 404, statusMessage: 'Location not found' })
    }

    const top = results[0]
    return {
        lat: parseFloat(top.lat),
        lng: parseFloat(top.lon),
        display_name: top.display_name,
    }
})
