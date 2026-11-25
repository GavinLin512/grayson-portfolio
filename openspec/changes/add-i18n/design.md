## Context

The site is English-only today, yet the journal is now written in Chinese first and translated to English (`content/blog` zh-TW, `content/i18n/en/blog` en, on the articles branch). `decisions.md` already notes that the English copies wait for a language switch, and the header has an `EN` pill that does nothing.

Constraints that shape the design:

- **Hosting**: Cloudflare Pages with the `cloudflare-pages` Nitro preset. Most routes are prerendered (`routeRules`); `/contact`, `/guestbook` and `/auth/**` are SSR.
- **Search**: Pagefind indexes the built HTML after `nuxt build`.
- **Visual tests**: Argos screenshots run on every UI change.
- **Fonts**: Shippori Mincho has limited Chinese glyph coverage (`add-design-tokens` design, deferred to this change).
- **Copy style**: the design uses lowercase English labels (`index`, `journal`, `— 06 / about`) as part of its look.

Decisions already made with the site owner:

- zh-TW is the default locale at `/`, and English lives under `/en`.
- The browser language is detected once, on the home page only.
- Phase one covers interface strings and journal posts. Projects, skills and the timeline stay English.
- Brand names and the lowercase design labels stay English in both locales.

## Goals / Non-Goals

**Goals:**

- Every page exists in zh-TW and en, and the language switch keeps the visitor on the same page.
- Journal posts appear in their own language; an English reader never sees a Chinese post body, and vice versa.
- Correct `<html lang>`, hreflang, canonical, sitemap and RSS for both locales.
- Chinese text renders in a matching font, and search finds Chinese words.
- l10n-review guards the locale files and the remaining hardcoded strings on every PR.

**Non-Goals:**

- Translating projects, `skills.yml` and `timeline.yml` (a later change).
- Translating user-generated content (guestbook, comments).
- Locales other than zh-TW and en.
- Machine translation or a translation platform (Crowdin, Lokalise).

## Decisions

### 1. `@nuxtjs/i18n` 10.x

The official module (10.6.0 at the time of writing, Nuxt 4 compatible). It provides locale-prefixed routes, browser detection, `useLocaleHead()` for SEO tags, `useSwitchLocalePath()` for the switch, and lazy-loaded locale files.

Alternative considered: a plain `vue-i18n` plugin with hand-written route prefixes. That would mean reimplementing routing, detection and SEO tags, with no benefit for a two-locale site.

### 2. `prefix_except_default`, zh-TW at the root

The locales are configured as:

```ts
locales: [
  { code: 'zh-TW', language: 'zh-TW', file: 'zh-TW.json', name: '繁中' },
  { code: 'en', language: 'en', file: 'en.json', name: 'EN' },
]
```

with `defaultLocale: 'zh-TW'`.

The `language` value is `zh-TW` rather than `zh-Hant-TW` for three reasons:

- it becomes `<html lang>`;
- Pagefind's Chinese segmentation lists `zh-tw` explicitly;
- `zh-TW` is the common hreflang form.

`baseUrl` comes from `NUXT_SITE_URL` (already in `site.url`), because hreflang and canonical URLs must be fully qualified.

Alternatives considered:

- English at the root: existing URLs would keep their content, but Chinese readers would need an extra click.
- `prefix` for both locales: every URL would change, and `/` would always redirect.

The owner chose zh-TW at the root.

### 3. Detection only on `/`, remembered in a cookie

```ts
detectBrowserLanguage: { useCookie: true, cookieKey: 'i18n_redirected', redirectOn: 'root', alwaysRedirect: false, fallbackLocale: 'zh-TW' }
```

These are mostly the module's defaults; they are spelled out so the behaviour is visible in config.

- A shared deep link always opens in the language of its URL.
- Switching the language with the pill updates the cookie, so a returning visitor keeps their choice.

**The root is server-rendered.** A prerendered `/` has no server to read `Accept-Language`, so the redirect would run in the browser after hydration: an English reader would see the Chinese home page flash first. `routeRules['/']` therefore changes from `prerender: true` to `ssr: true`, and the Nitro worker answers `/` with an HTTP redirect before any HTML is sent. Because `crawlLinks` would otherwise prerender `/` again from the navigation's `index` link, `/` is added to `nitro.prerender.ignore` (exact match). `/en` stays prerendered; detection only runs on `/`.

Alternative considered: keep `/` prerendered and accept the client-side redirect. It is cheaper, with no Worker request, but it shows the wrong language first; the owner chose SSR.

### 4. Interface strings in JSON locale files

The files are `i18n/locales/zh-TW.json` and `en.json`, the module's default `restructureDir` + `langDir`.

- **Format**: JSON rather than YAML or TS. It has the widest tooling support (i18n Ally, l10n-review), and the volume is small (about 100 strings, mostly short labels).
- **Keys**: namespaced by page or component (`header.*`, `about.*`, `contact.form.*`, `comments.*`, `search.*`) so a PR that moves one page's strings touches one block.
- **Special characters**: vue-i18n treats `{ } @ $ |` as special. E-mail addresses and handles stay in templates (they are not translated), or use `{'@'}`. l10n-review reports a message that does not compile.

### 5. What stays English

These stay English in both locales:

- brand names;
- navigation items;
- `PageHeader` section labels (`— 03 / journal · 5 notes` stays whole);
- the `EN` / `繁中` pill.

Sentences, buttons, form labels, empty states, messages and `aria-label`s are translated. This includes the home page introduction (`portfolio of grayson — a frontend engineer based in taipei.`) and single lowercase words that are functional text rather than design labels (`close`, `menu`, `search`, `sending...`, `email`, `name`, `message`). The lowercase style is kept for the English version only.

The rule lives in `.l10nrc.yml` (`ignoreText`, `ignorePattern: '^— \d+ / '`), so the l10n-review check matches it. Navigation labels are in `useMobileNav.ts`, which l10n-review does not check, and they stay as they are.

### 6. Journal: one collection per locale, same slug

The current file layout stays as it is; a second collection reads the English files:

```ts
blog: defineCollection({ type: 'page', source: 'blog/**/*.md', schema }),
blog_en: defineCollection({ type: 'page', source: { include: 'i18n/en/blog/**/*.md', prefix: '/blog' }, schema }),
```

With `prefix: '/blog'`, an English post's path is `/blog/<slug>`, the same as its Chinese original. The pages pick the collection from a `{ 'zh-TW': 'blog', en: 'blog_en' }` map and query `path('/blog/' + slug)`. Today they query `route.path`, which would include `/en`.

There is no fallback to the other language: a missing translation is the not-found page. The language switch sends the visitor to the list instead (decision 8).

Alternative considered: moving to `content/zh-TW/blog` and `content/en/blog`, the symmetric layout in Nuxt Content's i18n guide. It is cleaner, but it churns git history, the content-parity configuration, and the articles branch that is still open. It can follow later; only `content.config.ts` and `.l10nrc.yml` would change.

### 7. Untranslated content

Projects, skills and the timeline use one collection for both locales. On zh-TW pages, their English content is wrapped in `lang="en"` (spec: i18n). Screen readers then pronounce it as English, and fonts are chosen for English.

### 8. Language switch

- A `LangSwitch` component built on `useSwitchLocalePath()` replaces the `EN` `TagChip` in `SiteHeader` and `mobile-nav/Tools`.
- The pill shows the target language: `EN` on zh-TW pages, `繁中` on English pages. The labels come from each locale's `name` in the module config (`繁中`, `EN`), not from templates.
- On a journal post, the switch checks whether the other collection has the same path. If it does not, the switch links to that locale's `/blog` list.

### 9. SEO head

- `app.vue` adds `useLocaleHead()` output: `htmlAttrs.lang`, alternate links (zh-TW, en, x-default → zh-TW) and canonical.
- `og:url` follows the canonical URL.
- Prerendered HTML then carries the right `lang`, which is what Pagefind indexes.

### 10. Sitemap and RSS

**Sitemap.** `@nuxtjs/sitemap` integrates with `@nuxtjs/i18n` and adds locale alternates for app routes. The custom source `/api/__sitemap__/urls` emits explicit entries for both collections: `blog` as `/blog/...` and `blog_en` as `/en/blog/...`. Projects get both locale URLs. How this source interacts with the module's i18n integration is verified in implementation (task 6.5).

**RSS.** `/rss.xml` serves zh-TW with `<language>zh-TW</language>`, and a new `server/routes/en/rss.xml.ts` serves English. The feed-building code is shared through a `server/utils` helper.

### 11. Search per language

Pagefind indexes each `<html lang>` separately and, in the browser, loads the index for the current page's `lang`. It segments Chinese text in its extended release.

`usePagefind` currently caches one instance for the whole session. After a client-side language switch, it must use the other index, so the cache becomes per language. Re-initialising Pagefind on the same page is verified in implementation (task 7.2); if it is not supported, the language switch does a full navigation instead.

### 12. Fonts

`googleFonts.families` adds `Noto Serif TC` (400/600) and `Noto Sans TC` (400/700), and the Tailwind stacks become:

- `mincho`: `"Shippori Mincho", "Noto Serif TC", serif`
- `mono`: `"Space Mono", "Noto Sans TC", monospace`

The browser uses a fallback only for glyphs the first font lacks. Google Fonts serves CJK fonts as unicode-range slices, so a page downloads only the slices it uses.

## Risks / Trade-offs

- **[Risk] Existing URLs change language.** `/blog/...` shared earlier pointed at English posts, and now shows Chinese. → hreflang and alternates tell search engines about the English URLs, the language pill is one click away, and the old English posts are being replaced anyway (the articles branch removes them).
- **[Risk] The home page is no longer static.** Every request to `/` runs the Nitro worker, which counts toward Cloudflare Workers requests and adds a little latency, and `/` is no longer in the Pagefind index. → Only `/` is affected, and it has no searchable content. Verify after `pnpm build` that `dist/index.html` is absent and `dist/_routes.json` routes `/` to the worker (task 3.2).
- **[Risk] `@nuxtjs/google-fonts` downloads fonts at build time** (`download` defaults to on). With CJK families, that can mean many slices in `dist/`. → Measure `dist/` before and after (task 2.4); if it is too large, set `download: false` for the CJK families so they load from Google's CDN.
- **[Risk] Every Argos baseline changes** (Chinese interface at the old URLs). → Approve once in the PR that turns the module on; `/en` screenshots are new names (`en-<page>`), so they start fresh.
- **[Risk] Mixed-language pages** (Chinese interface, English project bodies) look inconsistent. → `lang="en"` on the content keeps typography right; translating projects is the planned next change.
- **[Trade-off] Two collections instead of a `locale` field.** Queries stay as simple as today, at the cost of a collection map. The symmetric layout remains possible later.

## Migration Plan

1. **Prerequisite**: merge the articles branch (`claude/current-project-check-3ixyjg`, with #37) into `dev`.
2. **Module, config, head, fonts, language switch**: strings stay English in both locale files for now. Argos baselines change once, for `lang` and fonts.
3. **Move strings, one page per PR**: l10n-review shows what each page still has left.
4. **Journal wiring**: collections, list and detail pages, the switch fallback, RSS.
5. **Search and sitemap**, then the Argos `/en` screenshots.

Each step deploys through a Cloudflare Pages preview first (every branch push builds one).

**Rollback**: revert the module PR. Routes return to English at `/`, and the locale files stay unused.

## Resolved Questions

Decided with the site owner before the task list was written:

1. `/` becomes SSR, so the browser-language redirect happens on the server (decision 3).
2. The home page introduction `portfolio of grayson — a frontend engineer based in taipei.` is translated (decision 5).
3. Single lowercase words that are functional text (`close`, `menu`, `search`, `sending...`, `email`, `name`, `message`) are translated (decision 5).
4. The pill on English pages reads `繁中` (decision 8).
