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
                <div
                    v-for="thread in threads"
                    :key="`${thread.listing_id}-${thread.other_user_id}`"
                    class="hover:border-brand group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-sm"
                >
                    <NuxtLink
                        :to="`/inbox/${thread.listing_id}/${thread.other_user_id}`"
                        class="block p-4"
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
                                    <p
                                        class="flex items-center gap-1.5 truncate font-semibold text-slate-900"
                                    >
                                        <span
                                            v-if="thread.flagged"
                                            class="text-amber-500"
                                            title="Flagged"
                                            >🚩</span
                                        >
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
                                <p
                                    :class="[
                                        'mt-1 truncate text-sm',
                                        thread.unread_count
                                            ? 'font-semibold text-slate-800'
                                            : 'text-slate-500',
                                    ]"
                                >
                                    {{ thread.last_message.body }}
                                </p>
                            </div>
                            <span
                                v-if="thread.unread_count"
                                class="bg-brand mt-1 inline-flex h-6 min-w-6 flex-none items-center justify-center rounded-full px-2 text-xs font-bold text-white"
                            >
                                {{ thread.unread_count }}
                            </span>
                        </div>
                    </NuxtLink>

                    <!-- Hover-revealed action bar — z-20 + pointer-events isolation
                         so the buttons reliably catch clicks instead of the wrapping
                         NuxtLink. The container itself ignores pointer events
                         (so empty space between buttons doesn't block link clicks),
                         but each button re-enables them. -->
                    <div
                        class="pointer-events-none absolute right-3 top-3 z-20 flex translate-y-1 items-center gap-1 opacity-0 transition focus-within:translate-y-0 focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
                    >
                        <button
                            type="button"
                            :title="thread.flagged ? 'Remove flag' : 'Flag thread'"
                            :class="[
                                'pointer-events-auto rounded-full bg-white p-1.5 text-base shadow ring-1 ring-slate-200 transition hover:scale-110',
                                thread.flagged
                                    ? 'text-amber-500'
                                    : 'text-slate-500 hover:text-amber-500',
                            ]"
                            @click.stop.prevent="toggleFlag(thread)"
                        >
                            🚩
                        </button>
                        <button
                            type="button"
                            title="Mark as unread"
                            :disabled="!thread.last_received_id"
                            class="pointer-events-auto rounded-full bg-white p-1.5 text-sm text-slate-500 shadow ring-1 ring-slate-200 transition hover:scale-110 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                            @click.stop.prevent="markUnread(thread)"
                        >
                            ✉️
                        </button>
                        <button
                            type="button"
                            title="Delete thread"
                            class="pointer-events-auto rounded-full bg-white p-1.5 text-sm text-slate-500 shadow ring-1 ring-slate-200 transition hover:scale-110 hover:text-red-600"
                            @click.stop.prevent="deleteThread(thread)"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { buildThreads, type Message, type Thread } from '~/composables/useMessages'
import { useUnreadBadge } from '~/composables/useUnreadBadge'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const { bump: bumpUnreadBadge } = useUnreadBadge()

// Helper: replace one thread in the list immutably so Vue reactivity
// definitely picks up the change. Mutating in place was unreliable here
// because the thread object came from useAsyncData and the property
// updates weren't always triggering re-renders.
function patchThread(target: Thread, patch: Partial<Thread>) {
    if (!threads.value) return
    threads.value = threads.value.map((t) =>
        t.listing_id === target.listing_id && t.other_user_id === target.other_user_id
            ? { ...t, ...patch }
            : t,
    )
}

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

// =====================================================
// Per-thread actions
// =====================================================

async function toggleFlag(thread: Thread) {
    if (!user.value || !threads.value) return
    const next = !thread.flagged
    const { error } = await supabase
        .from('messages')
        .update({ flagged: next })
        .eq('listing_id', thread.listing_id)
        .or(
            `and(sender_id.eq.${user.value.id},recipient_id.eq.${thread.other_user_id}),and(sender_id.eq.${thread.other_user_id},recipient_id.eq.${user.value.id})`,
        )
    if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to toggle flag:', error)
        return
    }
    patchThread(thread, { flagged: next })
}

async function markUnread(thread: Thread) {
    if (!thread.last_received_id) return
    const { error } = await supabase
        .from('messages')
        .update({ is_read: false })
        .eq('id', thread.last_received_id)
    if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to mark unread:', error)
        return
    }
    patchThread(thread, {
        unread_count: Math.max(thread.unread_count, 1),
        last_message: { ...thread.last_message, is_read: false },
    })
    bumpUnreadBadge()
}

async function deleteThread(thread: Thread) {
    if (!user.value || !threads.value) return
    const ok = window.confirm(
        `Delete this entire conversation with ${thread.other_user?.full_name || thread.other_user?.email || 'this user'}? This cannot be undone.`,
    )
    if (!ok) return
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('listing_id', thread.listing_id)
        .or(
            `and(sender_id.eq.${user.value.id},recipient_id.eq.${thread.other_user_id}),and(sender_id.eq.${thread.other_user_id},recipient_id.eq.${user.value.id})`,
        )
    if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to delete thread:', error)
        alert(`Could not delete: ${error.message}`)
        return
    }
    threads.value = threads.value.filter(
        (t) => !(t.listing_id === thread.listing_id && t.other_user_id === thread.other_user_id),
    )
    bumpUnreadBadge()
}

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
