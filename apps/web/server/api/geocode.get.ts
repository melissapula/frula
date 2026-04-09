/**
 * Free geocoding via Nominatim (OpenStreetMap).
 * Required: User-Agent header identifying the app, max ~1 request/second.
 *
 * GET /api/geocode?q=Bemidji,MN
 *   → { lat, lng, display_name }
 */

interface NominatimResult {
    lat: string
    lon: string
    display_name: string
}

export default defineEventHandler(async (event) => {
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
