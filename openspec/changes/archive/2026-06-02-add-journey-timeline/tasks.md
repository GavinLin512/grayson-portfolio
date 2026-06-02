## 1. Content Data

- [x] 1.1 Create `content/timeline.yml`:
  ```yaml
  - year: 2024
    company: Hina
    role: Lead Frontend Engineer
    description: Built the payments console from scratch.
    tags: [vue, ts, payments]
  - year: 2022
    company: Field LLC.
    role: Senior Frontend Engineer
    description: ...
    tags: [...]
  # ... more entries
  ```

## 2. Journey Page

- [x] 2.1 Create `app/pages/journey.vue` (uses `default` layout)
- [x] 2.2 Read data: `useAsyncData('timeline', () => queryContent('timeline').findOne())`
- [x] 2.3 Header: `— 06 / career journey` note
- [x] 2.4 Two-column layout: `grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-8 relative`

## 3. Year Sidebar

- [x] 3.1 Compute unique years from data (descending)
- [x] 3.2 For each year, render `<a href="#year-{year}" class="block font-mono text-[12px] opacity-70 hover:opacity-100">{year} ({count})</a>`
- [x] 3.3 `scroll-behavior: smooth` in `<html>` global CSS

## 4. Vertical φ Spine

- [x] 4.1 In main column, add absolute-positioned vertical line: `<div class="absolute top-0 bottom-0 border-l border-ink" style="left: 38.2%;"></div>` (relative to grid cell)

## 5. Event List

- [x] 5.1 v-for through entries:
  - `<section :id="\`year-\${year}\`" class="py-6">`
  - year label (Space Mono 11px uppercase)
  - `<h3 class="font-mincho text-[28px] mt-2">{company} · {role}</h3>`
  - `<p class="font-mono text-[12px] opacity-85 mt-2">{description}</p>`
  - tag chips row

## 6. Route Rule

- [x] 6.1 Add `/journey: { prerender: true }` to `routeRules`

## 7. Verification

- [x] 7.1 `/journey` renders all timeline entries
- [x] 7.2 Click year in sidebar smoothly scrolls to that year's first event
- [x] 7.3 Vertical spine visible at 38.2% width
