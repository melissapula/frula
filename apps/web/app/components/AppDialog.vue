<template>
    <div
        v-if="request"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        @click.self="cancel"
        @keydown.esc="cancel"
    >
        <form
            class="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            @submit.prevent="submit"
        >
            <div class="px-6 py-5">
                <h2 id="app-dialog-title" class="font-display text-xl font-bold text-slate-900">
                    {{ request.title }}
                </h2>
                <p v-if="request.message" class="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {{ request.message }}
                </p>
                <textarea
                    v-if="request.kind === 'prompt'"
                    ref="inputEl"
                    v-model="inputValue"
                    rows="3"
                    :placeholder="request.placeholder"
                    class="focus:border-brand focus:ring-brand mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                />
            </div>
            <div
                class="flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end"
            >
                <button
                    v-if="request.kind !== 'alert'"
                    type="button"
                    class="min-h-[44px] rounded-full px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    @click="cancel"
                >
                    {{ request.cancelLabel ?? 'Cancel' }}
                </button>
                <button
                    ref="confirmEl"
                    type="submit"
                    :class="[
                        'min-h-[44px] rounded-full px-5 py-2 text-sm font-semibold text-white transition',
                        request.isDestructive
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-brand hover:bg-brand-600',
                    ]"
                >
                    {{ request.confirmLabel ?? 'OK' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
const { request, close } = useDialog()

const inputValue = ref('')
const inputEl = ref<HTMLTextAreaElement | null>(null)
const confirmEl = ref<HTMLButtonElement | null>(null)

// Focus goes inside so Escape reaches the dialog and keyboard users land on it.
watch(request, async (next) => {
    if (!next) return
    inputValue.value = next.initialValue ?? ''
    await nextTick()
    if (next.kind !== 'prompt') {
        confirmEl.value?.focus()
        return
    }
    inputEl.value?.focus()
    inputEl.value?.select()
})

function submit() {
    if (request.value?.kind === 'prompt') close(inputValue.value)
    else close(true)
}

function cancel() {
    close(request.value?.kind === 'prompt' ? null : false)
}
</script>
