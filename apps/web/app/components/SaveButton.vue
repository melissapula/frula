<template>
    <button
        type="button"
        :title="saved ? 'Saved — click to remove' : 'Save listing'"
        :aria-pressed="saved"
        :class="[
            variant === 'icon'
                ? 'inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-base shadow-md ring-1 ring-slate-200 transition hover:scale-110'
                : 'hover:border-brand mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold transition',
            saved ? 'text-red-500' : 'text-slate-500 hover:text-red-500',
            variant === 'full' && saved ? 'border-red-300 bg-red-50' : '',
        ]"
        @click.stop.prevent="onClick"
    >
        <span class="text-lg leading-none">{{ saved ? '❤️' : '🤍' }}</span>
        <span v-if="variant === 'full'">
            {{ saved ? 'Saved' : 'Save listing' }}
        </span>
    </button>
</template>

<script setup lang="ts">
import { useSaved } from '~/composables/useSaved'

const props = defineProps<{
    listingId: string
    /** "icon" = small floating button (used on cards). "full" = full-width button (sidebar). */
    variant?: 'icon' | 'full'
}>()

const variant = computed(() => props.variant ?? 'icon')

const { isSaved, toggle } = useSaved()
const saved = computed(() => isSaved(props.listingId))

async function onClick() {
    await toggle(props.listingId)
}
</script>
