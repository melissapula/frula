<template>
    <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div class="text-center">
            <div class="font-display text-brand text-2xl font-bold">Frula Homes</div>
            <p class="mt-4 text-slate-600">Signing you in…</p>
        </div>
    </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useSeoMeta({ title: 'Confirming — Frula Homes', robots: 'noindex' })

const user = useSupabaseUser()
const router = useRouter()

// Fire the welcome email once the user is confirmed + authenticated.
// Idempotent via `welcomed_at` — safe to call from here AND from /signup.
const firedWelcome = ref(false)
watchEffect(async () => {
    if (user.value) {
        if (!firedWelcome.value) {
            firedWelcome.value = true
            try {
                await $fetch('/api/notifications/welcome', { method: 'POST' })
            } catch {
                // Non-fatal
            }
        }
        router.replace('/account')
    }
})
</script>
