export default defineNuxtConfig({
  compatibilityDate: '2025-05-19',
  devtools: { enabled: true },
  runtimeConfig: {
    turnstileSecretKey: '',
    resendApiKey: '',
    public: {
      turnstileSiteKey: '',
      contactEmail: '',
    },
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/google-fonts',
    '@nuxt/content',
    'nuxt-auth-utils',
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
    '/skills': { prerender: true },
    '/journey': { prerender: true },
    '/auth/**': { ssr: true },
    '/contact': { ssr: true },
    '/guestbook': { ssr: true },
  },
  nitro: {
    preset: 'cloudflare-pages',
    // Follow links from prerendered list pages so blog/project detail pages
    // become static HTML — required for Pagefind to index their content.
    prerender: { crawlLinks: true, ignore: [/^\/auth\//, /^\/guestbook/] },
    // Pagefind writes /pagefind/* after `nuxt build`, so Nitro can't auto-detect
    // them. This exclude is MERGED with Nitro's auto-generated excludes, so the
    // platform serves /pagefind/* as static assets instead of routing to the worker.
    cloudflare: {
      pages: {
        routes: {
          exclude: ['/pagefind/*'],
        },
      },
    },
  },
})
