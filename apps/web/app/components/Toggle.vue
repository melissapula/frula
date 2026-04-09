<template>
    <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
            type="checkbox"
            :checked="!!model"
            class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
            @change="onChange"
        />
        <span>{{ label }}</span>
    </label>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
const model = defineModel<boolean | undefined>()

function onChange(e: Event) {
    const checked = (e.target as HTMLInputElement).checked
    // Use undefined (not false) so the filter is "off" rather than actively
    // matching listings with that field === false. Keeps URLs/state clean too.
    model.value = checked ? true : undefined
}
</script>
