<template>
    <main class="flex min-h-screen flex-col bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-8">
                <div class="flex items-center gap-4">
                    <NuxtLink
                        to="/inbox"
                        class="hover:text-brand text-sm font-medium text-slate-600"
                    >
                        ← Inbox
                    </NuxtLink>
                </div>
                <AuthNav />
            </div>
        </header>

        <!-- Listing context -->
        <NuxtLink
            v-if="listing"
            :to="`/listing/${listing.id}`"
            class="mx-auto w-full max-w-3xl border-b border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 md:px-8"
        >
            <div class="flex items-center gap-3">
                <img
                    v-if="primaryPhoto"
                    :src="primaryPhoto"
                    class="h-12 w-16 flex-none rounded-lg object-cover"
                    alt=""
                />
                <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-slate-900">
                        {{ listing.address }}
                    </p>
                    <p class="truncate text-xs text-slate-500">
                        {{ listing.city }}, {{ listing.state }} · {{ formatPrice(listing.price) }}
                    </p>
                </div>
                <p class="text-xs text-slate-500">View →</p>
            </div>
        </NuxtLink>

        <!-- Messages -->
        <div class="mx-auto w-full max-w-3xl flex-1 space-y-3 px-4 py-6 md:px-8">
            <div v-if="pending" class="flex justify-center text-sm text-slate-400">Loading…</div>

            <div
                v-else-if="!messages.length"
                class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500"
            >
                No messages yet. Send the first one below.
            </div>

            <div v-else>
                <div
                    v-for="m in messages"
                    :key="m.id"
                    :class="['flex', m.sender_id === myId ? 'justify-end' : 'justify-start']"
                >
                    <div
                        :class="[
                            'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                            m.sender_id === myId
                                ? 'bg-brand text-white'
                                : 'border border-slate-200 bg-white text-slate-900',
                        ]"
                    >
                        <p class="whitespace-pre-wrap">{{ m.body }}</p>
                        <p
                            :class="[
                                'mt-1 text-[10px]',
                                m.sender_id === myId ? 'text-white/70' : 'text-slate-400',
                            ]"
                        >
                            {{ formatTime(m.created_at) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Composer -->
        <form
            class="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 md:px-8"
            @submit.prevent="send"
        >
            <div class="mx-auto flex max-w-3xl items-end gap-3">
                <textarea
                    v-model="draft"
                    rows="1"
                    placeholder="Type a message…"
                    class="focus:border-brand focus:ring-brand max-h-32 flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-1"
                    @keydown.enter.exact.prevent="send"
                />
                <button
                    type="submit"
                    :disabled="sending || !draft.trim()"
                    class="bg-brand hover:bg-brand-600 flex-none rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
                >
                    Send
                </button>
            </div>
        </form>
    </main>
</template>

<script setup lang="ts">
import type { Message } from '~/composables/useMessages'
import { formatPrice } from '~/composables/useListings'

definePageMeta({ layout: false })

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const listingId = computed(() => route.params.listingId as string)
const otherUserId = computed(() => route.params.userId as string)

watchEffect(() => {
    if (!user.value && import.meta.client) router.replace('/login')
})

const myId = computed(() => user.value?.id ?? '')

const messages = ref<Message[]>([])
const pending = ref(true)
const draft = ref('')
const sending = ref(false)

const { data: listing } = await useAsyncData(`thread-listing-${listingId.value}`, async () => {
    const { data } = await supabase
        .from('listings')
        .select('id, address, city, state, price, listing_photos(url, is_primary)')
        .eq('id', listingId.value)
        .maybeSingle()
    return data
})

const primaryPhoto = computed(() => {
    const photos =
        (listing.value?.listing_photos as { url: string; is_primary: boolean }[] | undefined) ?? []
    return (photos.find((p) => p.is_primary) ?? photos[0])?.url
})

async function loadMessages() {
    if (!user.value) return
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('listing_id', listingId.value)
        .or(
            `and(sender_id.eq.${myId.value},recipient_id.eq.${otherUserId.value}),and(sender_id.eq.${otherUserId.value},recipient_id.eq.${myId.value})`,
        )
        .order('created_at', { ascending: true })
    if (error) {
        console.error(error)
        return
    }
    messages.value = (data ?? []) as Message[]

    // Mark received messages as read
    const unreadIds = messages.value
        .filter((m) => m.recipient_id === myId.value && !m.is_read)
        .map((m) => m.id)
    if (unreadIds.length) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds)
    }
}

onMounted(async () => {
    await loadMessages()
    pending.value = false

    // Subscribe to realtime inserts on this thread
    const channel = supabase
        .channel(`messages:${listingId.value}:${myId.value}:${otherUserId.value}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `listing_id=eq.${listingId.value}`,
            },
            (payload) => {
                const m = payload.new as Message
                const isThisThread =
                    (m.sender_id === myId.value && m.recipient_id === otherUserId.value) ||
                    (m.sender_id === otherUserId.value && m.recipient_id === myId.value)
                if (isThisThread && !messages.value.some((x) => x.id === m.id)) {
                    messages.value.push(m)
                }
            },
        )
        .subscribe()

    onUnmounted(() => {
        supabase.removeChannel(channel)
    })
})

async function send() {
    const body = draft.value.trim()
    if (!body || !user.value) return
    sending.value = true
    const { data, error } = await supabase
        .from('messages')
        .insert({
            listing_id: listingId.value,
            sender_id: myId.value,
            recipient_id: otherUserId.value,
            body,
        })
        .select()
        .single()
    sending.value = false
    if (error) {
        alert(error.message)
        return
    }
    draft.value = ''
    if (data && !messages.value.some((m) => m.id === data.id)) {
        messages.value.push(data as Message)
    }
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

useSeoMeta({ title: 'Conversation — Frula Homes' })
</script>
