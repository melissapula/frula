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

                    <div
                        v-else-if="!data?.length"
                        class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
                    >
                        <p class="font-semibold text-slate-700">No listings match your filters</p>
                        <p class="mt-1 text-sm text-slate-500">
                            Try adjusting your price range or removing a filter.
                        </p>
                    </div>

                    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <ListingCard v-for="listing in data" :key="listing.id" :listing="listing" />
                    </div>
                </section>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import type { ListingFilters as Filters } from '~/types/listing'

const filtersOpen = ref(false)
const filters = ref<Filters>({})

const { data, pending, error } = useListings(filters)

useSeoMeta({
    title: 'Browse Listings — Frula Homes',
    description: 'Browse for-sale-by-owner homes nationwide.',
})
</script>
