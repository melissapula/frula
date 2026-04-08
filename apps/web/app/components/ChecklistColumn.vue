<template>
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-brand-700 text-xs font-semibold uppercase tracking-wide">
                    {{ role === 'seller' ? 'Seller' : 'Buyer' }} checklist
                </p>
                <h2 class="font-display text-xl font-bold text-slate-900">
                    {{ isMine ? 'Your tasks' : `${otherName}'s tasks` }}
                </h2>
            </div>
            <div class="text-right">
                <div class="font-display text-2xl font-bold text-slate-900">{{ stats.pct }}%</div>
                <div class="text-xs text-slate-500">{{ stats.done }} / {{ stats.total }}</div>
            </div>
        </div>

        <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div class="bg-brand h-full transition-all" :style="{ width: `${stats.pct}%` }" />
        </div>

        <div class="mt-6 space-y-6">
            <div v-for="group in grouped" :key="group.phase">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {{ group.label }}
                </p>
                <ul class="mt-2 space-y-2">
                    <li
                        v-for="item in group.items"
                        :key="item.id"
                        :class="[
                            'rounded-xl border p-3 transition',
                            item.completed
                                ? 'border-brand-100 bg-brand-50'
                                : 'hover:border-brand-100 border-slate-200 bg-white',
                        ]"
                    >
                        <label class="flex items-start gap-3">
                            <input
                                type="checkbox"
                                :checked="item.completed"
                                :disabled="!isMine"
                                class="text-brand focus:ring-brand mt-1 h-4 w-4 flex-none rounded border-slate-300"
                                @change="$emit('toggle', item)"
                            />
                            <div class="flex-1">
                                <p
                                    :class="[
                                        'text-sm font-semibold',
                                        item.completed
                                            ? 'text-slate-500 line-through'
                                            : 'text-slate-900',
                                    ]"
                                >
                                    {{ item.title }}
                                </p>
                                <p
                                    v-if="item.description"
                                    class="mt-1 text-xs leading-relaxed text-slate-600"
                                >
                                    {{ item.description }}
                                </p>
                                <p
                                    v-if="item.completed && item.completed_at"
                                    class="text-brand-700 mt-1 text-[10px]"
                                >
                                    Completed {{ formatDate(item.completed_at) }}
                                </p>
                            </div>
                        </label>
                    </li>
                </ul>
            </div>
        </div>

        <p v-if="!isMine" class="mt-4 text-xs italic text-slate-400">
            View only — {{ otherName }} can check items off as they complete them.
        </p>
    </section>
</template>

<script setup lang="ts">
import {
    type ChecklistItem,
    type TransactionChecklist,
    groupByPhase,
    progress,
} from '~/composables/useTransactions'

const props = defineProps<{
    role: 'seller' | 'buyer'
    checklist: TransactionChecklist
    myRole: 'seller' | 'buyer' | null
    otherName: string
}>()

defineEmits<{
    toggle: [item: ChecklistItem]
}>()

const isMine = computed(() => props.myRole === props.role)
const grouped = computed(() => groupByPhase(props.checklist.items))
const stats = computed(() => progress(props.checklist.items))

function formatDate(iso: string) {
    const ms = Date.now() - new Date(iso).getTime()
    const min = Math.floor(ms / 60000)
    if (min < 1) return 'just now'
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
