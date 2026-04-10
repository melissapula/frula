<template>
    <div>
        <!-- Mobile: swipeable strip -->
        <div class="md:hidden">
            <div class="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                <img
                    v-if="active"
                    :src="active.url"
                    :alt="title"
                    class="h-full w-full cursor-pointer object-cover"
                    @click="openLightbox(activeIndex)"
                />
                <div
                    v-if="photos.length > 1"
                    class="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white"
                >
                    {{ activeIndex + 1 }} / {{ photos.length }}
                </div>
                <button
                    v-if="photos.length > 1"
                    type="button"
                    class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md hover:bg-white"
                    @click="prev"
                >
                    ‹
                </button>
                <button
                    v-if="photos.length > 1"
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md hover:bg-white"
                    @click="next"
                >
                    ›
                </button>
            </div>
        </div>

        <!-- Desktop: hero + grid -->
        <div class="hidden md:block">
            <div
                v-if="photos.length === 0"
                class="flex aspect-[16/9] items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
            >
                No photos
            </div>
            <div v-else-if="photos.length === 1">
                <img
                    :src="photos[0].url"
                    :alt="title"
                    class="aspect-[16/9] w-full cursor-pointer rounded-2xl object-cover"
                    @click="openLightbox(0)"
                />
            </div>
            <div v-else class="relative grid h-[420px] grid-cols-4 gap-2">
                <img
                    :src="photos[0].url"
                    :alt="title"
                    class="col-span-2 row-span-2 h-full w-full cursor-pointer rounded-l-2xl object-cover"
                    @click="openLightbox(0)"
                />
                <img
                    v-for="(photo, i) in photos.slice(1, 5)"
                    :key="i"
                    :src="photo.url"
                    :alt="title"
                    :class="[
                        'h-full w-full cursor-pointer object-cover',
                        i === 1 ? 'rounded-tr-2xl' : '',
                        i === 3 ? 'rounded-br-2xl' : '',
                    ]"
                    @click="openLightbox(i + 1)"
                />
                <button
                    v-if="photos.length > 5"
                    type="button"
                    class="absolute bottom-3 right-3 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-md hover:bg-white"
                    @click="openLightbox(4)"
                >
                    +{{ photos.length - 5 }} more photos
                </button>
            </div>
        </div>

        <!-- Lightbox overlay -->
        <Teleport to="body">
            <Transition name="lightbox">
                <div
                    v-if="lightboxOpen"
                    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
                    role="dialog"
                    aria-modal="true"
                    @click.self="closeLightbox"
                    @keydown.escape="closeLightbox"
                    @keydown.left="lightboxPrev"
                    @keydown.right="lightboxNext"
                >
                    <!-- Close button -->
                    <button
                        type="button"
                        class="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                        aria-label="Close"
                        @click="closeLightbox"
                    >
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    <!-- Counter -->
                    <div
                        class="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white"
                    >
                        {{ lightboxIndex + 1 }} / {{ photos.length }}
                    </div>

                    <!-- Prev / next arrows -->
                    <button
                        v-if="photos.length > 1"
                        type="button"
                        class="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-2xl text-white transition hover:bg-white/20"
                        @click="lightboxPrev"
                    >
                        ‹
                    </button>
                    <button
                        v-if="photos.length > 1"
                        type="button"
                        class="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-2xl text-white transition hover:bg-white/20"
                        @click="lightboxNext"
                    >
                        ›
                    </button>

                    <!-- The image -->
                    <img
                        :src="photos[lightboxIndex]?.url"
                        :alt="`${title} — photo ${lightboxIndex + 1}`"
                        class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
                    />

                    <!-- Thumbnail strip -->
                    <div
                        v-if="photos.length > 1"
                        class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-white/10 p-2 backdrop-blur"
                    >
                        <button
                            v-for="(photo, i) in photos"
                            :key="i"
                            type="button"
                            :class="[
                                'h-12 w-16 flex-none overflow-hidden rounded-md transition',
                                i === lightboxIndex
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50'
                                    : 'opacity-60 hover:opacity-100',
                            ]"
                            @click="lightboxIndex = i"
                        >
                            <img
                                :src="photo.url"
                                :alt="`Thumbnail ${i + 1}`"
                                class="h-full w-full object-cover"
                            />
                        </button>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    photos: { url: string; is_primary: boolean; sort_order: number }[]
    title: string
}>()

// Mobile strip state
const activeIndex = ref(0)
const active = computed(() => props.photos[activeIndex.value])

function prev() {
    activeIndex.value = (activeIndex.value - 1 + props.photos.length) % props.photos.length
}
function next() {
    activeIndex.value = (activeIndex.value + 1) % props.photos.length
}

// Lightbox state
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox(index: number) {
    lightboxIndex.value = index
    lightboxOpen.value = true
    // Focus the overlay so keyboard events work immediately
    nextTick(() => {
        const el = document.querySelector('[role="dialog"]') as HTMLElement | null
        el?.focus()
    })
}

function closeLightbox() {
    lightboxOpen.value = false
}

function lightboxPrev() {
    lightboxIndex.value = (lightboxIndex.value - 1 + props.photos.length) % props.photos.length
}

function lightboxNext() {
    lightboxIndex.value = (lightboxIndex.value + 1) % props.photos.length
}

// Prevent body scroll while lightbox is open
watch(lightboxOpen, (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
})

// Cleanup on unmount
onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
    }
})
</script>

<style scoped>
.lightbox-enter-active,
.lightbox-leave-active {
    transition: opacity 200ms ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
    opacity: 0;
}
</style>
