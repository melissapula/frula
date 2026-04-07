<template>
  <div class="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
    <div>
      <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
      <input
        v-model="local.city"
        type="text"
        placeholder="Bemidji"
        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500">Price</label>
      <div class="mt-1 grid grid-cols-2 gap-2">
        <input
          v-model.number="local.minPrice"
          type="number"
          placeholder="Min"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <input
          v-model.number="local.maxPrice"
          type="number"
          placeholder="Max"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500">Beds (min)</label>
        <select
          v-model.number="local.beds"
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option :value="undefined">Any</option>
          <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}+</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500">Baths (min)</label>
        <select
          v-model.number="local.baths"
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option :value="undefined">Any</option>
          <option v-for="n in [1, 2, 3, 4]" :key="n" :value="n">{{ n }}+</option>
        </select>
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500">Property type</label>
      <select
        v-model="local.propertyType"
        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      >
        <option :value="undefined">Any</option>
        <option value="residential">Residential</option>
        <option value="condo">Condo</option>
        <option value="multi-family">Multi-family</option>
        <option value="land">Land</option>
        <option value="commercial">Commercial</option>
      </select>
    </div>

    <button
      type="button"
      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-brand hover:text-brand"
      @click="reset"
    >
      Clear filters
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ListingFilters } from '~/types/listing'

const model = defineModel<ListingFilters>({ required: true })

// Local copy so v-model updates flow back via watcher (avoids deep mutation surprises)
const local = reactive<ListingFilters>({ ...model.value })

watch(local, (v) => {
  model.value = { ...v }
}, { deep: true })

function reset() {
  local.city = undefined
  local.minPrice = undefined
  local.maxPrice = undefined
  local.beds = undefined
  local.baths = undefined
  local.propertyType = undefined
}
</script>
