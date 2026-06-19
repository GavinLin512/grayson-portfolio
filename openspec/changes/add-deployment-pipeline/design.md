## Context

This is the final change before MVP launch. It wires up production deployment, discoverability (sitemap, OG image), social validation (Webmentions), and validates performance via Lighthouse.

## Goals / Non-Goals

**Goals:**
- Working production deploy on Cloudflare Pages with one-push workflow
- SEO basics: sitemap, OG meta, canonical URLs
- Webmention reception for incoming social signals
- Lighthouse 90+ across three pillars

**Non-Goals:**
- Custom domain purchase (using `*.pages.dev` for MVP; can add custom later)
- Analytics (deferred; can add Cloudflare Web Analytics for free post-launch)
- Webmention SENDING (only receiving for now)

## Decisions

- **`nuxt-simple-sitemap` for sitemap**: Auto-generates from routes + content, handles SSG routes. Alternative: manual server route — rejected because we'd duplicate content listing logic.
- **Single static OG image**: 1200×630 PNG with site title in Mincho on beige background. Per-page OG images deferred (could be added with `nuxt-og-image` + Satori later).
- **webmention.io as Webmention endpoint**: Free third-party service, well-maintained, no setup beyond adding `<link>` tags and registering domain. Alternative: self-hosted (e.g., via Worker) — rejected as over-engineering for MVP.
- **Lighthouse 90+ enforced manually**: No CI gate yet. Run Lighthouse locally / via Chrome DevTools before merging significant changes. CI integration deferred.

## Risks / Trade-offs

- **Risk**: Production OAuth callback URL is `*.pages.dev` until custom domain is set up. If a custom domain is added later, OAuth App must be updated → Mitigation: documented in README; treated as a known follow-up
- **Risk**: Lighthouse Performance score sensitive to Cloudflare cold starts on Workers → Mitigation: most pages are SSG (no Worker invocation); only `/contact`, `/guestbook`, `/api/*` hit Workers, and those aren't tested by default Lighthouse run on `/`
- **Trade-off**: Single OG image is generic. Acceptable for MVP; visitors clicking shared links typically know the context already

## Migration Plan

1. Push current `main` to GitHub (assumes earlier changes already merged)
2. Cloudflare Pages dashboard: create new project, connect repo
3. Set build command `pnpm build`, output `.output/public`
4. Set all environment variables in Pages settings
5. Set D1 binding (DB) and KV binding (RATE_LIMIT) in Functions settings
6. Trigger first deploy
7. Run remote D1 migration: `npx wrangler d1 execute grayson-portfolio-db --remote --file=migrations/0001_init.sql`
8. Smoke-test: visit each route, submit contact form, post guestbook entry
9. Run Lighthouse on production `/`; fix any failures
