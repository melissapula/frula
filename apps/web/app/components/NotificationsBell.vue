<template>
    <div ref="rootEl" class="relative">
        <button
            type="button"
            :class="[
                'hover:text-brand relative flex items-center justify-center text-base text-slate-600 transition',
                unreadCount > 0 ? 'text-brand' : '',
            ]"
            :aria-label="`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`"
            @click="toggle"
        >
            🔔
            <span
                v-if="unreadCount > 0"
                class="absolute -right-2 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
            >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
        </button>

        <!-- Dropdown -->
        <div
            v-if="open"
            class="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96"
        >
            <div
                class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"
            >
                <p class="font-display text-sm font-bold text-slate-900">Notifications</p>
                <button
                    v-if="unreadCount > 0"
                    type="button"
                    class="text-brand text-xs font-semibold hover:underline"
                    @click="onMarkAllRead"
                >
                    Mark all read
                </button>
            </div>

            <div class="max-h-[26rem] overflow-y-auto">
                <div
                    v-if="!notifications.length"
                    class="px-6 py-10 text-center text-sm text-slate-500"
                >
                    <p class="mb-1 text-3xl">🔕</p>
                    <p>You're all caught up.</p>
                </div>

                <button
                    v-for="n in notifications"
                    :key="n.id"
                    type="button"
                    :class="[
                        'flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50',
                        !n.is_read && 'bg-brand/5',
                    ]"
                    @click="onClick(n)"
                >
                    <div class="text-xl">{{ iconFor(n.kind) }}</div>
                    <div class="min-w-0 flex-1">
                        <p
                            :class="[
                                'truncate text-sm',
                                n.is_read
                                    ? 'font-medium text-slate-700'
                                    : 'font-bold text-slate-900',
                            ]"
                        >
                            {{ n.title }}
                        </p>
                        <p v-if="n.body" class="truncate text-xs text-slate-500">
                            {{ n.body }}
                        </p>
                        <p class="mt-0.5 text-[10px] text-slate-400">
                            {{ relativeTime(n.created_at) }}
                        </p>
                    </div>
                    <span
                        v-if="!n.is_read"
                        class="bg-brand mt-1.5 h-2 w-2 flex-none rounded-full"
                    />
                </button>
            </div>

            <div
                v-if="notifications.length"
                class="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center"
            >
                <NuxtLink
                    to="/inbox"
                    class="hover:text-brand text-xs font-semibold text-slate-600"
                    @click="open = false"
                >
                    Open inbox →
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { NotificationRow } from '~/composables/useNotifications'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const { notifications, unreadCount, load, markRead, markAllRead, refreshTrigger } =
    useNotifications()

const open = ref(false)
const rootEl = ref<HTMLDivElement | null>(null)

function toggle() {
    open.value = !open.value
}

function onClick(n: NotificationRow) {
    markRead(n.id)
    open.value = false
    if (n.link) router.push(n.link)
}

async function onMarkAllRead() {
    await markAllRead()
}

const ICONS: Record<string, string> = {
    offer: '💰',
    offer_accepted: '✅',
    offer_declined: '❌',
    offer_countered: '↪️',
    viewing_request: '📅',
    viewing_confirmed: '✅',
    viewing_declined: '❌',
    message: '💬',
    save: '❤️',
}
function iconFor(kind: string): string {
    return ICONS[kind] ?? '🔔'
}

function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime()
    const min = Math.floor(ms / 60000)
    if (min < 1) return 'just now'
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const d = Math.floor(hr / 24)
    if (d < 7) return `${d}d ago`
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Click outside to close
function onClickOutside(e: MouseEvent) {
    if (!rootEl.value) return
    if (open.value && !rootEl.value.contains(e.target as Node)) {
        open.value = false
    }
}

let channel: ReturnType<typeof supabase.channel> | null = null

watch(
    user,
    (u) => {
        if (channel) {
            supabase.removeChannel(channel)
            channel = null
        }
        if (!u) {
            notifications.value = []
            return
        }
        load()
        // Realtime: a new notification for me → refresh the list
        channel = supabase
            .channel(`notifications-${u.id}-${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${u.id}`,
                },
                () => load(),
            )
            .subscribe()
    },
    { immediate: true },
)

// Manual refresh trigger from anywhere
watch(refreshTrigger, () => load())

onMounted(() => {
    document.addEventListener('click', onClickOutside)
})
onBeforeUnmount(() => {
    document.removeEventListener('click', onClickOutside)
    if (channel) supabase.removeChannel(channel)
})
</script>
