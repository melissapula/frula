/**
 * Server-side Dream Home scoring algorithm.
 *
 * This is the same logic as the client-side scoreListing() in
 * apps/web/app/pages/dream-home.vue. Keep them in sync if the
 * scoring rules change.
 */

export interface DreamPrefs {
    // Hard filters (applied at query level, not scored)
    maxPrice?: number
    state?: string
    propertyType?: string
    // Soft prefs (scored)
    idealBeds?: number
    idealBaths?: number
    minSqft?: number
    minAcres?: number
    minYearBuilt?: number
    singleStory: boolean
    garage: boolean
    basement: boolean
    waterfront: boolean
    views: string[]
    features: string[]
    terrain: string[]
    // Score gate
    minMatchPercent: number
}

export interface ScoredRow {
    score: number
    matched: number
    total: number
}

/**
 * Score a listing against dream home preferences.
 *
 * Each soft pref = 1 point max. Beds/baths use proximity scoring
 * (exact=1.0, ±1=0.75, ±2=0.25). Everything else is binary.
 * Returns 100 if no soft prefs are set.
 */
export function scoreDreamListing(
    l: {
        beds: number | null
        full_baths: number | null
        sqft: number | null
        lot_size: number | null
        lot_unit?: string | null
        year_built: number | null
        single_story?: boolean | null
        garage: boolean
        basement?: boolean | null
        waterfront?: boolean | null
        view_types?: string[] | null
        features?: string[] | null
        terrain?: string[] | null
    },
    prefs: DreamPrefs,
): ScoredRow {
    let matched = 0
    let total = 0

    if (prefs.idealBeds != null) {
        total++
        const diff = Math.abs((l.beds ?? 0) - prefs.idealBeds)
        if (diff === 0) matched += 1
        else if (diff === 1) matched += 0.75
        else if (diff === 2) matched += 0.25
    }
    if (prefs.idealBaths != null) {
        total++
        const diff = Math.abs((l.full_baths ?? 0) - prefs.idealBaths)
        if (diff === 0) matched += 1
        else if (diff === 1) matched += 0.75
        else if (diff === 2) matched += 0.25
    }
    if (prefs.minSqft != null) {
        total++
        if ((l.sqft ?? 0) >= prefs.minSqft) matched++
    }
    if (prefs.minAcres != null) {
        total++
        if (l.lot_unit !== 'sqft' && (l.lot_size ?? 0) >= prefs.minAcres) matched++
    }
    if (prefs.minYearBuilt != null) {
        total++
        if ((l.year_built ?? 0) >= prefs.minYearBuilt) matched++
    }
    if (prefs.singleStory) {
        total++
        if (l.single_story) matched++
    }
    if (prefs.garage) {
        total++
        if (l.garage) matched++
    }
    if (prefs.basement) {
        total++
        if (l.basement) matched++
    }
    if (prefs.waterfront) {
        total++
        if (l.waterfront) matched++
    }
    for (const v of prefs.views) {
        total++
        if ((l.view_types ?? []).includes(v)) matched++
    }
    for (const f of prefs.features) {
        total++
        if ((l.features ?? []).includes(f)) matched++
    }
    for (const t of prefs.terrain) {
        total++
        if ((l.terrain ?? []).includes(t)) matched++
    }

    const score = total === 0 ? 100 : Math.round((matched / total) * 100)
    return { score, matched, total }
}
