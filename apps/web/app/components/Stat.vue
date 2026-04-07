<template>
    <div>
        <div class="font-display text-xl font-bold text-slate-900">{{ value }}</div>
        <div class="text-xs uppercase tracking-wide text-slate-500">{{ label }}</div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ value: string | number; label: string }>()
</script>
