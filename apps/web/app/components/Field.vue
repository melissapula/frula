<template>
    <label class="block">
        <span class="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {{ label }}<span v-if="required" class="text-red-500"> *</span>
        </span>
        <div class="mt-1">
            <slot />
        </div>
    </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; required?: boolean }>()
</script>
