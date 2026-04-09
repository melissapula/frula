/**
 * Fire a notification email for a freshly-inserted message.
 *
 * Calls our /api/notifications/send server route, which looks up the
 * message + recipient + listing server-side and sends via Resend.
 *
 * Always non-throwing — email failures should never block the user's
 * actual message-send flow. If the email fails, the message still
 * exists in the inbox; the recipient just won't get pinged externally.
 */
export function useNotificationEmail() {
    async function notify(messageId: string): Promise<void> {
        try {
            await $fetch('/api/notifications/send', {
                method: 'POST',
                body: { messageId },
            })
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Notification email failed (non-fatal):', e)
        }
    }
    return { notify }
}
