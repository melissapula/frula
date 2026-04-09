import type { PropertyCategory } from '~/types/listing'

/**
 * Single source of truth for the color of each property category.
 * Used by the filter chips, the map markers, and the legend so they
 * never drift out of sync.
 */
export const CATEGORY_COLORS: Record<PropertyCategory, string> = {
    homes: '#1D9E75', // brand green
    land: '#C97A1A', // earthy amber
    commercial: '#3B5BDB', // steel blue
}

/** Map a raw `property_type` value to its display category. */
export function categoryForType(propertyType: string | null | undefined): PropertyCategory {
    switch (propertyType) {
        case 'land':
            return 'land'
        case 'commercial':
            return 'commercial'
        default:
            return 'homes'
    }
}

export function colorForType(propertyType: string | null | undefined): string {
    return CATEGORY_COLORS[categoryForType(propertyType)]
}
