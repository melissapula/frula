<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                    >Frula Homes</NuxtLink
                >
                <AuthNav />
            </div>
        </header>

        <div class="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
            <h1 class="font-display text-3xl font-bold text-slate-900">Inbox</h1>

            <div v-if="pending" class="mt-8 space-y-3">
                <div v-for="n in 3" :key="n" class="h-20 animate-pulse rounded-2xl bg-slate-200" />
            </div>

            <div
                v-else-if="!threads.length"
                class="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
            >
                <p class="font-semibold text-slate-700">No messages yet</p>
                <p class="mt-1 text-sm text-slate-500">
                    Browse listings and tap "Contact seller" to start a conversation.
                </p>
                <NuxtLink
                    to="/browse"
                    class="bg-brand hover:bg-brand-600 mt-6 inline-block rounded-full px-6 py-2 text-sm font-semibold text-white"
                >
                    Browse listings
                </NuxtLink>
            </div>

            <div v-else class="mt-8 space-y-3">
                <NuxtLink
                    v-for="thread in threads"
                    :key="`${thread.listing_id}-${thread.other_user_id}`"
                    :to="`/inbox/${thread.listing_id}/${thread.other_user_id}`"
                    class="hover:border-brand block rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
                >
                    <div class="flex items-start gap-4">
                        <img
                            v-if="primaryPhoto(thread)"
                            :src="primaryPhoto(thread)!"
                            class="h-16 w-20 flex-none rounded-lg object-cover"
                            alt=""
                        />
                        <div v-else class="h-16 w-20 flex-none rounded-lg bg-slate-100" />
                        <div class="min-w-0 flex-1">
                            <div class="flex items-baseline justify-between gap-2">
                                <p class="truncate font-semibold text-slate-900">
                                    {{
                                        thread.other_user?.full_name ||
                                        thread.other_user?.email ||
                                        'Unknown user'
                                    }}
                                </p>
                                <p class="flex-none text-xs text-slate-500">
                                    {{ relativeTime(thread.last_message.created_at) }}
                                </p>
                            </div>
                            <p class="truncate text-sm text-slate-600">
                                {{ thread.listing?.address || 'Listing' }} ·
                                {{ thread.listing?.city }}
                            </p>
                            <p class="mt-1 truncate text-sm text-slate-500">
                                {{ thread.last_message.body }}
                            </p>
                        </div>
                        <span
                            v-if="thread.unread_count"
                            class="bg-brand inline-flex h-6 min-w-6 flex-none items-center justify-center rounded-full px-2 text-xs font-bold text-white"
                        >
                            {{ thread.unread_count }}
                        </span>
                    </div>
                </NuxtLink>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { buildThreads, type Message, type Thread } from '~/composables/useMessages'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

watchEffect(() => {
    if (!user.value && import.meta.client) router.replace('/login')
})

const { data: threads, pending } = await useAsyncData<Thread[]>('inbox', async () => {
    if (!user.value) return []
    const myId = user.value.id

    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${myId},recipient_id.eq.${myId}`)
        .order('created_at', { ascending: false })
    if (error) throw error

    const grouped = buildThreads((messages ?? []) as Message[], myId)
    if (!grouped.length) return []

    const listingIds = [...new Set(grouped.map((t) => t.listing_id))]
    const userIds = [...new Set(grouped.map((t) => t.other_user_id))]

    const [listingsRes, profilesRes] = await Promise.all([
        supabase
            .from('listings')
            .select('id, address, city, state, price, listing_photos(url, is_primary)')
            .in('id', listingIds),
        supabase.from('profiles').select('id, full_name, email').in('id', userIds),
    ])

    const listingsMap = new Map((listingsRes.data ?? []).map((l) => [l.id, l]))
    const usersMap = new Map((profilesRes.data ?? []).map((u) => [u.id, u]))

    return grouped.map((t) => ({
        ...t,
        listing: (listingsMap.get(t.listing_id) as Thread['listing']) ?? null,
        other_user: (usersMap.get(t.other_user_id) as Thread['other_user']) ?? null,
    }))
})

function primaryPhoto(thread: Thread) {
    const photos = thread.listing?.listing_photos ?? []
    return (photos.find((p) => p.is_primary) ?? photos[0])?.url
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

useSeoMeta({ title: 'Inbox — Frula Homes' })
</script>
