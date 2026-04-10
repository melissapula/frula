<template>
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div class="mb-4 flex items-center gap-2">
            <div class="text-2xl">🧮</div>
            <h2 class="font-display text-xl font-semibold text-slate-900">Mortgage calculator</h2>
        </div>
        <p class="mb-5 text-sm text-slate-600">
            Estimate your monthly payment for this home. This is a rough number for planning
            purposes — your actual rate, taxes, and insurance will vary.
        </p>

        <div class="grid gap-4 md:grid-cols-2">
            <!-- Inputs -->
            <div class="space-y-4">
                <div>
                    <label
                        class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >Home price</label
                    >
                    <input v-model.number="form.price" type="number" min="0" class="input mt-1" />
                </div>

                <div>
                    <div class="flex items-baseline justify-between">
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Down payment</label
                        >
                        <span class="text-xs text-slate-500">
                            {{ formatPrice(downPaymentAmount) }} ({{ form.downPct }}%)
                        </span>
                    </div>
                    <input
                        v-model.number="form.downPct"
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        class="accent-brand mt-2 w-full"
                    />
                    <div class="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>0%</span>
                        <span>20%</span>
                        <span>50%</span>
                    </div>
                </div>

                <div>
                    <div class="flex items-baseline justify-between">
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Interest rate</label
                        >
                        <span class="text-xs text-slate-500">{{ form.rate.toFixed(2) }}%</span>
                    </div>
                    <input
                        v-model.number="form.rate"
                        type="range"
                        min="2"
                        max="12"
                        step="0.125"
                        class="accent-brand mt-2 w-full"
                    />
                    <div class="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>2%</span>
                        <span>7%</span>
                        <span>12%</span>
                    </div>
                </div>

                <div>
                    <label
                        class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >Loan term</label
                    >
                    <select v-model.number="form.years" class="input mt-1">
                        <option :value="15">15 years</option>
                        <option :value="20">20 years</option>
                        <option :value="30">30 years</option>
                    </select>
                </div>
            </div>

            <!-- Result -->
            <div
                class="from-brand-50 border-brand/20 rounded-2xl border bg-gradient-to-br to-white p-5"
            >
                <p class="text-brand-700 text-xs font-bold uppercase tracking-wider">
                    Estimated monthly payment
                </p>
                <div class="font-display mt-2 text-4xl font-bold text-slate-900 md:text-5xl">
                    {{ formatPrice(monthlyPayment) }}
                </div>
                <p class="mt-1 text-xs text-slate-500">Principal + interest</p>

                <dl class="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                    <div class="flex justify-between">
                        <dt class="text-slate-500">Loan amount</dt>
                        <dd class="font-semibold text-slate-800">
                            {{ formatPrice(loanAmount) }}
                        </dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-slate-500">Total interest paid</dt>
                        <dd class="font-semibold text-slate-800">
                            {{ formatPrice(totalInterest) }}
                        </dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-slate-500">Total of {{ form.years * 12 }} payments</dt>
                        <dd class="font-semibold text-slate-800">
                            {{ formatPrice(totalPaid) }}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>

        <p class="mt-4 text-xs italic text-slate-500">
            ⚠️ This is an estimate of principal and interest only. Your actual payment will also
            include property taxes, homeowners insurance, and (if your down payment is under 20%)
            likely PMI. Talk to a lender for a real quote.
        </p>
    </div>
</template>

<script setup lang="ts">
import { formatPrice } from '~/composables/useListings'

const props = defineProps<{
    /** Initial home price — usually the listing's asking price */
    initialPrice: number
}>()

const form = reactive({
    price: props.initialPrice,
    downPct: 20,
    rate: 7.0,
    years: 30,
})

// Keep form.price in sync if the listing prop changes (e.g. SSR hydration)
watch(
    () => props.initialPrice,
    (next) => {
        form.price = next
    },
)

const downPaymentAmount = computed(() => Math.round(form.price * (form.downPct / 100)))
const loanAmount = computed(() => form.price - downPaymentAmount.value)

/**
 * Standard amortized monthly payment formula:
 *   M = P × r(1+r)^n / ((1+r)^n − 1)
 * Where P = principal, r = monthly rate, n = total payments.
 *
 * Falls back to a simple division when the rate is exactly 0 to avoid
 * division-by-zero (and because the formula collapses to P/n at zero rate).
 */
const monthlyPayment = computed(() => {
    const P = loanAmount.value
    const annualRate = form.rate / 100
    const n = form.years * 12
    if (P <= 0 || n <= 0) return 0
    if (annualRate === 0) return Math.round(P / n)
    const r = annualRate / 12
    const payment = (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
    return Math.round(payment)
})

const totalPaid = computed(() => monthlyPayment.value * form.years * 12)
const totalInterest = computed(() => Math.max(0, totalPaid.value - loanAmount.value))
</script>

<style scoped>
.input {
    @apply focus:border-brand focus:ring-brand w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1;
}
</style>
