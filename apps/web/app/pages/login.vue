<template>
    <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div class="w-full max-w-md">
            <NuxtLink
                to="/"
                class="font-display text-brand mb-6 block text-center text-3xl font-bold"
            >
                Frula Homes
            </NuxtLink>

            <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 class="font-display text-2xl font-bold text-slate-900">Sign in</h1>
                <p class="mt-1 text-sm text-slate-600">Welcome back.</p>

                <form class="mt-6 space-y-4" @submit.prevent="signIn">
                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Email
                        </label>
                        <input
                            v-model="email"
                            type="email"
                            required
                            autocomplete="email"
                            class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Password
                        </label>
                        <input
                            v-model="password"
                            type="password"
                            required
                            autocomplete="current-password"
                            class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                        />
                    </div>

                    <div
                        v-if="error"
                        class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                    >
                        {{ error }}
                    </div>

                    <button
                        type="submit"
                        :disabled="loading"
                        class="bg-brand hover:bg-brand-600 w-full rounded-full px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
                    >
                        {{ loading ? 'Signing in…' : 'Sign in' }}
                    </button>
                </form>

                <p class="mt-6 text-center text-sm text-slate-600">
                    No account?
                    <NuxtLink to="/signup" class="text-brand font-semibold hover:underline"
                        >Sign up</NuxtLink
                    >
                </p>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

watchEffect(() => {
    if (user.value) router.replace('/account')
})

async function signIn() {
    error.value = null
    loading.value = true
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
    })
    loading.value = false
    if (signInError) {
        error.value = signInError.message
        return
    }
    await router.replace('/account')
}

useSeoMeta({ title: 'Sign in — Frula Homes' })
</script>
