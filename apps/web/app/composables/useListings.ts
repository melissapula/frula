import type { Listing, ListingFilters } from '~/types/listing'

export function useListings(filters: Ref<ListingFilters>) {
  const supabase = useSupabaseClient()

  return useAsyncData<Listing[]>(
    'listings',
    async () => {
      let query = supabase
        .from('listings')
        .select(
          `
          id, status, address, city, state, zip, county, lat, lng,
          property_type, price, sqft, lot_size, beds, full_baths, half_baths,
          year_built, garage, garage_stalls, title, description, highlights,
          listed_at,
          listing_photos ( url, is_primary, sort_order )
        `,
        )
        .eq('status', 'active')
        .order('listed_at', { ascending: false })

      const f = filters.value
      if (f.minPrice) query = query.gte('price', f.minPrice)
      if (f.maxPrice) query = query.lte('price', f.maxPrice)
      if (f.beds) query = query.gte('beds', f.beds)
      if (f.baths) query = query.gte('full_baths', f.baths)
      if (f.propertyType) query = query.eq('property_type', f.propertyType)
      if (f.city) query = query.ilike('city', `%${f.city}%`)

      const { data, error } = await query
      if (error) throw error
      return (data as unknown as Listing[]) ?? []
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

export function formatSqft(n: number | null): string {
  if (!n) return '—'
  return new Intl.NumberFormat('en-US').format(n) + ' sqft'
}
