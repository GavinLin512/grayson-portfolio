export default defineNuxtConfig({
  compatibilityDate: '2025-05-19',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/google-fonts',
    '@nuxt/content',
  ],
  css: ['~/assets/css/tokens.css'],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },
  googleFonts: {
    families: {
      'Shippori Mincho': [400, 600, 800],
      'Space Mono': [400, 700],
      Caveat: [400, 600],
    },
    display: 'swap',
    preconnect: true,
  },
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/projects': { prerender: true },
    '/projects/**': { prerender: true },
    '/blog': { prerender: true },
    '/blog/**': { prerender: true },
  },
  nitro: {
    preset: 'cloudflare-pages',
  },
})
