/**
 * Global server middleware that adds security headers to every response.
 */
export default defineEventHandler((event) => {
    const headers = event.node.res

    // Prevent clickjacking — only allow framing from same origin
    headers.setHeader('X-Frame-Options', 'SAMEORIGIN')

    // Prevent MIME-type sniffing
    headers.setHeader('X-Content-Type-Options', 'nosniff')

    // Control referrer information sent to external sites
    headers.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Opt out of Google FLoC/Topics tracking
    headers.setHeader('Permissions-Policy', 'interest-cohort=()')

    // Content Security Policy
    // Allows: self, Cloudinary images, Mapbox tiles/scripts, Google Fonts,
    // Supabase API, Resend, inline styles (needed for Tailwind/email)
    headers.setHeader(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://events.mapbox.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com",
            "img-src 'self' data: blob: https://res.cloudinary.com https://*.tiles.mapbox.com https://api.mapbox.com",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://api.cloudinary.com https://nominatim.openstreetmap.org",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; '),
    )

    // HTTPS enforcement (Cloudflare handles TLS, but belt + suspenders)
    headers.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
})
