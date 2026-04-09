<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
                <div class="flex items-center gap-6">
                    <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                        >Frula Homes</NuxtLink
                    >
                    <NuxtLink
                        :to="`/listing/${route.params.id}`"
                        class="hover:text-brand hidden text-sm font-medium text-slate-600 sm:block"
                    >
                        ← Back to listing
                    </NuxtLink>
                </div>
                <AuthNav />
            </div>
        </header>

        <div class="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
            <p class="text-brand-600 text-sm font-medium uppercase tracking-widest">
                Market Snapshot
            </p>
            <h1 class="font-display mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
                What's the market doing here?
            </h1>
            <p class="mt-3 max-w-2xl text-slate-600">
                Informational market context for this listing — built from public data and nearby
                Frula listings. This is not a professional appraisal. For an authoritative
                valuation, hire a state-licensed appraiser.
            </p>

            <div v-if="pending" class="mt-10 space-y-4">
                <div class="aspect-[4/1] animate-pulse rounded-2xl bg-slate-200" />
                <div class="aspect-[4/1] animate-pulse rounded-2xl bg-slate-200" />
            </div>

            <div
                v-else-if="error || !data"
                class="mt-10 rounded-lg border border-red-200 bg-red-50 p-6 text-red-800"
            >
                <p class="font-semibold">Couldn't load market snapshot</p>
                <p class="mt-1 text-sm">{{ error?.message || 'Please try again.' }}</p>
            </div>

            <div v-else class="mt-10 space-y-6">
                <!-- Listing summary card -->
                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div class="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                            <p
                                class="text-xs font-semibold uppercase tracking-wider text-slate-500"
                            >
                                This listing
                            </p>
                            <p class="font-display mt-1 text-2xl font-bold text-slate-900">
                                {{ data.listing.address }}
                            </p>
                            <p class="text-sm text-slate-600">
                                {{ data.listing.city }}, {{ data.listing.state }}
                                {{ data.listing.zip }}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="font-display text-brand text-3xl font-bold md:text-4xl">
                                {{ formatPrice(data.listing.price) }}
                            </p>
                            <p v-if="data.listing.price_per_sqft" class="text-xs text-slate-500">
                                {{ formatPrice(data.listing.price_per_sqft) }}/sqft
                            </p>
                        </div>
                    </div>
                </section>

                <!-- ZIP-level market data (Zillow ZHVI) -->
                <section
                    v-if="data.zipMarket.loaded"
                    class="from-brand-50 border-brand/20 rounded-2xl border bg-gradient-to-br to-white p-6 shadow-sm md:p-8"
                >
                    <p class="text-brand-700 text-xs font-semibold uppercase tracking-wider">
                        📊 ZIP {{ data.zipMarket.zip }} market
                    </p>
                    <div class="mt-4 grid gap-4 md:grid-cols-3">
                        <div>
                            <p class="font-display text-3xl font-bold text-slate-900 md:text-4xl">
                                {{ formatPrice(data.zipMarket.median_home_value!) }}
                            </p>
                            <p class="mt-1 text-xs uppercase tracking-wider text-slate-500">
                                Median home value
                            </p>
                        </div>
                        <div v-if="data.zipMarket.yoy_change_pct != null">
                            <p
                                :class="[
                                    'font-display text-3xl font-bold md:text-4xl',
                                    data.zipMarket.yoy_change_pct >= 0
                                        ? 'text-emerald-600'
                                        : 'text-red-600',
                                ]"
                            >
                                {{ data.zipMarket.yoy_change_pct >= 0 ? '+' : ''
                                }}{{ data.zipMarket.yoy_change_pct.toFixed(1) }}%
                            </p>
                            <p class="mt-1 text-xs uppercase tracking-wider text-slate-500">
                                Year over year
                            </p>
                        </div>
                        <div v-if="data.comparisons.price_vs_zip_median_pct != null">
                            <p
                                :class="[
                                    'font-display text-3xl font-bold md:text-4xl',
                                    data.comparisons.price_vs_zip_median_pct < 0
                                        ? 'text-emerald-600'
                                        : 'text-slate-700',
                                ]"
                            >
                                {{ data.comparisons.price_vs_zip_median_pct >= 0 ? '+' : ''
                                }}{{ data.comparisons.price_vs_zip_median_pct }}%
                            </p>
                            <p class="mt-1 text-xs uppercase tracking-wider text-slate-500">
                                This listing vs. median
                            </p>
                        </div>
                    </div>
                    <p class="mt-4 text-xs text-slate-500">
                        Data: Zillow Research ZHVI<span v-if="data.zipMarket.data_month">
                            · {{ formatMonth(data.zipMarket.data_month) }}</span
                        >
                    </p>
                </section>

                <!-- ZIP data not loaded yet -->
                <section
                    v-else
                    class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
                >
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        📊 ZIP {{ data.zipMarket.zip }} market
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-slate-600">
                        ZIP-level market data isn't loaded for this area yet. We're rolling out
                        nationwide coverage from Zillow Research's public ZHVI dataset — check back
                        soon. In the meantime, the nearby Frula listings below give you a sense of
                        comparable asking prices in the area.
                    </p>
                </section>

                <!-- Nearby Frula listings -->
                <section v-if="data.nearby.comps.length">
                    <div class="mb-4 flex items-baseline justify-between">
                        <h2 class="font-display text-xl font-semibold">Nearby Frula listings</h2>
                        <p class="text-sm text-slate-500">
                            {{ data.nearby.count }} within 5 miles
                            <span v-if="data.nearby.median_price_per_sqft">
                                · median {{ formatPrice(data.nearby.median_price_per_sqft) }}/sqft
                            </span>
                        </p>
                    </div>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <NuxtLink
                            v-for="comp in data.nearby.comps"
                            :key="comp.id"
                            :to="`/listing/${comp.id}`"
                            class="hover:border-brand block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-sm"
                        >
                            <div class="flex">
                                <div
                                    class="aspect-square w-32 flex-none overflow-hidden bg-slate-100 sm:w-40"
                                >
                                    <img
                                        v-if="comp.photo_url"
                                        :src="comp.photo_url"
                                        :alt="comp.address"
                                        class="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                <div class="min-w-0 flex-1 p-4">
                                    <p class="font-display text-lg font-bold text-slate-900">
                                        {{ formatPrice(comp.price) }}
                                    </p>
                                    <p v-if="comp.price_per_sqft" class="text-xs text-slate-500">
                                        {{ formatPrice(comp.price_per_sqft) }}/sqft
                                    </p>
                                    <p class="mt-1 truncate text-xs text-slate-700">
                                        {{ comp.address }}
                                    </p>
                                    <p class="truncate text-xs text-slate-500">
                                        {{ comp.city }}, {{ comp.state }}
                                    </p>
                                    <div
                                        class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600"
                                    >
                                        <span v-if="comp.beds">{{ comp.beds }} bd</span>
                                        <span v-if="comp.full_baths">{{ comp.full_baths }} ba</span>
                                        <span v-if="comp.sqft"
                                            >{{ comp.sqft.toLocaleString() }} sqft</span
                                        >
                                        <span class="text-slate-400"
                                            >· {{ comp.distance_miles }} mi</span
                                        >
                                    </div>
                                </div>
                            </div>
                        </NuxtLink>
                    </div>
                </section>

                <section
                    v-else
                    class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"
                >
                    <p class="font-semibold text-slate-700">No nearby Frula listings yet</p>
                    <p class="mt-1 text-sm text-slate-500">
                        Frula is growing — once more sellers list in this area, you'll see their
                        asking prices here as comparison points.
                    </p>
                </section>

                <!-- Want a real CMA -->
                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <h2 class="font-display text-xl font-semibold">
                        Need a professional valuation?
                    </h2>
                    <p class="mt-2 text-sm leading-relaxed text-slate-600">
                        A Market Snapshot is great for ballpark context, but it's not an appraisal
                        and shouldn't replace one for serious decisions like offer pricing or loan
                        applications. For an authoritative valuation, hire a state-licensed
                        appraiser.
                    </p>
                    <p class="mt-3 text-sm text-slate-600">
                        <strong>Coming soon:</strong> for sellers who want a deeper analysis, we'll
                        be offering a $9 Professional CMA Report add-on powered by a third-party
                        AVM. Until then, your best bet is a local licensed appraiser (typically
                        $400-700 for a residential appraisal).
                    </p>
                </section>

                <!-- Disclaimer -->
                <section
                    class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
                >
                    <p class="font-semibold">📌 Informational only.</p>
                    <p class="mt-1">
                        This Market Snapshot is informational market context, not a professional
                        appraisal or Comparative Market Analysis. Frula Homes is an informational
                        platform — we're not a licensed appraiser, real estate agent, or broker.
                        Public market data may be incomplete or out of date for your specific area.
                        For decisions that depend on accurate valuation, consult a licensed
                        appraiser in your state.
                    </p>
                </section>
            </div>
        </div>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
import { formatPrice } from '~/composables/useListings'

definePageMeta({ layout: false })

const route = useRoute()

interface MarketSnapshotResponse {
    listing: {
        id: string
        address: string
        city: string
        state: string
        zip: string
        price: number
        sqft: number | null
        price_per_sqft: number | null
    }
    zipMarket:
        | {
              zip: string
              median_home_value: number | null
              yoy_change_pct: number | null
              data_month: string | null
              data_source: string
              loaded: true
          }
        | { zip: string; loaded: false }
    nearby: {
        comps: {
            id: string
            address: string
            city: string
            state: string
            price: number
            sqft: number | null
            beds: number | null
            full_baths: number | null
            distance_miles: number
            price_per_sqft: number | null
            photo_url: string | null
        }[]
        median_price_per_sqft: number | null
        count: number
    }
    comparisons: {
        price_vs_zip_median_pct: number | null
    }
}

const { data, pending, error } = await useFetch<MarketSnapshotResponse>('/api/market-snapshot', {
    query: { listingId: route.params.id },
})

function formatMonth(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

useSeoMeta({
    title: 'Market Snapshot — Frula Homes',
    description:
        'Informational market context for this for-sale-by-owner listing — drawn from public data and nearby Frula listings.',
})
</script>
