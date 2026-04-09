import type { Listing, ListingFilters } from '~/types/listing'
import { CATEGORY_TYPES } from '~/types/listing'

export function useListings(filters: Ref<ListingFilters>) {
    const supabase = useSupabaseClient()

    return useAsyncData<Listing[]>(
        'listings',
        async () => {
            const f = filters.value

            // Resolve radius filter via PostGIS RPC (returns id + distance, ordered nearest first)
            let radiusIds: string[] | null = null
            let distanceById: Map<string, number> | null = null
            if (f.near && f.radiusMiles) {
                const { data: idRows, error: rpcErr } = await supabase.rpc(
                    'listing_ids_in_radius',
                    {
                        center_lat: f.near.lat,
                        center_lng: f.near.lng,
                        radius_miles: f.radiusMiles,
                    },
                )
                if (rpcErr) throw rpcErr
                const rows = (idRows as unknown as { id: string; distance_meters: number }[]) ?? []
                if (!rows.length) return []
                radiusIds = rows.map((r) => r.id)
                distanceById = new Map(rows.map((r) => [r.id, r.distance_meters]))
            }

            let query = supabase
                .from('listings')
                .select(
                    `
          id, status, address, city, state, zip, county, lat, lng,
          property_type, listing_type, price, price_reduced_from,
          sqft, lot_size, lot_unit, beds, full_baths, half_baths,
          year_built, garage, garage_stalls, parking_spaces, single_story,
          basement, basement_finished, stories,
          pets_allowed, large_dogs_ok, furnished, rent_period, lease_term_months, available_from,
          waterfront, water_body_name, view_types, features,
          terrain, road_access, utilities,
          hoa, water_source, sewer_type,
          title, description, highlights,
          listed_at,
          listing_photos ( url, is_primary, sort_order )
        `,
                )
                .eq('status', 'active')

            // When radius search is active, preserve nearest-first order from the RPC.
            // Otherwise default to newest-first.
            if (!radiusIds) query = query.order('listed_at', { ascending: false })

            if (radiusIds) query = query.in('id', radiusIds)

            // Location
            if (f.city) {
                // Match against either city or county so users can type "Beltrami"
                // and find listings in Bemidji, Blackduck, etc.
                const term = f.city.replace(/[%,]/g, '')
                query = query.or(`city.ilike.%${term}%,county.ilike.%${term}%`)
            }
            if (f.state) query = query.eq('state', f.state)

            // Category / type
            if (f.propertyType) query = query.eq('property_type', f.propertyType)
            if (f.categories && f.categories.length) {
                const types = f.categories.flatMap((c) => CATEGORY_TYPES[c] ?? [])
                if (types.length) query = query.in('property_type', types)
            }
            // Price
            if (f.minPrice) query = query.gte('price', f.minPrice)
            if (f.maxPrice) query = query.lte('price', f.maxPrice)
            if (f.priceReducedOnly) query = query.not('price_reduced_from', 'is', null)

            // Size
            if (f.minSqft) query = query.gte('sqft', f.minSqft)
            if (f.maxSqft) query = query.lte('sqft', f.maxSqft)
            // Lot size: filter only when stored in acres (skip otherwise to avoid bad matches)
            if (f.minLotAcres) {
                query = query.eq('lot_unit', 'acres').gte('lot_size', f.minLotAcres)
            }
            if (f.maxLotAcres) {
                query = query.eq('lot_unit', 'acres').lte('lot_size', f.maxLotAcres)
            }

            // Rooms
            if (f.beds) query = query.gte('beds', f.beds)
            if (f.maxBeds) query = query.lte('beds', f.maxBeds)
            if (f.baths) query = query.gte('full_baths', f.baths)
            if (f.maxBaths) query = query.lte('full_baths', f.maxBaths)

            // Build
            if (f.minYearBuilt) query = query.gte('year_built', f.minYearBuilt)
            if (f.maxYearBuilt) query = query.lte('year_built', f.maxYearBuilt)
            if (f.stories) query = query.gte('stories', f.stories)

            // Construction / utilities
            if (f.garage) query = query.eq('garage', true)
            if (f.minParkingSpaces) query = query.gte('parking_spaces', f.minParkingSpaces)
            if (f.basement) query = query.eq('basement', true)
            if (f.basementFinished) query = query.eq('basement_finished', true)
            if (f.singleStory) query = query.eq('single_story', true)
            if (f.waterSource) query = query.eq('water_source', f.waterSource)
            if (f.sewerType) query = query.eq('sewer_type', f.sewerType)
            if (f.noHoa) query = query.eq('hoa', false)

            // Lifestyle
            if (f.waterfront) query = query.eq('waterfront', true)
            // Postgres array overlap via PostgREST: `overlaps` operator
            if (f.views && f.views.length) query = query.overlaps('view_types', f.views)
            if (f.features && f.features.length) query = query.contains('features', f.features)

            // Land
            if (f.terrain && f.terrain.length) query = query.overlaps('terrain', f.terrain)
            if (f.roadAccess) query = query.eq('road_access', f.roadAccess)
            if (f.utilities && f.utilities.length) query = query.contains('utilities', f.utilities)

            // Freshness — listings posted within the last N days
            if (f.daysOnMarketMax) {
                const cutoff = new Date(Date.now() - f.daysOnMarketMax * 86_400_000).toISOString()
                query = query.gte('listed_at', cutoff)
            }

            const { data, error } = await query
            if (error) throw error
            let rows = (data as unknown as Listing[]) ?? []

            // Re-order to match RPC nearest-first ordering and attach distance
            if (radiusIds && distanceById) {
                const rank = new Map(radiusIds.map((id, i) => [id, i]))
                rows = rows
                    .map((r) => ({
                        ...r,
                        distance_meters: distanceById!.get(r.id),
                    }))
                    .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
            }
            return rows
        },
        { watch: [filters], default: () => [] },
    )
}

export function formatPrice(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(n)
}

export function formatDistance(meters: number | undefined): string | null {
    if (meters == null) return null
    const miles = meters / 1609.344
    if (miles < 0.1) return '< 0.1 mi'
    if (miles < 10) return `${miles.toFixed(1)} mi`
    return `${Math.round(miles)} mi`
}

export function formatSqft(n: number | null): string {
    if (!n) return '—'
    return new Intl.NumberFormat('en-US').format(n) + ' sqft'
}
