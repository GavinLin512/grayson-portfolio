## 1. Content Module (if not installed by add-blog-feature)

- [x] 1.1 Confirm `@nuxt/content` is installed; if not, run `pnpm add @nuxt/content` and add to modules
- [x] 1.2 Add to `routeRules`: `/projects: { prerender: true }`, `/projects/**: { prerender: true }`

## 2. Sample Content

- [x] 2.1 Create `content/projects/01-field.md` with frontmatter (`title`, `subtitle`, `year`, `role`, `team`, `stack`, `cover`, `screens`) and Markdown body with `## Brief`, `## Process`, `## Tech Decisions` (including a mermaid code block)
- [x] 2.2 Create `content/projects/02-hina.md` (second sample)

## 3. Projects List Page

- [x] 3.1 Create `app/pages/projects/index.vue`
- [x] 3.2 Background: `<PhiLines :lines="[{x1:0, y1:'61.8%', x2:'100%', y2:'61.8%', width:0.6, opacity:0.55}]" />`
- [x] 3.3 Header: `— 02 / works · N projects` label
- [x] 3.4 Each entry as a row with `grid grid-cols-[60px_1fr_240px_120px] gap-6 py-6 border-b border-line`:
  - col 1: zero-padded index (`01`, `02`)
  - col 2: Mincho title + subtitle below
  - col 3: stack chips
  - col 4: "→" link

## 4. Project Detail Page

- [x] 4.1 Create `app/pages/projects/[slug].vue`
- [x] 4.2 Read project via `queryContent('projects').where({ _path: $route.path }).findOne()`
- [x] 4.3 Header grid: `grid-cols-[70px_1fr_200px] gap-6 items-baseline`
  - col 1: index label
  - col 2: Mincho 56px title + 22px subtitle
  - col 3: year · case study label
- [x] 4.4 Horizontal rule below header (1px ink)
- [x] 4.5 Cover image: full-width, `h-[420px]`, src from `frontmatter.cover`
- [x] 4.6 Role / brief grid: `grid-cols-[1fr_2fr] gap-[60px]`
  - left: role label + value, team label + value, stack chips
  - right: brief and process body paragraphs
- [x] 4.7 Dual-image grid: `grid-cols-[2fr_1fr] gap-6`
  - left: `<img :src="screens[0]" class="h-[300px] w-full object-cover">`
  - right: `<img :src="screens[1]" class="h-[300px] w-full object-cover bg-cool">` (cool tint when image is dark/transparent)
- [x] 4.8 Render markdown body via `<ContentRenderer :value="post" />` — body's `## Tech Decisions` heading + Mermaid auto-renders via the prose override from blog change
- [x] 4.9 Bottom prev/next nav: query adjacent projects sorted by date

## 5. Verification

- [x] 5.1 `/projects` lists both samples with correct fields
- [x] 5.2 Click into detail: cover, role/stack, dual-image, Mermaid all render
- [x] 5.3 Prev/next links work between project 1 and project 2
