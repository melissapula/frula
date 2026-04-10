<template>
    <div class="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        <!-- ============ BASIC ============ -->

        <!-- Location: Near vs Region toggle -->
        <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >Location</label
            >
            <div
                class="mt-1 inline-flex w-full rounded-lg border border-slate-300 bg-white p-1 text-sm"
            >
                <button
                    type="button"
                    :class="[
                        'flex-1 rounded-md px-3 py-1.5 font-medium transition',
                        locationMode === 'near' ? 'bg-brand text-white' : 'text-slate-600',
                    ]"
                    @click="setLocationMode('near')"
                >
                    Near a place
                </button>
                <button
                    type="button"
                    :class="[
                        'flex-1 rounded-md px-3 py-1.5 font-medium transition',
                        locationMode === 'region' ? 'bg-brand text-white' : 'text-slate-600',
                    ]"
                    @click="setLocationMode('region')"
                >
                    State / city
                </button>
            </div>

            <!-- NEAR mode -->
            <div v-if="locationMode === 'near'" class="mt-3">
                <div class="flex gap-2">
                    <input
                        v-model="nearQuery"
                        type="text"
                        placeholder="e.g. Bemidji, MN"
                        class="focus:border-brand focus:ring-brand flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                        @keydown.enter.prevent="applyNear"
                    />
                    <button
                        type="button"
                        :disabled="geoLoading || !nearQuery.trim()"
                        class="bg-brand rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                        @click="applyNear"
                    >
                        {{ geoLoading ? '…' : 'Go' }}
                    </button>
                </div>
                <p v-if="geoError" class="mt-1 text-xs text-red-600">{{ geoError }}</p>
                <p v-else-if="local.near" class="mt-1 truncate text-xs text-slate-500">
                    {{ local.near.label }}
                </p>
                <div v-if="local.near" class="mt-2">
                    <label
                        class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >Radius: {{ local.radiusMiles }} mi</label
                    >
                    <input
                        v-model.number="local.radiusMiles"
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        class="accent-brand mt-1 w-full"
                    />
                    <button
                        type="button"
                        class="mt-1 text-xs text-slate-500 underline"
                        @click="clearNear"
                    >
                        Clear location
                    </button>
                </div>
            </div>

            <!-- REGION mode -->
            <div v-else class="mt-3 space-y-2">
                <select
                    v-model="local.state"
                    class="focus:border-brand focus:ring-brand w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                >
                    <option :value="undefined">All states</option>
                    <option v-for="s in US_STATES" :key="s.code" :value="s.code">
                        {{ s.name }}
                    </option>
                </select>
                <input
                    v-model="local.city"
                    type="text"
                    placeholder="City or county"
                    class="focus:border-brand focus:ring-brand w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                />
            </div>
        </div>

        <!-- Price -->
        <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >Price</label
            >
            <div class="mt-1 grid grid-cols-2 gap-2">
                <input
                    v-model.number="local.minPrice"
                    type="number"
                    placeholder="Min"
                    class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                />
                <input
                    v-model.number="local.maxPrice"
                    type="number"
                    placeholder="Max"
                    class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                />
            </div>
        </div>

        <!-- Beds (min / max) -->
        <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >Beds</label
            >
            <div class="mt-1 grid grid-cols-2 gap-2">
                <select
                    v-model.number="local.beds"
                    class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                >
                    <option :value="undefined">Min</option>
                    <option v-for="n in [1, 2, 3, 4, 5, 6]" :key="n" :value="n">{{ n }}+</option>
                </select>
                <select
                    v-model.number="local.maxBeds"
                    class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                >
                    <option :value="undefined">Max</option>
                    <option v-for="n in [1, 2, 3, 4, 5, 6]" :key="n" :value="n">{{ n }}</option>
                </select>
            </div>
        </div>

        <!-- Baths (min / max) -->
        <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >Baths</label
            >
            <div class="mt-1 grid grid-cols-2 gap-2">
                <select
                    v-model.number="local.baths"
                    class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                >
                    <option :value="undefined">Min</option>
                    <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}+</option>
                </select>
                <select
                    v-model.number="local.maxBaths"
                    class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                >
                    <option :value="undefined">Max</option>
                    <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
                </select>
            </div>
        </div>

        <!-- ============ ADVANCED FILTERS BUTTON ============ -->
        <button
            type="button"
            class="hover:border-brand hover:text-brand flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
            @click="advancedOpen = true"
        >
            Advanced filters
            <span
                v-if="advancedCount > 0"
                class="bg-brand inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
            >
                {{ advancedCount }}
            </span>
        </button>

        <!-- ============ ADVANCED FILTERS MODAL ============ -->
        <Teleport to="body">
            <div
                v-if="advancedOpen"
                class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm md:items-center"
                @mousedown.self="advancedOpen = false"
            >
                <div
                    class="relative my-4 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
                >
                    <!-- Modal header -->
                    <div
                        class="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4"
                    >
                        <h2 class="font-display text-lg font-bold text-slate-900">
                            Advanced Filters
                        </h2>
                        <button
                            type="button"
                            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            @click="advancedOpen = false"
                        >
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                                />
                            </svg>
                        </button>
                    </div>

                    <!-- Modal body -->
                    <div class="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
                        <!-- Property Details -->
                        <section>
                            <h3
                                class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Property Details
                            </h3>
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label class="block text-xs font-medium text-slate-600"
                                        >Property type</label
                                    >
                                    <select
                                        v-model="local.propertyType"
                                        class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                    >
                                        <option :value="undefined">Any</option>
                                        <option value="residential">Residential</option>
                                        <option value="condo">Condo</option>
                                        <option value="multi-family">Multi-family</option>
                                        <option value="land">Land</option>
                                        <option value="commercial">Commercial</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-600"
                                        >Stories (min)</label
                                    >
                                    <select
                                        v-model.number="local.stories"
                                        class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                    >
                                        <option :value="undefined">Any</option>
                                        <option :value="1">1+</option>
                                        <option :value="1.5">1.5+</option>
                                        <option :value="2">2+</option>
                                        <option :value="3">3+</option>
                                    </select>
                                </div>
                            </div>

                            <div class="mt-3 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label class="block text-xs font-medium text-slate-600"
                                        >Square feet</label
                                    >
                                    <div class="mt-1 grid grid-cols-2 gap-2">
                                        <input
                                            v-model.number="local.minSqft"
                                            type="number"
                                            placeholder="Min"
                                            class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                        />
                                        <input
                                            v-model.number="local.maxSqft"
                                            type="number"
                                            placeholder="Max"
                                            class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-600"
                                        >Lot size (acres)</label
                                    >
                                    <div class="mt-1 grid grid-cols-2 gap-2">
                                        <input
                                            v-model.number="local.minLotAcres"
                                            type="number"
                                            step="0.1"
                                            placeholder="Min"
                                            class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                        />
                                        <input
                                            v-model.number="local.maxLotAcres"
                                            type="number"
                                            step="0.1"
                                            placeholder="Max"
                                            class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div class="mt-3 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label class="block text-xs font-medium text-slate-600"
                                        >Year built</label
                                    >
                                    <div class="mt-1 grid grid-cols-2 gap-2">
                                        <input
                                            v-model.number="local.minYearBuilt"
                                            type="number"
                                            placeholder="Min"
                                            class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                        />
                                        <input
                                            v-model.number="local.maxYearBuilt"
                                            type="number"
                                            placeholder="Max"
                                            class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-600"
                                        >Parking spaces (min)</label
                                    >
                                    <input
                                        v-model.number="local.minParkingSpaces"
                                        type="number"
                                        min="0"
                                        placeholder="Any"
                                        class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                    />
                                </div>
                            </div>

                            <div class="mt-3">
                                <label class="block text-xs font-medium text-slate-600"
                                    >Listed within</label
                                >
                                <select
                                    v-model.number="local.daysOnMarketMax"
                                    class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 sm:w-1/2"
                                >
                                    <option :value="undefined">Any time</option>
                                    <option :value="1">Last 24 hours</option>
                                    <option :value="7">Last 7 days</option>
                                    <option :value="14">Last 14 days</option>
                                    <option :value="30">Last 30 days</option>
                                </select>
                            </div>
                        </section>

                        <!-- Must Have -->
                        <section class="border-t border-slate-100 pt-5">
                            <h3
                                class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Must Have
                            </h3>
                            <div class="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                                <Toggle v-model="local.singleStory" label="Single story" />
                                <Toggle v-model="local.garage" label="Garage" />
                                <Toggle v-model="local.basement" label="Basement" />
                                <Toggle
                                    v-model="local.basementFinished"
                                    label="Finished basement"
                                />
                                <Toggle v-model="local.noHoa" label="No HOA" />
                                <Toggle v-model="local.waterfront" label="Waterfront" />
                                <Toggle v-model="local.priceReducedOnly" label="Price reduced" />
                            </div>
                        </section>

                        <!-- Views -->
                        <section class="border-t border-slate-100 pt-5">
                            <h3
                                class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Views
                            </h3>
                            <div class="flex flex-wrap gap-2">
                                <button
                                    v-for="v in VIEW_OPTIONS"
                                    :key="v.value"
                                    type="button"
                                    :class="chipClass(local.views?.includes(v.value))"
                                    @click="toggleArrayValue('views', v.value)"
                                >
                                    {{ v.label }}
                                </button>
                            </div>
                        </section>

                        <!-- Features -->
                        <section class="border-t border-slate-100 pt-5">
                            <h3
                                class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Features
                            </h3>
                            <div class="space-y-3">
                                <div v-for="group in FEATURE_GROUPS" :key="group.label">
                                    <p
                                        class="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                                    >
                                        {{ group.label }}
                                    </p>
                                    <div class="flex flex-wrap gap-1.5">
                                        <button
                                            v-for="f in group.options"
                                            :key="f.value"
                                            type="button"
                                            :class="chipClass(local.features?.includes(f.value))"
                                            @click="toggleArrayValue('features', f.value)"
                                        >
                                            {{ f.label }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- Water & Sewer -->
                        <section class="border-t border-slate-100 pt-5">
                            <h3
                                class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Water & Sewer
                            </h3>
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label class="block text-xs font-medium text-slate-600"
                                        >Water source</label
                                    >
                                    <select
                                        v-model="local.waterSource"
                                        class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                    >
                                        <option :value="undefined">Any</option>
                                        <option value="city">City</option>
                                        <option value="well">Well</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-600"
                                        >Sewer type</label
                                    >
                                    <select
                                        v-model="local.sewerType"
                                        class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                    >
                                        <option :value="undefined">Any</option>
                                        <option value="city">City</option>
                                        <option value="septic">Septic</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <!-- Land -->
                        <section class="border-t border-slate-100 pt-5">
                            <h3
                                class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Land
                            </h3>

                            <div>
                                <label class="block text-xs font-medium text-slate-600"
                                    >Terrain</label
                                >
                                <div class="mt-1.5 flex flex-wrap gap-2">
                                    <button
                                        v-for="t in TERRAIN_OPTIONS"
                                        :key="t.value"
                                        type="button"
                                        :class="chipClass(local.terrain?.includes(t.value))"
                                        @click="toggleArrayValue('terrain', t.value)"
                                    >
                                        {{ t.label }}
                                    </button>
                                </div>
                            </div>

                            <div class="mt-3">
                                <label class="block text-xs font-medium text-slate-600"
                                    >Road access</label
                                >
                                <select
                                    v-model="local.roadAccess"
                                    class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 sm:w-1/2"
                                >
                                    <option :value="undefined">Any</option>
                                    <option
                                        v-for="r in ROAD_ACCESS_OPTIONS"
                                        :key="r.value"
                                        :value="r.value"
                                    >
                                        {{ r.label }}
                                    </option>
                                </select>
                            </div>

                            <div class="mt-3">
                                <label class="block text-xs font-medium text-slate-600"
                                    >Utilities at lot</label
                                >
                                <div class="mt-1.5 flex flex-wrap gap-2">
                                    <button
                                        v-for="u in UTILITY_OPTIONS"
                                        :key="u.value"
                                        type="button"
                                        :class="chipClass(local.utilities?.includes(u.value))"
                                        @click="toggleArrayValue('utilities', u.value)"
                                    >
                                        {{ u.label }}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    <!-- Modal footer -->
                    <div
                        class="sticky bottom-0 flex items-center justify-between rounded-b-2xl border-t border-slate-200 bg-white px-6 py-4"
                    >
                        <button
                            type="button"
                            class="text-sm font-medium text-slate-500 hover:text-slate-700"
                            @click="clearAdvanced"
                        >
                            Clear advanced filters
                        </button>
                        <button
                            type="button"
                            class="bg-brand hover:bg-brand-600 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition"
                            @click="advancedOpen = false"
                        >
                            Apply filters
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <button
            type="button"
            class="hover:border-brand hover:text-brand w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"
            @click="reset"
        >
            Clear filters
        </button>
    </div>
</template>

<script setup lang="ts">
import type { ListingFilters } from '~/types/listing'
import {
    VIEW_OPTIONS,
    FEATURE_GROUPS,
    TERRAIN_OPTIONS,
    ROAD_ACCESS_OPTIONS,
    UTILITY_OPTIONS,
} from '~/types/listing'
import { US_STATES } from '~/composables/useStates'

const model = defineModel<ListingFilters>({ required: true })

// Local copy so v-model updates flow back via watcher (avoids deep mutation surprises)
const local = reactive<ListingFilters>({ ...model.value })

watch(
    local,
    (v) => {
        model.value = { ...v }
    },
    { deep: true },
)

const advancedOpen = ref(false)

// Count how many advanced filters are active (for the badge)
const advancedCount = computed(() => {
    let n = 0
    if (local.propertyType) n++
    if (local.minSqft) n++
    if (local.maxSqft) n++
    if (local.minLotAcres) n++
    if (local.maxLotAcres) n++
    if (local.minYearBuilt) n++
    if (local.maxYearBuilt) n++
    if (local.stories) n++
    if (local.minParkingSpaces) n++
    if (local.daysOnMarketMax) n++
    if (local.singleStory) n++
    if (local.garage) n++
    if (local.basement) n++
    if (local.basementFinished) n++
    if (local.noHoa) n++
    if (local.waterfront) n++
    if (local.priceReducedOnly) n++
    if (local.views?.length) n++
    if (local.features?.length) n++
    if (local.waterSource) n++
    if (local.sewerType) n++
    if (local.terrain?.length) n++
    if (local.roadAccess) n++
    if (local.utilities?.length) n++
    return n
})

function clearAdvanced() {
    const advancedKeys: (keyof ListingFilters)[] = [
        'propertyType',
        'minSqft',
        'maxSqft',
        'minLotAcres',
        'maxLotAcres',
        'minYearBuilt',
        'maxYearBuilt',
        'stories',
        'minParkingSpaces',
        'daysOnMarketMax',
        'singleStory',
        'garage',
        'basement',
        'basementFinished',
        'noHoa',
        'waterfront',
        'priceReducedOnly',
        'views',
        'features',
        'waterSource',
        'sewerType',
        'terrain',
        'roadAccess',
        'utilities',
    ]
    for (const key of advancedKeys) {
        ;(local as Record<string, unknown>)[key] = undefined
    }
}

// Location mode: "near" (geocode + radius) or "region" (state + city/county).
// Initialize from existing filter values so refresh / shareable URLs feel right.
type LocationMode = 'near' | 'region'
const locationMode = ref<LocationMode>(local.state || local.city ? 'region' : 'near')

function setLocationMode(mode: LocationMode) {
    if (locationMode.value === mode) return
    locationMode.value = mode
    // Clear the *other* mode's fields so the two are mutually exclusive
    if (mode === 'near') {
        local.state = undefined
        local.city = undefined
    } else {
        clearNear()
    }
}

type ArrayFilterKey = 'views' | 'features' | 'terrain' | 'utilities'
function toggleArrayValue(key: ArrayFilterKey, value: string) {
    const current = (local[key] as string[] | undefined) ?? []
    if (current.includes(value)) {
        const next = current.filter((x) => x !== value)
        local[key] = next.length ? next : undefined
    } else {
        local[key] = [...current, value]
    }
}

function chipClass(active: boolean | undefined): string {
    return [
        'rounded-full border px-3 py-1.5 text-sm font-medium transition',
        active
            ? 'border-brand bg-brand text-white'
            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400',
    ].join(' ')
}

const nearQuery = ref('')
const geoLoading = ref(false)
const geoError = ref<string | null>(null)

async function applyNear() {
    const q = nearQuery.value.trim()
    if (!q) return
    geoLoading.value = true
    geoError.value = null
    try {
        const res = await $fetch<{ lat: number; lng: number; display_name: string }>(
            '/api/geocode',
            { params: { q } },
        )
        local.near = { lat: res.lat, lng: res.lng, label: res.display_name }
        if (!local.radiusMiles) local.radiusMiles = 25
    } catch (e: unknown) {
        const err = e as { statusMessage?: string; message?: string }
        geoError.value = err.statusMessage || err.message || 'Could not find that location'
    } finally {
        geoLoading.value = false
    }
}

function clearNear() {
    local.near = undefined
    local.radiusMiles = undefined
    nearQuery.value = ''
    geoError.value = null
}

function reset() {
    Object.keys(local).forEach((k) => {
        ;(local as Record<string, unknown>)[k] = undefined
    })
    nearQuery.value = ''
    geoError.value = null
}
</script>
