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
    listing_type?: string
    price: number
    price_reduced_from?: number | null
    sqft: number | null
    lot_size: number | null
    lot_unit?: 'acres' | 'sqft'
    beds: number | null
    full_baths: number | null
    half_baths: number | null
    year_built: number | null
    garage: boolean
    garage_stalls: number | null
    parking_spaces?: number | null
    single_story?: boolean
    pets_allowed?: boolean | null
    large_dogs_ok?: boolean | null
    rent_period?: 'month' | 'week' | 'night' | null
    lease_term_months?: number | null
    available_from?: string | null
    furnished?: boolean
    basement?: boolean
    basement_finished?: boolean
    stories?: number | null
    waterfront?: boolean
    water_body_name?: string | null
    view_types?: string[]
    features?: string[]
    hoa?: boolean
    water_source?: string | null
    sewer_type?: string | null
    title: string | null
    description: string | null
    highlights: string[]
    listed_at: string | null
    listing_photos: { url: string; is_primary: boolean; sort_order: number }[]
    /** Populated only when results come from a radius search */
    distance_meters?: number
}

export interface GeoCenter {
    lat: number
    lng: number
    label: string
}

/** Property category buckets used by the basic filter chips. */
export type PropertyCategory = 'homes' | 'land' | 'commercial'

/** Map a category to the underlying `property_type` values stored in the DB. */
export const CATEGORY_TYPES: Record<PropertyCategory, string[]> = {
    homes: ['residential', 'condo', 'multi-family'],
    land: ['land'],
    commercial: ['commercial'],
}

export const VIEW_OPTIONS = [
    { value: 'water', label: 'Water' },
    { value: 'lake', label: 'Lake' },
    { value: 'river', label: 'River' },
    { value: 'mountain', label: 'Mountain' },
    { value: 'city', label: 'City skyline' },
    { value: 'woods', label: 'Woods / forest' },
    { value: 'golf', label: 'Golf course' },
] as const

export const TERRAIN_OPTIONS = [
    { value: 'wooded', label: 'Wooded' },
    { value: 'cleared', label: 'Cleared' },
    { value: 'flat', label: 'Flat' },
    { value: 'rolling', label: 'Rolling' },
    { value: 'hilly', label: 'Hilly' },
    { value: 'pasture', label: 'Pasture' },
    { value: 'tillable', label: 'Tillable / farmland' },
    { value: 'prairie', label: 'Prairie' },
    { value: 'wetland', label: 'Wetland' },
] as const

export const ROAD_ACCESS_OPTIONS = [
    { value: 'paved', label: 'Paved' },
    { value: 'gravel', label: 'Gravel' },
    { value: 'dirt', label: 'Dirt' },
    { value: 'seasonal', label: 'Seasonal access' },
    { value: 'none', label: 'No road access' },
] as const

export const UTILITY_OPTIONS = [
    { value: 'electric', label: 'Electric' },
    { value: 'gas', label: 'Natural gas' },
    { value: 'city_water', label: 'City water' },
    { value: 'well', label: 'Well' },
    { value: 'city_sewer', label: 'City sewer' },
    { value: 'septic', label: 'Septic' },
    { value: 'internet', label: 'Internet / fiber' },
] as const

/**
 * Grouped feature options for the sell form, Dream Home finder, and
 * browse filters. All stored as flat strings in the `features TEXT[]`
 * column — the grouping is purely a UI concern.
 */
export interface FeatureGroup {
    label: string
    options: readonly { value: string; label: string }[]
}

export const FEATURE_GROUPS: readonly FeatureGroup[] = [
    {
        label: 'Interior layout',
        options: [
            { value: 'open_concept', label: 'Open concept' },
            { value: 'main_level_master', label: 'Main-level primary bedroom' },
            { value: 'master_ensuite', label: 'Primary bedroom with en-suite bath' },
            { value: 'walk_in_closet', label: 'Walk-in closet' },
            { value: 'mud_room', label: 'Mud room' },
            { value: 'walk_in_pantry', label: 'Walk-in pantry' },
            { value: 'main_level_laundry', label: 'Main-level laundry' },
            { value: 'bonus_room', label: 'Bonus / flex room' },
            { value: 'home_office', label: 'Dedicated home office' },
            { value: 'in_law_suite', label: 'In-law suite / ADU' },
            { value: 'hardwood_floors', label: 'Hardwood floors' },
        ],
    },
    {
        label: 'Kitchen & bath',
        options: [
            { value: 'updated_kitchen', label: 'Updated kitchen' },
            { value: 'granite_quartz', label: 'Granite / quartz countertops' },
            { value: 'stainless_appliances', label: 'Stainless steel appliances' },
            { value: 'kitchen_island', label: 'Kitchen island' },
            { value: 'double_vanity', label: 'Double vanity in primary bath' },
        ],
    },
    {
        label: 'Outdoor',
        options: [
            { value: 'deck', label: 'Deck / patio' },
            { value: 'fenced_yard', label: 'Fenced yard' },
            { value: 'pool', label: 'Pool' },
            { value: 'covered_porch', label: 'Covered porch' },
            { value: 'screened_porch', label: 'Screened porch / 3-season' },
            { value: 'outdoor_kitchen', label: 'Outdoor kitchen' },
            { value: 'fire_pit', label: 'Fire pit' },
            { value: 'dock', label: 'Dock' },
            { value: 'rv_parking', label: 'RV parking' },
            { value: 'workshop', label: 'Workshop / outbuilding' },
        ],
    },
    {
        label: 'Energy & technology',
        options: [
            { value: 'central_ac', label: 'Central A/C' },
            { value: 'fireplace', label: 'Fireplace' },
            { value: 'new_roof', label: 'New roof' },
            { value: 'solar', label: 'Solar panels' },
            { value: 'ev_charger', label: 'EV charger' },
            { value: 'smart_home', label: 'Smart home / automation' },
            { value: 'generator', label: 'Backup generator' },
        ],
    },
    {
        label: 'Specialty rooms',
        options: [
            { value: 'theater', label: 'Theater / media room' },
            { value: 'wine_cellar', label: 'Wine cellar' },
            { value: 'storm_shelter', label: 'Storm shelter / safe room' },
            { value: 'sunroom', label: 'Sunroom' },
        ],
    },
] as const

/** Flat list for backwards compatibility with components that don't use groups */
export const FEATURE_OPTIONS = FEATURE_GROUPS.flatMap((g) => g.options)

export interface ListingFilters {
    // Location
    near?: GeoCenter
    radiusMiles?: number
    state?: string
    city?: string

    // Category / type
    categories?: PropertyCategory[]
    propertyType?: string

    // Price
    minPrice?: number
    maxPrice?: number
    priceReducedOnly?: boolean

    // Size
    minSqft?: number
    maxSqft?: number
    minLotAcres?: number
    maxLotAcres?: number

    // Rooms
    beds?: number
    maxBeds?: number
    baths?: number
    maxBaths?: number

    // Build
    minYearBuilt?: number
    maxYearBuilt?: number
    stories?: number

    // Construction / utilities
    garage?: boolean
    minParkingSpaces?: number
    basement?: boolean
    basementFinished?: boolean
    singleStory?: boolean
    waterSource?: 'city' | 'well' | 'other'
    sewerType?: 'city' | 'septic' | 'other'
    noHoa?: boolean

    // Lifestyle
    waterfront?: boolean
    views?: string[]
    features?: string[]

    // Land
    terrain?: string[]
    roadAccess?: string
    utilities?: string[]

    // Freshness
    daysOnMarketMax?: number
}
