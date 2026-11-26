# Tasks

## 1. Prerequisite

- [ ] 1.1 Merge the articles branch `claude/current-project-check-3ixyjg` (with #37) into `dev`. Verify that `dev` has the five zh-TW posts in `content/blog/` and their English versions in `content/i18n/en/blog/`, and that `node <l10n-review>/packages/cli/dist/cli.js --all` reports no `content-parity` warnings.

## 2. Module, locale files and fonts

- [ ] 2.1 Add `@nuxtjs/i18n` 10.x (a release at least 3 days old, per the pnpm `minimumReleaseAge` policy) with `pnpm add -D`. Verify that `pnpm install --frozen-lockfile` passes with the trust policy unchanged.
- [ ] 2.2 Configure `i18n` in `nuxt.config.ts`:
  - locales `zh-TW` (`language: 'zh-TW'`, `name: '繁中'`) and `en` (`language: 'en'`, `name: 'EN'`);
  - `defaultLocale: 'zh-TW'`, `strategy: 'prefix_except_default'`;
  - the `detectBrowserLanguage` block from design decision 3;
  - `baseUrl` from `NUXT_SITE_URL`.

  Verify in `pnpm dev` that `/about` and `/en/about` both render.
- [ ] 2.3 Create `i18n/locales/zh-TW.json` and `i18n/locales/en.json` with the same initial keys. Verify that l10n-review reports no `locale-keys` or `locale-placeholders` findings and detects the vue-i18n syntax (a test message with a raw `@` is reported, then removed).
- [ ] 2.4 Add the CJK fallbacks:
  - `googleFonts`: `Noto Serif TC` (400/600) and `Noto Sans TC` (400/700);
  - Tailwind `mincho`/`mono` stacks per design decision 12.

  Verify that a Chinese heading's computed font in Playwright is Noto Serif TC for glyphs Shippori Mincho lacks. Measure `dist/` size before and after `pnpm build`; if the CJK slices bloat it, set the CJK families to load from Google's CDN and record why in `.claude/docs/decisions.md`.

## 3. Routing, browser detection and head

- [ ] 3.1 In `app/app.vue`, add the `useLocaleHead()` output: `htmlAttrs.lang`, hreflang alternates (zh-TW, en, x-default), canonical, and `og:url` from the canonical URL. Verify that the head of `/en/about` matches the scenario in `specs/i18n` ("Alternates on an English page").
- [ ] 3.2 Update `routeRules`:
  - `/` becomes `ssr: true`, and `/` is added to `nitro.prerender.ignore` (exact match);
  - the prerender rules are mirrored for `/en/**` pages, and `/en/contact` and `/en/guestbook` become SSR.

  Verify after `pnpm build`:
  - `dist/index.html` does not exist and `dist/_routes.json` routes `/` to the worker;
  - under `npx wrangler pages dev dist`, `curl -sI -H 'Accept-Language: en-US' localhost:8788/` returns a 3xx redirect to `/en`;
  - the same request with the zh-TW cookie returns 200.
- [ ] 3.3 Verify that deep links are not redirected: `curl -sI -H 'Accept-Language: en-US' localhost:8788/blog/<slug>` returns 200 with `lang="zh-TW"`. Add a `decisions.md` entry on why `/` is SSR and the rest stays prerendered.

## 4. Language switch and locale-aware links

- [ ] 4.1 Create `LangSwitch` (built on `useSwitchLocalePath()`, label from the target locale's `name`) and use it in place of the `EN` `TagChip` in `SiteHeader.vue` and `mobile-nav/Tools.vue`. Verify that clicking `EN` on `/about` lands on `/en/about`, where the pill reads `繁中`, and that the locale cookie is updated.
- [ ] 4.2 Make navigation, footer and in-page links locale-aware (`NuxtLinkLocale` or `useLocalePath`). Verify that on `/en/about` every header, mobile-menu and footer link points to `/en/...`.
- [ ] 4.3 Document `LangSwitch` and the locale-aware link rule in `.claude/rules/frontend.md`. Verify that the rule's example matches the component's props.

## 5. Interface strings, one page per PR

Each task below:

- moves the page's interface text into both locale files, translating sentences and functional words and keeping brand names and design labels in English per design decision 5;
- is verified with l10n-review: the touched files have no `no-hardcoded-string` findings, and the locale files have no `locale-keys`, `locale-placeholders` or vue-i18n findings;
- gets its Argos diffs reviewed and approved.

- [ ] 5.1 Shared components: `SiteHeader`, `MobileNav`, `mobile-nav/Tools`, `SiteFooter`, `SearchModal`. Also verify that `menu`, `close` and `search` read in Chinese at `/`.
- [ ] 5.2 Home page: `app/pages/index.vue`. Also verify that the introduction line is Chinese at `/` and `Grayson's Portfolio.` is unchanged.
- [ ] 5.3 About page: `app/pages/about.vue`. E-mail addresses and handles stay in the template; verify there is no `@` in any locale message.
- [ ] 5.4 Contact page: `app/pages/contact.vue`. Also verify that the form labels, button states (`sending...`, `verifying...`) and the thank-you message switch with the locale.
- [ ] 5.5 Journal chrome: `blog/index.vue`, `blog/[slug].vue`, `Comments.vue`, `Webmentions.vue`. Also format comment dates with `Intl.DateTimeFormat` in the current locale, and verify `2026年11月25日` and `Nov 25, 2026` per `specs/blog-comments`.
- [ ] 5.6 Projects, skills, journey and guestbook pages. Also wrap untranslated English content in `lang="en"`, and verify the `specs/i18n` scenario "An English project on a Chinese page".

## 6. Journal in two languages

- [ ] 6.1 Add the `blog_en` collection to `content.config.ts` (`include: 'i18n/en/blog/**/*.md'`, `prefix: '/blog'`). Verify that `queryCollection('blog_en').path('/blog/<slug>')` returns the English post; if `prefix` behaves differently, adjust and note it in `decisions.md`.
- [ ] 6.2 Select the collection by locale in `blog/index.vue` and `blog/[slug].vue`:
  - query `path('/blog/' + slug)` instead of `route.path`;
  - list related posts from the same locale;
  - render the not-found page when the requested locale has no post.

  Verify that `/en/blog` lists the five English posts, `/en/blog/<slug>` renders the English body, and `/en/blog/<zh-only-slug>` is a 404.
- [ ] 6.3 Make `LangSwitch` fall back to the other locale's `/blog` list when the post has no translation. Verify with a temporary zh-only post (removed afterwards).
- [ ] 6.4 Serve the RSS feeds through a shared `server/utils` helper:
  - `/rss.xml` for zh-TW with `<language>zh-TW</language>`;
  - a new `/en/rss.xml` with `/en/blog/...` links.

  Verify that both feeds parse as RSS 2.0 (`xmllint --noout`) and every link resolves.
- [ ] 6.5 Make the sitemap list both locales:
  - `server/api/__sitemap__/urls.ts` emits `/blog/...` from `blog` and `/en/blog/...` from `blog_en`;
  - projects get both locale URLs.

  Verify that `/sitemap.xml` lists each page once per locale with hreflang alternates, and check how the custom source combines with `@nuxtjs/sitemap`'s i18n integration (design decision 10).

## 7. Search per language

- [ ] 7.1 Verify that `pnpm build` produces separate Pagefind indexes for `zh-tw` and `en` (`dist/pagefind/` lists both). Then, under `wrangler pages dev`:
  - searching `供應鏈` on a zh-TW page returns the posts that contain it inside a sentence;
  - searching on `/en/blog` returns only `/en/...` pages.
- [ ] 7.2 Make the `usePagefind` cache per language and re-initialise after a client-side language switch, or fall back to a full navigation on switch if the Pagefind JS API cannot re-initialise. Verify the `specs/site-search` scenario "Searching after switching the language".

## 8. Visual tests

- [ ] 8.1 Update `tests/screenshot-pages.spec.ts`:
  - point `blog-detail` at an existing post;
  - add an `en-<name>` screenshot for every page.

  Verify that `pnpm exec playwright test` passes locally and that Argos shows the `en-*` screenshots as new. Document the new names in `.claude/rules/CI.md`.

## 9. Integration check

- [ ] 9.1 On a Cloudflare Pages preview of the final branch, walk through every page in both locales and confirm each scenario in `specs/i18n`, `specs/shared-layout`, `specs/blog-feature`, `specs/site-search`, `specs/design-tokens` and `specs/blog-comments`. Record any deviation in the PR before merging.

## Workflow follow-up

- Archive the change with `openspec archive add-i18n` after the last PR is merged into `main`, and check that the main specs in `openspec/specs/` now include the i18n requirements.
- Add `add-i18n` to the dependency chain in `.claude/rules/task.md`.
