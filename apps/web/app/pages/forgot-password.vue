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
                <h1 class="font-display text-2xl font-bold text-slate-900">Reset your password</h1>
                <p class="mt-1 text-sm text-slate-600">
                    Enter the email you used to sign up and we'll send you a link to set a new
                    password.
                </p>

                <form v-if="!sent" class="mt-6 space-y-4" @submit.prevent="submit">
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
                        {{ loading ? 'Sending…' : 'Send reset link' }}
                    </button>
                </form>

                <div
                    v-else
                    class="mt-6 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                    <p class="font-semibold">Check your email 💌</p>
                    <p>
                        If an account exists for <strong>{{ email }}</strong
                        >, we just sent a password reset link. Click the link in the email to set a
                        new password. The link expires in 1 hour.
                    </p>
                    <div
                        class="rounded-md border border-emerald-200 bg-white/60 p-3 text-xs text-emerald-900"
                    >
                        <p class="font-semibold">Don't see it after a couple minutes?</p>
                        <ol class="ml-4 mt-1 list-decimal space-y-1 text-emerald-800">
                            <li>
                                Check your <strong>spam</strong> or <strong>junk</strong> folder —
                                Gmail users, also peek in <strong>Promotions</strong>.
                            </li>
                            <li>
                                Add
                                <strong>noreply@frulahomes.com</strong>
                                to your contacts so future emails land in your inbox.
                            </li>
                            <li>
                                Still nothing?
                                <button
                                    type="button"
                                    class="font-semibold underline"
                                    @click="sent = false"
                                >
                                    Try sending again
                                </button>
                                with the same or a different email.
                            </li>
                        </ol>
                    </div>
                </div>

                <p class="mt-6 text-center text-sm text-slate-600">
                    Remembered it?
                    <NuxtLink to="/login" class="text-brand font-semibold hover:underline"
                        >Back to sign in</NuxtLink
                    >
                </p>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()

const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const sent = ref(false)

async function submit() {
    error.value = null
    loading.value = true
    // Tells Supabase where to redirect the user after they click the reset link.
    // The /reset-password page reads the recovery token from the URL and lets
    // them choose a new password.
    const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo,
    })
    loading.value = false
    if (resetError) {
        error.value = resetError.message
        return
    }
    sent.value = true
}

useSeoMeta({ title: 'Forgot password — Frula Homes' })
</script>
