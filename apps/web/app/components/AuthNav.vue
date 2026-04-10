<template>
    <div class="flex items-center gap-3">
        <NuxtLink
            to="/paperwork"
            class="hover:text-brand hidden text-sm font-medium text-slate-600 sm:block"
        >
            📄 Paperwork
        </NuxtLink>
        <NuxtLink
            to="/dream-home"
            class="hover:text-brand hidden text-sm font-semibold text-slate-700 sm:block"
        >
            ✨ Dream Home
        </NuxtLink>
        <template v-if="user">
            <NotificationsBell />
            <NuxtLink
                to="/saved"
                :class="[
                    'hover:text-brand hidden text-sm font-medium sm:flex sm:items-center sm:gap-1.5',
                    savedCount > 0 ? 'text-slate-700' : 'text-slate-600',
                ]"
            >
                ❤️
                <span v-if="savedCount > 0" class="text-xs">{{ savedCount }}</span>
            </NuxtLink>
            <NuxtLink
                to="/inbox"
                :class="[
                    'hover:text-brand relative hidden text-sm font-medium sm:flex sm:items-center sm:gap-1.5',
                    unreadCount > 0 ? 'text-brand font-bold' : 'text-slate-600',
                ]"
            >
                Inbox
                <span
                    v-if="unreadCount > 0"
                    class="bg-brand inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                >
                    {{ unreadCount > 99 ? '99+' : unreadCount }}
                </span>
            </NuxtLink>
            <NuxtLink
                to="/transactions"
                class="hover:text-brand hidden text-sm font-medium text-slate-600 sm:block"
            >
                Transactions
            </NuxtLink>
            <!-- User dropdown -->
            <div class="relative hidden sm:block" ref="dropdownRef">
                <button
                    class="hover:text-brand flex items-center gap-2 text-sm font-medium text-slate-600"
                    @click="dropdownOpen = !dropdownOpen"
                >
                    {{ displayName }}
                    <svg
                        class="h-4 w-4 transition"
                        :class="{ 'rotate-180': dropdownOpen }"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </button>
                <div
                    v-if="dropdownOpen"
                    class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                    <NuxtLink
                        to="/account"
                        class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        @click="dropdownOpen = false"
                    >
                        Account
                    </NuxtLink>
                    <button
                        class="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        @click="signOut"
                    >
                        Sign out
                    </button>
                </div>
            </div>
            <NuxtLink
                to="/account"
                class="bg-brand inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                :title="user.email ?? ''"
            >
                {{ initials }}
            </NuxtLink>
        </template>
        <template v-else>
            <NuxtLink
                to="/login"
                class="hover:text-brand hidden text-sm font-medium text-slate-600 sm:block"
            >
                Sign in
            </NuxtLink>
            <NuxtLink
                to="/signup"
                class="bg-brand hover:bg-brand-600 rounded-full px-4 py-2 text-sm font-semibold text-white"
            >
                Sign up
            </NuxtLink>
        </template>
        <!-- Mobile hamburger menu (replaces all the sm:hidden links) -->
        <MobileMenu :unread-count="unreadCount" />
    </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()
const router = useRouter()
const { version: unreadBadgeVersion } = useUnreadBadge()
const { savedIds } = useSaved()
const savedCount = computed(() => savedIds.value.size)

// User dropdown
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function onClickOutside(e: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        dropdownOpen.value = false
    }
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

async function signOut() {
    dropdownOpen.value = false
    await supabase.auth.signOut()
    router.push('/')
}

// Live unread-message count for the badge on the Inbox link.
// Refreshes whenever the user changes, the route changes (so opening a
// thread immediately decrements the badge), and via realtime INSERT/UPDATE
// subscriptions on the messages table.
const unreadCount = ref(0)

async function refreshUnread() {
    if (!user.value) {
        unreadCount.value = 0
        return
    }
    const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.value.id)
        .eq('is_read', false)
    unreadCount.value = count ?? 0
}

let channel: ReturnType<typeof supabase.channel> | null = null

watch(
    user,
    (u) => {
        // Tear down any prior subscription when the user changes
        if (channel) {
            supabase.removeChannel(channel)
            channel = null
        }
        if (!u) {
            unreadCount.value = 0
            return
        }
        refreshUnread()
        // Realtime: a new INSERT addressed to me, OR an UPDATE that flips is_read
        // (e.g. opening a thread on another tab) — both should refresh the badge.
        // Unique suffix on the channel name avoids Supabase returning a cached
        // already-subscribed channel on HMR or re-login.
        channel = supabase
            .channel(`unread-badge-${u.id}-${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${u.id}`,
                },
                () => refreshUnread(),
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${u.id}`,
                },
                () => refreshUnread(),
            )
            .subscribe()
    },
    { immediate: true },
)

// Refresh whenever navigation lands on (or leaves) an inbox thread, since
// the thread page marks messages as read on mount.
watch(
    () => route.fullPath,
    () => refreshUnread(),
)

// Refresh whenever any page bumps the shared trigger (e.g. inbox list
// marks a thread as unread or deletes a thread).
watch(unreadBadgeVersion, () => refreshUnread())

onBeforeUnmount(() => {
    if (channel) supabase.removeChannel(channel)
})

const displayName = computed(() => {
    const name = user.value?.user_metadata?.full_name as string | undefined
    return name || user.value?.email || ''
})

const initials = computed(() => {
    const source =
        (user.value?.user_metadata?.full_name as string | undefined) || user.value?.email || '?'
    const parts = source.split(/\s+|@/).filter(Boolean)
    return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? '')
})
</script>
