# Grayson Portfolio

Personal portfolio site built with Nuxt 4, deployed on Cloudflare Pages.

## Tech Stack

- **Framework**: Nuxt 4.4.6
- **Styling**: Tailwind CSS
- **Content**: @nuxt/content (Markdown)
- **Deployment**: Cloudflare Pages (Nitro `cloudflare-pages` preset)
- **Testing**: Playwright + Argos CI (visual regression)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Hero landing page |
| `/about` | About me |
| `/projects` | Projects list & detail |
| `/blog` | Blog posts |

## Development

```bash
pnpm install
pnpm dev        # localhost:3000
pnpm build      # build to dist/
pnpm preview    # preview production build
```

## Testing

```bash
pnpm exec playwright test
```

Visual regression screenshots are uploaded to Argos CI only in CI environments.

## Roadmap

- Skills page
- Journey timeline
- Contact form
- Site search
- Guestbook (Cloudflare D1)
- Deployment pipeline
