<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-8">
                <div class="flex items-center gap-4">
                    <NuxtLink
                        to="/paperwork"
                        class="hover:text-brand text-sm font-medium text-slate-600"
                    >
                        ← Directory
                    </NuxtLink>
                </div>
                <AuthNav />
            </div>
        </header>

        <div v-if="!guide" class="mx-auto max-w-4xl p-8">
            <div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
                <p class="font-semibold">Guide not found</p>
                <p class="mt-1 text-sm">
                    This guide doesn't exist yet — or we may have renamed it. Browse all guides
                    <NuxtLink to="/paperwork" class="font-semibold underline">here</NuxtLink>.
                </p>
            </div>
        </div>

        <article v-else class="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
            <!-- Title block -->
            <div class="mb-8">
                <div class="mb-3 flex flex-wrap items-center gap-2">
                    <span
                        class="bg-brand-50 text-brand-700 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase"
                    >
                        {{ stateLabel(guide.state) }}
                    </span>
                    <span
                        class="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600"
                    >
                        {{ ROLE_LABELS[guide.role] }}
                    </span>
                    <span
                        class="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600"
                    >
                        {{ PHASE_LABELS[guide.phase] }}
                    </span>
                </div>
                <h1 class="font-display text-3xl font-bold text-slate-900 md:text-4xl">
                    {{ guide.title }}
                </h1>
                <p v-if="guide.estimatedTime" class="mt-2 text-sm text-slate-500">
                    ⏱ Estimated time: {{ guide.estimatedTime }}
                </p>
            </div>

            <!-- Informational note for guides pending professional review -->
            <div
                v-if="guide.reviewedBy?.includes('Placeholder')"
                class="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
            >
                <p class="font-semibold">Informational overview</p>
                <p class="mt-1">
                    This guide provides general context about this document type. For the official
                    version applicable to your state, use the source linked below.
                </p>
            </div>

            <!-- Intro -->
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p class="text-base leading-relaxed text-slate-700">{{ guide.intro }}</p>
            </div>

            <!-- Official PDF link (federal guides) -->
            <div
                v-if="guide.officialPdfUrl"
                class="border-brand bg-brand-50 mt-4 rounded-2xl border-2 p-5"
            >
                <p class="text-brand-700 text-xs font-bold uppercase tracking-wide">
                    📥 Get the official blank form
                </p>
                <p class="mt-2 text-sm text-slate-700">
                    The official form is published by
                    <strong>{{ guide.officialPdfSource }}</strong
                    >. Always download from the source — never trust a third-party copy.
                </p>
                <a
                    :href="guide.officialPdfUrl"
                    target="_blank"
                    rel="noopener"
                    class="bg-brand hover:bg-brand-600 mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition"
                >
                    Open official source ↗
                </a>
            </div>

            <!-- State-finder widget (concept guides — every state has its own form) -->
            <div
                v-if="guide.state === 'ALL'"
                class="border-brand bg-brand-50 mt-4 rounded-2xl border-2 p-5"
            >
                <p class="text-brand-700 text-xs font-bold uppercase tracking-wide">
                    📥 Find your state's official form
                </p>
                <p class="mt-2 text-sm text-slate-700">
                    Every state publishes its own version of this document. Pick your state below
                    and we'll send you straight to its real estate commission, where you can
                    download the official form.
                </p>
                <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                        v-model="selectedStateCode"
                        class="focus:border-brand focus:ring-brand flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1"
                    >
                        <option value="">Select your state…</option>
                        <option v-for="s in STATE_RESOURCES" :key="s.code" :value="s.code">
                            {{ s.name }}
                        </option>
                    </select>
                    <a
                        v-if="selectedStateResource"
                        :href="selectedStateResource.url"
                        target="_blank"
                        rel="noopener"
                        class="bg-brand hover:bg-brand-600 inline-flex flex-none items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition"
                    >
                        Open {{ selectedStateResource.name }} ↗
                    </a>
                </div>
                <p v-if="selectedStateResource" class="mt-2 text-xs text-slate-600">
                    Goes to:
                    <strong>{{ selectedStateResource.commissionName }}</strong>
                </p>
            </div>

            <!-- Sections -->
            <div class="mt-8 space-y-8">
                <section v-for="(s, idx) in guide.sections" :key="idx">
                    <h2 class="font-display text-2xl font-bold text-slate-900">{{ s.title }}</h2>
                    <p v-if="s.intro" class="mt-2 text-base leading-relaxed text-slate-700">
                        {{ s.intro }}
                    </p>

                    <div v-if="s.body && s.body.length" class="mt-3 space-y-3">
                        <p
                            v-for="(p, i) in s.body"
                            :key="i"
                            class="whitespace-pre-line text-base leading-relaxed text-slate-700"
                        >
                            {{ p }}
                        </p>
                    </div>
                </section>
            </div>

            <!-- Things to watch out for -->
            <section
                v-if="guide.commonMistakes && guide.commonMistakes.length"
                class="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6"
            >
                <h2 class="font-display text-xl font-bold text-red-900">
                    ⚠️ Things to watch out for
                </h2>
                <p class="mt-1 text-xs text-red-800/80">
                    Commonly-reported issues people run into with this document. Always verify the
                    specifics with your state's official source or a licensed professional.
                </p>
                <ul class="mt-3 space-y-2">
                    <li
                        v-for="(m, i) in guide.commonMistakes"
                        :key="i"
                        class="flex items-start gap-2 text-sm text-red-900"
                    >
                        <span class="mt-0.5 flex-none">•</span>
                        <span>{{ m }}</span>
                    </li>
                </ul>
            </section>

            <!-- Footer / disclaimer -->
            <div
                class="mt-10 rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-500"
            >
                <p>
                    <strong class="text-slate-700">Last reviewed:</strong>
                    {{ guide.lastReviewed || 'Pending' }}
                    <span v-if="guide.reviewedBy"> · {{ guide.reviewedBy }}</span>
                </p>
                <p class="mt-2">
                    This entry is informational only — not legal advice. Frula Homes is an
                    informational platform. We point you to official sources; we don't prepare,
                    review, or interpret legal documents, and we're not your attorney or real estate
                    agent. For legal questions specific to your situation, consult a licensed
                    attorney in your state.
                </p>
            </div>
        </article>
    </main>
</template>

<script setup lang="ts">
import { getGuideBySlug } from '~/data/paperwork/guides'
import { PHASE_LABELS, ROLE_LABELS } from '~/data/paperwork/types'
import { STATE_RESOURCES, getStateResource } from '~/data/paperwork/state-resources'
import { US_STATES } from '~/composables/useStates'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const guide = computed(() => getGuideBySlug(slug.value))

function stateLabel(code: string): string {
    if (code === 'US') return 'Federal'
    if (code === 'ALL') return 'All 50 states'
    return US_STATES.find((s) => s.code === code)?.name ?? code
}

// State-finder widget state. Persisted in localStorage so users don't have
// to re-pick their state on every guide they visit.
const selectedStateCode = ref<string>('')
onMounted(() => {
    if (import.meta.client) {
        selectedStateCode.value = window.localStorage.getItem('frula-paperwork-state') ?? ''
    }
})
watch(selectedStateCode, (v) => {
    if (import.meta.client) {
        if (v) window.localStorage.setItem('frula-paperwork-state', v)
        else window.localStorage.removeItem('frula-paperwork-state')
    }
})

const selectedStateResource = computed(() =>
    selectedStateCode.value ? getStateResource(selectedStateCode.value) : null,
)

const config = useRuntimeConfig()
const canonicalUrl = computed(() => `${config.public.siteUrl}/paperwork/${slug.value}`)

useSeoMeta({
    title: () => (guide.value ? `${guide.value.title} — Frula Homes` : 'Paperwork guide'),
    description: () => guide.value?.summary ?? '',
})
useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
})
</script>
