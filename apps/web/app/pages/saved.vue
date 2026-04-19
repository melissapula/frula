<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                    >Frula Homes</NuxtLink
                >
                <AuthNav />
            </div>
        </header>

        <div class="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
            <div class="mb-6 flex items-baseline justify-between">
                <h1 class="font-display text-3xl font-bold text-slate-900 md:text-4xl">
                    ❤️ Saved listings
                </h1>
                <p v-if="!pending" class="text-sm text-slate-500">
                    {{ savedListings.length }} home{{ savedListings.length === 1 ? '' : 's' }}
                </p>
            </div>

            <div v-if="pending" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div
                    v-for="n in 6"
                    :key="n"
                    class="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200"
                />
            </div>

            <div
                v-else-if="loadError"
                class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
                {{ loadError }}
            </div>

            <div
                v-else-if="!savedListings.length"
                class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
            >
                <p class="font-display text-xl font-semibold text-slate-700">
                    You haven't saved any listings yet
                </p>
                <p class="mt-2 text-sm text-slate-500">
                    Tap the 🤍 on any listing card to save it for later. Saved homes appear here so
                    you can come back to them anytime.
                </p>
                <div class="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                    <NuxtLink
                        to="/dream-home"
                        class="hover:border-brand hover:text-brand rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition"
                    >
                        ✨ Find my dream home
                    </NuxtLink>
                    <NuxtLink
                        to="/browse"
                        class="bg-brand hover:bg-brand-600 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition"
                    >
                        Browse listings
                    </NuxtLink>
                </div>
            </div>

            <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <ListingCard
                    v-for="listing in savedListings"
                    :key="listing.id"
                    :listing="listing"
                />
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import type { Listing } from '~/types/listing'
import { useSaved } from '~/composables/useSaved'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const { savedIds, load } = useSaved()

watchEffect(() => {
    if (!user.value && import.meta.client) router.replace('/login')
})

const savedListings = ref<Listing[]>([])
const pending = ref(true)
const loadError = ref<string | null>(null)

async function loadListings() {
    if (!user.value) {
        savedListings.value = []
        pending.value = false
        return
    }
    pending.value = true
    // Make sure the saved-id set is loaded first
    await load()

    const ids = Array.from(savedIds.value)
    if (!ids.length) {
        savedListings.value = []
        pending.value = false
        return
    }

    const { data, error } = await supabase
        .from('listings')
        .select(
            `id, user_id, status, address, city, state, zip, county, lat, lng,
             property_type, price, sqft, lot_size, lot_unit, beds, full_baths, half_baths,
             year_built, garage, garage_stalls, title, description, highlights,
             listed_at,
             listing_photos ( url, is_primary, sort_order )`,
        )
        .in('id', ids)
        .eq('status', 'active')

    if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load saved listings:', error)
        loadError.value = 'Failed to load your saved listings. Please try again.'
        savedListings.value = []
    } else {
        loadError.value = null
        savedListings.value = (data ?? []) as unknown as Listing[]
    }
    pending.value = false
}

onMounted(loadListings)

// If a listing gets unsaved while on this page, drop it from the local list
// immediately so the grid feels responsive.
watch(savedIds, (next) => {
    savedListings.value = savedListings.value.filter((l) => next.has(l.id))
})

useSeoMeta({ title: 'Saved listings — Frula Homes', robots: 'noindex' })
</script>
