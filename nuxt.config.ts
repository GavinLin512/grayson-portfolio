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
  site: {
    url: process.env.NUXT_SITE_URL,
    name: process.env.NUXT_SITE_NAME,
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/google-fonts',
    '@nuxt/content',
    'nuxt-auth-utils',
    '@nuxtjs/sitemap',
  ],
  css: ['~/assets/css/tokens.css'],
  // @lucide/vue ships no `exports`, so the server build loads its CJS entry,
  // which requires a second copy of Vue: inject() then fails during SSR.
  // Bundling it makes it share the app's Vue.
  build: { transpile: ['@lucide/vue'] },
  // @nuxtjs/tailwindcss adds this plugin, but Nuxt 4.6 imports postcss plugins
  // as ESM and tailwind 3 has no `exports` for the subpath, so it never loads.
  // No CSS here is nested; turn it off to drop the warning.
  postcss: { plugins: { 'tailwindcss/nesting': false } },
  // ProsePre imports mermaid only on mount, so in dev Vite finds it late and
  // reloads the page; the Playwright pages with diagrams hit that on a cold start.
  vite: { optimizeDeps: { include: ['mermaid'] } },
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
