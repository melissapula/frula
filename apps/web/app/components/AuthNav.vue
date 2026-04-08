<template>
    <div class="flex items-center gap-3">
        <template v-if="user">
            <NuxtLink
                to="/inbox"
                class="hover:text-brand hidden text-sm font-medium text-slate-600 sm:block"
            >
                Inbox
            </NuxtLink>
            <NuxtLink
                to="/account"
                class="hover:text-brand hidden text-sm font-medium text-slate-600 sm:block"
            >
                {{ displayName }}
            </NuxtLink>
            <NuxtLink
                to="/account"
                class="bg-brand inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                :title="user.email ?? ''"
            >
                {{ initials }}
            </NuxtLink>
        </template>
        <template v-else>
            <NuxtLink
                to="/login"
                class="hover:text-brand hidden text-sm font-medium text-slate-600 sm:block"
            >
                Sign in
            </NuxtLink>
            <NuxtLink
                to="/signup"
                class="bg-brand hover:bg-brand-600 rounded-full px-4 py-2 text-sm font-semibold text-white"
            >
                Sign up
            </NuxtLink>
        </template>
    </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()

const displayName = computed(() => {
    const name = user.value?.user_metadata?.full_name as string | undefined
    return name || user.value?.email || ''
})

const initials = computed(() => {
    const source =
        (user.value?.user_metadata?.full_name as string | undefined) || user.value?.email || '?'
    const parts = source.split(/\s+|@/).filter(Boolean)
    return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? '')
})
</script>
