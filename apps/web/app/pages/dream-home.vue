<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                    >Frula Homes</NuxtLink
                >
                <AuthNav />
            </div>
        </header>

        <div class="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
            <div class="mb-8 text-center">
                <h1 class="font-display text-3xl font-bold text-slate-900 md:text-5xl">
                    Find your dream home
                </h1>
                <p class="mx-auto mt-3 max-w-2xl text-slate-600">
                    Tell us what you're looking for and we'll show you every home in the country
                    ranked by how well it matches your dreams.
                </p>
            </div>

            <div class="grid gap-8 lg:grid-cols-[340px_1fr]">
                <!-- ============ INTAKE ============ -->
                <aside class="lg:sticky lg:top-6 lg:self-start">
                    <form
                        class="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        @submit.prevent="search"
                    >
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Deal-breakers
                        </p>

                        <div>
                            <label class="block text-xs font-medium text-slate-600">
                                Max budget (USD)
                            </label>
                            <input
                                v-model.number="prefs.maxPrice"
                                type="number"
                                min="0"
                                placeholder="e.g. 350000"
                                class="input mt-1"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-600">State</label>
                            <select v-model="prefs.state" class="input mt-1">
                                <option :value="undefined">Anywhere in the US</option>
                                <option v-for="s in US_STATES" :key="s.code" :value="s.code">
                                    {{ s.name }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-600"
                                >Property type</label
                            >
                            <select v-model="prefs.propertyType" class="input mt-1">
                                <option :value="undefined">Any type</option>
                                <option value="residential">Residential</option>
                                <option value="condo">Condo</option>
                                <option value="multi-family">Multi-family</option>
                                <option value="land">Land</option>
                                <option value="commercial">Commercial</option>
                            </select>
                        </div>

                        <hr class="border-slate-200" />
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Your wish list
                        </p>
                        <p class="-mt-3 text-xs text-slate-500">
                            Pick anything that matters. Each one you choose adds to the match score
                            — leave blank what you don't care about.
                        </p>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-slate-600"
                                    >Min beds</label
                                >
                                <input
                                    v-model.number="prefs.minBeds"
                                    type="number"
                                    min="0"
                                    class="input mt-1"
                                />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-slate-600"
                                    >Min baths</label
                                >
                                <input
                                    v-model.number="prefs.minBaths"
                                    type="number"
                                    min="0"
                                    class="input mt-1"
                                />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-slate-600"
                                    >Min sqft</label
                                >
                                <input
                                    v-model.number="prefs.minSqft"
                                    type="number"
                                    min="0"
                                    class="input mt-1"
                                />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-slate-600"
                                    >Min acres</label
                                >
                                <input
                                    v-model.number="prefs.minAcres"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    class="input mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-600"
                                >Built after (year)</label
                            >
                            <input
                                v-model.number="prefs.minYearBuilt"
                                type="number"
                                placeholder="1990"
                                class="input mt-1"
                            />
                        </div>

                        <div class="space-y-2">
                            <label class="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    v-model="prefs.singleStory"
                                    type="checkbox"
                                    class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                                />
                                Single story / no stairs
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    v-model="prefs.garage"
                                    type="checkbox"
                                    class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                                />
                                Has a garage
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    v-model="prefs.basement"
                                    type="checkbox"
                                    class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                                />
                                Has a basement
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    v-model="prefs.waterfront"
                                    type="checkbox"
                                    class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                                />
                                Waterfront
                            </label>
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-600">Views</label>
                            <div class="mt-1.5 flex flex-wrap gap-1.5">
                                <button
                                    v-for="v in VIEW_OPTIONS"
                                    :key="v.value"
                                    type="button"
                                    :class="chip(prefs.views.includes(v.value))"
                                    @click="toggle('views', v.value)"
                                >
                                    {{ v.label }}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-600">Features</label>
                            <div class="mt-1.5 flex flex-wrap gap-1.5">
                                <button
                                    v-for="f in FEATURE_OPTIONS"
                                    :key="f.value"
                                    type="button"
                                    :class="chip(prefs.features.includes(f.value))"
                                    @click="toggle('features', f.value)"
                                >
                                    {{ f.label }}
                                </button>
                            </div>
                        </div>

                        <hr class="border-slate-200" />
                        <div>
                            <label
                                class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >Minimum match: {{ prefs.minMatchPercent }}%</label
                            >
                            <input
                                v-model.number="prefs.minMatchPercent"
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                class="accent-brand mt-2 w-full"
                            />
                            <p class="mt-1 text-xs text-slate-500">
                                Hide matches below this score, and only get emailed about homes that
                                score this high.
                            </p>
                        </div>

                        <div v-if="prefs.propertyType === 'land'">
                            <label class="block text-xs font-medium text-slate-600">Terrain</label>
                            <div class="mt-1.5 flex flex-wrap gap-1.5">
                                <button
                                    v-for="t in TERRAIN_OPTIONS"
                                    :key="t.value"
                                    type="button"
                                    :class="chip(prefs.terrain.includes(t.value))"
                                    @click="toggle('terrain', t.value)"
                                >
                                    {{ t.label }}
                                </button>
                            </div>
                        </div>

                        <div class="flex flex-col gap-2 pt-2">
                            <button
                                type="submit"
                                :disabled="searching"
                                class="bg-brand hover:bg-brand-600 w-full rounded-full px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
                            >
                                {{ searching ? 'Searching…' : 'Find my dream home' }}
                            </button>
                            <button
                                type="button"
                                class="hover:border-brand hover:text-brand w-full rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 transition"
                                @click="reset"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </aside>

                <!-- ============ RESULTS ============ -->
                <section>
                    <div
                        v-if="!hasSearched"
                        class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
                    >
                        <p class="font-display text-xl font-semibold text-slate-700">
                            Your matches will appear here
                        </p>
                        <p class="mt-2 text-sm text-slate-500">
                            Fill out your wish list on the left and hit "Find my dream home" to see
                            every listing nationwide ranked by how well it matches.
                        </p>
                    </div>

                    <div v-else>
                        <div class="mb-4 flex items-center justify-between">
                            <p class="text-sm text-slate-600">
                                <strong>{{ filteredScored.length }}</strong> match{{
                                    filteredScored.length === 1 ? '' : 'es'
                                }}
                                <span v-if="prefs.minMatchPercent > 0" class="text-slate-400">
                                    at {{ prefs.minMatchPercent }}%+
                                </span>
                                {{
                                    filteredScored.length
                                        ? `· showing top ${Math.min(visibleCount, filteredScored.length)}`
                                        : ''
                                }}
                            </p>
                            <button
                                v-if="user && filteredScored.length"
                                type="button"
                                :disabled="savingAlert"
                                class="hover:border-brand hover:text-brand rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition disabled:opacity-50"
                                @click="saveAlert"
                            >
                                {{ alertSaved ? '✓ Alert saved' : 'Email me new matches' }}
                            </button>
                        </div>

                        <div
                            v-if="!filteredScored.length"
                            class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
                        >
                            <p class="font-semibold text-slate-700">
                                {{
                                    scored.length
                                        ? `No homes scored ${prefs.minMatchPercent}% or higher`
                                        : 'No homes match your dreams yet'
                                }}
                            </p>
                            <p class="mt-1 text-sm text-slate-500">
                                {{
                                    scored.length
                                        ? 'Lower the minimum match slider, or loosen a wish-list item.'
                                        : 'Try loosening your deal-breakers (max budget, state, type) — those are the only criteria that exclude listings entirely.'
                                }}
                            </p>
                        </div>

                        <div v-else class="grid gap-4 sm:grid-cols-2">
                            <ListingCard
                                v-for="entry in visible"
                                :key="entry.listing.id"
                                :listing="entry.listing"
                                :match-percent="entry.score"
                            />
                        </div>

                        <div
                            v-if="visibleCount < filteredScored.length"
                            class="mt-6 flex justify-center"
                        >
                            <button
                                type="button"
                                class="hover:border-brand hover:text-brand rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition"
                                @click="visibleCount += 10"
                            >
                                Show next 10
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
import type { Listing } from '~/types/listing'
import { VIEW_OPTIONS, FEATURE_OPTIONS, TERRAIN_OPTIONS } from '~/types/listing'
import { US_STATES } from '~/composables/useStates'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

interface DreamPrefs {
    // Hard filters
    maxPrice?: number
    state?: string
    propertyType?: string
    // Soft prefs
    minBeds?: number
    minBaths?: number
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

const prefs = reactive<DreamPrefs>({
    singleStory: false,
    garage: false,
    basement: false,
    waterfront: false,
    views: [],
    features: [],
    terrain: [],
    minMatchPercent: 0,
})

type ArrayPrefKey = 'views' | 'features' | 'terrain'
function toggle(key: ArrayPrefKey, value: string) {
    const list = prefs[key]
    if (list.includes(value)) {
        prefs[key] = list.filter((x) => x !== value)
    } else {
        prefs[key] = [...list, value]
    }
}

function chip(active: boolean): string {
    return [
        'rounded-full border px-2.5 py-1 text-xs font-medium transition',
        active
            ? 'border-brand bg-brand text-white'
            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
    ].join(' ')
}

function reset() {
    Object.assign(prefs, {
        maxPrice: undefined,
        state: undefined,
        propertyType: undefined,
        minBeds: undefined,
        minBaths: undefined,
        minSqft: undefined,
        minAcres: undefined,
        minYearBuilt: undefined,
        singleStory: false,
        garage: false,
        basement: false,
        waterfront: false,
        views: [],
        features: [],
        terrain: [],
        minMatchPercent: 0,
    })
    scored.value = []
    hasSearched.value = false
    visibleCount.value = 10
    alertSaved.value = false
}

interface ScoredListing {
    listing: Listing
    score: number
    matched: number
    total: number
}

const scored = ref<ScoredListing[]>([])
const searching = ref(false)
const hasSearched = ref(false)
const visibleCount = ref(10)

// Apply the user's minimum-match-% gate on top of the scored results.
// Reactive on `prefs.minMatchPercent` so dragging the slider re-filters
// instantly without re-running the search.
const filteredScored = computed(() => scored.value.filter((s) => s.score >= prefs.minMatchPercent))
const visible = computed(() => filteredScored.value.slice(0, visibleCount.value))

// Reset pagination whenever the threshold changes so users always start
// from the top of the new (smaller/larger) result set.
watch(
    () => prefs.minMatchPercent,
    () => {
        visibleCount.value = 10
    },
)

/**
 * Score a single listing against the user's preferences.
 *
 * Each soft preference the user supplied counts as 1 point. Match it → +1.
 * Score = matched / total × 100 (rounded). If the user supplied no soft
 * preferences at all, every listing scores 100% (the deal-breakers already
 * narrowed the field).
 */
function scoreListing(l: Listing): { score: number; matched: number; total: number } {
    let matched = 0
    let total = 0

    if (prefs.minBeds != null) {
        total++
        if ((l.beds ?? 0) >= prefs.minBeds) matched++
    }
    if (prefs.minBaths != null) {
        total++
        if ((l.full_baths ?? 0) >= prefs.minBaths) matched++
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

async function search() {
    if (searching.value) return
    searching.value = true
    hasSearched.value = true
    visibleCount.value = 10
    alertSaved.value = false

    // Hard filters: only fetch listings that pass the deal-breakers.
    let query = supabase
        .from('listings')
        .select(
            `id, user_id, status, address, city, state, zip, county, lat, lng,
             property_type, price, sqft, lot_size, lot_unit, beds, full_baths, half_baths,
             year_built, garage, garage_stalls, single_story, basement, basement_finished,
             waterfront, view_types, features, terrain,
             title, description, highlights, listed_at,
             listing_photos ( url, is_primary, sort_order )`,
        )
        .eq('status', 'active')
        .limit(500)

    if (prefs.maxPrice) query = query.lte('price', prefs.maxPrice)
    if (prefs.state) query = query.eq('state', prefs.state)
    if (prefs.propertyType) query = query.eq('property_type', prefs.propertyType)

    const { data, error } = await query
    searching.value = false
    if (error) {
        // eslint-disable-next-line no-console
        console.error('Dream home search failed:', error)
        scored.value = []
        return
    }

    const listings = (data ?? []) as unknown as Listing[]
    const ranked = listings
        .map((l) => ({ listing: l, ...scoreListing(l) }))
        .sort((a, b) => {
            // Primary sort: match score desc.
            // Tiebreaker: cheapest first (helps when many listings tie at 100%).
            if (b.score !== a.score) return b.score - a.score
            return a.listing.price - b.listing.price
        })

    scored.value = ranked
}

const savingAlert = ref(false)
const alertSaved = ref(false)
async function saveAlert() {
    if (!user.value || savingAlert.value) return
    savingAlert.value = true
    const { error } = await supabase.from('search_alerts').insert({
        user_id: user.value.id,
        filters: prefs,
        email_frequency: 'daily',
    })
    savingAlert.value = false
    if (error) {
        // eslint-disable-next-line no-console
        console.error('Could not save alert:', error)
        return
    }
    alertSaved.value = true
}

useSeoMeta({
    title: 'Find your dream home — Frula Homes',
    description:
        'Tell Frula Homes what you want and see every for-sale-by-owner listing in the country ranked by how well it matches your dreams.',
})
</script>

<style scoped>
.input {
    @apply focus:border-brand focus:ring-brand w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1;
}
</style>
