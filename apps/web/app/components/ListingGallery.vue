<template>
  <div>
    <!-- Mobile: swipeable strip -->
    <div class="md:hidden">
      <div class="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
        <img
          v-if="active"
          :src="active.url"
          :alt="title"
          class="h-full w-full object-cover"
        />
        <div v-if="photos.length > 1" class="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
          {{ activeIndex + 1 }} / {{ photos.length }}
        </div>
        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md hover:bg-white"
          @click="prev"
        >‹</button>
        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md hover:bg-white"
          @click="next"
        >›</button>
      </div>
    </div>

    <!-- Desktop: hero + grid -->
    <div class="hidden md:block">
      <div v-if="photos.length === 0" class="flex aspect-[16/9] items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        No photos
      </div>
      <div v-else-if="photos.length === 1">
        <img :src="photos[0].url" :alt="title" class="aspect-[16/9] w-full rounded-2xl object-cover" />
      </div>
      <div v-else class="grid h-[420px] grid-cols-4 gap-2">
        <img
          :src="photos[0].url"
          :alt="title"
          class="col-span-2 row-span-2 h-full w-full rounded-l-2xl object-cover"
        />
        <img
          v-for="(photo, i) in photos.slice(1, 5)"
          :key="i"
          :src="photo.url"
          :alt="title"
          :class="[
            'h-full w-full object-cover',
            i === 1 ? 'rounded-tr-2xl' : '',
            i === 3 ? 'rounded-br-2xl' : '',
          ]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  photos: { url: string; is_primary: boolean; sort_order: number }[]
  title: string
}>()

const activeIndex = ref(0)
const active = computed(() => props.photos[activeIndex.value])

function prev() {
  activeIndex.value = (activeIndex.value - 1 + props.photos.length) % props.photos.length
}
function next() {
  activeIndex.value = (activeIndex.value + 1) % props.photos.length
}
</script>
