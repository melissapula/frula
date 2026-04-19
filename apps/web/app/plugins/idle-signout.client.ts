/**
 * Auto sign-out after 1 hour of inactivity.
 *
 * Listens for user interaction events (mouse, keyboard, touch, scroll)
 * and resets a timer. If no activity is detected for 60 minutes, the
 * user is signed out and redirected to the login page.
 *
 * Only active when a user is logged in.
 */
export default defineNuxtPlugin(() => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()
    const router = useRouter()

    const IDLE_TIMEOUT = 60 * 60 * 1000 // 1 hour in ms
    let timer: ReturnType<typeof setTimeout> | null = null

    function resetTimer() {
        if (timer) clearTimeout(timer)
        if (!user.value) return

        timer = setTimeout(async () => {
            await supabase.auth.signOut()
            router.replace('/login')
        }, IDLE_TIMEOUT)
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const

    watch(
        user,
        (u) => {
            if (u) {
                // User just logged in — start watching for idle
                events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }))
                resetTimer()
            } else {
                // User logged out — stop watching
                if (timer) clearTimeout(timer)
                events.forEach((e) => document.removeEventListener(e, resetTimer))
            }
        },
        { immediate: true },
    )
})
