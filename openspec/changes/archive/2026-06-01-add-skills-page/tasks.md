## 1. Content Data

- [x] 1.1 Create `content/skills.yml`:
  ```yaml
  backend: [Go, Python, Node.js, PostgreSQL, Redis]
  frontend: [Vue 3, Nuxt 3, TypeScript, Tailwind CSS]
  devops: [Docker, GitHub Actions, Cloudflare, Terraform]
  database: [PostgreSQL, D1, Redis, MongoDB]
  ```

## 2. Skills Page

- [x] 2.1 Create `app/pages/skills.vue`
  - ⚠️ **Layout 說明**：tasks 原寫 `default` layout，但 `frontend.md` 規定「有 PageHeader 的內容頁 → 使用 `content` layout」。依新規則改用 `content` layout，確保 padding 與橫線位置與 about / projects / blog 一致。
- [x] 2.2 Read data: `queryCollection('skills').first()`（v3 API；同時在 `content.config.ts` 新增 `type: 'data'` collection）
- [x] 2.3 Background φ line: `<PhiLines :lines="[{x1:0, y1:'38.2%', x2:'100%', y2:'18%', width:0.5, opacity:0.45}]" />`
- [x] 2.4 Header: `<PageHeader label="— 05 / skills" />`
- [x] 2.5 Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12` with `flex-1` for 滿版
- [x] 2.6 Each category column:
  - Category label（`font-mono text-[11px] uppercase tracking-wider opacity-50`）
  - Chip cluster（`flex flex-wrap gap-2` with `<TagChip>`）
  - Caveat note at bottom（`font-hand text-[15px] opacity-40 mt-auto pt-6`）

## 3. Add Route Rule

- [x] 3.1 Add `/skills: { prerender: true }` to `routeRules` in `nuxt.config.ts`

## 4. Verification

- [x] 4.1 `/skills` renders 4 category columns (Backend / Frontend / DevOps / Database)
- [x] 4.2 Grid classes `md:grid-cols-2` / `lg:grid-cols-4` confirmed in SSR HTML
- [x] 4.3 Skill chips, caveat notes, PhiLines 全部正確渲染於 SSR HTML
