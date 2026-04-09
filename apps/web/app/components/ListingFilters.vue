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

        <!-- ============ ADVANCED TOGGLE ============ -->
        <button
            type="button"
            class="hover:border-brand hover:text-brand flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
            @click="advancedOpen = !advancedOpen"
        >
            <span>{{ advancedOpen ? 'Hide' : 'Show' }} advanced filters</span>
            <svg
                class="h-4 w-4 transition"
                :class="{ 'rotate-180': advancedOpen }"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
            >
                <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                />
            </svg>
        </button>

        <!-- ============ ADVANCED ============ -->
        <div v-if="advancedOpen" class="space-y-5 border-t border-slate-200 pt-5">
            <!-- Specific property type -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
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

            <!-- Square feet -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
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

            <!-- Lot size -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
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

            <!-- Year built -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Year built</label
                >
                <div class="mt-1 grid grid-cols-2 gap-2">
                    <input
                        v-model.number="local.minYearBuilt"
                        type="number"
                        placeholder="Min year"
                        class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                    />
                    <input
                        v-model.number="local.maxYearBuilt"
                        type="number"
                        placeholder="Max year"
                        class="focus:border-brand focus:ring-brand rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                    />
                </div>
            </div>

            <!-- Stories -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
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

            <!-- Parking -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
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

            <!-- Construction toggles -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Must have</label
                >
                <div class="mt-2 space-y-2">
                    <Toggle v-model="local.singleStory" label="Single story (no stairs)" />
                    <Toggle v-model="local.garage" label="Garage" />
                    <Toggle v-model="local.basement" label="Basement" />
                    <Toggle v-model="local.basementFinished" label="Finished basement" />
                    <Toggle v-model="local.noHoa" label="No HOA" />
                    <Toggle v-model="local.waterfront" label="Waterfront" />
                    <Toggle v-model="local.priceReducedOnly" label="Price reduced" />
                </div>
            </div>

            <!-- Views -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >View</label
                >
                <div class="mt-2 flex flex-wrap gap-2">
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
            </div>

            <!-- Features -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Features</label
                >
                <div class="mt-2 flex flex-wrap gap-2">
                    <button
                        v-for="f in FEATURE_OPTIONS"
                        :key="f.value"
                        type="button"
                        :class="chipClass(local.features?.includes(f.value))"
                        @click="toggleArrayValue('features', f.value)"
                    >
                        {{ f.label }}
                    </button>
                </div>
            </div>

            <!-- Water / sewer -->
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label
                        class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >Water</label
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
                    <label
                        class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >Sewer</label
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

            <!-- ===== Land-specific ===== -->
            <div class="rounded-xl bg-slate-50 p-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Land</p>

                <div class="mt-3">
                    <label class="block text-xs font-medium text-slate-600">Terrain</label>
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
                    <label class="block text-xs font-medium text-slate-600">Road access</label>
                    <select
                        v-model="local.roadAccess"
                        class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1"
                    >
                        <option :value="undefined">Any</option>
                        <option v-for="r in ROAD_ACCESS_OPTIONS" :key="r.value" :value="r.value">
                            {{ r.label }}
                        </option>
                    </select>
                </div>

                <div class="mt-3">
                    <label class="block text-xs font-medium text-slate-600">Utilities at lot</label>
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
            </div>

            <!-- Days on market -->
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Listed within</label
                >
                <select
                    v-model.number="local.daysOnMarketMax"
                    class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                >
                    <option :value="undefined">Any time</option>
                    <option :value="1">Last 24 hours</option>
                    <option :value="7">Last 7 days</option>
                    <option :value="14">Last 14 days</option>
                    <option :value="30">Last 30 days</option>
                </select>
            </div>
        </div>

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
    FEATURE_OPTIONS,
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
