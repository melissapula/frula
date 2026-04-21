<template>
    <div
        class="w-full max-w-sm overflow-hidden rounded-2xl border-2 bg-white shadow-md"
        :class="statusBorder"
    >
        <!-- Header -->
        <div class="bg-brand-50 border-b border-slate-200 px-4 py-3">
            <div class="flex items-center justify-between">
                <p class="text-brand text-xs font-bold uppercase tracking-wider">
                    💰 {{ headerLabel }}
                </p>
                <span
                    v-if="statusLabel"
                    :class="[
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                        statusPill,
                    ]"
                >
                    {{ statusLabel }}
                </span>
            </div>
            <div class="font-display mt-1 text-3xl font-bold text-slate-900">
                {{ formatPrice(payload.offer_price) }}
            </div>
            <p v-if="comparedToAsking" class="mt-0.5 text-xs text-slate-500">
                {{ comparedToAsking }}
            </p>
        </div>

        <!-- Body -->
        <dl class="space-y-2 px-4 py-3 text-xs">
            <div class="flex justify-between">
                <dt class="font-semibold text-slate-500">Financing</dt>
                <dd class="text-slate-800">{{ FINANCING_LABELS[payload.financing] }}</dd>
            </div>
            <div v-if="payload.earnest_money" class="flex justify-between">
                <dt class="font-semibold text-slate-500">Earnest money</dt>
                <dd class="text-slate-800">{{ formatPrice(payload.earnest_money) }}</dd>
            </div>
            <div v-if="payload.closing_date" class="flex justify-between">
                <dt class="font-semibold text-slate-500">Proposed closing</dt>
                <dd class="text-slate-800">{{ formatDate(payload.closing_date) }}</dd>
            </div>
            <div v-if="contingencyList.length" class="flex justify-between gap-3">
                <dt class="flex-none font-semibold text-slate-500">Contingencies</dt>
                <dd class="text-right text-slate-800">{{ contingencyList.join(', ') }}</dd>
            </div>
            <div v-if="payload.note" class="border-t border-slate-100 pt-2">
                <dt class="mb-1 font-semibold text-slate-500">Note from buyer</dt>
                <dd class="whitespace-pre-wrap text-slate-700">{{ payload.note }}</dd>
            </div>
        </dl>

        <!-- Actions -->
        <div
            v-if="canAct && payload.status === 'pending'"
            class="grid grid-cols-3 gap-px border-t border-slate-200 bg-slate-200"
        >
            <button
                type="button"
                aria-label="Accept offer"
                class="bg-brand hover:bg-brand-600 px-2 py-3 text-xs font-bold text-white transition"
                @click="$emit('accept')"
            >
                Accept
            </button>
            <button
                type="button"
                aria-label="Counter offer"
                class="bg-white px-2 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                @click="$emit('counter')"
            >
                Counter
            </button>
            <button
                type="button"
                aria-label="Decline offer"
                class="bg-white px-2 py-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                @click="$emit('decline')"
            >
                Decline
            </button>
        </div>
        <div
            v-else-if="payload.status && payload.status !== 'pending'"
            class="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs font-medium text-slate-500"
        >
            {{ closedLabel }}
        </div>

        <p class="border-t border-slate-100 px-4 py-2 text-[10px] italic text-slate-400">
            Expression of interest, not a binding contract.
        </p>
    </div>
</template>

<script setup lang="ts">
import type { OfferPayload } from '~/composables/useMessages'
import { formatPrice } from '~/composables/useListings'

const props = defineProps<{
    payload: OfferPayload
    /** True when the current user is the recipient and can accept/counter/decline. */
    canAct: boolean
    /** Sender's perspective label tweaks. */
    fromMe: boolean
}>()

defineEmits<{
    (e: 'accept'): void
    (e: 'counter'): void
    (e: 'decline'): void
}>()

const FINANCING_LABELS: Record<string, string> = {
    cash: 'Cash',
    conventional: 'Conventional loan',
    fha: 'FHA',
    va: 'VA',
    usda: 'USDA',
}

const headerLabel = computed(() => (props.fromMe ? 'Offer sent' : 'Offer received'))

const statusLabel = computed(() => {
    switch (props.payload.status) {
        case 'accepted':
            return 'Accepted'
        case 'declined':
            return 'Declined'
        case 'countered':
            return 'Countered'
        default:
            return null
    }
})

const statusPill = computed(() => {
    switch (props.payload.status) {
        case 'accepted':
            return 'bg-emerald-100 text-emerald-700'
        case 'declined':
            return 'bg-red-100 text-red-700'
        case 'countered':
            return 'bg-amber-100 text-amber-700'
        default:
            return 'bg-slate-100 text-slate-600'
    }
})

const statusBorder = computed(() => {
    switch (props.payload.status) {
        case 'accepted':
            return 'border-emerald-300'
        case 'declined':
            return 'border-red-200'
        case 'countered':
            return 'border-amber-300'
        default:
            return 'border-brand/40'
    }
})

const closedLabel = computed(() => {
    switch (props.payload.status) {
        case 'accepted':
            return '✓ Offer accepted — transaction started'
        case 'declined':
            return '✗ Offer declined'
        case 'countered':
            return '↪ Countered with a new offer below'
        default:
            return ''
    }
})

const comparedToAsking = computed(() => {
    const asking = props.payload.asking_price_at_offer
    if (!asking) return ''
    const diff = props.payload.offer_price - asking
    if (diff === 0) return 'Asking price'
    const pct = Math.round((Math.abs(diff) / asking) * 100)
    return diff > 0
        ? `${formatPrice(diff)} (${pct}%) over asking`
        : `${formatPrice(Math.abs(diff))} (${pct}%) under asking`
})

const contingencyList = computed(() => {
    const c = props.payload.contingencies
    const out: string[] = []
    if (c.inspection) out.push('inspection')
    if (c.appraisal) out.push('appraisal')
    if (c.financing && props.payload.financing !== 'cash') out.push('financing')
    if (c.saleOfHome) out.push('sale of current home')
    return out
})

function formatDate(iso: string): string {
    const d = new Date(`${iso}T12:00:00`)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
