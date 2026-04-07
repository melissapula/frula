<template>
    <div
        class="hover:border-brand rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-md"
    >
        <h3 class="font-display text-lg font-semibold text-slate-900">{{ title }}</h3>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ description }}</p>
    </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>
