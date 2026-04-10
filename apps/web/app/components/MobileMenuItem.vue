<template>
    <li>
        <NuxtLink
            :to="to"
            :class="[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                isActive
                    ? 'bg-brand/10 text-brand font-semibold'
                    : 'text-slate-700 hover:bg-slate-50',
            ]"
            @click="$emit('nav')"
        >
            <span class="w-6 text-center text-base">{{ icon }}</span>
            <span class="flex-1">{{ label }}</span>
            <span
                v-if="badge"
                class="bg-brand inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
            >
                {{ badge > 99 ? '99+' : badge }}
            </span>
        </NuxtLink>
    </li>
</template>

<script setup lang="ts">
const props = defineProps<{
    to: string
    icon: string
    label: string
    badge?: number
}>()

defineEmits<{ (e: 'nav'): void }>()

const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>
