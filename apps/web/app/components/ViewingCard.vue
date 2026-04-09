<template>
    <div
        class="w-full max-w-sm overflow-hidden rounded-2xl border-2 bg-white shadow-md"
        :class="statusBorder"
    >
        <div class="bg-brand-50 border-b border-slate-200 px-4 py-3">
            <div class="flex items-center justify-between">
                <p class="text-brand text-xs font-bold uppercase tracking-wider">
                    📅 {{ headerLabel }}
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
            <p class="font-display mt-1 text-base font-bold text-slate-900">
                {{ formatLongDate(payload.date_primary) }}
            </p>
            <p class="text-xs text-slate-600">{{ TIME_LABELS[payload.time_of_day] }}</p>
        </div>

        <dl class="space-y-2 px-4 py-3 text-xs">
            <div v-if="payload.date_backup" class="flex justify-between">
                <dt class="font-semibold text-slate-500">Backup date</dt>
                <dd class="text-slate-800">{{ formatLongDate(payload.date_backup) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="font-semibold text-slate-500">Party size</dt>
                <dd class="text-slate-800">
                    {{ payload.party_size }} {{ payload.party_size === 1 ? 'person' : 'people' }}
                </dd>
            </div>
            <div v-if="payload.note" class="border-t border-slate-100 pt-2">
                <dt class="mb-1 font-semibold text-slate-500">Note from buyer</dt>
                <dd class="whitespace-pre-wrap text-slate-700">{{ payload.note }}</dd>
            </div>
        </dl>

        <div
            v-if="canAct && payload.status === 'pending'"
            class="grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200"
        >
            <button
                type="button"
                class="bg-brand hover:bg-brand-600 px-2 py-2.5 text-xs font-bold text-white transition"
                @click="$emit('confirm')"
            >
                Confirm
            </button>
            <button
                type="button"
                class="bg-white px-2 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
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
    </div>
</template>

<script setup lang="ts">
import type { ViewingPayload } from '~/composables/useMessages'

const props = defineProps<{
    payload: ViewingPayload
    canAct: boolean
    fromMe: boolean
}>()

defineEmits<{ (e: 'confirm'): void; (e: 'decline'): void }>()

const TIME_LABELS: Record<string, string> = {
    morning: 'Morning (9am – 12pm)',
    afternoon: 'Afternoon (12pm – 5pm)',
    evening: 'Evening (5pm – 8pm)',
    anytime: 'Any time',
}

const headerLabel = computed(() => (props.fromMe ? 'Viewing requested' : 'Viewing request'))

const statusLabel = computed(() => {
    switch (props.payload.status) {
        case 'confirmed':
            return 'Confirmed'
        case 'declined':
            return 'Declined'
        default:
            return null
    }
})

const statusPill = computed(() => {
    switch (props.payload.status) {
        case 'confirmed':
            return 'bg-emerald-100 text-emerald-700'
        case 'declined':
            return 'bg-red-100 text-red-700'
        default:
            return 'bg-slate-100 text-slate-600'
    }
})

const statusBorder = computed(() => {
    switch (props.payload.status) {
        case 'confirmed':
            return 'border-emerald-300'
        case 'declined':
            return 'border-red-200'
        default:
            return 'border-brand/40'
    }
})

const closedLabel = computed(() => {
    switch (props.payload.status) {
        case 'confirmed':
            return '✓ Viewing confirmed'
        case 'declined':
            return '✗ Viewing declined'
        default:
            return ''
    }
})

function formatLongDate(iso: string): string {
    const d = new Date(`${iso}T12:00:00`)
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}
</script>
