<template>
    <div class="space-y-3">
        <!-- Drop zone -->
        <label
            :class="[
                'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50 px-6 py-10 text-center transition',
                dragOver
                    ? 'border-brand bg-brand/5'
                    : 'hover:border-brand hover:bg-brand/5 border-slate-300',
            ]"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
        >
            <svg
                class="text-brand h-10 w-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5V18"
                />
            </svg>
            <p class="mt-3 text-sm font-semibold text-slate-700">
                Drop photos here or <span class="text-brand underline">browse</span>
            </p>
            <p class="mt-1 text-xs text-slate-500">JPG, PNG, or HEIC. Up to 25 MB each.</p>
            <input
                ref="fileInput"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="onFileChange"
            />
        </label>

        <p
            v-if="!isConfigured"
            class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
        >
            Photo uploads aren't configured yet. Add <code>CLOUDINARY_CLOUD_NAME</code> and
            <code>CLOUDINARY_UPLOAD_PRESET</code> to your <code>.env</code> and restart the dev
            server.
        </p>

        <!-- Errors -->
        <p
            v-if="errorMessage"
            class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
            {{ errorMessage }}
        </p>

        <!-- Photo grid -->
        <div v-if="photos.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div
                v-for="(photo, idx) in photos"
                :key="photo.localId"
                class="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
                <div class="aspect-[4/3]">
                    <img
                        v-if="photo.url"
                        :src="photo.url"
                        :alt="`Photo ${idx + 1}`"
                        class="h-full w-full object-cover"
                    />
                    <div
                        v-else-if="photo.uploading"
                        class="flex h-full flex-col items-center justify-center gap-2 p-2"
                    >
                        <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                                class="bg-brand h-full transition-all"
                                :style="{ width: `${photo.progress}%` }"
                            />
                        </div>
                        <p class="text-xs text-slate-500">Uploading… {{ photo.progress }}%</p>
                    </div>
                </div>

                <!-- Primary badge -->
                <div
                    v-if="idx === 0 && photo.url"
                    class="bg-brand absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                >
                    Primary
                </div>

                <!-- Action buttons (hover) -->
                <div
                    v-if="photo.url"
                    class="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100"
                >
                    <div class="flex gap-1">
                        <button
                            type="button"
                            :disabled="idx === 0"
                            class="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-40"
                            title="Move up"
                            @click="move(idx, -1)"
                        >
                            ←
                        </button>
                        <button
                            type="button"
                            :disabled="idx === photos.length - 1"
                            class="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-40"
                            title="Move down"
                            @click="move(idx, 1)"
                        >
                            →
                        </button>
                    </div>
                    <button
                        type="button"
                        class="rounded-md bg-red-500/90 px-2 py-1 text-xs font-semibold text-white"
                        title="Remove"
                        @click="remove(idx)"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>

        <p v-if="photos.length" class="text-xs text-slate-500">
            The first photo is the primary thumbnail buyers see in the listing card. Drag with the
            arrows to reorder.
        </p>
    </div>
</template>

<script setup lang="ts">
import { useCloudinaryUpload } from '~/composables/useCloudinaryUpload'

interface PhotoEntry {
    localId: string
    url: string | null
    publicId: string | null
    uploading: boolean
    progress: number
}

const photos = defineModel<{ url: string; publicId?: string }[]>({ default: () => [] })
const { uploadFile, isConfigured } = useCloudinaryUpload()

// Internal entries (with progress + localId) mirrored back to the v-model
// as the simpler {url, publicId}[] shape on every change.
const entries = ref<PhotoEntry[]>(
    (photos.value ?? []).map((p, i) => ({
        localId: `existing-${i}-${p.url}`,
        url: p.url,
        publicId: p.publicId ?? null,
        uploading: false,
        progress: 100,
    })),
)

const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const errorMessage = ref<string | null>(null)

function syncOut() {
    photos.value = entries.value
        .filter((e) => e.url && !e.uploading)
        .map((e) => ({ url: e.url!, publicId: e.publicId ?? undefined }))
}

function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files) return
    addFiles(Array.from(input.files))
    input.value = ''
}

function onDrop(e: DragEvent) {
    dragOver.value = false
    if (!e.dataTransfer?.files) return
    addFiles(Array.from(e.dataTransfer.files))
}

async function addFiles(files: File[]) {
    errorMessage.value = null
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (!images.length) return

    for (const file of images) {
        const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const entry: PhotoEntry = {
            localId,
            url: null,
            publicId: null,
            uploading: true,
            progress: 0,
        }
        entries.value.push(entry)

        try {
            const result = await uploadFile(file, (pct) => {
                entry.progress = pct
            })
            entry.url = result.url
            entry.publicId = result.publicId
            entry.uploading = false
            entry.progress = 100
            syncOut()
        } catch (e: unknown) {
            entries.value = entries.value.filter((x) => x.localId !== localId)
            const err = e as { message?: string }
            errorMessage.value = err.message || 'One or more uploads failed'
        }
    }
}

function remove(idx: number) {
    entries.value.splice(idx, 1)
    syncOut()
}

function move(idx: number, delta: number) {
    const next = idx + delta
    if (next < 0 || next >= entries.value.length) return
    const [item] = entries.value.splice(idx, 1)
    entries.value.splice(next, 0, item!)
    syncOut()
}
</script>
