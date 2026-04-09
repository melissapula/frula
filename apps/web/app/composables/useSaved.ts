/**
 * Saved-listings state for the current user.
 *
 * Backed by the `saved_listings` table (user_id, listing_id, created_at).
 * Loads the user's full saved set once on first access (kept in `useState`
 * so every page shares the same reactive ref) and exposes simple
 * `isSaved` / `toggle` helpers backed by optimistic updates so the UI
 * feels instant.
 */
export function useSaved() {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()
    const router = useRouter()

    // Shared reactive set of saved listing ids — same instance across pages
    const savedIds = useState<Set<string>>('saved-listings', () => new Set())
    const loaded = useState<boolean>('saved-listings-loaded', () => false)

    async function load(force = false) {
        if (!user.value) {
            savedIds.value = new Set()
            loaded.value = false
            return
        }
        if (loaded.value && !force) return
        const { data, error } = await supabase
            .from('saved_listings')
            .select('listing_id')
            .eq('user_id', user.value.id)
        if (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load saved listings:', error)
            return
        }
        savedIds.value = new Set((data ?? []).map((r) => r.listing_id as string))
        loaded.value = true
    }

    function isSaved(listingId: string): boolean {
        return savedIds.value.has(listingId)
    }

    /**
     * Toggle saved state for a listing. Returns the new state (true = saved).
     * Redirects to login if the user isn't signed in.
     */
    async function toggle(listingId: string): Promise<boolean> {
        if (!user.value) {
            router.push(`/login?next=/listing/${listingId}`)
            return false
        }
        const currentlySaved = savedIds.value.has(listingId)

        // Optimistic update — flip the local set first, then persist.
        // Use a fresh Set so Vue's reactivity definitely fires.
        const next = new Set(savedIds.value)
        if (currentlySaved) next.delete(listingId)
        else next.add(listingId)
        savedIds.value = next

        if (currentlySaved) {
            const { error } = await supabase
                .from('saved_listings')
                .delete()
                .eq('user_id', user.value.id)
                .eq('listing_id', listingId)
            if (error) {
                // Roll back on failure
                savedIds.value = new Set(savedIds.value).add(listingId)
                // eslint-disable-next-line no-console
                console.error('Failed to unsave:', error)
                return true
            }
            return false
        } else {
            const { error } = await supabase
                .from('saved_listings')
                .insert({ user_id: user.value.id, listing_id: listingId })
            if (error) {
                const rolled = new Set(savedIds.value)
                rolled.delete(listingId)
                savedIds.value = rolled
                // eslint-disable-next-line no-console
                console.error('Failed to save:', error)
                return false
            }
            // Drop a save notification for the listing owner. Server route
            // because RLS prevents writing notifications for other users
            // from the client. Fire-and-forget — failures should never
            // break the heart-button UX.
            $fetch('/api/notifications/save', {
                method: 'POST',
                body: { listingId },
            }).catch((e) => {
                // eslint-disable-next-line no-console
                console.warn('Save notification failed (non-fatal):', e)
            })
            return true
        }
    }

    // Auto-load when the user changes (login/logout). Done lazily — first
    // time something on the page reads `savedIds` it'll trigger via load().
    watch(
        user,
        () => {
            loaded.value = false
            load()
        },
        { immediate: true },
    )

    return { savedIds, isSaved, toggle, load }
}
