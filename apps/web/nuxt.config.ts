// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxt/image',
  ],

  app: {
    head: {
      title: 'Frula Homes — Sell it yourself',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'For Sale By Owner platform for Minnesota. Sell your home without paying agent commissions.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      mapboxToken: process.env.MAPBOX_TOKEN,
      apiBase: process.env.API_BASE || 'http://localhost:3001',
    },
  },

  supabase: {
    redirect: false,
  },
})
