<template>
    <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        @click.self="$emit('close')"
    >
        <div
            class="w-full max-w-2xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        >
            <header
                class="bg-brand-50 flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5"
            >
                <div>
                    <h2 class="font-display text-2xl font-bold text-slate-900">
                        {{ mode === 'counter' ? 'Send counter-offer' : 'Make an offer' }}
                    </h2>
                    <p class="mt-1 text-sm text-slate-600">On {{ listingAddress }}</p>
                </div>
                <button
                    type="button"
                    class="text-slate-400 hover:text-slate-700"
                    aria-label="Close"
                    @click="$emit('close')"
                >
                    ✕
                </button>
            </header>

            <form class="max-h-[80vh] overflow-y-auto px-6 py-5" @submit.prevent="submit">
                <!-- Disclaimer -->
                <div
                    class="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
                >
                    <p class="font-semibold">This is an expression of interest, not a contract.</p>
                    <p class="mt-1">
                        Sending this offer notifies the seller of your terms so you can negotiate.
                        The actual purchase agreement is a separate document you'll prepare and sign
                        together — Frula's paperwork guides walk you through it.
                    </p>
                </div>

                <div class="space-y-4">
                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Offer price (USD) *</label
                        >
                        <input
                            v-model.number="form.offerPrice"
                            type="number"
                            min="0"
                            required
                            placeholder="425000"
                            class="input mt-1"
                        />
                        <p
                            v-if="listingPrice && form.offerPrice"
                            class="mt-1 text-xs text-slate-500"
                        >
                            {{ comparedToAsking }}
                        </p>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >Earnest money (USD)</label
                            >
                            <input
                                v-model.number="form.earnestMoney"
                                type="number"
                                min="0"
                                placeholder="5000"
                                class="input mt-1"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >Financing</label
                            >
                            <select v-model="form.financing" class="input mt-1">
                                <option value="cash">Cash</option>
                                <option value="conventional">Conventional loan</option>
                                <option value="fha">FHA</option>
                                <option value="va">VA</option>
                                <option value="usda">USDA</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Proposed closing date</label
                        >
                        <input v-model="form.closingDate" type="date" class="input mt-1" />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Contingencies</label
                        >
                        <div class="mt-2 space-y-2">
                            <label class="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    v-model="form.contingencies.inspection"
                                    type="checkbox"
                                    class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                                />
                                Subject to home inspection
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    v-model="form.contingencies.appraisal"
                                    type="checkbox"
                                    class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                                />
                                Subject to appraisal
                            </label>
                            <label
                                v-if="form.financing !== 'cash'"
                                class="flex items-center gap-2 text-sm text-slate-700"
                            >
                                <input
                                    v-model="form.contingencies.financing"
                                    type="checkbox"
                                    class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                                />
                                Subject to financing approval
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    v-model="form.contingencies.saleOfHome"
                                    type="checkbox"
                                    class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                                />
                                Subject to sale of my current home
                            </label>
                        </div>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Note to seller (optional)</label
                        >
                        <textarea
                            v-model="form.note"
                            rows="3"
                            placeholder="Anything you'd like to add — about your timeline, your situation, why you love the home…"
                            class="input mt-1"
                        />
                    </div>
                </div>

                <p
                    v-if="error"
                    class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                    {{ error }}
                </p>

                <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        class="hover:border-brand hover:text-brand rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
                        @click="$emit('close')"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        :disabled="submitting || !canSubmit"
                        class="bg-brand hover:bg-brand-600 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                    >
                        {{
                            submitting
                                ? 'Sending…'
                                : mode === 'counter'
                                  ? 'Send counter'
                                  : 'Send offer'
                        }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { formatPrice } from '~/composables/useListings'
import { useNotificationEmail } from '~/composables/useNotificationEmail'

const { notify } = useNotificationEmail()

const props = defineProps<{
    open: boolean
    listingId: string
    recipientId: string
    listingAddress: string
    listingPrice: number
    /** Pre-fill the price (used when countering an existing offer). */
    initialPrice?: number
    /** Tweak the heading + button copy for counter-offer flow. */
    mode?: 'offer' | 'counter'
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'sent'): void
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

// Pre-fill price when opening the modal in counter mode.
watch(
    () => [props.open, props.initialPrice] as const,
    ([open, initial]) => {
        if (open && initial != null) form.offerPrice = initial
    },
)

const form = reactive({
    offerPrice: undefined as number | undefined,
    earnestMoney: undefined as number | undefined,
    financing: 'conventional' as 'cash' | 'conventional' | 'fha' | 'va' | 'usda',
    closingDate: '',
    contingencies: {
        inspection: true,
        appraisal: true,
        financing: true,
        saleOfHome: false,
    },
    note: '',
})

const submitting = ref(false)
const error = ref<string | null>(null)

const canSubmit = computed(() => typeof form.offerPrice === 'number' && form.offerPrice > 0)

const comparedToAsking = computed(() => {
    if (!props.listingPrice || !form.offerPrice) return ''
    const diff = form.offerPrice - props.listingPrice
    if (diff === 0) return 'Asking price'
    const pct = Math.round((Math.abs(diff) / props.listingPrice) * 100)
    return diff > 0
        ? `${formatPrice(diff)} (${pct}%) over asking`
        : `${formatPrice(Math.abs(diff))} (${pct}%) under asking`
})

const FINANCING_LABELS: Record<string, string> = {
    cash: 'Cash',
    conventional: 'Conventional loan',
    fha: 'FHA',
    va: 'VA',
    usda: 'USDA',
}

function buildBody(): string {
    const lines: string[] = []
    lines.push('💰 OFFER SUBMITTED')
    lines.push('')
    lines.push(`Offer price: ${formatPrice(form.offerPrice!)}`)
    if (props.listingPrice) {
        lines.push(`Asking price: ${formatPrice(props.listingPrice)}`)
        if (comparedToAsking.value) lines.push(`(${comparedToAsking.value})`)
    }
    lines.push('')
    lines.push(`Financing: ${FINANCING_LABELS[form.financing]}`)
    if (form.earnestMoney) lines.push(`Earnest money: ${formatPrice(form.earnestMoney)}`)
    if (form.closingDate) lines.push(`Proposed closing: ${form.closingDate}`)

    const cs: string[] = []
    if (form.contingencies.inspection) cs.push('home inspection')
    if (form.contingencies.appraisal) cs.push('appraisal')
    if (form.contingencies.financing && form.financing !== 'cash') cs.push('financing approval')
    if (form.contingencies.saleOfHome) cs.push('sale of current home')
    if (cs.length) {
        lines.push('')
        lines.push(`Contingencies: ${cs.join(', ')}`)
    }

    if (form.note.trim()) {
        lines.push('')
        lines.push('Note from buyer:')
        lines.push(form.note.trim())
    }

    lines.push('')
    lines.push('— This is an expression of interest, not a binding contract.')
    return lines.join('\n')
}

async function submit() {
    if (!user.value) {
        router.push(`/login?next=/listing/${props.listingId}`)
        return
    }
    if (!canSubmit.value || submitting.value) return
    submitting.value = true
    error.value = null

    const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert({
            listing_id: props.listingId,
            sender_id: user.value.id,
            recipient_id: props.recipientId,
            body: buildBody(),
            kind: 'offer',
            payload: {
                status: 'pending',
                offer_price: form.offerPrice,
                earnest_money: form.earnestMoney ?? null,
                financing: form.financing,
                closing_date: form.closingDate || null,
                contingencies: form.contingencies,
                note: form.note || null,
                asking_price_at_offer: props.listingPrice,
            },
        })
        .select('id')
        .single()

    submitting.value = false
    if (insertError) {
        error.value = insertError.message
        return
    }
    if (inserted?.id) await notify(inserted.id)
    emit('sent')
    router.push(`/inbox/${props.listingId}/${props.recipientId}`)
}
</script>

<style scoped>
.input {
    @apply focus:border-brand focus:ring-brand w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1;
}
</style>
