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
            <h1 class="font-display text-3xl font-bold text-slate-900">My transactions</h1>
            <p class="mt-2 text-slate-600">Active offers and closings you're part of.</p>

            <div v-if="pending" class="mt-8 space-y-3">
                <div v-for="n in 3" :key="n" class="h-28 animate-pulse rounded-2xl bg-slate-200" />
            </div>

            <div
                v-else-if="!rows.length"
                class="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
            >
                <p class="font-semibold text-slate-700">No active transactions</p>
                <p class="mt-1 text-sm text-slate-500">
                    When you start a transaction from a message thread, it'll show up here.
                </p>
            </div>

            <div v-else class="mt-8 space-y-3">
                <NuxtLink
                    v-for="row in rows"
                    :key="row.transaction.id"
                    :to="`/transaction/${row.transaction.id}`"
                    class="hover:border-brand block rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
                >
                    <div class="flex items-start gap-4">
                        <img
                            v-if="row.primary_photo"
                            :src="row.primary_photo"
                            class="h-20 w-28 flex-none rounded-lg object-cover"
                            alt=""
                        />
                        <div v-else class="h-20 w-28 flex-none rounded-lg bg-slate-100" />
                        <div class="min-w-0 flex-1">
                            <p class="truncate font-semibold text-slate-900">
                                {{ row.listing?.address }}
                            </p>
                            <p class="truncate text-sm text-slate-600">
                                {{ row.listing?.city }}, {{ row.listing?.state }}
                            </p>
                            <p class="mt-1 text-xs text-slate-500">
                                You are the <strong>{{ row.my_role }}</strong>
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs uppercase tracking-wide text-slate-500">Started</p>
                            <p class="text-sm font-medium text-slate-900">
                                {{ formatDate(row.transaction.created_at) }}
                            </p>
                        </div>
                    </div>
                </NuxtLink>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import type { Transaction } from '~/composables/useTransactions'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

watchEffect(() => {
    if (!user.value && import.meta.client) router.replace('/login')
})

interface Row {
    transaction: Transaction
    listing: { id: string; address: string; city: string; state: string; price: number } | null
    primary_photo?: string
    my_role: 'seller' | 'buyer'
}

const { data: rows, pending } = await useAsyncData<Row[]>('my-transactions', async () => {
    if (!user.value) return []
    const myId = user.value.id

    const { data: txns, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`seller_id.eq.${myId},buyer_id.eq.${myId}`)
        .order('created_at', { ascending: false })
    if (error) throw error
    if (!txns?.length) return []

    const listingIds = txns.map((t) => t.listing_id)
    const { data: listings } = await supabase
        .from('listings')
        .select('id, address, city, state, price, listing_photos(url, is_primary)')
        .in('id', listingIds)

    const listingsMap = new Map((listings ?? []).map((l) => [l.id, l]))

    return txns.map((t) => {
        const listing = listingsMap.get(t.listing_id)
        const photos =
            (listing?.listing_photos as { url: string; is_primary: boolean }[] | undefined) ?? []
        return {
            transaction: t as Transaction,
            listing: listing
                ? {
                      id: listing.id,
                      address: listing.address,
                      city: listing.city,
                      state: listing.state,
                      price: listing.price,
                  }
                : null,
            primary_photo: (photos.find((p) => p.is_primary) ?? photos[0])?.url,
            my_role: (t.seller_id === myId ? 'seller' : 'buyer') as 'seller' | 'buyer',
        }
    })
})

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

useSeoMeta({ title: 'My transactions — Frula Homes', robots: 'noindex' })
</script>
