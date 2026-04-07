<template>
  <NuxtLink
    :to="`/listing/${listing.id}`"
    class="hover:border-brand group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg"
  >
    <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
      <img
        v-if="primaryPhoto"
        :src="primaryPhoto"
        :alt="listing.title || listing.address"
        loading="lazy"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <div v-else class="flex h-full items-center justify-center text-slate-300">No photo</div>
      <div
        class="text-brand absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm"
      >
        FSBO
      </div>
    </div>

    <div class="p-4">
      <div class="flex items-baseline justify-between gap-2">
        <div class="font-display text-2xl font-bold text-slate-900">
          {{ formatPrice(listing.price) }}
        </div>
        <div v-if="listing.sqft" class="text-xs text-slate-500">{{ pricePerSqft }}/sqft</div>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-700">
        <span v-if="listing.beds"
          ><strong>{{ listing.beds }}</strong> bd</span
        >
        <span v-if="totalBaths"
          ><strong>{{ totalBaths }}</strong> ba</span
        >
        <span v-if="listing.sqft">{{ formatSqft(listing.sqft) }}</span>
      </div>

      <p class="mt-2 truncate text-sm text-slate-600">
        {{ listing.address }}
      </p>
      <p class="text-xs text-slate-500">
        {{ listing.city }}, {{ listing.state }} {{ listing.zip }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Listing } from '~/types/listing'
import { formatPrice, formatSqft } from '~/composables/useListings'

const props = defineProps<{ listing: Listing }>()

const primaryPhoto = computed(() => {
  const photos = props.listing.listing_photos ?? []
  const primary = photos.find((p) => p.is_primary)
  return (primary ?? photos[0])?.url
})

const totalBaths = computed(() => {
  const f = props.listing.full_baths ?? 0
  const h = props.listing.half_baths ?? 0
  if (!f && !h) return null
  return h ? `${f}.${h >= 1 ? 5 : 0}` : `${f}`
})

const pricePerSqft = computed(() => {
  if (!props.listing.sqft) return ''
  return formatPrice(Math.round(props.listing.price / props.listing.sqft))
})
</script>
