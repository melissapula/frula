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
                <h1 class="font-display text-2xl font-bold text-slate-900">Set a new password</h1>
                <p class="mt-1 text-sm text-slate-600">
                    Choose a password you'll remember this time. 😉
                </p>

                <form v-if="!done" class="mt-6 space-y-4" @submit.prevent="submit">
                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            New password
                        </label>
                        <input
                            v-model="password"
                            type="password"
                            required
                            minlength="8"
                            autocomplete="new-password"
                            class="focus:border-brand focus:ring-brand mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                        />
                        <p class="mt-1 text-xs text-slate-500">At least 8 characters.</p>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Confirm new password
                        </label>
                        <input
                            v-model="confirm"
                            type="password"
                            required
                            autocomplete="new-password"
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
                        :disabled="loading || !canSubmit"
                        class="bg-brand hover:bg-brand-600 w-full rounded-full px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
                    >
                        {{ loading ? 'Saving…' : 'Save new password' }}
                    </button>
                </form>

                <div
                    v-else
                    class="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                    <p class="font-semibold">All set! ✓</p>
                    <p class="mt-1">
                        Your password has been updated. Redirecting you to your account…
                    </p>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const router = useRouter()

const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const done = ref(false)

const canSubmit = computed(() => password.value.length >= 8 && password.value === confirm.value)

async function submit() {
    error.value = null
    if (password.value !== confirm.value) {
        error.value = "Passwords don't match."
        return
    }
    if (password.value.length < 8) {
        error.value = 'Password must be at least 8 characters.'
        return
    }
    loading.value = true
    // The user is in a Supabase "recovery" session at this point — created
    // automatically by clicking the link in the reset email. updateUser({password})
    // works against that session.
    const { error: updateError } = await supabase.auth.updateUser({
        password: password.value,
    })
    loading.value = false
    if (updateError) {
        error.value = updateError.message
        return
    }
    done.value = true
    setTimeout(() => router.replace('/account'), 1500)
}

useSeoMeta({ title: 'Set new password — Frula Homes', robots: 'noindex' })
</script>
