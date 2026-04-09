<template>
    <main class="flex min-h-screen flex-col bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold">
                    Frula Homes
                </NuxtLink>
                <NuxtLink to="/browse" class="hover:text-brand text-sm font-medium text-slate-600">
                    Browse listings →
                </NuxtLink>
            </div>
        </header>

        <div class="flex flex-1 items-center justify-center px-4 py-16">
            <div class="mx-auto max-w-lg text-center">
                <p class="text-brand-600 text-xs font-semibold uppercase tracking-widest">
                    {{ statusCode }} · {{ statusLabel }}
                </p>
                <h1 class="font-display mt-3 text-4xl font-bold text-slate-900 md:text-5xl">
                    {{ headline }}
                </h1>
                <p class="mt-4 text-base leading-relaxed text-slate-600">
                    {{ message }}
                </p>

                <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                        type="button"
                        class="bg-brand hover:bg-brand-600 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-sm transition"
                        @click="goHome"
                    >
                        ← Back to home
                    </button>
                    <NuxtLink
                        to="/browse"
                        class="hover:border-brand hover:text-brand rounded-full border border-slate-300 px-7 py-3 text-sm font-semibold text-slate-700 transition"
                    >
                        Browse listings
                    </NuxtLink>
                </div>

                <!-- Helpful navigation -->
                <div
                    class="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-left text-sm text-slate-700"
                >
                    <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Looking for something specific?
                    </p>
                    <ul class="space-y-2">
                        <li>
                            <NuxtLink to="/dream-home" class="hover:text-brand">
                                ✨ Dream Home Finder — describe your ideal home and we'll match you
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/sell" class="hover:text-brand">
                                🏠 List your home for free
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/paperwork" class="hover:text-brand">
                                📄 Paperwork directory — official forms by state
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/how-we-make-money" class="hover:text-brand">
                                💚 How we make money (spoiler: not from listings)
                            </NuxtLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
const props = defineProps<{
    error: { statusCode: number; statusMessage?: string; message?: string }
}>()

const statusCode = computed(() => props.error?.statusCode ?? 500)
const statusLabel = computed(() => {
    if (statusCode.value === 404) return 'Not found'
    if (statusCode.value === 403) return 'Forbidden'
    if (statusCode.value === 401) return 'Sign in required'
    if (statusCode.value >= 500) return 'Something went wrong'
    return 'Error'
})

const headline = computed(() => {
    if (statusCode.value === 404) return "We couldn't find that page"
    if (statusCode.value === 401) return 'You need to sign in'
    if (statusCode.value === 403) return "You don't have access to that"
    return 'Something went sideways'
})

const message = computed(() => {
    if (statusCode.value === 404) {
        return 'The page you were looking for might have moved, or maybe a typo crept into the URL. Either way, here are a few places that might help.'
    }
    if (statusCode.value === 401) {
        return 'This page is for signed-in users only. Sign in and you should land back here automatically.'
    }
    if (statusCode.value === 403) {
        return "You're signed in, but this page isn't accessible to your account."
    }
    return "Frula hit an unexpected error. We're sorry about that. Try again, or head back home and re-trace your steps."
})

function goHome() {
    clearError({ redirect: '/' })
}

useSeoMeta({
    title: () => `${statusCode.value} ${statusLabel.value} — Frula Homes`,
    robots: 'noindex',
})
</script>
