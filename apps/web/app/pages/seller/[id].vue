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

        <div v-if="pending" class="mx-auto max-w-6xl p-8">
            <div class="h-32 animate-pulse rounded-2xl bg-slate-200" />
        </div>

        <div v-else-if="!profile" class="mx-auto max-w-6xl p-8">
            <div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
                <p class="font-semibold">Seller not found</p>
                <p class="mt-1 text-sm">
                    This profile doesn't exist or has been removed.
                    <NuxtLink to="/browse" class="font-semibold underline"
                        >Browse listings</NuxtLink
                    >
                    instead.
                </p>
            </div>
        </div>

        <div v-else class="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
            <!-- Profile header -->
            <div class="mb-8 flex items-center gap-4">
                <div
                    class="bg-brand flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                >
                    {{ initials }}
                </div>
                <div>
                    <h1 class="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                        {{ profile.full_name || 'Frula Homes Seller' }}
                    </h1>
                    <p class="mt-1 text-sm text-slate-500">
                        Member since {{ memberSince }}
                        <span v-if="listings.length">
                            · {{ listings.length }} active listing{{
                                listings.length === 1 ? '' : 's'
                            }}
                        </span>
                    </p>
                </div>
            </div>

            <!-- Active listings -->
            <section>
                <h2 class="font-display mb-4 text-xl font-semibold">
                    {{ profile.full_name?.split(' ')[0] || 'This seller' }}'s listings
                </h2>

                <div
                    v-if="!listings.length"
                    class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
                >
                    <p class="text-sm text-slate-600">No active listings right now.</p>
                </div>

                <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <ListingCard v-for="listing in listings" :key="listing.id" :listing="listing" />
                </div>
            </section>
        </div>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
import type { Listing } from '~/types/listing'

const route = useRoute()
const supabase = useSupabaseClient()
const sellerId = computed(() => route.params.id as string)

interface SellerProfile {
    id: string
    full_name: string | null
    created_at: string
}

const profile = ref<SellerProfile | null>(null)
const listings = ref<Listing[]>([])
const pending = ref(true)

onMounted(async () => {
    const [profileRes, listingsRes] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, full_name, created_at')
            .eq('id', sellerId.value)
            .maybeSingle(),
        supabase
            .from('listings')
            .select(
                `id, user_id, status, address, city, state, zip, county, lat, lng,
                 property_type, price, sqft, lot_size, lot_unit, beds, full_baths, half_baths,
                 year_built, garage, garage_stalls, title, description, highlights,
                 listed_at,
                 listing_photos ( url, is_primary, sort_order )`,
            )
            .eq('user_id', sellerId.value)
            .eq('status', 'active')
            .order('listed_at', { ascending: false }),
    ])

    profile.value = profileRes.data as SellerProfile | null
    listings.value = (listingsRes.data ?? []) as unknown as Listing[]
    pending.value = false
})

const initials = computed(() => {
    const name = profile.value?.full_name || '?'
    const parts = name.split(/\s+/).filter(Boolean)
    return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? '')
})

const memberSince = computed(() => {
    if (!profile.value?.created_at) return ''
    return new Date(profile.value.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
    })
})

const sellerTitle = computed(() =>
    profile.value?.full_name
        ? `${profile.value.full_name} — Seller on Frula Homes`
        : 'Seller profile — Frula Homes',
)
const sellerDesc = computed(() =>
    profile.value?.full_name
        ? `View ${profile.value.full_name}'s for-sale-by-owner listings on Frula Homes.`
        : '',
)

useSeoMeta({
    title: sellerTitle,
    description: sellerDesc,
    ogTitle: sellerTitle,
    ogDescription: sellerDesc,
    ogType: 'profile',
    ogSiteName: 'Frula Homes',
    twitterCard: 'summary',
    twitterTitle: sellerTitle,
    twitterDescription: sellerDesc,
})
</script>
