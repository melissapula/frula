<template>
    <main class="mx-auto max-w-2xl p-8">
        <h1 class="font-display text-3xl font-bold">Supabase Health Check</h1>

        <div v-if="pending" class="mt-6 text-slate-500">Connecting…</div>

        <div
            v-else-if="error"
            class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
        >
            <p class="font-semibold">Connection failed</p>
            <pre class="mt-2 whitespace-pre-wrap text-xs">{{ error.message }}</pre>
        </div>

        <div v-else class="mt-6">
            <p class="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                ✅ Connected. Found <strong>{{ data?.length ?? 0 }}</strong> checklist template{{
                    (data?.length ?? 0) === 1 ? '' : 's'
                }}.
            </p>
            <ul class="mt-6 space-y-3">
                <li v-for="t in data" :key="t.id" class="rounded-xl border border-slate-200 p-4">
                    <div class="font-semibold">{{ t.name }}</div>
                    <div class="text-sm text-slate-500">
                        {{ t.role }} · {{ t.property_type }} · {{ t.state }}
                    </div>
                </li>
            </ul>
        </div>
    </main>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()

const { data, error, pending } = await useAsyncData('checklist-templates', async () => {
    const { data, error } = await supabase
        .from('checklist_templates')
        .select('id, name, role, property_type, state')
        .order('name')
    if (error) throw error
    return data
})

useSeoMeta({ title: 'Health Check — Frula Homes' })
</script>
