<template>
    <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="mb-3 flex items-center gap-2">
            <div class="text-lg">📣</div>
            <h3 class="font-display text-base font-bold text-slate-900">Share this listing</h3>
        </div>
        <p class="mb-4 text-xs text-slate-600">
            FSBO listings spread fastest through your own network. Share to Facebook, Nextdoor, your
            group chat — every share is one more potential buyer.
        </p>

        <div class="flex flex-wrap gap-2">
            <!-- Native share (mobile-friendly, falls back gracefully) -->
            <button
                v-if="canNativeShare"
                type="button"
                class="bg-brand hover:bg-brand-600 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
                @click="nativeShare"
            >
                📤 Share…
            </button>

            <a
                :href="facebookUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-full bg-[#1877F2] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
                <span aria-hidden="true">f</span>
                Facebook
            </a>

            <a
                :href="twitterUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
                <span aria-hidden="true">𝕏</span>
                X / Twitter
            </a>

            <a
                :href="smsUrl"
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
                💬 Text
            </a>

            <a
                :href="emailUrl"
                class="hover:border-brand hover:text-brand inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition"
            >
                ✉️ Email
            </a>

            <button
                type="button"
                class="hover:border-brand hover:text-brand inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition"
                @click="copyLink"
            >
                {{ copied ? '✓ Copied!' : '🔗 Copy link' }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    listingId: string
    address: string
    city: string
    state: string
    price: number
}>()

// Build the canonical share URL. On the server we don't have window, so we
// use the configured siteUrl from runtimeConfig as the fallback. On the
// client, window.location.href is most accurate (handles preview deploys,
// custom domains, etc.).
const config = useRuntimeConfig()
const siteUrl = computed(() => {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/listing/${props.listingId}`
    }
    return `${config.public.siteUrl}/listing/${props.listingId}`
})

const formattedPrice = computed(() =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(props.price),
)

const shareTitle = computed(() => `${props.address} — ${formattedPrice.value} on Frula Homes`)
const shareText = computed(
    () =>
        `Check out this home for sale by owner: ${props.address}, ${props.city}, ${props.state} — ${formattedPrice.value}. No agent commissions.`,
)

// URL builders for each network's share endpoint
const facebookUrl = computed(
    () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl.value)}`,
)
const twitterUrl = computed(
    () =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.value)}&url=${encodeURIComponent(siteUrl.value)}`,
)
const smsUrl = computed(
    () => `sms:?&body=${encodeURIComponent(`${shareText.value} ${siteUrl.value}`)}`,
)
const emailUrl = computed(
    () =>
        `mailto:?subject=${encodeURIComponent(shareTitle.value)}&body=${encodeURIComponent(`${shareText.value}\n\n${siteUrl.value}`)}`,
)

// Web Share API — only available on most mobile browsers and a few desktop
// ones (Safari, Edge). When present, it gives users their OS-native share
// sheet (AirDrop, WhatsApp, Signal, etc.) which is way more useful than
// hardcoded buttons. Detect support and only show the button if available.
const canNativeShare = ref(false)
onMounted(() => {
    canNativeShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
})

async function nativeShare() {
    if (!canNativeShare.value) return
    try {
        await navigator.share({
            title: shareTitle.value,
            text: shareText.value,
            url: siteUrl.value,
        })
    } catch {
        // User cancelled or share failed — silently ignore
    }
}

// Copy-link with visual feedback
const copied = ref(false)
async function copyLink() {
    try {
        await navigator.clipboard.writeText(siteUrl.value)
        copied.value = true
        setTimeout(() => (copied.value = false), 2000)
    } catch {
        // Clipboard API blocked (rare) — fall back to a prompt
        window.prompt('Copy this link:', siteUrl.value)
    }
}
</script>
