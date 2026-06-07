## 1. Install Pagefind

- [x] 1.1 Run `pnpm add -D pagefind`
- [x] 1.2 Update `package.json` scripts:
  - `"build:search": "pagefind --site dist"`
  - `"build": "nuxt build && pnpm build:search"`
- [x] 1.3 `nuxt.config.ts`: add `nitro.cloudflare.pages.routes.exclude: ['/pagefind/*']` so Cloudflare Pages serves `/pagefind/*` as static assets instead of routing to the Nitro worker (without it → 404 → search index fails to load, in prod and local `wrangler pages dev`). Verified this exclude MERGES with Nitro's auto-generated excludes, so no manual maintenance of the rest.

## 2. usePagefind Composable

- [x] 2.1 Create `app/composables/usePagefind.ts`
- [x] 2.2 Export `async function initPagefind()` that tries `await import(/* @vite-ignore */ '/pagefind/pagefind.js')` and `await pf.init()` inside a try/catch
- [x] 2.3 On failure return `null`; on success return the Pagefind instance

## 3. SearchModal Component

- [x] 3.1 Create `app/components/SearchModal.vue`
- [x] 3.2 Props: `modelValue: boolean` (v-model for open state)
- [x] 3.3 Template uses `<dialog :open="modelValue">` for built-in focus trap
- [x] 3.4 Styled container: `fixed inset-x-0 top-[20%] mx-auto max-w-2xl bg-bg border border-ink p-6`
- [x] 3.5 Input: `<input class="w-full h-[38px] bg-paper border border-ink px-3 font-mono">`
- [x] 3.6 On input change, debounce 200ms then call `pagefind.search(query)`
- [x] 3.7 Render results in BlogList-style rows: title + excerpt + URL
- [x] 3.8 Result click: emit close + navigate via `navigateTo()`
- [x] 3.9 If `initPagefind()` returns null, show "Search index not built. Run `pnpm build` to enable search." message instead of input

## 4. Cmd+K Shortcut

- [x] 4.1 In `app/app.vue` (not a layout — so it covers both `default` and `content` layouts), add `<SearchModal v-model="searchOpen" />`
- [x] 4.2 Add keydown listener on `window`: if `(e.metaKey || e.ctrlKey) && e.key === 'k'`, prevent default + toggle `searchOpen`
- [x] 4.3 Add Escape handler to close

## 5. Header Search Icon

- [x] 5.1 In `app/components/SiteHeader.vue` right section, add a `rounded-md` search trigger button: magnifier icon on the left, `search` label in the middle, OS-aware shortcut keys on the right (`⌘` + `K` on macOS, `Ctrl` + `K` on Windows/Linux, each in a separate `<kbd>` element). No hover fill effect. Platform detected client-side via `navigator.userAgent` in `onMounted`.
- [x] 5.2 Trigger click sets the `useState('search-open')` shared signal (consumed by the app-root SearchModal)

## 6. Prerender coverage (needed for indexing detail pages)

- [x] 6.0 `nuxt.config.ts`: add `nitro.prerender.crawlLinks: true` so `/blog/**` and `/projects/**` detail pages are prerendered to HTML (otherwise Pagefind only indexes the 6 list pages)

## 7. Verification

- [x] 7.1 In dev: Cmd+K opens modal, shows "Search index not built" message (verified via Playwright; `/pagefind/pagefind.js` 404 is the expected dev fallback)
- [x] 7.2 `pnpm build`: searching "grid" returns the post "On Grids That Fail Gracefully" with title (16 pages / 1055 words indexed)
- [x] 7.3 Confirm `dist/pagefind/` directory exists after build (contains `pagefind.js` + indexes)
- [ ] 7.4 Update Cloudflare Pages build command in dashboard to `pnpm build` (manual, at deploy time — recorded in `.claude/rules/deploy.md`)
