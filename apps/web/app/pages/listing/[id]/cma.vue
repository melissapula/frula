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
                Market Analysis
            </p>
            <h1 class="font-display mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
                Comparable Market Analysis
            </h1>

            <div v-if="pending" class="mt-10">
                <div class="aspect-[3/1] animate-pulse rounded-2xl bg-slate-200" />
            </div>

            <div
                v-else-if="error || !data"
                class="mt-10 rounded-lg border border-red-200 bg-red-50 p-6 text-red-800"
            >
                <p class="font-semibold">Could not generate CMA</p>
                <p class="mt-1 text-sm">{{ error?.message || 'Unknown error.' }}</p>
            </div>

            <div v-else class="mt-10 space-y-8">
                <!-- Coming-soon banner for unsupported states -->
                <section
                    v-if="data.coverage === 'unsupported'"
                    class="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8"
                >
                    <p class="font-display text-xl font-semibold text-amber-900">
                        Full CMA coming soon to {{ data.state }}
                    </p>
                    <p class="mt-3 leading-relaxed text-amber-900">
                        {{ data.narrative }}
                    </p>
                </section>

                <!-- Estimate hero (only when we actually have one) -->
                <section
                    v-else-if="data.estimate"
                    class="border-brand-100 from-brand-50 rounded-2xl border bg-gradient-to-br to-white p-8 shadow-sm"
                >
                    <p class="text-brand-700 text-sm font-semibold uppercase tracking-wide">
                        Estimated Market Value
                    </p>
                    <div class="font-display mt-3 text-5xl font-bold text-slate-900 md:text-6xl">
                        {{ formatPrice(data.estimate.mid) }}
                    </div>
                    <p class="mt-2 text-lg text-slate-600">
                        Range: <strong>{{ formatPrice(data.estimate.low) }}</strong> –
                        <strong>{{ formatPrice(data.estimate.high) }}</strong>
                    </p>
                    <div
                        class="text-brand-700 mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold"
                    >
                        <span class="bg-brand h-2 w-2 rounded-full"></span>
                        {{ data.estimate.confidence }} confidence · {{ data.comps.length }} comps
                    </div>
                </section>

                <!-- Narrative -->
                <section
                    v-if="data.coverage !== 'unsupported'"
                    class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
                >
                    <h2 class="font-display text-xl font-semibold">How we got there</h2>
                    <div class="mt-4 whitespace-pre-line leading-relaxed text-slate-700">
                        {{ data.narrative }}
                    </div>
                </section>

                <!-- Comps -->
                <section v-if="data.comps.length">
                    <h2 class="font-display text-xl font-semibold">Comparable sales</h2>
                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                        <div
                            v-for="comp in data.comps"
                            :key="comp.id"
                            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <p class="font-semibold text-slate-900">{{ comp.address }}</p>
                                    <p class="text-xs text-slate-500">
                                        {{ comp.distance_mi }} mi · sold
                                        {{ formatDate(comp.sold_date) }}
                                    </p>
                                </div>
                                <div class="text-right">
                                    <div class="font-display text-xl font-bold text-slate-900">
                                        {{ formatPrice(comp.sold_price) }}
                                    </div>
                                    <div class="text-xs text-slate-500">
                                        ${{ comp.price_per_sqft }}/sqft
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                                <span
                                    ><strong>{{ comp.beds }}</strong> bd</span
                                >
                                <span
                                    ><strong>{{ comp.baths }}</strong> ba</span
                                >
                                <span>{{ comp.sqft.toLocaleString() }} sqft</span>
                                <span>built {{ comp.year_built }}</span>
                            </div>
                            <div class="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                                <div
                                    class="bg-brand h-full rounded-full"
                                    :style="{
                                        width: `${Math.min(100, (comp.weight / maxWeight) * 100)}%`,
                                    }"
                                />
                            </div>
                            <p class="mt-1 text-xs text-slate-500">
                                Comp weight: {{ comp.weight }}
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Disclaimer -->
                <section
                    class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                >
                    <strong class="block">Note:</strong>
                    {{ data.disclaimer }}
                    <span
                        v-if="data.source === 'mock' && data.coverage === 'preview'"
                        class="mt-2 block text-xs"
                    >
                        (Currently showing demo comps. Once {{ data.state }} parcel data is loaded,
                        this will use real recent sales within a radius of your address via
                        PostGIS.)
                    </span>
                </section>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import type { CmaResult } from '~~/server/api/cma/[id].get'
import { formatPrice } from '~/composables/useListings'

definePageMeta({ layout: false })

const route = useRoute()

const { data, pending, error } = await useFetch<CmaResult>(`/api/cma/${route.params.id}`)

const maxWeight = computed(() => Math.max(...(data.value?.comps.map((c) => c.weight) ?? [1])))

function formatDate(s: string) {
    return new Date(s).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

useSeoMeta({ title: 'CMA Report — Frula Homes' })
</script>
