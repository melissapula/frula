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
        <div
            v-if="listing"
            class="mx-auto w-full max-w-3xl border-b border-slate-200 bg-white px-4 py-3 md:px-8"
        >
            <div class="flex items-center gap-3">
                <NuxtLink
                    :to="`/listing/${listing.id}`"
                    class="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
                >
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
                            {{ listing.city }}, {{ listing.state }} ·
                            {{ formatPrice(listing.price) }}
                        </p>
                    </div>
                </NuxtLink>
                <NuxtLink
                    v-if="existingTransactionId"
                    :to="`/transaction/${existingTransactionId}`"
                    class="bg-brand hover:bg-brand-600 flex-none rounded-full px-4 py-2 text-xs font-semibold text-white"
                >
                    Open transaction
                </NuxtLink>
                <button
                    v-else
                    type="button"
                    :disabled="startingTxn"
                    class="hover:border-brand hover:text-brand flex-none rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                    @click="startTransaction"
                >
                    {{ startingTxn ? 'Starting…' : 'Start transaction' }}
                </button>
            </div>
        </div>

        <!-- First message form (shown when no messages yet) -->
        <div v-if="!pending && !messages.length" class="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <h2 class="font-display text-xl font-bold text-slate-900">Contact the seller</h2>
                <p class="mt-1 text-sm text-slate-500">
                    Send a message about
                    <strong>{{ listing?.address }}</strong>
                    <span v-if="listing">
                        · {{ listing.city }}, {{ listing.state }} ·
                        {{ formatPrice(listing.price) }}</span
                    >
                </p>

                <form class="mt-6 space-y-4" @submit.prevent="sendFirstMessage">
                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Your name</label
                        >
                        <input
                            v-model="contactName"
                            type="text"
                            required
                            class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                            :placeholder="user?.user_metadata?.full_name || 'Your name'"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Phone number
                            <span class="font-normal normal-case text-slate-400">(optional)</span>
                        </label>
                        <input
                            v-model="contactPhone"
                            type="tel"
                            class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Message</label
                        >
                        <textarea
                            v-model="contactMessage"
                            rows="4"
                            required
                            class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                            :placeholder="`Hi, I'm interested in ${listing?.address || 'this property'}. Is it still available?`"
                        />
                    </div>

                    <button
                        type="submit"
                        :disabled="sending || !contactMessage.trim() || !contactName.trim()"
                        class="bg-brand hover:bg-brand-600 w-full rounded-full px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                    >
                        {{ sending ? 'Sending…' : 'Send message' }}
                    </button>
                    <p v-if="sendError" class="mt-2 text-xs text-red-700">
                        {{ sendError }}
                    </p>
                </form>
            </div>
        </div>

        <!-- Messages (shown after first message is sent) -->
        <div v-else class="mx-auto w-full max-w-3xl flex-1 space-y-3 px-4 py-6 md:px-8">
            <div v-if="pending" class="flex justify-center text-sm text-slate-400">Loading…</div>

            <div v-else class="space-y-3">
                <div
                    v-for="m in messages"
                    :key="m.id"
                    :class="['flex', m.sender_id === myId ? 'justify-end' : 'justify-start']"
                >
                    <!-- Offer card -->
                    <OfferCard
                        v-if="m.kind === 'offer' && m.payload"
                        :payload="m.payload as OfferPayload"
                        :can-act="m.recipient_id === myId"
                        :from-me="m.sender_id === myId"
                        @accept="acceptOffer(m)"
                        @counter="counterOffer(m)"
                        @decline="declineOffer(m)"
                    />

                    <!-- Viewing card -->
                    <ViewingCard
                        v-else-if="m.kind === 'viewing_request' && m.payload"
                        :payload="m.payload as ViewingPayload"
                        :can-act="m.recipient_id === myId"
                        :from-me="m.sender_id === myId"
                        @confirm="confirmViewing(m)"
                        @decline="declineViewing(m)"
                    />

                    <!-- Plain text bubble -->
                    <div
                        v-else
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

            <!-- Counter-offer modal (only mounted when needed) -->
            <OfferModal
                v-if="counterModalOpen && counterContext"
                :open="counterModalOpen"
                :listing-id="listingId"
                :recipient-id="counterContext.recipientId"
                :listing-address="listing?.address ?? ''"
                :listing-price="listing?.price ?? 0"
                :initial-price="counterContext.initialPrice"
                mode="counter"
                @close="counterModalOpen = false"
                @sent="onCounterSent"
            />
        </div>

        <!-- Composer (hidden when contact form is showing) -->
        <form
            v-if="messages.length || pending"
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
            <p v-if="sendError" class="px-4 text-xs text-red-700 md:px-8">
                {{ sendError }}
            </p>
        </form>
    </main>
</template>

<script setup lang="ts">
import type { Message, OfferPayload, ViewingPayload } from '~/composables/useMessages'
import { formatPrice } from '~/composables/useListings'
import { useUnreadBadge } from '~/composables/useUnreadBadge'
import { useNotificationEmail } from '~/composables/useNotificationEmail'

const { bump: bumpUnreadBadge } = useUnreadBadge()
const { notify } = useNotificationEmail()

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
const sendError = ref<string | null>(null)

// First-message contact form
const contactName = ref(user.value?.user_metadata?.full_name ?? '')
const contactPhone = ref('')
const contactMessage = ref('')

async function sendFirstMessage() {
    const name = contactName.value.trim()
    const phone = contactPhone.value.trim()
    const msg = contactMessage.value.trim()
    if (!name || !msg || !user.value) return

    // Build the message body with contact info
    const parts = [`${msg}`, '', `— ${name}`]
    if (phone) parts.push(`Phone: ${phone}`)

    sending.value = true
    const { data, error } = await supabase
        .from('messages')
        .insert({
            listing_id: listingId.value,
            sender_id: myId.value,
            recipient_id: otherUserId.value,
            body: parts.join('\n'),
        })
        .select()
        .single()
    sending.value = false

    if (error) {
        sendError.value = error.message || 'Failed to send message. Please try again.'
        return
    }
    if (data && !messages.value.some((m) => m.id === data.id)) {
        messages.value.push(data as Message)
        notify(data.id)
    }
}

const { data: listing } = await useAsyncData(`thread-listing-${listingId.value}`, async () => {
    const { data } = await supabase
        .from('listings')
        .select('id, user_id, address, city, state, zip, price, listing_photos(url, is_primary)')
        .eq('id', listingId.value)
        .maybeSingle()
    return data
})

const existingTransactionId = ref<string | null>(null)
const startingTxn = ref(false)

async function loadExistingTransaction() {
    if (!user.value) return
    const { data } = await supabase
        .from('transactions')
        .select('id')
        .eq('listing_id', listingId.value)
        .or(
            `and(seller_id.eq.${myId.value},buyer_id.eq.${otherUserId.value}),and(seller_id.eq.${otherUserId.value},buyer_id.eq.${myId.value})`,
        )
        .maybeSingle()
    existingTransactionId.value = (data?.id as string | undefined) ?? null
}

async function startTransaction() {
    if (!user.value || !listing.value) return
    startingTxn.value = true

    // Determine seller / buyer roles from the listing
    const sellerId = listing.value.user_id as string
    const buyerId = sellerId === myId.value ? otherUserId.value : myId.value
    if (sellerId === buyerId) {
        startingTxn.value = false
        sendError.value = "You can't start a transaction with yourself."
        return
    }

    // Create the transaction
    const { data: txn, error: txnErr } = await supabase
        .from('transactions')
        .insert({
            listing_id: listing.value.id,
            seller_id: sellerId,
            buyer_id: buyerId,
        })
        .select('id')
        .single()

    if (txnErr || !txn) {
        startingTxn.value = false
        sendError.value = txnErr?.message || 'Could not start transaction.'
        return
    }

    // Pull both checklist templates (any state — MN is the reference for now)
    const { data: templates } = await supabase
        .from('checklist_templates')
        .select('role, items')
        .eq('property_type', 'residential')
        .in('role', ['seller', 'buyer'])

    const sellerItems = templates?.find((t) => t.role === 'seller')?.items ?? []
    const buyerItems = templates?.find((t) => t.role === 'buyer')?.items ?? []

    const seedItems = (raw: unknown[]) =>
        (raw as Record<string, unknown>[]).map((it) => ({
            ...it,
            completed: false,
            completed_at: null,
            completed_by: null,
        }))

    await supabase.from('transaction_checklists').insert([
        {
            transaction_id: txn.id,
            user_id: sellerId,
            role: 'seller',
            items: seedItems(sellerItems as unknown[]),
        },
        {
            transaction_id: txn.id,
            user_id: buyerId,
            role: 'buyer',
            items: seedItems(buyerItems as unknown[]),
        },
    ])

    // Drop a system message into the thread
    await supabase.from('messages').insert({
        listing_id: listing.value.id,
        sender_id: myId.value,
        recipient_id: otherUserId.value,
        body: '🤝 Started a transaction. Both checklists are now active.',
    })

    startingTxn.value = false
    router.push(`/transaction/${txn.id}`)
}

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
        // Tell the global navbar badge to recount immediately
        bumpUnreadBadge()
    }
}

onMounted(async () => {
    await Promise.all([loadMessages(), loadExistingTransaction()])
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
            async (payload) => {
                const m = payload.new as Message
                const isThisThread =
                    (m.sender_id === myId.value && m.recipient_id === otherUserId.value) ||
                    (m.sender_id === otherUserId.value && m.recipient_id === myId.value)
                if (isThisThread && !messages.value.some((x) => x.id === m.id)) {
                    messages.value.push(m)
                    // If a new message arrived while we're sitting in the open thread,
                    // mark it as read immediately so the badge stays accurate.
                    if (m.recipient_id === myId.value && !m.is_read) {
                        await supabase.from('messages').update({ is_read: true }).eq('id', m.id)
                        bumpUnreadBadge()
                    }
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
        sendError.value = error.message || 'Failed to send message. Please try again.'
        return
    }
    draft.value = ''
    sendError.value = null
    if (data && !messages.value.some((m) => m.id === data.id)) {
        messages.value.push(data as Message)
        // Fire the email notification (non-blocking, fails silently)
        notify(data.id)
    }
}

// =====================================================
// Offer / viewing actions
// =====================================================

const counterModalOpen = ref(false)
const counterContext = ref<{ recipientId: string; initialPrice: number } | null>(null)

async function patchMessagePayload(messageId: string, patch: Record<string, unknown>) {
    // Reactively update local state first so the UI feels instant
    const msg = messages.value.find((m) => m.id === messageId)
    if (msg && msg.payload) {
        msg.payload = { ...msg.payload, ...patch } as typeof msg.payload
    }
    const newPayload = msg?.payload
    const { error } = await supabase
        .from('messages')
        .update({ payload: newPayload })
        .eq('id', messageId)
    if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to update message payload:', error)
    }
}

async function dropSystemMessage(body: string) {
    if (!user.value) return
    await supabase.from('messages').insert({
        listing_id: listingId.value,
        sender_id: myId.value,
        recipient_id: otherUserId.value,
        body,
    })
}

async function acceptOffer(m: Message) {
    if (
        !confirm(
            'Accept this offer? This will start a transaction and unlock the post-offer checklists.',
        )
    )
        return

    await patchMessagePayload(m.id, { status: 'accepted' })

    // Reuse the existing transaction-creation flow if one doesn't already exist
    if (!existingTransactionId.value) {
        await startTransaction()
    }

    const offerPrice = (m.payload as OfferPayload | null)?.offer_price
    await dropSystemMessage(
        `✅ Offer accepted${offerPrice ? ` at ${formatPrice(offerPrice)}` : ''}. Transaction is now open.`,
    )
}

function counterOffer(m: Message) {
    const payload = m.payload as OfferPayload | null
    if (!payload) return
    counterContext.value = {
        // Counter goes back to whoever sent the original offer
        recipientId: m.sender_id,
        initialPrice: payload.offer_price,
    }
    counterModalOpen.value = true
}

async function onCounterSent() {
    counterModalOpen.value = false
    // Mark the original offer as countered (look up the most recent pending offer
    // received from the other party — there's only ever one in practice)
    const original = [...messages.value]
        .reverse()
        .find(
            (m) =>
                m.kind === 'offer' &&
                m.recipient_id === myId.value &&
                (m.payload as OfferPayload | null)?.status === 'pending',
        )
    if (original) await patchMessagePayload(original.id, { status: 'countered' })
}

async function declineOffer(m: Message) {
    const reason =
        window.prompt("Optional: tell the buyer why you're declining (leave blank to skip)") ?? ''
    await patchMessagePayload(m.id, { status: 'declined' })
    const offerPrice = (m.payload as OfferPayload | null)?.offer_price
    await dropSystemMessage(
        `✗ Offer${offerPrice ? ` of ${formatPrice(offerPrice)}` : ''} declined.${
            reason.trim() ? `\n\nReason: ${reason.trim()}` : ''
        }`,
    )
}

async function confirmViewing(m: Message) {
    await patchMessagePayload(m.id, { status: 'confirmed' })
    const payload = m.payload as ViewingPayload | null
    const dateStr = payload?.date_primary ? ` for ${payload.date_primary}` : ''
    await dropSystemMessage(`✅ Viewing confirmed${dateStr}.`)
}

async function declineViewing(m: Message) {
    const reason =
        window.prompt('Optional: suggest another time or explain why (leave blank to skip)') ?? ''
    await patchMessagePayload(m.id, { status: 'declined' })
    await dropSystemMessage(
        `✗ Viewing request declined.${reason.trim() ? `\n\n${reason.trim()}` : ''}`,
    )
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

useSeoMeta({ title: 'Conversation — Frula Homes', robots: 'noindex' })
</script>
