<template>
    <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <div class="text-2xl">{{ icon }}</div>
        <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
                <p class="font-display text-xl font-bold text-slate-900">{{ thisWeek }}</p>
                <p class="text-xs text-slate-500">this week</p>
            </div>
            <p class="text-xs text-slate-500">{{ total }} {{ label.toLowerCase() }} all-time</p>
        </div>
        <div v-if="showDelta" :class="['text-right text-xs font-semibold', deltaColor]">
            {{ deltaSign }}{{ Math.abs(delta) }}
            <p class="text-[10px] font-normal text-slate-400">vs last week</p>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    icon: string
    label: string
    total: number
    thisWeek: number
    delta: number
}>()

// Hide the delta when both weeks are zero — "0 vs last week" is noise
const showDelta = computed(() => props.thisWeek > 0 || props.delta !== 0)

const deltaSign = computed(() => (props.delta > 0 ? '+' : props.delta < 0 ? '−' : ''))
const deltaColor = computed(() => {
    if (props.delta > 0) return 'text-emerald-600'
    if (props.delta < 0) return 'text-slate-400'
    return 'text-slate-400'
})
</script>
