<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                    >Frula Homes</NuxtLink
                >
                <AuthNav />
            </div>
        </header>

        <div class="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
            <div class="mb-8">
                <h1 class="font-display text-3xl font-bold text-slate-900 md:text-4xl">
                    📄 Paperwork directory
                </h1>
                <p class="mt-2 max-w-2xl text-slate-600">
                    A directory of the official forms, disclosures, and consumer resources you'll
                    encounter when selling or buying a home without an agent. Pick your state to
                    find the authoritative sources for your area — all links go straight to the
                    official publisher.
                </p>
            </div>

            <!-- Filters -->
            <div class="mb-6 flex flex-wrap gap-3">
                <div>
                    <label
                        class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >Your state</label
                    >
                    <select v-model="filterState" class="input mt-1 min-w-[180px]">
                        <option value="">All states (federal only)</option>
                        <option v-for="s in STATE_RESOURCES" :key="s.code" :value="s.code">
                            {{ s.name }}
                        </option>
                    </select>
                </div>
                <div>
                    <label
                        class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >Who</label
                    >
                    <select v-model="filterRole" class="input mt-1 min-w-[140px]">
                        <option value="">Anyone</option>
                        <option value="seller">Seller</option>
                        <option value="buyer">Buyer</option>
                    </select>
                </div>
                <div>
                    <label
                        class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >Phase</label
                    >
                    <select v-model="filterPhase" class="input mt-1 min-w-[180px]">
                        <option value="">Any phase</option>
                        <option v-for="p in PHASE_ORDER" :key="p" :value="p">
                            {{ PHASE_LABELS[p] }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- State hint banner -->
            <div
                v-if="!filterState"
                class="border-brand/30 bg-brand-50 mb-6 rounded-xl border p-4 text-sm text-slate-700"
            >
                <p class="font-semibold text-slate-800">
                    👋 Pick your state above to see your state's official real estate forms
                </p>
                <p class="mt-1 text-slate-600">
                    Federal documents (which apply nationwide) are shown below. Selecting your state
                    adds your state real estate commission as a one-click resource — that's where
                    the actual purchase agreements, disclosure forms, and consumer guides for your
                    state live.
                </p>
            </div>

            <!-- Grouped by phase -->
            <div
                v-if="!filtered.length"
                class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
            >
                <p class="font-semibold text-slate-700">No guides match those filters yet</p>
                <p class="mt-1 text-sm text-slate-500">
                    Try clearing a filter or picking a different state.
                </p>
            </div>

            <div v-else class="space-y-8">
                <div v-for="phase in groupedPhases" :key="phase.key">
                    <h2 class="font-display mb-3 text-xl font-bold text-slate-900">
                        {{ PHASE_LABELS[phase.key] }}
                    </h2>
                    <div class="grid gap-4 md:grid-cols-2">
                        <NuxtLink
                            v-for="g in phase.guides"
                            :key="g.slug"
                            :to="`/paperwork/${g.slug}`"
                            class="hover:border-brand block rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
                        >
                            <div class="mb-2 flex items-center gap-2">
                                <span
                                    class="bg-brand-50 text-brand-700 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                                >
                                    {{ stateLabel(g.state) }}
                                </span>
                                <template v-if="g.role === 'both'">
                                    <span
                                        class="bg-brand-50 text-brand-700 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                                        >Seller</span
                                    >
                                    <span
                                        class="bg-brand-50 text-brand-700 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                                        >Buyer</span
                                    >
                                </template>
                                <span
                                    v-else
                                    class="bg-brand-50 text-brand-700 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                                >
                                    {{ ROLE_LABELS[g.role] }}
                                </span>
                            </div>
                            <h3 class="font-display text-base font-bold text-slate-900">
                                {{ g.title }}
                            </h3>
                            <p class="mt-1 text-sm leading-relaxed text-slate-600">
                                {{ g.summary }}
                            </p>
                            <p
                                v-if="g.estimatedTime"
                                class="mt-3 text-xs font-medium text-slate-500"
                            >
                                ⏱ {{ g.estimatedTime }}
                            </p>
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <!-- Disclaimer footer -->
            <div
                class="mt-12 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
            >
                <p class="font-semibold">📌 Informational only — not legal advice.</p>
                <p class="mt-1">
                    Frula Homes is an informational platform. We point you to official sources for
                    the documents involved in real estate transactions — we don't prepare, review,
                    or interpret legal documents, and we're not your attorney or real estate agent.
                    For questions about your specific situation, consult a licensed attorney or
                    qualified real estate professional in your state.
                </p>
            </div>
        </div>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
import { GUIDES } from '~/data/paperwork/guides'
import { STATE_RESOURCES } from '~/data/paperwork/state-resources'
import {
    PHASE_LABELS,
    PHASE_ORDER,
    ROLE_LABELS,
    type PaperworkPhase,
    type PaperworkRole,
} from '~/data/paperwork/types'
import { US_STATES } from '~/composables/useStates'

// Persist the user's state pick across visits — same key used by the
// state-finder widget on guide detail pages, so picking it once on either
// page carries through everywhere.
const filterState = ref<string>('')
onMounted(() => {
    if (import.meta.client) {
        filterState.value = window.localStorage.getItem('frula-paperwork-state') ?? ''
    }
})
watch(filterState, (v) => {
    if (import.meta.client) {
        if (v) window.localStorage.setItem('frula-paperwork-state', v)
        else window.localStorage.removeItem('frula-paperwork-state')
    }
})

const filterRole = ref<'' | PaperworkRole>('')
const filterPhase = ref<'' | PaperworkPhase>('')

function stateLabel(code: string): string {
    if (code === 'US') return 'Federal'
    if (code === 'ALL') return 'All 50 states'
    return US_STATES.find((s) => s.code === code)?.name ?? code
}

const filtered = computed(() => {
    return GUIDES.filter((g) => {
        // State filter logic:
        //   - If user picks a specific state, show federal (US) + universal (ALL) +
        //     that one state's resources page. Skip every other state.
        //   - If no state is picked, only show federal + universal (avoid dumping
        //     all 50 state cards on first load — overwhelming).
        if (filterState.value) {
            if (g.state !== 'US' && g.state !== 'ALL' && g.state !== filterState.value) {
                return false
            }
        } else {
            if (g.state !== 'US' && g.state !== 'ALL') return false
        }
        if (filterRole.value && g.role !== filterRole.value && g.role !== 'both') return false
        if (filterPhase.value && g.phase !== filterPhase.value) return false
        return true
    })
})

const groupedPhases = computed(() => {
    return PHASE_ORDER.map((phase) => ({
        key: phase,
        guides: filtered.value.filter((g) => g.phase === phase),
    })).filter((group) => group.guides.length > 0)
})

const paperworkDesc =
    'Directory of official real estate forms, disclosures, and resources for all 50 states. Find what you need to buy or sell a home without an agent.'
useSeoMeta({
    title: 'Paperwork guides — Frula Homes',
    description: paperworkDesc,
    ogTitle: 'Paperwork guides — Frula Homes',
    ogDescription: paperworkDesc,
    ogType: 'website',
    ogSiteName: 'Frula Homes',
    twitterCard: 'summary',
})
</script>

<style scoped>
.input {
    @apply focus:border-brand focus:ring-brand rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1;
}
</style>
