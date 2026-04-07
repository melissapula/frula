<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                    >Frula Homes</NuxtLink
                >
                <AuthNav />
            </div>
        </header>

        <div class="mx-auto max-w-3xl px-4 py-10 md:px-8">
            <h1 class="font-display text-3xl font-bold text-slate-900">My account</h1>

            <div v-if="user" class="mt-6 space-y-6">
                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 class="font-display text-xl font-semibold">Profile</h2>
                    <dl class="mt-4 space-y-3">
                        <div class="flex justify-between border-b border-slate-100 pb-2">
                            <dt class="text-sm text-slate-500">Email</dt>
                            <dd class="text-sm font-medium text-slate-900">{{ user.email }}</dd>
                        </div>
                        <div
                            v-if="fullName"
                            class="flex justify-between border-b border-slate-100 pb-2"
                        >
                            <dt class="text-sm text-slate-500">Name</dt>
                            <dd class="text-sm font-medium text-slate-900">{{ fullName }}</dd>
                        </div>
                        <div class="flex justify-between border-b border-slate-100 pb-2">
                            <dt class="text-sm text-slate-500">Member since</dt>
                            <dd class="text-sm font-medium text-slate-900">{{ memberSince }}</dd>
                        </div>
                    </dl>
                </section>

                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 class="font-display text-xl font-semibold">Quick actions</h2>
                    <div class="mt-4 grid gap-3 sm:grid-cols-2">
                        <NuxtLink
                            to="/sell"
                            class="bg-brand hover:bg-brand-600 rounded-full px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition"
                        >
                            List a home
                        </NuxtLink>
                        <NuxtLink
                            to="/browse"
                            class="hover:border-brand hover:text-brand rounded-full border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition"
                        >
                            Browse listings
                        </NuxtLink>
                    </div>
                </section>

                <button
                    type="button"
                    class="text-sm font-medium text-slate-500 hover:text-red-600"
                    @click="signOut"
                >
                    Sign out
                </button>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const fullName = computed(() => (user.value?.user_metadata?.full_name as string | undefined) ?? '')

const memberSince = computed(() => {
    if (!user.value?.created_at) return ''
    return new Date(user.value.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
})

async function signOut() {
    await supabase.auth.signOut()
    await router.replace('/')
}

useSeoMeta({ title: 'My account — Frula Homes' })
</script>
