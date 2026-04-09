/**
 * Shared in-app notifications state for the bell dropdown.
 *
 * Loads the user's most recent notifications, exposes a reactive list
 * + unread count, and provides actions to mark single rows or all
 * rows as read. Uses Supabase realtime so new events ping the bell
 * immediately, plus a shared `bump()` signal anywhere can fire to
 * force a refresh (mirrors useUnreadBadge for inbox messages).
 */

export interface NotificationRow {
    id: string
    user_id: string
    kind: string
    title: string
    body: string | null
    link: string | null
    is_read: boolean
    payload: Record<string, unknown> | null
    created_at: string
}

export function useNotifications() {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    // Shared across pages
    const notifications = useState<NotificationRow[]>('notifications', () => [])
    const loaded = useState<boolean>('notifications-loaded', () => false)
    const refreshTrigger = useState<number>('notifications-refresh', () => 0)

    const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length)

    async function load() {
        if (!user.value) {
            notifications.value = []
            loaded.value = false
            return
        }
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(20)
        if (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load notifications:', error)
            return
        }
        notifications.value = (data ?? []) as NotificationRow[]
        loaded.value = true
    }

    function bump() {
        refreshTrigger.value++
    }

    async function markRead(id: string) {
        const item = notifications.value.find((n) => n.id === id)
        if (!item || item.is_read) return
        // Optimistic
        notifications.value = notifications.value.map((n) =>
            n.id === id ? { ...n, is_read: true } : n,
        )
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
        if (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to mark notification read:', error)
        }
    }

    async function markAllRead() {
        if (!user.value) return
        const unreadIds = notifications.value.filter((n) => !n.is_read).map((n) => n.id)
        if (!unreadIds.length) return
        notifications.value = notifications.value.map((n) => ({ ...n, is_read: true }))
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds)
        if (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to mark all read:', error)
        }
    }

    return {
        notifications,
        unreadCount,
        loaded,
        refreshTrigger,
        load,
        bump,
        markRead,
        markAllRead,
    }
}
