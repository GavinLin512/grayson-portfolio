## Context

本次調整為純視覺精修，所有變動都集中在 `app/pages/blog/index.vue` 的 template 與 `<script setup>` 中的 `formatDate`。不引入新元件、不改 schema、不動 routing。

## Goals / Non-Goals

**Goals**
- 把 blog list 視覺對齊 `uiux-fix/blog/index.png`
- 沿用既有設計系統 token（`font-mono`、`font-mincho`、`border-line`、`border-ink`、`<TagChip>`、`<PageHeader>`）
- 不改變既有資料模型（`tags`、`pinned`、`date`、`body` frontmatter 維持）

**Non-Goals**
- 不新增 reading progress 真實追蹤（meter 為純視覺裝飾）
- 不重構 `<TagChip>` 元件本身
- 不處理 `/blog/[slug]` 詳細頁（另案）
- 不實作 `/feed.xml` 後端 endpoint（僅變更顯示文字；若實際路由為 `/rss.xml`，保留 `href`，調整 label）

## Decisions

### 1. Tag filter：複用 TagChip 還是新建 active variant？

採用「在 button 上手刻 chip 樣式」的策略：

```html
<button
  class="font-mono text-[11px] uppercase tracking-wider px-[10px] py-[4px] rounded-full border border-ink transition"
  :class="active ? 'bg-ink text-bg' : 'opacity-70 hover:opacity-100'"
>
  {{ tag }}
</button>
```

**Why**：`<TagChip>` 設計上是「展示用 chip」沒有 active state，硬塞 active 會污染元件 API。filter button 是少數需要「未啟用 / 啟用反白」雙態的場景，個別頁面手刻較簡單且不影響其他頁面用法。

### 2. 日期格式 `YYYY · MM · DD`

替換 `formatDate`：

```ts
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${day}`
}
```

**Why**：與 hero / about / projects 頁面的 mono 編號風格一致，視覺上強化「機械精準」的調性。

### 3. 灰色 progress meter

純 div 矩形，無功能含意。設計稿中是「標題下方一條淡灰橫線」，可以理解為「文章長度的視覺暗示」。實作上不接 reading time（避免暗示假資訊），固定寬度即可：

```html
<div class="h-[6px] bg-ink/15 w-[180px] mt-[10px]" />
```

或依 reading time 比例（每分鐘 30px、上限 240px）強化資訊密度：

```html
<div :style="{ width: Math.min(useReadingTime(post.body) * 30, 240) + 'px' }" class="h-[6px] bg-ink/15 mt-[10px]" />
```

**決策**：採後者（依 reading time），讓 meter 同時是裝飾也是隱性的長度提示，符合 Quiet Codex 風格「資訊圖層化」的理念。

### 4. Pinned 卡片版型

從 `border border-ink p-[18px]` 的標題清單，改為「單一精選文章卡」：

```html
<div class="border border-ink p-[18px]">
  <div class="font-mono text-[11px] opacity-50 mb-[14px] uppercase tracking-wider">pinned</div>
  <div class="font-mono text-[12px] opacity-55 mb-[8px]">{{ formatDate(featured.date) }}</div>
  <h3 class="font-mincho text-[20px] leading-[1.25] mb-[12px]">{{ featured.title }}</h3>
  <div class="space-y-[4px] mb-[16px]">
    <div class="h-[6px] bg-ink/15 w-full" />
    <div class="h-[6px] bg-ink/15 w-[80%]" />
  </div>
  <NuxtLink :to="featured.path" class="font-mono text-[12px] hover:opacity-70">read →</NuxtLink>
</div>
```

**Why**：設計稿 pinned 區塊只放一篇主打文，採「卡片化」處理。若有多篇 `pinned: true`，取最新一篇即可。

### 5. Archive inline 年份計數

```ts
const yearCounts = computed(() =>
  sortedYears.value.map((y) => ({ year: y, count: postsByYear.value[y].length }))
)
```

```html
<div class="flex gap-[16px] flex-wrap font-mono text-[12px]">
  <span v-for="{ year, count } in yearCounts" :key="year" class="opacity-70">
    {{ year }} ({{ count }})
  </span>
</div>
```

**Why**：原本「每年逐篇列出」資訊量太重，與右側 sidebar 應該作為次要導覽的角色衝突。Inline 計數更貼近設計稿密度，使用者若需要看篇目仍可透過 tag filter / 滾動主清單達成。

## Risks / Trade-offs

- **Meter 沒有真實功能**：使用者可能誤以為是 reading progress，但因為它只出現在列表頁、不在詳細頁，誤解風險低。可選擇加上 aria-hidden 強調純裝飾。
- **Archive 移除逐篇連結**：失去「快速跳到 N 年前某篇」的能力。Trade-off 是換取版面整潔；若未來文章超過 50 篇，可重新評估。
- **Tag filter 手刻**：未來新增 filter 頁面（projects、journal）需手動同步樣式。可接受，因為 active filter 場景目前只有 blog 一處。
- **Argos baseline 重置**：截圖差異會觸發 Argos 視覺比對失敗，PR 需要人工核准新 baseline。
