<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
                <div class="flex items-center gap-6">
                    <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                        >Frula Homes</NuxtLink
                    >
                    <NuxtLink
                        to="/transactions"
                        class="hover:text-brand hidden text-sm font-medium text-slate-600 sm:block"
                    >
                        ← My transactions
                    </NuxtLink>
                </div>
                <AuthNav />
            </div>
        </header>

        <div v-if="pending" class="mx-auto max-w-6xl p-8">
            <div class="aspect-[3/1] animate-pulse rounded-2xl bg-slate-200" />
        </div>

        <div v-else-if="loadError" class="mx-auto max-w-6xl p-8">
            <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
                <p class="font-semibold">Could not load this transaction.</p>
                <p class="mt-1 text-sm">{{ loadError }}</p>
            </div>
        </div>

        <div v-else-if="transaction" class="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
            <!-- Listing summary -->
            <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex flex-col gap-4 md:flex-row md:items-center">
                    <img
                        v-if="primaryPhoto"
                        :src="primaryPhoto"
                        class="h-24 w-32 flex-none rounded-lg object-cover"
                        alt=""
                    />
                    <div class="min-w-0 flex-1">
                        <p class="text-brand-700 text-xs font-semibold uppercase tracking-wide">
                            Active transaction
                        </p>
                        <NuxtLink :to="`/listing/${listing?.id}`" class="hover:text-brand block">
                            <h1 class="font-display text-2xl font-bold text-slate-900">
                                {{ listing?.address }}
                            </h1>
                            <p class="text-sm text-slate-600">
                                {{ listing?.city }}, {{ listing?.state }} {{ listing?.zip }}
                            </p>
                        </NuxtLink>
                    </div>
                    <div class="flex-none text-right">
                        <p class="text-xs uppercase tracking-wide text-slate-500">Listing price</p>
                        <p class="font-display text-2xl font-bold text-slate-900">
                            {{ listing ? formatPrice(listing.price) : '' }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- State coverage notice -->
            <div
                v-if="!isFullCoverageState"
                class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
                <strong class="block">Reference checklist:</strong>
                Showing the Minnesota residential checklist as a starting point. Full
                {{ listing?.state || 'state-specific' }} guidance is on the roadmap as we expand
                state coverage.
            </div>

            <!-- Two checklists side by side -->
            <div class="mt-6 grid gap-6 lg:grid-cols-2">
                <ChecklistColumn
                    v-if="sellerChecklist"
                    role="seller"
                    :checklist="sellerChecklist"
                    :my-role="myRole"
                    :other-name="counterpartyName('seller')"
                    @toggle="(item) => toggleItem(sellerChecklist!, item)"
                />
                <ChecklistColumn
                    v-if="buyerChecklist"
                    role="buyer"
                    :checklist="buyerChecklist"
                    :my-role="myRole"
                    :other-name="counterpartyName('buyer')"
                    @toggle="(item) => toggleItem(buyerChecklist!, item)"
                />
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import {
    type ChecklistItem,
    type Transaction,
    type TransactionChecklist,
} from '~/composables/useTransactions'
import { formatPrice } from '~/composables/useListings'
import { FULL_COVERAGE_STATES } from '~/composables/useStates'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

watchEffect(() => {
    if (!user.value && import.meta.client) router.replace('/login')
})

const transactionId = computed(() => route.params.id as string)

const transaction = ref<Transaction | null>(null)
const sellerChecklist = ref<TransactionChecklist | null>(null)
const buyerChecklist = ref<TransactionChecklist | null>(null)
const listing = ref<{
    id: string
    address: string
    city: string
    state: string
    zip: string
    price: number
    listing_photos: { url: string; is_primary: boolean }[]
} | null>(null)
const profiles = ref<Record<string, { full_name: string | null; email: string }>>({})
const pending = ref(true)
const loadError = ref<string | null>(null)

const myRole = computed<'seller' | 'buyer' | null>(() => {
    if (!transaction.value || !user.value) return null
    if (transaction.value.seller_id === user.value.id) return 'seller'
    if (transaction.value.buyer_id === user.value.id) return 'buyer'
    return null
})

const primaryPhoto = computed(() => {
    const photos = listing.value?.listing_photos ?? []
    return (photos.find((p) => p.is_primary) ?? photos[0])?.url
})

const isFullCoverageState = computed(() => {
    return listing.value ? FULL_COVERAGE_STATES.includes(listing.value.state) : true
})

function counterpartyName(role: 'seller' | 'buyer') {
    if (!transaction.value) return ''
    const id = role === 'seller' ? transaction.value.seller_id : transaction.value.buyer_id
    if (!id) return ''
    const profile = profiles.value[id]
    return profile?.full_name || profile?.email || (role === 'seller' ? 'Seller' : 'Buyer')
}

async function loadAll() {
    pending.value = true
    loadError.value = null

    const { data: txn, error: txnErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId.value)
        .maybeSingle()

    if (txnErr || !txn) {
        loadError.value = txnErr?.message || 'Transaction not found.'
        pending.value = false
        return
    }
    transaction.value = txn as Transaction

    const [{ data: checklists }, { data: listingRow }] = await Promise.all([
        supabase
            .from('transaction_checklists')
            .select('*')
            .eq('transaction_id', transactionId.value),
        supabase
            .from('listings')
            .select('id, address, city, state, zip, price, listing_photos(url, is_primary)')
            .eq('id', txn.listing_id)
            .maybeSingle(),
    ])

    sellerChecklist.value =
        ((checklists ?? []).find((c) => c.role === 'seller') as TransactionChecklist | undefined) ??
        null
    buyerChecklist.value =
        ((checklists ?? []).find((c) => c.role === 'buyer') as TransactionChecklist | undefined) ??
        null
    listing.value = listingRow as typeof listing.value

    const userIds = [txn.seller_id, txn.buyer_id].filter(Boolean) as string[]
    if (userIds.length) {
        const { data: profileRows } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds)
        profiles.value = Object.fromEntries((profileRows ?? []).map((p) => [p.id, p]))
    }

    pending.value = false
}

async function toggleItem(checklist: TransactionChecklist, item: ChecklistItem) {
    if (!user.value) return
    // Only the owning party can toggle their own checklist items
    if (myRole.value !== checklist.role) return

    const updated = checklist.items.map((it) =>
        it.id === item.id
            ? {
                  ...it,
                  completed: !it.completed,
                  completed_at: !it.completed ? new Date().toISOString() : null,
                  completed_by: !it.completed ? user.value!.id : null,
              }
            : it,
    )

    // Optimistic local update
    checklist.items = updated

    const { error } = await supabase
        .from('transaction_checklists')
        .update({ items: updated, updated_at: new Date().toISOString() })
        .eq('id', checklist.id)

    if (error) {
        alert('Could not save: ' + error.message)
        await loadAll()
        return
    }

    // Notify the other party via the messages table (in-app notification).
    if (transaction.value && listing.value) {
        const otherId =
            checklist.role === 'seller' ? transaction.value.buyer_id : transaction.value.seller_id
        const newState = updated.find((i) => i.id === item.id)
        if (otherId && newState?.completed) {
            await supabase.from('messages').insert({
                listing_id: listing.value.id,
                sender_id: user.value.id,
                recipient_id: otherId,
                body: `✓ Checked off: ${item.title}`,
            })
        }
    }
}

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

onMounted(async () => {
    await loadAll()

    realtimeChannel = supabase
        .channel(`transaction:${transactionId.value}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'transaction_checklists',
                filter: `transaction_id=eq.${transactionId.value}`,
            },
            (payload) => {
                const row = payload.new as TransactionChecklist
                if (row.role === 'seller' && sellerChecklist.value?.id === row.id) {
                    sellerChecklist.value = { ...sellerChecklist.value, items: row.items }
                } else if (row.role === 'buyer' && buyerChecklist.value?.id === row.id) {
                    buyerChecklist.value = { ...buyerChecklist.value, items: row.items }
                }
            },
        )
        .subscribe()
})

onUnmounted(() => {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

useSeoMeta({ title: 'Transaction — Frula Homes' })
</script>
