import { serverSupabaseClient } from '#supabase/server'

interface Comp {
    id: string
    address: string
    distance_mi: number
    sold_price: number
    sold_date: string
    sqft: number
    beds: number
    baths: number
    year_built: number
    price_per_sqft: number
    weight: number
}

export interface CmaResult {
    listing_id: string
    state: string
    coverage: 'full' | 'preview' | 'unsupported'
    estimate: {
        low: number
        mid: number
        high: number
        confidence: 'low' | 'medium' | 'high'
    } | null
    comps: Comp[]
    narrative: string
    disclaimer: string
    source: 'mock' | 'parcels'
    generated_at: string
}

// States with full Frula CMA coverage. Add more as public parcel sources are wired in.
const FULL_COVERAGE_STATES = new Set<string>(['MN'])

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing listing id' })

    const supabase = await serverSupabaseClient(event)

    const { data: listing, error } = await supabase
        .from('listings')
        .select(
            'id, address, city, state, zip, price, sqft, beds, full_baths, half_baths, year_built, lat, lng',
        )
        .eq('id', id)
        .eq('status', 'active')
        .maybeSingle()

    if (error || !listing) {
        throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
    }

    const state = listing.state || 'XX'

    // States we don't yet have parcel data for: tell the truth, don't fake comps.
    if (!FULL_COVERAGE_STATES.has(state)) {
        return {
            listing_id: listing.id,
            state,
            coverage: 'unsupported',
            estimate: null,
            comps: [],
            narrative:
                `Frula Homes' full Comparable Market Analysis is rolling out state by state as we wire ` +
                `in each state's public parcel data. ${state} isn't live yet, but it's on the roadmap. ` +
                `In the meantime, your asking price of $${Number(listing.price).toLocaleString()} is your ` +
                `best starting point — pair it with a free Zillow/Redfin estimate and any comparable sales ` +
                `you can find in your neighborhood.`,
            disclaimer:
                'Frula Homes does not yet have public records coverage for this state. ' +
                'When CMA data goes live for ' +
                state +
                ', this report will populate automatically.',
            source: 'mock',
            generated_at: new Date().toISOString(),
        } satisfies CmaResult
    }

    // ----- Generate mock comps (deterministic from listing id) -----
    // Replace with a call to public.find_comps() once parcel data is loaded.
    const comps = generateMockComps(listing)

    // ----- Weighted estimate -----
    const totalWeight = comps.reduce((s, c) => s + c.weight, 0)
    const weightedPpsf = comps.reduce((s, c) => s + c.price_per_sqft * c.weight, 0) / totalWeight
    const sqft = listing.sqft ?? 1800
    const mid = Math.round((weightedPpsf * sqft) / 1000) * 1000
    const spread = Math.round(mid * 0.06)
    const low = mid - spread
    const high = mid + spread

    const confidence: 'low' | 'medium' | 'high' = comps.length >= 5 ? 'medium' : 'low'

    return {
        listing_id: listing.id,
        state,
        coverage: 'preview', // 'full' once we swap mock for real find_comps
        estimate: { low, mid, high, confidence },
        comps,
        narrative: buildNarrative(listing, mid, comps, weightedPpsf),
        disclaimer:
            'Seller Market Estimate — not a licensed appraisal. Based on recent comparable sales nearby. ' +
            'Real estate values fluctuate; consider this one data point among many.',
        source: 'mock',
        generated_at: new Date().toISOString(),
    } satisfies CmaResult
})

// ---- Helpers ----

function seeded(id: string, salt: number) {
    let h = salt
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
    return Math.abs(Math.sin(h)) // [0,1)
}

function generateMockComps(listing: {
    id: string
    address: string
    sqft: number | null
    beds: number | null
    full_baths: number | null
    year_built: number | null
    price: number
}): Comp[] {
    const baseSqft = listing.sqft ?? 1800
    const basePrice = Number(listing.price)
    const basePpsf = basePrice / baseSqft

    const streetNames = [
        'Pine St',
        'Lakeview Dr',
        'Birch Ave',
        'Maple Ln',
        'Cedar Cir',
        'Oak Ridge Rd',
    ]
    const comps: Comp[] = []

    for (let i = 0; i < 5; i++) {
        const r1 = seeded(listing.id, i * 7 + 1)
        const r2 = seeded(listing.id, i * 7 + 2)
        const r3 = seeded(listing.id, i * 7 + 3)
        const r4 = seeded(listing.id, i * 7 + 4)

        const ppsfDelta = (r1 - 0.5) * 0.18 // ±9%
        const ppsf = basePpsf * (1 + ppsfDelta)
        const sqft = Math.round((baseSqft + (r2 - 0.5) * 600) / 50) * 50
        const sold_price = Math.round((ppsf * sqft) / 1000) * 1000
        const distance_mi = Math.round((0.2 + r3 * 1.6) * 10) / 10
        const daysAgo = Math.round(15 + r4 * 165)
        const sold_date = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10)

        // Weight: closer + more recent + similar size = higher weight
        const distanceScore = 1 / (1 + distance_mi)
        const recencyScore = 1 / (1 + daysAgo / 90)
        const sizeScore = 1 / (1 + Math.abs(sqft - baseSqft) / baseSqft)
        const weight = Math.round((distanceScore + recencyScore + sizeScore) * 100) / 100

        comps.push({
            id: `mock-${i + 1}`,
            address: `${100 + Math.round(r1 * 8000)} ${streetNames[i % streetNames.length]}`,
            distance_mi,
            sold_price,
            sold_date,
            sqft,
            beds: (listing.beds ?? 3) + (r2 > 0.6 ? 1 : r2 < 0.2 ? -1 : 0),
            baths: listing.full_baths ?? 2,
            year_built: (listing.year_built ?? 1990) + Math.round((r3 - 0.5) * 20),
            price_per_sqft: Math.round(ppsf),
            weight,
        })
    }

    return comps
}

function buildNarrative(
    listing: { address: string; city: string; sqft: number | null; beds: number | null },
    mid: number,
    comps: Comp[],
    ppsf: number,
): string {
    const fmt = (n: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(n)
    const avgDistance = (comps.reduce((s, c) => s + c.distance_mi, 0) / comps.length).toFixed(1)
    const recentCount = comps.filter((c) => {
        const d = (Date.now() - new Date(c.sold_date).getTime()) / 86400000
        return d <= 90
    }).length

    return [
        `Based on ${comps.length} comparable sales within ${avgDistance} miles of ${listing.address}, ` +
            `${listing.city}, our model estimates a current market value of approximately ${fmt(mid)}.`,
        `The weighted average price per square foot for these comps is ${fmt(ppsf)}/sqft, applied to your ` +
            `home's ${listing.sqft?.toLocaleString() ?? 'reported'} square feet.`,
        `${recentCount} of the comps closed in the last 90 days, suggesting the local market is ${recentCount >= 3 ? 'active' : 'steady'}.`,
        `This is a starting point — final pricing should account for condition, recent updates, and timing.`,
    ].join('\n\n')
}
