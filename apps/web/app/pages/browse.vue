<template>
    <main class="min-h-screen bg-slate-50">
        <!-- Header -->
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                    >Frula Homes</NuxtLink
                >
                <AuthNav />
            </div>
        </header>

        <div class="mx-auto max-w-7xl px-4 py-6 md:px-8">
            <!-- Title + count -->
            <div class="mb-4 flex items-baseline justify-between">
                <h1 class="font-display text-2xl font-bold md:text-3xl">Browse listings</h1>
                <p class="text-sm text-slate-500">
                    <span v-if="pending">Loading…</span>
                    <span v-else
                        >{{ data?.length ?? 0 }} home{{
                            (data?.length ?? 0) === 1 ? '' : 's'
                        }}</span
                    >
                </p>
            </div>

            <!-- Mobile filter toggle -->
            <button
                type="button"
                class="mb-4 flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 md:hidden"
                @click="filtersOpen = !filtersOpen"
            >
                {{ filtersOpen ? 'Hide' : 'Show' }} filters
            </button>

            <div class="grid gap-6 md:grid-cols-[280px_1fr]">
                <!-- Filters sidebar -->
                <aside :class="['md:block', filtersOpen ? 'block' : 'hidden']">
                    <ListingFilters v-model="filters" />
                </aside>

                <!-- Results -->
                <section>
                    <!-- Mobile list/map toggle -->
                    <div
                        class="mb-3 inline-flex rounded-lg border border-slate-300 bg-white p-1 text-sm md:hidden"
                    >
                        <button
                            type="button"
                            :class="[
                                'rounded-md px-3 py-1.5 font-medium',
                                view === 'list' ? 'bg-brand text-white' : 'text-slate-600',
                            ]"
                            @click="view = 'list'"
                        >
                            List
                        </button>
                        <button
                            type="button"
                            :class="[
                                'rounded-md px-3 py-1.5 font-medium',
                                view === 'map' ? 'bg-brand text-white' : 'text-slate-600',
                            ]"
                            @click="view = 'map'"
                        >
                            Map
                        </button>
                    </div>

                    <div
                        v-if="error"
                        class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
                    >
                        {{ error.message }}
                    </div>

                    <div v-else-if="pending" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <div
                            v-for="n in 6"
                            :key="n"
                            class="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200"
                        />
                    </div>

                    <template v-else>
                        <div class="grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
                            <div
                                :class="[
                                    'order-2 lg:order-1',
                                    view === 'map' ? 'hidden md:block' : '',
                                ]"
                            >
                                <div
                                    v-if="!data?.length"
                                    class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
                                >
                                    <p class="font-semibold text-slate-700">
                                        No listings match your filters
                                    </p>
                                    <p class="mt-1 text-sm text-slate-500">
                                        Try adjusting your price range or removing a filter.
                                    </p>
                                </div>
                                <div v-else>
                                    <button
                                        v-if="focusedFromMap"
                                        type="button"
                                        class="hover:border-brand hover:text-brand mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600"
                                        @click="clearMapHover"
                                    >
                                        ← Show all {{ data.length }} listings
                                    </button>
                                    <div class="grid gap-4 sm:grid-cols-2">
                                        <ListingCard
                                            v-for="listing in visibleListings"
                                            :key="listing.id"
                                            :listing="listing"
                                            :highlighted="focusedId === listing.id"
                                            :expanded="focusedFromMap"
                                            @hover="onCardHover(listing.id, $event)"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div
                                :class="[
                                    'order-1 lg:sticky lg:top-4 lg:order-2 lg:self-start',
                                    view === 'list' ? 'hidden md:block' : '',
                                ]"
                            >
                                <BrowseMap
                                    :listings="data ?? []"
                                    :center="filters.near"
                                    :radius-miles="filters.radiusMiles"
                                    :hovered-id="hoveredId"
                                    :pinned-id="pinnedId"
                                    @select="goToListing"
                                    @hover="onMapHover"
                                    @pin="onMapPin"
                                />
                            </div>
                        </div>
                    </template>
                </section>
            </div>
        </div>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
import type { ListingFilters as Filters } from '~/types/listing'

const filtersOpen = ref(false)
const filters = ref<Filters>({})
const view = ref<'list' | 'map'>('list')

// Hover-sync state.
// `hoveredId` drives the card highlight + map popup transiently.
// `pinnedId` is sticky — set when the user CLICKS a marker, cleared when
// they click the same marker again or click empty map. Pinning lets the
// user move their mouse off the marker (e.g. to scroll the expanded card)
// without losing the popup or the filtered list.
const hoveredId = ref<string | null>(null)
const hoverSource = ref<'map' | 'card' | null>(null)
const pinnedId = ref<string | null>(null)

const { data, pending, error } = useListings(filters)

// Treat pinned as the source of truth when set; otherwise honor map-originated hover
const focusedId = computed(() => pinnedId.value ?? hoveredId.value)
const focusedFromMap = computed(
    () => !!pinnedId.value || (hoverSource.value === 'map' && !!hoveredId.value),
)

const visibleListings = computed(() => {
    if (!data.value) return []
    if (focusedFromMap.value && focusedId.value) {
        return data.value.filter((l) => l.id === focusedId.value)
    }
    return data.value
})

function onMapHover(id: string | null) {
    hoveredId.value = id
    hoverSource.value = id ? 'map' : null
}

function onCardHover(_listingId: string, id: string | null) {
    hoveredId.value = id
    hoverSource.value = id ? 'card' : null
}

function onMapPin(id: string | null) {
    pinnedId.value = id
}

function clearMapHover() {
    hoveredId.value = null
    hoverSource.value = null
    pinnedId.value = null
}

const router = useRouter()
function goToListing(id: string) {
    router.push(`/listing/${id}`)
}

useSeoMeta({
    title: 'Browse Listings — Frula Homes',
    description: 'Browse for-sale-by-owner homes nationwide.',
})
</script>
