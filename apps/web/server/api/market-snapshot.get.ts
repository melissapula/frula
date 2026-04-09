/**
 * GET /api/market-snapshot?listingId=xxx
 *
 * Returns a "market snapshot" for a listing — informational market context
 * combining:
 *   1. ZIP-level median home value + YoY trend (from zip_market_data,
 *      sourced from Zillow Research ZHVI)
 *   2. Nearby active Frula listings within a 5-mile radius (via the
 *      existing PostGIS RPC)
 *   3. Computed comparisons (this listing vs. ZIP median, vs. nearby
 *      Frula median, etc.)
 *
 * Designed to gracefully degrade: if ZIP data isn't loaded yet, the
 * snapshot still returns the nearby-listings portion. If the listing
 * has no lat/lng, the nearby portion is skipped. The endpoint never
 * 500s on missing data — always returns SOME useful information.
 *
 * IMPORTANT: this is informational market context, not a CMA or
 * appraisal. The page that consumes this data must include the
 * required disclaimers and Zillow attribution.
 */

import { serverSupabaseClient } from '#supabase/server'

interface ListingRow {
    id: string
    address: string
    city: string
    state: string
    zip: string
    lat: number | null
    lng: number | null
    price: number
    sqft: number | null
    beds: number | null
    full_baths: number | null
    property_type: string
    listing_photos?: { url: string; is_primary: boolean }[]
}

interface ZipDataRow {
    zip: string
    median_home_value: number | null
    yoy_change_pct: number | null
    data_month: string | null
    city: string | null
    state: string | null
    data_source: string
}

interface NearbyComp {
    id: string
    address: string
    city: string
    state: string
    price: number
    sqft: number | null
    beds: number | null
    full_baths: number | null
    distance_miles: number
    price_per_sqft: number | null
    photo_url: string | null
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const listingId = query.listingId as string | undefined
    if (!listingId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing listingId' })
    }

    const supabase = await serverSupabaseClient(event)

    // 1. Pull the listing
    const { data: listing, error: listingErr } = await supabase
        .from('listings')
        .select(
            `id, address, city, state, zip, lat, lng, price, sqft, beds,
             full_baths, property_type,
             listing_photos ( url, is_primary )`,
        )
        .eq('id', listingId)
        .maybeSingle<ListingRow>()

    if (listingErr || !listing) {
        throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    // 2. Pull ZIP market data (may not exist yet — that's fine)
    const cleanZip = listing.zip.trim().slice(0, 5)
    const { data: zipData } = await supabase
        .from('zip_market_data')
        .select('*')
        .eq('zip', cleanZip)
        .maybeSingle<ZipDataRow>()

    // 3. Pull nearby Frula listings via PostGIS radius RPC.
    //    We use a 5-mile radius and exclude the current listing.
    let nearbyComps: NearbyComp[] = []
    if (listing.lat != null && listing.lng != null) {
        const { data: idRows } = await supabase.rpc('listing_ids_in_radius', {
            center_lat: listing.lat,
            center_lng: listing.lng,
            radius_miles: 5,
        })
        const rows = (idRows ?? []) as { id: string; distance_meters: number }[]
        const distanceById = new Map(rows.map((r) => [r.id, r.distance_meters]))
        const otherIds = rows.map((r) => r.id).filter((id) => id !== listing.id)

        if (otherIds.length) {
            const { data: compRows } = await supabase
                .from('listings')
                .select(
                    `id, address, city, state, price, sqft, beds, full_baths,
                     listing_photos ( url, is_primary )`,
                )
                .in('id', otherIds)
                .eq('status', 'active')
                .limit(20)

            nearbyComps = (compRows ?? [])
                .map((c) => {
                    const photos =
                        (c.listing_photos as { url: string; is_primary: boolean }[]) ?? []
                    const primary = photos.find((p) => p.is_primary)?.url ?? photos[0]?.url ?? null
                    const meters = distanceById.get(c.id) ?? 0
                    return {
                        id: c.id as string,
                        address: c.address as string,
                        city: c.city as string,
                        state: c.state as string,
                        price: c.price as number,
                        sqft: c.sqft as number | null,
                        beds: c.beds as number | null,
                        full_baths: c.full_baths as number | null,
                        distance_miles: Math.round((meters / 1609.344) * 10) / 10,
                        price_per_sqft: c.sqft
                            ? Math.round((c.price as number) / (c.sqft as number))
                            : null,
                        photo_url: primary,
                    }
                })
                .sort((a, b) => a.distance_miles - b.distance_miles)
        }
    }

    // 4. Computed comparisons
    const listingPricePerSqft = listing.sqft ? Math.round(listing.price / listing.sqft) : null

    // Median price per sqft of the nearby Frula comps (if we have enough)
    let nearbyMedianPricePerSqft: number | null = null
    if (nearbyComps.length >= 3) {
        const ppsftValues = nearbyComps
            .map((c) => c.price_per_sqft)
            .filter((v): v is number => v != null)
            .sort((a, b) => a - b)
        if (ppsftValues.length) {
            nearbyMedianPricePerSqft = ppsftValues[Math.floor(ppsftValues.length / 2)]!
        }
    }

    // Listing's price vs the ZIP median (if we have it)
    let priceVsZipMedianPct: number | null = null
    if (zipData?.median_home_value) {
        priceVsZipMedianPct = Math.round(
            ((listing.price - zipData.median_home_value) / zipData.median_home_value) * 100,
        )
    }

    return {
        listing: {
            id: listing.id,
            address: listing.address,
            city: listing.city,
            state: listing.state,
            zip: cleanZip,
            price: listing.price,
            sqft: listing.sqft,
            price_per_sqft: listingPricePerSqft,
        },
        zipMarket: zipData
            ? {
                  zip: zipData.zip,
                  median_home_value: zipData.median_home_value,
                  yoy_change_pct: zipData.yoy_change_pct,
                  data_month: zipData.data_month,
                  data_source: zipData.data_source,
                  loaded: true,
              }
            : { zip: cleanZip, loaded: false },
        nearby: {
            comps: nearbyComps,
            median_price_per_sqft: nearbyMedianPricePerSqft,
            count: nearbyComps.length,
        },
        comparisons: {
            price_vs_zip_median_pct: priceVsZipMedianPct,
        },
    }
})
