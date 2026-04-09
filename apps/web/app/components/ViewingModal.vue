<template>
    <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        @click.self="$emit('close')"
    >
        <div
            class="w-full max-w-xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        >
            <header
                class="bg-brand-50 flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5"
            >
                <div>
                    <h2 class="font-display text-2xl font-bold text-slate-900">
                        Request a viewing
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
                <p class="mb-5 text-sm text-slate-600">
                    Pick a couple of times that work for you. The seller will reply via your inbox
                    to confirm one or suggest something else.
                </p>

                <div class="space-y-4">
                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Preferred date *</label
                        >
                        <input
                            v-model="form.date1"
                            type="date"
                            required
                            :min="todayISO"
                            class="input mt-1"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Time of day</label
                        >
                        <select v-model="form.timeOfDay" class="input mt-1">
                            <option value="morning">Morning (9am – 12pm)</option>
                            <option value="afternoon">Afternoon (12pm – 5pm)</option>
                            <option value="evening">Evening (5pm – 8pm)</option>
                            <option value="anytime">Any time that works</option>
                        </select>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Backup date (optional)</label
                        >
                        <input
                            v-model="form.date2"
                            type="date"
                            :min="todayISO"
                            class="input mt-1"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >How many people will visit?</label
                        >
                        <input
                            v-model.number="form.partySize"
                            type="number"
                            min="1"
                            max="20"
                            class="input mt-1"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >Note to seller (optional)</label
                        >
                        <textarea
                            v-model="form.note"
                            rows="3"
                            placeholder="Anything the seller should know — driving from out of town, bringing a contractor, etc."
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
                        {{ submitting ? 'Sending…' : 'Send request' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useNotificationEmail } from '~/composables/useNotificationEmail'

const props = defineProps<{
    open: boolean
    listingId: string
    recipientId: string
    listingAddress: string
}>()

const { notify } = useNotificationEmail()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'sent'): void
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const todayISO = new Date().toISOString().slice(0, 10)

const form = reactive({
    date1: '',
    date2: '',
    timeOfDay: 'afternoon' as 'morning' | 'afternoon' | 'evening' | 'anytime',
    partySize: 2,
    note: '',
})

const submitting = ref(false)
const error = ref<string | null>(null)

const canSubmit = computed(() => !!form.date1)

const TIME_LABELS: Record<string, string> = {
    morning: 'Morning (9am – 12pm)',
    afternoon: 'Afternoon (12pm – 5pm)',
    evening: 'Evening (5pm – 8pm)',
    anytime: 'Any time',
}

function formatDate(iso: string): string {
    const d = new Date(`${iso}T12:00:00`)
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}

function buildBody(): string {
    const lines: string[] = []
    lines.push('📅 VIEWING REQUEST')
    lines.push('')
    lines.push(`Preferred: ${formatDate(form.date1)}, ${TIME_LABELS[form.timeOfDay]}`)
    if (form.date2) lines.push(`Backup: ${formatDate(form.date2)}`)
    lines.push('')
    lines.push(`Party size: ${form.partySize} ${form.partySize === 1 ? 'person' : 'people'}`)
    if (form.note.trim()) {
        lines.push('')
        lines.push('Note from buyer:')
        lines.push(form.note.trim())
    }
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
            kind: 'viewing_request',
            payload: {
                status: 'pending',
                date_primary: form.date1,
                date_backup: form.date2 || null,
                time_of_day: form.timeOfDay,
                party_size: form.partySize,
                note: form.note || null,
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
