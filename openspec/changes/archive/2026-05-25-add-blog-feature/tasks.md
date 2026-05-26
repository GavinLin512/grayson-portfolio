## 1. Module Setup

- [x] 1.1 Run `pnpm add @nuxt/content`
- [x] 1.2 Add `'@nuxt/content'` to `nuxt.config.ts` `modules`
- [x] 1.3 Add to `routeRules`: `/blog: { prerender: true }`, `/blog/**: { prerender: true }`

## 2. Sample Content

- [x] 2.1 Create `content/blog/2026-04-12-on-grids-that-fail-gracefully.md` with frontmatter (`title`, `date`, `tags: [css]`, `pinned: true`) and a body containing H2 sections, a code block, a `mermaid` code block, and an image
- [x] 2.2 Create a second post `content/blog/2025-12-24-animating-with-restraint.md` (different tag)

## 3. Reading Time Composable

- [x] 3.1 Create `app/composables/useReadingTime.ts`
- [x] 3.2 Export `useReadingTime(body: string): number` that counts words and returns `Math.ceil(wordCount / 200)`

## 4. Blog List Page

- [x] 4.1 Create `app/pages/blog/index.vue`
- [x] 4.2 Header: 「— 03 / journal · N notes」note + chip filter row `['all', 'css', 'type', 'craft', 'motion', 'meta']`
- [x] 4.3 Two-column grid: `grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[60px]`
- [x] 4.4 Main column: `<ContentList path="/blog" v-slot="{ list }">` then v-for posts (sorted by date desc), each entry shows date label, read-time label, Mincho title (24px), tag chip
- [x] 4.5 Side column: pinned posts (filter `pinned: true`) inside `border border-ink p-[18px]`; archive by year; "rss · /feed.xml" link

## 5. Blog Detail Page

- [x] 5.1 Create `app/pages/blog/[slug].vue`
- [x] 5.2 Read post via `queryContent('blog').where({ _path: $route.path }).findOne()`
- [x] 5.3 Header: `— journal · slug` label, Mincho 52px title, date + read time labels, tag chip
- [x] 5.4 Three-column grid: `grid-cols-[180px_1fr_180px] gap-[60px]`
- [x] 5.5 Left TOC: extract H2/H3 from `body.toc.links`, render as anchor links
- [x] 5.6 Center article: render via `<ContentRenderer :value="post" />`
- [x] 5.7 Right "also reading": 3 related post titles (Mincho 14px + read → label)
- [x] 5.8 TOC active state: `IntersectionObserver` watches H2/H3 elements in DOM, sets active

## 6. Mermaid Rendering

- [x] 6.1 Run `pnpm add mermaid`
- [x] 6.2 Create `app/components/content/ProseCode.vue` that overrides `@nuxt/content` default code block
- [x] 6.3 If `language === 'mermaid'`, dynamically import `mermaid` and render into a `<div>` with `mermaid.render(uniqueId, code)`
- [x] 6.4 Otherwise, render the original code block

## 7. RSS Feed

- [x] 7.1 Create `server/routes/rss.xml.ts`
- [x] 7.2 Query all posts via `queryContent('blog').find()`
- [x] 7.3 Emit valid RSS 2.0 XML with `<channel>` + `<item>` per post
- [x] 7.4 Set `Content-Type: application/xml`

## 8. Verification

- [x] 8.1 `/blog` shows both sample posts with correct metadata
- [x] 8.2 Click into detail: TOC populates, Mermaid renders, code block has syntax highlight
- [x] 8.3 `/rss.xml` returns valid XML (validate with feedvalidator.org or `xmllint`)
- [x] 8.4 Click tag chip filters list
