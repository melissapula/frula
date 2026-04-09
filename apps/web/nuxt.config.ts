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
                        'Nationwide For Sale By Owner platform. Sell your home without paying agent commissions.',
                },
            ],
            link: [
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
        public: {
            mapboxToken: process.env.MAPBOX_TOKEN,
            cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
            cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
            siteUrl: process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
            apiBase: process.env.API_BASE || 'http://localhost:3001',
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
            ],
            cookieRedirect: false,
        },
    },
})
