/**
 * Tiny shared signal so any page (the inbox list, an inbox thread, etc.)
 * can tell the global navbar badge to recount unread messages without
 * relying on Supabase realtime (which doesn't always publish UPDATE/DELETE
 * events depending on the project's replication settings).
 *
 * Increment the version to fire a refresh.
 */
export function useUnreadBadge() {
    const version = useState<number>('unread-badge-version', () => 0)
    function bump() {
        version.value++
    }
    return { version, bump }
}
