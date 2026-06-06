# Grayson Portfolio

Personal portfolio site built with Nuxt 4, deployed on Cloudflare Pages.

## Tech Stack

- **Framework**: Nuxt 4.4.6
- **Styling**: Tailwind CSS
- **Content**: @nuxt/content (Markdown)
- **Search**: Pagefind (static index, Cmd+K modal)
- **Email**: Resend
- **Bot protection**: Cloudflare Turnstile (invisible mode)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Rate limiting**: Cloudflare KV
- **Deployment**: Cloudflare Pages (Nitro `cloudflare-pages` preset)
- **Testing**: Playwright + Argos CI (visual regression)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Hero landing page |
| `/about` | About me |
| `/projects` | Projects list & detail |
| `/blog` | Blog posts |
| `/skills` | Skills overview |
| `/journey` | Career timeline |
| `/contact` | Contact form |

## Development

```bash
pnpm install
pnpm dev        # localhost:3000（無 D1/KV）
pnpm build      # build to dist/（含 pagefind index）
pnpm preview    # preview production build
```

### D1 / KV features（guestbook、rate limit）

```bash
pnpm build
npx wrangler pages dev dist   # localhost:8788，讀取 wrangler.toml bindings
```

本地 migration（首次或重置時執行）：

```bash
npx wrangler d1 execute grayson-portfolio-db --local --file=migrations/0001_init.sql
```

## Testing

```bash
pnpm exec playwright test
```

Visual regression screenshots are uploaded to Argos CI only in CI environments.

## Roadmap

- [x] Project foundation & design tokens — 2026-05-19
- [x] Hero landing page — 2026-05-19
- [x] About page — 2026-05-24
- [x] Projects list & detail — 2026-05-24
- [x] Blog posts — 2026-05-25
- [x] Skills page — 2026-06-01
- [x] Journey timeline — 2026-06-02
- [x] Contact form (Resend + Turnstile + KV rate limit) — 2026-06-04
- [x] Site search (Pagefind, Cmd+K) — 2026-06-06
- [x] D1 database setup (guestbook schema) — 2026-06-06
- [ ] Guestbook (GitHub OAuth + D1)
- [ ] Deployment pipeline
