<template>
    <main class="min-h-screen bg-white">
        <!-- Header -->
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
                <div class="flex items-center gap-6">
                    <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                        >Frula Homes</NuxtLink
                    >
                    <NuxtLink
                        to="/browse"
                        class="hover:text-brand hidden text-sm font-medium text-slate-600 sm:block"
                    >
                        ← Back to browse
                    </NuxtLink>
                </div>
                <AuthNav />
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

                    <!-- Key feature badges (waterfront, single story, etc) -->
                    <div v-if="keyFeatureBadges.length" class="mt-5 flex flex-wrap gap-2">
                        <span
                            v-for="b in keyFeatureBadges"
                            :key="b.label"
                            class="bg-brand-50 text-brand-700 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                        >
                            <span>{{ b.icon }}</span>
                            {{ b.label }}
                        </span>
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

                    <!-- Lifestyle: views + features (homes/condo/etc) -->
                    <div v-if="!isLand && (viewTags.length || featureTags.length)" class="mt-8">
                        <h2 class="font-display text-xl font-semibold">Features & lifestyle</h2>
                        <div v-if="viewTags.length" class="mt-3">
                            <p
                                class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Views
                            </p>
                            <div class="flex flex-wrap gap-2">
                                <span
                                    v-for="tag in viewTags"
                                    :key="tag"
                                    class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                                >
                                    {{ tag }}
                                </span>
                            </div>
                        </div>
                        <div v-if="featureTags.length" class="mt-4">
                            <p
                                class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Features
                            </p>
                            <div class="flex flex-wrap gap-2">
                                <span
                                    v-for="tag in featureTags"
                                    :key="tag"
                                    class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                                >
                                    {{ tag }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Land specifics -->
                    <div v-if="isLand" class="mt-8">
                        <h2 class="font-display text-xl font-semibold">Land details</h2>
                        <div v-if="terrainTags.length" class="mt-3">
                            <p
                                class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Terrain
                            </p>
                            <div class="flex flex-wrap gap-2">
                                <span
                                    v-for="tag in terrainTags"
                                    :key="tag"
                                    class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                                >
                                    {{ tag }}
                                </span>
                            </div>
                        </div>
                        <div v-if="utilityTags.length" class="mt-4">
                            <p
                                class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Utilities at lot
                            </p>
                            <div class="flex flex-wrap gap-2">
                                <span
                                    v-for="tag in utilityTags"
                                    :key="tag"
                                    class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                                >
                                    {{ tag }}
                                </span>
                            </div>
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
                            <Fact label="Lot size" :value="lotLabel" />
                            <Fact label="Stories" :value="listing.stories" />
                            <Fact label="Bedrooms" :value="listing.beds" />
                            <Fact label="Full baths" :value="listing.full_baths" />
                            <Fact label="Half baths" :value="listing.half_baths" />
                            <Fact
                                label="Garage"
                                :value="
                                    listing.garage_stalls ? `${listing.garage_stalls}-car` : 'No'
                                "
                            />
                            <Fact
                                label="Other parking"
                                :value="
                                    listing.parking_spaces
                                        ? `${listing.parking_spaces} spaces`
                                        : null
                                "
                            />
                            <Fact
                                label="Basement"
                                :value="
                                    listing.basement_finished
                                        ? 'Finished'
                                        : listing.basement
                                          ? 'Unfinished'
                                          : null
                                "
                            />
                            <Fact
                                label="Single story"
                                :value="listing.single_story ? 'Yes' : null"
                            />
                            <Fact
                                v-if="!isLand"
                                label="Water source"
                                :value="
                                    listing.water_source ? capitalize(listing.water_source) : null
                                "
                            />
                            <Fact
                                v-if="!isLand"
                                label="Sewer"
                                :value="listing.sewer_type ? capitalize(listing.sewer_type) : null"
                            />
                            <Fact
                                v-if="isLand"
                                label="Road access"
                                :value="
                                    listing.road_access
                                        ? (ROAD_ACCESS_LABELS[listing.road_access] ??
                                          listing.road_access)
                                        : null
                                "
                            />
                            <Fact
                                label="Waterfront"
                                :value="
                                    listing.waterfront ? listing.water_body_name || 'Yes' : null
                                "
                            />
                            <Fact label="HOA" :value="hoaSummary" />
                            <Fact label="County" :value="listing.county" />
                        </dl>
                    </div>

                    <!-- Location map -->
                    <div v-if="listing.lat != null && listing.lng != null" class="mt-8">
                        <h2 class="font-display text-xl font-semibold">Where it is</h2>
                        <p class="mb-3 mt-1 text-sm text-slate-500">
                            {{ listing.address }} · {{ listing.city }}, {{ listing.state }}
                            {{ listing.zip }}
                        </p>
                        <ListingLocationMap
                            :lat="listing.lat"
                            :lng="listing.lng"
                            :property-type="listing.property_type"
                            :address="listing.address"
                        />
                    </div>
                </div>

                <!-- Sticky sidebar -->
                <aside class="space-y-4 md:sticky md:top-6 md:self-start">
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

                        <div v-if="!isOwnListing" class="mt-6 space-y-2">
                            <button
                                type="button"
                                class="bg-brand hover:bg-brand-600 w-full rounded-full px-4 py-3 text-sm font-semibold text-white shadow-sm transition"
                                @click="openOffer"
                            >
                                💰 Make an offer
                            </button>
                            <button
                                type="button"
                                class="hover:border-brand hover:text-brand w-full rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition"
                                @click="openViewing"
                            >
                                📅 Request a viewing
                            </button>
                            <button
                                type="button"
                                class="hover:border-brand hover:text-brand w-full rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition"
                                @click="contactSeller"
                            >
                                Contact seller
                            </button>
                        </div>
                        <div v-else class="mt-6 space-y-2">
                            <p
                                class="rounded-full bg-slate-100 px-4 py-2 text-center text-xs font-medium text-slate-500"
                            >
                                This is your listing
                            </p>
                            <NuxtLink
                                :to="`/sell?edit=${listing.id}`"
                                class="bg-brand hover:bg-brand-600 block w-full rounded-full px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition"
                            >
                                Edit listing
                            </NuxtLink>
                            <button
                                type="button"
                                :disabled="deleting"
                                class="block w-full rounded-full border border-red-300 px-4 py-3 text-sm font-semibold text-red-600 transition hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
                                @click="deleteListing"
                            >
                                {{ deleting ? 'Deleting…' : 'Delete listing' }}
                            </button>
                        </div>
                        <SaveButton :listing-id="listing.id" variant="full" />
                        <NuxtLink
                            :to="`/listing/${listing.id}/cma`"
                            class="hover:border-brand hover:text-brand mt-2 block w-full rounded-full border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition"
                        >
                            📊 View market snapshot
                        </NuxtLink>

                        <p class="mt-4 text-xs text-slate-500">
                            Listed {{ daysOnMarket }} day{{ daysOnMarket === 1 ? '' : 's' }} ago
                        </p>
                    </div>

                    <!-- Owner-only stats card -->
                    <SellerStatsCard v-if="isOwnListing" :listing-id="listing.id" />
                </aside>
            </div>
        </article>

        <!-- Offer + viewing modals -->
        <OfferModal
            v-if="listing"
            :open="offerOpen"
            :listing-id="listing.id"
            :recipient-id="listing.user_id"
            :listing-address="listing.address"
            :listing-price="listing.price"
            @close="offerOpen = false"
            @sent="offerOpen = false"
        />
        <ViewingModal
            v-if="listing"
            :open="viewingOpen"
            :listing-id="listing.id"
            :recipient-id="listing.user_id"
            :listing-address="listing.address"
            @close="viewingOpen = false"
            @sent="viewingOpen = false"
        />
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
        id, user_id, status, address, city, state, zip, county, lat, lng,
        property_type, price, sqft, lot_size, lot_unit, beds, full_baths, half_baths,
        year_built, garage, garage_stalls, parking_spaces, single_story, stories,
        basement, basement_finished,
        waterfront, water_body_name, view_types, features,
        terrain, road_access, utilities,
        water_source, sewer_type, hoa, hoa_fee, hoa_frequency,
        title, description, highlights,
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

// =====================================================
// Display labels for the structured filter fields. Keeps
// the listing detail page in sync with what sellers picked
// in the sell form (and what buyers searched for).
// =====================================================
const VIEW_LABELS: Record<string, string> = {
    water: 'Water view',
    lake: 'Lake view',
    river: 'River view',
    mountain: 'Mountain view',
    city: 'City skyline',
    woods: 'Woods / forest',
    golf: 'Golf course view',
}

const FEATURE_LABELS: Record<string, string> = {
    pool: 'Pool',
    fireplace: 'Fireplace',
    central_ac: 'Central A/C',
    deck: 'Deck / patio',
    fenced_yard: 'Fenced yard',
    updated_kitchen: 'Updated kitchen',
    new_roof: 'New roof',
    solar: 'Solar',
    ev_charger: 'EV charger',
    dock: 'Dock',
}

const TERRAIN_LABELS: Record<string, string> = {
    wooded: 'Wooded',
    cleared: 'Cleared',
    flat: 'Flat',
    rolling: 'Rolling',
    hilly: 'Hilly',
    pasture: 'Pasture',
    tillable: 'Tillable / farmland',
    prairie: 'Prairie',
    wetland: 'Wetland',
}

const UTILITY_LABELS: Record<string, string> = {
    electric: 'Electric',
    gas: 'Natural gas',
    city_water: 'City water',
    well: 'Well',
    city_sewer: 'City sewer',
    septic: 'Septic',
    internet: 'Internet / fiber',
}

const ROAD_ACCESS_LABELS: Record<string, string> = {
    paved: 'Paved road',
    gravel: 'Gravel road',
    dirt: 'Dirt road',
    seasonal: 'Seasonal access',
    none: 'No road access',
}

function lookupList(values: string[] | null | undefined, labels: Record<string, string>) {
    return (values ?? []).map((v) => labels[v] ?? v)
}

const viewTags = computed(() => lookupList(listing.value?.view_types, VIEW_LABELS))
const featureTags = computed(() => lookupList(listing.value?.features, FEATURE_LABELS))
const terrainTags = computed(() => lookupList(listing.value?.terrain, TERRAIN_LABELS))
const utilityTags = computed(() => lookupList(listing.value?.utilities, UTILITY_LABELS))

const lotLabel = computed(() => {
    const l = listing.value
    if (!l?.lot_size) return null
    if (l.lot_unit === 'sqft') return `${formatNumber(Math.round(l.lot_size))} sqft`
    return `${l.lot_size} acres`
})

const isLand = computed(() => listing.value?.property_type === 'land')

// Pulls the most "wow" attributes into a single hero badge strip near the
// top of the listing — this is what catches a buyer's eye in the first
// 2 seconds and signals "yes, this matches what I was searching for".
const keyFeatureBadges = computed(() => {
    const l = listing.value
    if (!l) return []
    const badges: { icon: string; label: string }[] = []
    if (l.waterfront) badges.push({ icon: '🌊', label: l.water_body_name || 'Waterfront' })
    if (l.single_story) badges.push({ icon: '♿', label: 'Single story' })
    if ((l.view_types ?? []).includes('mountain'))
        badges.push({ icon: '⛰️', label: 'Mountain view' })
    if ((l.view_types ?? []).includes('lake')) badges.push({ icon: '🏞️', label: 'Lake view' })
    if ((l.features ?? []).includes('pool')) badges.push({ icon: '🏊', label: 'Pool' })
    if ((l.features ?? []).includes('fireplace')) badges.push({ icon: '🔥', label: 'Fireplace' })
    if ((l.features ?? []).includes('updated_kitchen'))
        badges.push({ icon: '✨', label: 'Updated kitchen' })
    if ((l.features ?? []).includes('new_roof')) badges.push({ icon: '🏠', label: 'New roof' })
    if ((l.features ?? []).includes('solar')) badges.push({ icon: '☀️', label: 'Solar' })
    if ((l.features ?? []).includes('dock')) badges.push({ icon: '⚓', label: 'Dock' })
    if (l.garage_stalls && l.garage_stalls >= 3)
        badges.push({ icon: '🚗', label: `${l.garage_stalls}-car garage` })
    return badges
})

const hoaSummary = computed(() => {
    const l = listing.value
    if (!l?.hoa || !l.hoa_fee) return null
    const period =
        l.hoa_frequency === 'annual' ? '/yr' : l.hoa_frequency === 'quarterly' ? '/qtr' : '/mo'
    return `$${formatNumber(l.hoa_fee)}${period}`
})

const user = useSupabaseUser()
const router = useRouter()

const isOwnListing = computed(() => listing.value && user.value?.id === listing.value.user_id)

// Log a view event on mount, but only when the viewer isn't the seller —
// otherwise the seller's own clicks would inflate their own stats card.
onMounted(async () => {
    if (!listing.value || isOwnListing.value) return
    await supabase.from('listing_views').insert({
        listing_id: listing.value.id,
        viewer_id: user.value?.id ?? null,
    })
})

function contactSeller() {
    if (!listing.value) return
    if (!user.value) {
        router.push(`/login?next=/listing/${listing.value.id}`)
        return
    }
    if (isOwnListing.value) return
    router.push(`/inbox/${listing.value.id}/${listing.value.user_id}`)
}

const offerOpen = ref(false)
const viewingOpen = ref(false)

function requireLoginThen(action: () => void) {
    if (!user.value) {
        router.push(`/login?next=/listing/${listing.value?.id ?? ''}`)
        return
    }
    if (isOwnListing.value) return
    action()
}

function openOffer() {
    requireLoginThen(() => (offerOpen.value = true))
}
function openViewing() {
    requireLoginThen(() => (viewingOpen.value = true))
}

const deleting = ref(false)
async function deleteListing() {
    if (!listing.value || !isOwnListing.value) return
    const ok = window.confirm(
        `Permanently delete this listing for ${listing.value.address}? This cannot be undone.`,
    )
    if (!ok) return
    deleting.value = true
    const { error: delErr } = await supabase.from('listings').delete().eq('id', listing.value.id)
    if (delErr) {
        deleting.value = false
        window.alert(`Could not delete listing: ${delErr.message}`)
        return
    }
    router.push('/account')
}

useSeoMeta({
    title: () =>
        listing.value
            ? `${listing.value.title || listing.value.address} — Frula Homes`
            : 'Listing — Frula Homes',
    description: () => listing.value?.description ?? '',
})
</script>
