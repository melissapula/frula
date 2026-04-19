// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },

    modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@vueuse/nuxt', '@nuxt/image'],

    app: {
        head: {
            title: 'Frula Homes — Sell it yourself',
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                {
                    name: 'description',
                    content:
                        'Nationwide For Sale By Owner information platform. List your home, browse listings, and find official forms for your state — all without paying agent commissions.',
                },
                { name: 'theme-color', content: '#1D9E75' },
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
                { rel: 'manifest', href: '/site.webmanifest' },
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap',
                },
            ],
        },
    },

    runtimeConfig: {
        // Server-only secrets (never exposed to the browser)
        resendApiKey: process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM || 'Frula Homes <noreply@frulahomes.com>',
        emailReplyTo: process.env.EMAIL_REPLY_TO || '',
        public: {
            mapboxToken: process.env.MAPBOX_TOKEN,
            cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
            cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
            siteUrl: process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
            sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
        },
    },

    supabase: {
        redirectOptions: {
            login: '/login',
            callback: '/confirm',
            include: ['/account', '/sell', '/sell/**', '/saved'],
            exclude: [
                '/',
                '/browse',
                '/listing/**',
                '/health',
                '/login',
                '/signup',
                '/forgot-password',
                '/reset-password',
                '/dream-home',
                '/paperwork',
                '/paperwork/**',
                '/how-we-make-money',
                '/privacy',
                '/terms',
                '/seller/**',
                '/checklist/**',
            ],
            cookieRedirect: false,
        },
    },

    routeRules: {
        // Static public pages — cache at the edge for 1 hour, revalidate in background
        '/': { swr: 3600 },
        '/browse': { swr: 600 },
        '/paperwork': { swr: 86400 },
        '/paperwork/**': { swr: 86400 },
        '/how-we-make-money': { swr: 86400 },
        '/privacy': { swr: 86400 },
        '/terms': { swr: 86400 },
        '/checklist/**': { swr: 86400 },
        // Listing detail pages — cache 10 min, revalidate in background
        '/listing/**': { swr: 600 },
        // Seller profiles — cache 10 min
        '/seller/**': { swr: 600 },
    },

    vite: {
        optimizeDeps: {
            include: ['@vue/devtools-core', '@vue/devtools-kit', 'mapbox-gl'],
        },
    },
})
