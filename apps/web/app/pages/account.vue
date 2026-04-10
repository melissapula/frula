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

        <div class="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
            <!-- Welcome header -->
            <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 class="font-display text-3xl font-bold text-slate-900 md:text-4xl">
                        Welcome back{{ firstName ? `, ${firstName}` : '' }} 💚
                    </h1>
                    <p class="mt-1 text-sm text-slate-500">Member since {{ memberSince }}</p>
                </div>
                <NuxtLink
                    to="/sell"
                    class="bg-brand hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition"
                >
                    + List a new home
                </NuxtLink>
            </div>

            <!-- Quick stats strip -->
            <div class="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                <NuxtLink
                    to="/inbox"
                    class="hover:border-brand rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
                >
                    <p class="font-display text-2xl font-bold text-slate-900">
                        {{ stats.unreadMessages }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">Unread messages</p>
                </NuxtLink>
                <NuxtLink
                    to="/saved"
                    class="hover:border-brand rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
                >
                    <p class="font-display text-2xl font-bold text-slate-900">
                        {{ stats.savedCount }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">Saved homes</p>
                </NuxtLink>
                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                    <p class="font-display text-2xl font-bold text-slate-900">
                        {{ stats.myListingCount }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">My listings</p>
                </div>
                <NuxtLink
                    to="/dream-home"
                    class="hover:border-brand rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
                >
                    <p class="font-display text-2xl font-bold text-slate-900">
                        {{ stats.alertCount }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">Dream home alerts</p>
                </NuxtLink>
            </div>

            <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
                <!-- Main column -->
                <div class="space-y-6">
                    <!-- My listings -->
                    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div class="mb-4 flex items-center justify-between">
                            <h2 class="font-display text-xl font-semibold">My listings</h2>
                            <NuxtLink
                                to="/sell"
                                class="text-brand text-sm font-semibold hover:underline"
                            >
                                + New listing
                            </NuxtLink>
                        </div>

                        <div v-if="loadingListings" class="space-y-3">
                            <div
                                v-for="n in 2"
                                :key="n"
                                class="h-20 animate-pulse rounded-xl bg-slate-100"
                            />
                        </div>

                        <div
                            v-else-if="!myListings.length"
                            class="rounded-xl border border-dashed border-slate-300 py-8 text-center"
                        >
                            <p class="text-sm font-semibold text-slate-700">
                                You haven't listed a home yet
                            </p>
                            <p class="mt-1 text-xs text-slate-500">
                                It's free and takes a few minutes.
                            </p>
                            <NuxtLink
                                to="/sell"
                                class="bg-brand hover:bg-brand-600 mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold text-white"
                            >
                                List your home
                            </NuxtLink>
                        </div>

                        <div v-else class="space-y-3">
                            <NuxtLink
                                v-for="l in myListings"
                                :key="l.id"
                                :to="`/listing/${l.id}`"
                                class="hover:border-brand flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition hover:shadow-sm"
                            >
                                <img
                                    v-if="primaryPhotoFor(l)"
                                    :src="primaryPhotoFor(l)!"
                                    :alt="l.address"
                                    class="h-16 w-20 flex-none rounded-lg object-cover"
                                />
                                <div
                                    v-else
                                    class="flex h-16 w-20 flex-none items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400"
                                >
                                    No photo
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-baseline justify-between gap-2">
                                        <p class="truncate font-semibold text-slate-900">
                                            {{ l.address }}
                                        </p>
                                        <p
                                            class="font-display flex-none text-base font-bold text-slate-900"
                                        >
                                            {{ formatPrice(l.price) }}
                                        </p>
                                    </div>
                                    <p class="text-xs text-slate-500">
                                        {{ l.city }}, {{ l.state }} ·
                                        <span
                                            :class="[
                                                'font-semibold',
                                                l.status === 'active'
                                                    ? 'text-emerald-600'
                                                    : 'text-slate-500',
                                            ]"
                                        >
                                            {{ l.status }}
                                        </span>
                                    </p>
                                    <div class="mt-1 flex gap-3 text-xs text-slate-500">
                                        <span>👀 {{ l.views ?? 0 }} views</span>
                                        <span>❤️ {{ l.saves ?? 0 }} saves</span>
                                    </div>
                                </div>
                            </NuxtLink>
                        </div>
                    </section>

                    <!-- Recent notifications -->
                    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div class="mb-4 flex items-center justify-between">
                            <h2 class="font-display text-xl font-semibold">Recent activity</h2>
                            <NuxtLink
                                to="/inbox"
                                class="text-brand text-sm font-semibold hover:underline"
                            >
                                Open inbox →
                            </NuxtLink>
                        </div>

                        <div
                            v-if="!recentNotifications.length"
                            class="py-6 text-center text-sm text-slate-500"
                        >
                            No recent activity. Share your listing to start getting views!
                        </div>

                        <div v-else class="space-y-2">
                            <div
                                v-for="n in recentNotifications"
                                :key="n.id"
                                :class="[
                                    'flex items-start gap-3 rounded-lg p-3 text-sm',
                                    n.is_read ? 'bg-white' : 'bg-brand/5',
                                ]"
                            >
                                <div class="text-lg">{{ iconFor(n.kind) }}</div>
                                <div class="min-w-0 flex-1">
                                    <p
                                        :class="[
                                            'truncate',
                                            n.is_read
                                                ? 'text-slate-700'
                                                : 'font-semibold text-slate-900',
                                        ]"
                                    >
                                        {{ n.title }}
                                    </p>
                                    <p v-if="n.body" class="truncate text-xs text-slate-500">
                                        {{ n.body }}
                                    </p>
                                </div>
                                <p class="flex-none text-[10px] text-slate-400">
                                    {{ relativeTime(n.created_at) }}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Sidebar -->
                <div class="space-y-4">
                    <!-- Profile card -->
                    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="flex items-center gap-3">
                            <div
                                class="bg-brand flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                            >
                                {{ initials }}
                            </div>
                            <div>
                                <p class="font-semibold text-slate-900">
                                    {{ fullName || user?.email }}
                                </p>
                                <p class="text-xs text-slate-500">{{ user?.email }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Quick links -->
                    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p
                            class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                            Quick links
                        </p>
                        <ul class="space-y-2 text-sm">
                            <li>
                                <NuxtLink to="/sell" class="hover:text-brand text-slate-700"
                                    >🏠 List a new home</NuxtLink
                                >
                            </li>
                            <li>
                                <NuxtLink to="/browse" class="hover:text-brand text-slate-700"
                                    >🔍 Browse listings</NuxtLink
                                >
                            </li>
                            <li>
                                <NuxtLink to="/dream-home" class="hover:text-brand text-slate-700"
                                    >✨ Dream Home Finder</NuxtLink
                                >
                            </li>
                            <li>
                                <NuxtLink to="/saved" class="hover:text-brand text-slate-700"
                                    >❤️ Saved homes</NuxtLink
                                >
                            </li>
                            <li>
                                <NuxtLink to="/inbox" class="hover:text-brand text-slate-700"
                                    >💬 Inbox</NuxtLink
                                >
                            </li>
                            <li>
                                <NuxtLink to="/paperwork" class="hover:text-brand text-slate-700"
                                    >📄 Paperwork directory</NuxtLink
                                >
                            </li>
                        </ul>
                    </div>

                    <!-- Sign out -->
                    <button
                        type="button"
                        class="w-full rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600"
                        @click="signOut"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
import type { Listing } from '~/types/listing'
import type { NotificationRow } from '~/composables/useNotifications'
import { formatPrice } from '~/composables/useListings'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const fullName = computed(() => (user.value?.user_metadata?.full_name as string | undefined) ?? '')
const firstName = computed(() => fullName.value.split(' ')[0] || '')
const initials = computed(() => {
    const source = fullName.value || user.value?.email || '?'
    const parts = source.split(/\s+|@/).filter(Boolean)
    return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? '')
})
const memberSince = computed(() => {
    if (!user.value?.created_at) return ''
    return new Date(user.value.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
})

// =====================================================
// Data loading
// =====================================================

interface ListingWithStats extends Listing {
    views?: number
    saves?: number
}

const myListings = ref<ListingWithStats[]>([])
const loadingListings = ref(true)
const recentNotifications = ref<NotificationRow[]>([])

const stats = reactive({
    unreadMessages: 0,
    savedCount: 0,
    myListingCount: 0,
    alertCount: 0,
})

// Load saved count from shared composable
const { savedIds } = useSaved()
watch(
    savedIds,
    (ids) => {
        stats.savedCount = ids.size
    },
    { immediate: true },
)

onMounted(async () => {
    if (!user.value) return

    // Parallel load: my listings, unread messages, notifications, alerts
    const [listingsRes, unreadRes, notifsRes, alertsRes] = await Promise.all([
        supabase
            .from('listings')
            .select(
                `id, address, city, state, zip, price, status, property_type, views, saves,
                 listing_photos ( url, is_primary )`,
            )
            .eq('user_id', user.value.id)
            .order('listed_at', { ascending: false }),

        supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', user.value.id)
            .eq('is_read', false),

        supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(8),

        supabase
            .from('search_alerts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.value.id),
    ])

    myListings.value = (listingsRes.data ?? []) as unknown as ListingWithStats[]
    stats.myListingCount = myListings.value.length
    stats.unreadMessages = unreadRes.count ?? 0
    recentNotifications.value = (notifsRes.data ?? []) as NotificationRow[]
    stats.alertCount = alertsRes.count ?? 0
    loadingListings.value = false
})

function primaryPhotoFor(l: ListingWithStats): string | null {
    const photos = (l.listing_photos ?? []) as { url: string; is_primary: boolean }[]
    return (photos.find((p) => p.is_primary) ?? photos[0])?.url ?? null
}

const ICONS: Record<string, string> = {
    offer: '💰',
    offer_accepted: '✅',
    offer_declined: '❌',
    offer_countered: '↪️',
    viewing_request: '📅',
    viewing_confirmed: '✅',
    viewing_declined: '❌',
    message: '💬',
    save: '❤️',
}
function iconFor(kind: string): string {
    return ICONS[kind] ?? '🔔'
}

function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime()
    const min = Math.floor(ms / 60000)
    if (min < 1) return 'just now'
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const d = Math.floor(hr / 24)
    if (d < 7) return `${d}d ago`
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function signOut() {
    await supabase.auth.signOut()
    await router.replace('/')
}

useSeoMeta({ title: 'My account — Frula Homes' })
</script>
