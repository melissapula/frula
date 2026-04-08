export interface Listing {
    id: string
    user_id: string
    status: string
    address: string
    city: string
    state: string
    zip: string
    county: string | null
    lat: number | null
    lng: number | null
    property_type: string
    price: number
    sqft: number | null
    lot_size: number | null
    beds: number | null
    full_baths: number | null
    half_baths: number | null
    year_built: number | null
    garage: boolean
    garage_stalls: number | null
    title: string | null
    description: string | null
    highlights: string[]
    listed_at: string | null
    listing_photos: { url: string; is_primary: boolean; sort_order: number }[]
}

export interface ListingFilters {
    minPrice?: number
    maxPrice?: number
    beds?: number
    baths?: number
    propertyType?: string
    city?: string
    state?: string
}
