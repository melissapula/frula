<template>
    <label class="block">
        <span class="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {{ label }}<span v-if="required" class="text-red-500"> *</span>
        </span>
        <div class="mt-1">
            <!-- The input binds these so screen readers announce the error with the field. -->
            <slot v-bind="{ errorId: error ? errorId : undefined, invalid: !!error }" />
        </div>
        <p v-if="error" :id="errorId" class="mt-1 text-xs text-red-600">{{ error }}</p>
    </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; required?: boolean; error?: string }>()

const errorId = useId()
</script>
