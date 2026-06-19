## ADDED Requirements

### Requirement: Site SHALL serve a sitemap.xml

The `/sitemap.xml` route SHALL return a valid sitemap XML listing all static routes and all blog/projects content URLs.

#### Scenario: Sitemap is valid XML

- **WHEN** an HTTP GET is made to `/sitemap.xml`
- **THEN** the response is `Content-Type: application/xml` and parses as valid sitemap.xml

#### Scenario: Sitemap includes all routes

- **WHEN** the site has 3 blog posts and 2 projects
- **THEN** the sitemap contains entries for `/`, `/about`, `/skills`, `/journey`, `/blog`, `/projects`, `/contact`, `/guestbook`, and 5 content URLs (3 blog + 2 projects)

### Requirement: Site SHALL have a default Open Graph image

The system SHALL serve `/og-default.png` (1200×630) and reference it via `<meta property="og:image">` on pages without a per-page OG image.

#### Scenario: Sharing a page shows preview

- **WHEN** a page URL is pasted into Twitter or Slack
- **THEN** the unfurled preview shows the OG image (either page-specific or the default)

### Requirement: Site SHALL accept Webmentions

The system SHALL include `<link rel="webmention" href="https://webmention.io/<domain>/webmention">` and `<link rel="pingback" href="https://webmention.io/<domain>/xmlrpc">` in the page `<head>`. Blog detail pages SHALL display received Webmentions at the bottom.

#### Scenario: Webmention endpoint is declared

- **WHEN** any page's HTML is inspected
- **THEN** the `<head>` contains both `rel="webmention"` and `rel="pingback"` link tags

#### Scenario: Blog post shows incoming mentions

- **WHEN** a blog post's URL has received a Webmention via webmention.io
- **THEN** the bottom of the blog detail page lists the mention with source URL and excerpt

### Requirement: Cloudflare Pages SHALL build and deploy on main push

A Cloudflare Pages project SHALL be connected to the GitHub repository's `main` branch. Pushes SHALL trigger a build with `pnpm build` and deploy `.output/public`.

#### Scenario: Push to main deploys

- **WHEN** a commit is pushed to `main`
- **THEN** Cloudflare Pages picks it up, runs the build command, and serves the updated site within 5 minutes

### Requirement: Production environment SHALL have all required secrets configured

The Cloudflare Pages Dashboard SHALL have environment variables set for: `NODE_VERSION=20`, `NUXT_RESEND_API_KEY`, `NUXT_TURNSTILE_SITE_KEY`, `NUXT_TURNSTILE_SECRET_KEY`, `NUXT_OAUTH_GITHUB_CLIENT_ID`, `NUXT_OAUTH_GITHUB_CLIENT_SECRET`, `NUXT_SESSION_PASSWORD`, `NUXT_PUBLIC_CONTACT_EMAIL`. D1 + KV bindings SHALL be configured in Functions settings.

#### Scenario: Contact form works in production

- **WHEN** a real visitor submits the contact form on the production site
- **THEN** the email is delivered via Resend (production keys, not test keys)

### Requirement: Lighthouse scores SHALL be ≥ 90 on Performance, Accessibility, SEO

A Lighthouse audit on the production homepage SHALL return scores ≥ 90 for Performance, Accessibility, and SEO categories.

#### Scenario: Lighthouse passes thresholds

- **WHEN** a developer runs Lighthouse against the production `/` URL
- **THEN** Performance ≥ 90, Accessibility ≥ 90, SEO ≥ 90
