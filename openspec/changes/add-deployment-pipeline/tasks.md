## 1. Sitemap

- [x] 1.1 Run `pnpm add -D @nuxtjs/sitemap` (nuxt-simple-sitemap locks Nuxt 3; @nuxtjs/sitemap supports Nuxt 4)
- [x] 1.2 Add `'@nuxtjs/sitemap'` to `nuxt.config.ts` `modules`
- [x] 1.3 Configure module options to include all static routes and dynamic content URLs
- [x] 1.4 Verify `pnpm build && pnpm preview` then GET `/sitemap.xml` returns valid XML

## 2. OG Image

- [x] 2.1 Design a 1200×630 PNG: beige background, "Grayson's Portfolio." in Shippori Mincho (export from Figma or generate)
- [x] 2.2 Place at `public/og-default.png`
- [x] 2.3 In `app/app.vue` add `<Head>` with:
  - `<meta property="og:image" content="/og-default.png">`
  - `<meta property="og:title" content="Grayson's Portfolio">`
  - `<meta property="og:type" content="website">`
  - `<meta name="twitter:card" content="summary_large_image">`

## 3. Webmentions

- [ ] 3.1 Register the production domain at https://webmention.io
- [ ] 3.2 Get assigned `<link rel="webmention">` and `<link rel="pingback">` URLs
- [x] 3.3 Add both `<link>` tags to `app/app.vue` `<Head>`
- [x] 3.4 In `app/pages/blog/[slug].vue`, after article body, add a `<Webmentions :target="fullUrl" />` component
- [x] 3.5 Create `app/components/Webmentions.vue` that fetches `https://webmention.io/api/mentions.jf2?target={target}` and renders each as: source link + author + excerpt
- [x] 3.6 Cache the fetch on the server side (use Nitro cache for 1 hour)

## 4. Cloudflare Pages Project

- [x] 4.1 Visit Cloudflare Dashboard → Pages → Create a project → Connect to Git
- [x] 4.2 Select GitHub repo + `main` branch
- [x] 4.3 Framework preset: Nuxt.js
- [x] 4.4 Build command: `pnpm build` (includes pagefind via package.json scripts)
- [x] 4.5 Build output: `dist` (this project's `cloudflare-pages` preset outputs to `dist`, not `.output/public`)
- [x] 4.6 Environment variables (Production):
  - ~~`NODE_VERSION=22`~~ (可略過：CF Pages v3 build 預設即 Node 22，見 rules/deploy.md)
  - `NUXT_RESEND_API_KEY=<production key>`
  - `NUXT_TURNSTILE_SITE_KEY=<production key>`
  - `NUXT_TURNSTILE_SECRET_KEY=<production secret>`
  - `NUXT_OAUTH_GITHUB_CLIENT_ID=<prod OAuth App id>`
  - `NUXT_OAUTH_GITHUB_CLIENT_SECRET=<prod OAuth App secret>`
  - `NUXT_SESSION_PASSWORD=<32+ char random>`
  - `NUXT_PUBLIC_CONTACT_EMAIL=<owner email>`
  - `NUXT_PUBLIC_TURNSTILE_SITE_KEY=<production key>`

## 5. Cloudflare Bindings (Production)

- [x] 5.1 D1 binding `DB` → grayson-portfolio-db (configured via `wrangler.toml` `[[d1_databases]]`; Wrangler 4 applies Pages bindings from the config file when `pages_build_output_dir` is set)
- [x] 5.2 KV binding `RATE_LIMIT` (configured via `wrangler.toml` `[[kv_namespaces]]`)
- [x] 5.3 Apply all remote migrations: `npx wrangler d1 migrations apply grayson-portfolio-db --remote` (runs every unapplied file in `migrations/` in order — currently `0001_init.sql` + `0002_comments.sql` — and tracks applied versions, so it stays correct as migrations are added)

## 6. GitHub OAuth App (Production)

- [x] 6.1 Create a second GitHub OAuth App with callback `https://<your-domain>.pages.dev/auth/github`
- [x] 6.2 Update the production env vars with these new credentials

## 7. Initial Deploy

- [x] 7.1 Push current `main` branch to GitHub
- [x] 7.2 Watch the Cloudflare Pages dashboard for build success
- [ ] 7.3 Visit the deployed URL → smoke-test each route

## 8. Smoke Tests on Production

- [ ] 8.1 Submit contact form → email arrives at `NUXT_PUBLIC_CONTACT_EMAIL`
- [ ] 8.2 Sign in to guestbook via GitHub → post a message → reload → message persists
- [ ] 8.3 Press Cmd+K → search returns results
- [ ] 8.4 Toggle dark mode → no visual breakage
- [ ] 8.5 Verify `/sitemap.xml` and `/rss.xml` return valid XML

## 9. Lighthouse Audit

- [ ] 9.1 Open Chrome DevTools → Lighthouse → run audit on production `/`
- [ ] 9.2 Verify scores: Performance ≥ 90, Accessibility ≥ 90, SEO ≥ 90
- [ ] 9.3 If any < 90, file follow-up tasks (not part of this change)
