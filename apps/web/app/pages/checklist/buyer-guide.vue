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

        <div class="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
            <!-- Title -->
            <h1 class="font-display text-3xl font-bold text-slate-900 md:text-4xl">
                {{ def.title }}
            </h1>
            <p class="mt-2 text-slate-600">{{ def.subtitle }}</p>

            <!-- Sign-in prompt (logged out) -->
            <div
                v-if="!user"
                class="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
                <NuxtLink to="/login" class="font-semibold underline">Sign in</NuxtLink> or
                <NuxtLink to="/signup" class="font-semibold underline">create an account</NuxtLink>
                to save your checklist progress across devices.
            </div>

            <!-- Progress bar -->
            <div v-if="user" class="mt-6">
                <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-slate-700"
                        >{{ progress.done }} of {{ progress.total }} complete</span
                    >
                    <span class="text-brand font-semibold">{{ progress.pct }}%</span>
                </div>
                <div class="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                        class="bg-brand h-full rounded-full transition-all duration-300"
                        :style="{ width: `${progress.pct}%` }"
                    />
                </div>
            </div>

            <!-- Phases -->
            <div class="mt-8 space-y-8">
                <section v-for="(phase, pi) in def.phases" :key="phase.label">
                    <h2 class="font-display text-xl font-semibold text-slate-900">
                        <span class="text-brand mr-2">Phase {{ pi + 1 }}:</span>
                        {{ phase.label }}
                    </h2>

                    <div class="mt-3 space-y-2">
                        <label
                            v-for="item in phase.items"
                            :key="item.id"
                            :class="[
                                'flex cursor-pointer gap-3 rounded-xl border p-4 transition',
                                isChecked(item.id)
                                    ? 'border-brand/30 bg-brand-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300',
                                !user ? 'cursor-default opacity-70' : '',
                            ]"
                        >
                            <input
                                type="checkbox"
                                :checked="isChecked(item.id)"
                                :disabled="!user"
                                class="accent-brand mt-0.5 h-5 w-5 flex-none rounded"
                                @change="toggle(item.id)"
                            />
                            <div class="min-w-0">
                                <p
                                    :class="[
                                        'text-sm font-semibold',
                                        isChecked(item.id)
                                            ? 'text-brand-700 line-through'
                                            : 'text-slate-900',
                                    ]"
                                >
                                    {{ item.title }}
                                </p>
                                <p class="mt-0.5 text-sm leading-relaxed text-slate-500">
                                    {{ item.detail }}
                                </p>
                            </div>
                        </label>
                    </div>
                </section>
            </div>

            <!-- Related links -->
            <div class="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                <h3 class="font-display text-lg font-semibold text-slate-900">Related resources</h3>
                <div class="mt-3 flex flex-wrap gap-3">
                    <NuxtLink
                        to="/paperwork"
                        class="text-brand text-sm font-medium hover:underline"
                    >
                        Paperwork directory →
                    </NuxtLink>
                    <NuxtLink to="/browse" class="text-brand text-sm font-medium hover:underline">
                        Browse listings →
                    </NuxtLink>
                    <NuxtLink
                        to="/checklist/seller-prep"
                        class="text-brand text-sm font-medium hover:underline"
                    >
                        Seller prep checklist →
                    </NuxtLink>
                </div>
            </div>

            <!-- Disclaimer -->
            <p class="mt-8 text-center text-xs italic text-slate-400">
                This checklist is for general informational purposes only. It is not legal,
                financial, or professional real estate advice. Requirements vary by state and
                situation. Consult qualified professionals for advice specific to your transaction.
            </p>
        </div>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const { def, progress, toggle, isChecked } = useEducationalChecklist('buyer-guide')

const buyerGuideDesc =
    'An interactive checklist to help homebuyers evaluate properties and navigate the buying process.'
useSeoMeta({
    title: "Buyer's Guide Checklist — Frula Homes",
    description: buyerGuideDesc,
    ogTitle: "Buyer's Guide Checklist — Frula Homes",
    ogDescription: buyerGuideDesc,
    ogType: 'website',
    ogSiteName: 'Frula Homes',
    twitterCard: 'summary',
})
</script>
