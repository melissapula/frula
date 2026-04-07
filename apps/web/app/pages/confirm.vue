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

const user = useSupabaseUser()
const router = useRouter()

watchEffect(() => {
    if (user.value) router.replace('/account')
})
</script>
