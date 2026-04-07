<template>
    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="font-display text-xl font-semibold text-slate-900">{{ title }}</h2>
        <div class="mt-4 space-y-4">
            <slot />
        </div>
    </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
