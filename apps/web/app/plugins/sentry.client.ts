/**
 * Sentry error monitoring — client-side only.
 *
 * Captures unhandled errors and Vue component errors in production.
 * Set NUXT_PUBLIC_SENTRY_DSN in your environment to enable.
 *
 * This is a lightweight integration that doesn't require the full
 * @sentry/vue package — it uses the Sentry browser SDK directly
 * via their loader script. If you want richer Vue integration
 * (component tracking, performance), install @sentry/vue and
 * swap this out.
 */
export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig()
    const dsn = config.public.sentryDsn as string | undefined

    if (!dsn || process.env.NODE_ENV === 'development') return

    // Global error handler — catches unhandled promise rejections
    // and runtime errors that Vue doesn't catch
    window.addEventListener('unhandledrejection', (event) => {
        reportToSentry(dsn, event.reason)
    })

    // Vue error handler — catches errors in components
    nuxtApp.vueApp.config.errorHandler = (error, _instance, info) => {
        // eslint-disable-next-line no-console
        console.error(`[Vue error] ${info}:`, error)
        reportToSentry(dsn, error, { vue_info: info })
    }
})

/**
 * Minimal error reporter using Sentry's envelope API.
 * No SDK dependency — just a POST to Sentry's ingest endpoint.
 */
function reportToSentry(dsn: string, error: unknown, extra?: Record<string, unknown>) {
    try {
        const url = new URL(dsn)
        const projectId = url.pathname.replace('/', '')
        const publicKey = url.username
        const ingestUrl = `${url.protocol}//${url.host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`

        const errorObj = error instanceof Error ? error : new Error(String(error))

        const envelope = [
            JSON.stringify({
                event_id: crypto.randomUUID().replace(/-/g, ''),
                sent_at: new Date().toISOString(),
                dsn,
            }),
            JSON.stringify({ type: 'event' }),
            JSON.stringify({
                exception: {
                    values: [
                        {
                            type: errorObj.name,
                            value: errorObj.message,
                            stacktrace: errorObj.stack
                                ? { frames: parseStack(errorObj.stack) }
                                : undefined,
                        },
                    ],
                },
                level: 'error',
                platform: 'javascript',
                environment: 'production',
                request: {
                    url: window.location.href,
                    headers: { 'User-Agent': navigator.userAgent },
                },
                extra,
            }),
        ].join('\n')

        // Use sendBeacon so it doesn't block page unload
        if (navigator.sendBeacon) {
            navigator.sendBeacon(ingestUrl, envelope)
        } else {
            fetch(ingestUrl, { method: 'POST', body: envelope, keepalive: true })
        }
    } catch {
        // Don't let error reporting cause more errors
    }
}

function parseStack(stack: string) {
    return stack
        .split('\n')
        .slice(1, 10)
        .map((line) => {
            const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/)
            if (match) {
                return {
                    function: match[1],
                    filename: match[2],
                    lineno: parseInt(match[3]!),
                    colno: parseInt(match[4]!),
                }
            }
            return { function: line.trim(), filename: '(unknown)' }
        })
}
