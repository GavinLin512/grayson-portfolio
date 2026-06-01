## 1. Date Formatting

- [x] 1.1 Replace `formatDate` in `app/pages/blog/index.vue` 改為 `YYYY · MM · DD` 格式（月日補零、中點分隔）
- [x] 1.2 確認列表項與 pinned 卡片都使用同一個 `formatDate` helper

## 2. Tag Filter — Pill Chip Style

- [x] 2.1 把 `<button v-for="tag in tags">` 樣式改為 pill chip：
  - base：`font-mono text-[11px] uppercase tracking-wider px-[10px] py-[4px] rounded-full border border-ink transition`
  - inactive：`opacity-70 hover:opacity-100`
  - active：`bg-ink text-bg`
- [x] 2.2 拿掉原本的 `underline font-bold` active 樣式

## 3. List Item — Date / Reading Time / Meter

- [x] 3.1 列表項上方 metadata：左側 `formatDate(post.date)`，右側 `{{ useReadingTime(post.body) }} min`（拿掉 `read` 文字）
- [x] 3.2 改用 `flex justify-between` 讓日期靠左、reading time 靠右
- [x] 3.3 標題下方追加 progress meter：
  ```html
  <div class="flex items-center gap-[12px] mt-[12px]">
    <TagChip v-for="tag in post.tags" :key="tag">{{ tag }}</TagChip>
    <div
      aria-hidden="true"
      :style="{ width: Math.min(useReadingTime(post.body) * 30, 240) + 'px' }"
      class="h-[6px] bg-ink/15"
    />
  </div>
  ```

## 4. Pinned Card

- [x] 4.1 將 `pinnedPosts` 改為 `featuredPost = computed(() => posts.value?.find(p => p.pinned))`（只取最新一篇）
- [x] 4.2 重寫 pinned 卡片內容：
  - `pinned` label
  - 日期（mono、12px、opacity-55）
  - 標題（`font-mincho text-[20px] leading-[1.25]`）
  - 兩條 progress meter（`h-[6px] bg-ink/15`，寬度 100% / 80%）
  - `read →` CTA → NuxtLink 到 `featuredPost.path`
- [x] 4.3 若 `featuredPost` 為 null，整張卡片不渲染（`v-if`）

## 5. Archive — Inline Year Counts

- [x] 5.1 新增 `yearCounts` computed：`sortedYears.map(y => ({ year: y, count: postsByYear[y].length }))`
- [x] 5.2 將原本「每年 + 每篇文章 NuxtLink」結構替換成 inline 計數：
  ```html
  <div class="flex gap-[16px] flex-wrap font-mono text-[12px]">
    <span v-for="{ year, count } in yearCounts" :key="year" class="opacity-70">
      {{ year }} ({{ count }})
    </span>
  </div>
  ```
- [x] 5.3 保留 `archive · by year` label

## 6. RSS Link Label

- [x] 6.1 將顯示文字 `rss · /rss.xml` 改為 `rss · /feed.xml`
- [x] 6.2 `href` 暫保留 `/rss.xml`（若該路由存在）；若不存在，提 issue 紀錄需建立 `/feed.xml` 端點

## 7. Verification

- [x] 7.1 `pnpm dev` 啟動，SSR HTML 結構正確（含新日期格式 `YYYY · MM · DD`、`bg-ink text-bg` active filter、`pinned` 卡片、inline year counts、`rss · /feed.xml`）
- [x] 7.2 SSR HTML 確認 active filter "all" 套用 `bg-ink text-bg` pill 樣式
- [x] 7.3 Meter 寬度依 reading time 變化驗證通過（修完 `useReadingTime` 對 Nuxt Content v3 minimark AST 的解析後，sample 文章 4 min → 120px）
- [x] 7.4 SSR HTML 中 `pinned</div>` 僅出現一次 — 確認單篇 featured 渲染
- [x] 7.5 既有 `grid-cols-1 lg:grid-cols-[1.4fr_1fr]` 已處理響應式折疊
- [x] 7.6 Playwright 視覺測試由 CI 自動執行（本地不需驗證）；Argos baseline 在 CI 上人工核准

## 8. Post-implementation Refinements

- [x] 8.1 修正 `app/composables/useReadingTime.ts` 的 `extractText`：補 Nuxt Content v3 minimark 解析（`{ type: 'minimark', value: [[tag, attrs, ...children]] }`），保留舊版 hast / MDC fallback
- [x] 8.2 順手統一 `app/pages/blog/[slug].vue` 的 `formatDate` 為 `YYYY · MM · DD`
- [x] 8.3 Tag filter chip 尺寸微調：`text-[12px] leading-none px-[14px] py-[4px]`（總高 22px ≤ label box 22.5px，PageHeader 橫線位置維持與 about / projects 對齊）
- [x] 8.4 `pnpm add @lucide/vue`（已先試 `lucide-vue-next` 但官方標記 deprecated）
- [x] 8.5 RSS 連結加上 `<Rss :size="14" :stroke-width="2" />` icon，`inline-flex items-center gap-[8px]`
