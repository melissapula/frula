<template>
  <div v-if="value !== null && value !== undefined && value !== ''" class="flex justify-between border-b border-slate-100 pb-2">
    <dt class="text-sm text-slate-500">{{ label }}</dt>
    <dd class="text-sm font-medium text-slate-900">{{ value }}</dd>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number | null | undefined }>()
</script>
