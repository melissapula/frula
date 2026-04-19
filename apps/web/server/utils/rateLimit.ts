/**
 * Simple in-memory rate limiter for server routes.
 *
 * Uses a sliding window per key (typically user ID or IP).
 * Not shared across server instances — fine for a single-node deploy.
 * If you scale to multiple instances, swap this for a Redis-backed limiter.
 */

interface RateLimitEntry {
    timestamps: number[]
}

const buckets = new Map<string, RateLimitEntry>()

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now
    const cutoff = now - windowMs
    for (const [key, entry] of Array.from(buckets.entries())) {
        entry.timestamps = entry.timestamps.filter((t: number) => t > cutoff)
        if (entry.timestamps.length === 0) buckets.delete(key)
    }
}

/**
 * Check and consume a rate limit token.
 *
 * @param key   Unique identifier (e.g. `send:${userId}`)
 * @param limit Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 * @returns Object with `allowed` boolean and `retryAfterMs` if blocked
 */
export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
    cleanup(windowMs)

    const now = Date.now()
    const cutoff = now - windowMs

    let entry = buckets.get(key)
    if (!entry) {
        entry = { timestamps: [] }
        buckets.set(key, entry)
    }

    // Drop expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

    if (entry.timestamps.length >= limit) {
        const oldestInWindow = entry.timestamps[0]!
        const retryAfterMs = oldestInWindow + windowMs - now
        return { allowed: false, retryAfterMs }
    }

    entry.timestamps.push(now)
    return { allowed: true, retryAfterMs: 0 }
}
