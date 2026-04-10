<template>
    <div class="sm:hidden">
        <!-- Hamburger button -->
        <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            :aria-label="open ? 'Close menu' : 'Open menu'"
            @click="open = !open"
        >
            <!-- Hamburger / X icon swap -->
            <svg v-if="!open" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        </button>

        <!-- Slide-down menu panel -->
        <Teleport to="body">
            <Transition name="menu">
                <div v-if="open" class="fixed inset-x-0 top-0 z-50 bg-white shadow-xl">
                    <!-- Header inside the menu -->
                    <div
                        class="flex items-center justify-between border-b border-slate-200 px-4 py-4"
                    >
                        <NuxtLink
                            to="/"
                            class="font-display text-brand text-xl font-bold"
                            @click="close"
                        >
                            Frula Homes
                        </NuxtLink>
                        <button
                            type="button"
                            class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                            aria-label="Close menu"
                            @click="close"
                        >
                            <svg
                                class="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <nav class="max-h-[80vh] overflow-y-auto px-4 py-4">
                        <!-- Logged-in user profile banner -->
                        <div
                            v-if="user"
                            class="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                        >
                            <div
                                class="bg-brand flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                            >
                                {{ initials }}
                            </div>
                            <div class="min-w-0">
                                <p class="truncate text-sm font-semibold text-slate-900">
                                    {{ displayName }}
                                </p>
                                <p class="truncate text-xs text-slate-500">{{ user.email }}</p>
                            </div>
                        </div>

                        <ul class="space-y-1">
                            <MobileMenuItem
                                to="/browse"
                                icon="🔍"
                                label="Browse listings"
                                @nav="close"
                            />
                            <MobileMenuItem
                                to="/dream-home"
                                icon="✨"
                                label="Dream Home Finder"
                                @nav="close"
                            />
                            <MobileMenuItem
                                to="/paperwork"
                                icon="📄"
                                label="Paperwork directory"
                                @nav="close"
                            />
                            <MobileMenuItem
                                to="/how-we-make-money"
                                icon="💚"
                                label="How we make money"
                                @nav="close"
                            />

                            <template v-if="user">
                                <li class="my-2 border-t border-slate-100" />
                                <MobileMenuItem
                                    to="/account"
                                    icon="👤"
                                    label="My account"
                                    @nav="close"
                                />
                                <MobileMenuItem
                                    to="/sell"
                                    icon="🏠"
                                    label="List a home"
                                    @nav="close"
                                />
                                <MobileMenuItem
                                    to="/inbox"
                                    icon="💬"
                                    :label="`Inbox${unreadCount > 0 ? ` (${unreadCount})` : ''}`"
                                    :badge="unreadCount"
                                    @nav="close"
                                />
                                <MobileMenuItem
                                    to="/saved"
                                    icon="❤️"
                                    :label="`Saved (${savedCount})`"
                                    @nav="close"
                                />
                                <MobileMenuItem
                                    to="/transactions"
                                    icon="📋"
                                    label="Transactions"
                                    @nav="close"
                                />
                                <li class="my-2 border-t border-slate-100" />
                                <li>
                                    <button
                                        type="button"
                                        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                                        @click="signOut"
                                    >
                                        <span class="w-6 text-center text-base">🚪</span>
                                        Sign out
                                    </button>
                                </li>
                            </template>

                            <template v-else>
                                <li class="my-2 border-t border-slate-100" />
                                <MobileMenuItem
                                    to="/login"
                                    icon="🔑"
                                    label="Sign in"
                                    @nav="close"
                                />
                                <MobileMenuItem
                                    to="/signup"
                                    icon="✨"
                                    label="Sign up"
                                    @nav="close"
                                />
                            </template>
                        </ul>
                    </nav>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()
const { savedIds } = useSaved()
const savedCount = computed(() => savedIds.value.size)

const props = defineProps<{
    unreadCount: number
}>()

const open = ref(false)

function close() {
    open.value = false
}

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

async function signOut() {
    close()
    await supabase.auth.signOut()
    await router.replace('/')
}

// Close on route change (user tapped a link)
const route = useRoute()
watch(() => route.fullPath, close)
</script>

<style scoped>
.menu-enter-active,
.menu-leave-active {
    transition:
        transform 200ms ease,
        opacity 200ms ease;
}
.menu-enter-from,
.menu-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}
</style>
