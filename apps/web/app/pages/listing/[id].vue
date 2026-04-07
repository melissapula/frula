<template>
    <main class="min-h-screen bg-white">
        <!-- Header -->
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                    >Frula Homes</NuxtLink
                >
                <NuxtLink to="/browse" class="hover:text-brand text-sm font-medium text-slate-600">
                    ← Back to browse
                </NuxtLink>
            </div>
        </header>

        <div v-if="pending" class="mx-auto max-w-6xl p-8">
            <div class="aspect-[16/9] animate-pulse rounded-2xl bg-slate-200" />
        </div>

        <div v-else-if="error || !listing" class="mx-auto max-w-6xl p-8">
            <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
                <p class="font-semibold">Listing not found</p>
                <p class="mt-1 text-sm">
                    {{
                        error?.message ||
                        'This listing may have been removed or is no longer active.'
                    }}
                </p>
            </div>
        </div>

        <article v-else class="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
            <!-- Photo gallery -->
            <ListingGallery :photos="photos" :title="listing.title || listing.address" />

            <!-- Title block -->
            <div class="mt-6 grid gap-8 md:grid-cols-[1fr_320px]">
                <div>
                    <h1 class="font-display text-3xl font-bold text-slate-900 md:text-4xl">
                        {{ listing.title || listing.address }}
                    </h1>
                    <p class="mt-1 text-slate-600">
                        {{ listing.address }} · {{ listing.city }}, {{ listing.state }}
                        {{ listing.zip }}
                    </p>

                    <!-- Quick stats -->
                    <div class="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-y border-slate-200 py-5">
                        <Stat v-if="listing.beds" :value="listing.beds" label="beds" />
                        <Stat v-if="totalBathLabel" :value="totalBathLabel" label="baths" />
                        <Stat
                            v-if="listing.sqft"
                            :value="formatNumber(listing.sqft)"
                            label="sqft"
                        />
                        <Stat
                            v-if="listing.lot_size"
                            :value="`${listing.lot_size}`"
                            label="acres"
                        />
                        <Stat v-if="listing.year_built" :value="listing.year_built" label="built" />
                        <Stat
                            v-if="listing.garage_stalls"
                            :value="listing.garage_stalls"
                            label="car garage"
                        />
                    </div>

                    <!-- Description -->
                    <div v-if="listing.description" class="mt-6">
                        <h2 class="font-display text-xl font-semibold">About this home</h2>
                        <p class="mt-3 whitespace-pre-line leading-relaxed text-slate-700">
                            {{ listing.description }}
                        </p>
                    </div>

                    <!-- Highlights -->
                    <div v-if="listing.highlights?.length" class="mt-6">
                        <h2 class="font-display text-xl font-semibold">Highlights</h2>
                        <div class="mt-3 flex flex-wrap gap-2">
                            <span
                                v-for="h in listing.highlights"
                                :key="h"
                                class="bg-brand-50 text-brand-700 rounded-full px-3 py-1.5 text-sm font-medium"
                            >
                                {{ h }}
                            </span>
                        </div>
                    </div>

                    <!-- Facts grid -->
                    <div class="mt-8">
                        <h2 class="font-display text-xl font-semibold">Property facts</h2>
                        <dl class="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                            <Fact
                                label="Property type"
                                :value="capitalize(listing.property_type)"
                            />
                            <Fact label="Year built" :value="listing.year_built" />
                            <Fact
                                label="Square feet"
                                :value="listing.sqft ? formatNumber(listing.sqft) : null"
                            />
                            <Fact
                                label="Lot size"
                                :value="listing.lot_size ? `${listing.lot_size} acres` : null"
                            />
                            <Fact label="Bedrooms" :value="listing.beds" />
                            <Fact label="Full baths" :value="listing.full_baths" />
                            <Fact label="Half baths" :value="listing.half_baths" />
                            <Fact
                                label="Garage"
                                :value="
                                    listing.garage_stalls ? `${listing.garage_stalls}-car` : 'No'
                                "
                            />
                            <Fact label="County" :value="listing.county" />
                        </dl>
                    </div>
                </div>

                <!-- Sticky sidebar -->
                <aside class="md:sticky md:top-6 md:self-start">
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div class="font-display text-3xl font-bold text-slate-900">
                            {{ formatPrice(listing.price) }}
                        </div>
                        <p v-if="listing.sqft" class="mt-1 text-sm text-slate-500">
                            {{ formatPrice(Math.round(listing.price / listing.sqft)) }}/sqft
                        </p>

                        <div
                            class="bg-brand-50 text-brand-700 mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                        >
                            <span class="bg-brand h-2 w-2 rounded-full"></span>
                            For Sale By Owner
                        </div>

                        <button
                            type="button"
                            class="bg-brand hover:bg-brand-600 mt-6 w-full rounded-full px-4 py-3 text-sm font-semibold text-white shadow-sm transition"
                            @click="contactSeller"
                        >
                            Contact seller
                        </button>
                        <button
                            type="button"
                            class="hover:border-brand hover:text-brand mt-2 w-full rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition"
                        >
                            Save listing
                        </button>

                        <p class="mt-4 text-xs text-slate-500">
                            Listed {{ daysOnMarket }} day{{ daysOnMarket === 1 ? '' : 's' }} ago
                        </p>
                    </div>
                </aside>
            </div>
        </article>
    </main>
</template>

<script setup lang="ts">
import type { Listing } from '~/types/listing'
import { formatPrice } from '~/composables/useListings'

const route = useRoute()
const supabase = useSupabaseClient()

const {
    data: listing,
    pending,
    error,
} = await useAsyncData(`listing-${route.params.id}`, async () => {
    const { data, error } = await supabase
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
        .eq('id', route.params.id as string)
        .eq('status', 'active')
        .maybeSingle()
    if (error) throw error
    return data as unknown as Listing | null
})

const photos = computed(() => {
    const list = listing.value?.listing_photos ?? []
    return [...list].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return a.sort_order - b.sort_order
    })
})

const totalBathLabel = computed(() => {
    if (!listing.value) return null
    const f = listing.value.full_baths ?? 0
    const h = listing.value.half_baths ?? 0
    if (!f && !h) return null
    return h ? `${f}.${h >= 1 ? 5 : 0}` : `${f}`
})

const daysOnMarket = computed(() => {
    if (!listing.value?.listed_at) return 0
    const ms = Date.now() - new Date(listing.value.listed_at).getTime()
    return Math.max(1, Math.floor(ms / 86400000))
})

function formatNumber(n: number) {
    return new Intl.NumberFormat('en-US').format(n)
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function contactSeller() {
    // Wired up once auth + messaging are in place
    alert('Contact seller flow coming next session — needs auth + messaging.')
}

useSeoMeta({
    title: () =>
        listing.value
            ? `${listing.value.title || listing.value.address} — Frula Homes`
            : 'Listing — Frula Homes',
    description: () => listing.value?.description ?? '',
})
</script>
