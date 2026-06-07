# Frontend Rules

## PageHeader 元件

每個頁面頂部的 label + 橫線結構，必須使用 `app/components/PageHeader.vue`，不可手刻。

### Props

| Prop | Type | 說明 |
|------|------|------|
| `label` | `string` | 頁面標籤，格式為 `— XX / name` |

### Slot

default slot 放右側內容（如 category filter buttons）。無右側內容時省略 slot。

### 規格

- label 樣式：`font-mono text-[15px] opacity-70`
- 橫線：`border-t border-line mt-[14px]`
- wrapper：`shrink-0 mb-[48px]`

### 使用範例

```vue
<!-- 無右側內容 -->
<PageHeader label="— 06 / about" />

<!-- 有右側內容 -->
<PageHeader :label="`— 02 / projects · ${count} selected`">
  <div class="flex gap-6 font-mono text-[13px]">
    ...
  </div>
</PageHeader>
```

### 已套用頁面

| 頁面 | Label |
|------|-------|
| `app/pages/about.vue` | `— 06 / about` |
| `app/pages/projects/index.vue` | `— 02 / projects · N selected` |

---

## Layout：`content` vs `default`

### 規則

- **內容頁**（有 PageHeader + 一般排版）→ 使用 `layout: 'content'`
- **全出血頁**（Hero、特殊背景、全版定位）→ 使用預設 `layout: 'default'`（不加宣告）

### 內容 layout 規格

`app/layouts/content.vue` 結構：

```html
<div class="bg-bg text-ink min-h-screen flex flex-col">
  <SiteHeader class="sticky top-0 z-10" />
  <main class="flex-1 px-6 lg:px-[60px] py-[60px]">
    <slot />
  </main>
  <SiteFooter />
</div>
```

- **`min-h-screen`**：頁面高度隨內容增長，scrollbar 只在真正需要時出現（視窗捲動，非 main 內部捲動）
- **`SiteHeader sticky`**：捲動時 header 保持可見
- **`py-[60px]`**：標準 padding，在自然流中 `padding-bottom` 正常作用，無需額外 spacer

頁面本身的最外層 `<div>` **不再**加 padding class。

### 宣告方式

```vue
<script setup lang="ts">
definePageMeta({ layout: 'content' })
</script>
```

### 已套用頁面

| 頁面 | Layout |
|------|--------|
| `app/pages/index.vue` | `default`（全出血 Hero，不宣告）|
| `app/pages/about.vue` | `content` |
| `app/pages/projects/index.vue` | `content` |
| `app/pages/projects/[slug].vue` | `content` |

---

## 滿版頁面規則（重要）

**任何新建或調整的頁面，root 元素必須撐滿 viewport，不可在底部留白或讓內容只佔上半部。**

### 為什麼

`content` layout 的 `<main>` 是 `flex-1`，在短內容頁面下 main 會撐滿 header 與 footer 之間的空間。頁面 root `<div>` 若沒有 `min-h-full`，內容只會自然高度展開，視覺上會在 SiteFooter 之上出現一大塊空白。

### 規則

1. **`layout: 'content'` 的頁面** root `<div>` 必須是：
   ```html
   <div class="relative min-h-full flex flex-col">
   ```
   並用 `flex-1` 讓主要內容區塊吃掉剩餘高度（例如 `<div class="flex-1 grid ...">`）。

2. **`layout: 'default'` 的全出血頁面**（如 Hero）使用絕對定位或自帶 `h-screen` 撐滿，不依賴 layout 的 main padding。

3. **避免**在頁面 root 直接使用 `h-full` 或省略高度宣告 — 前者固定高度為 main 高度（短頁面 OK，長頁面內容被截斷），後者讓頁面底部出現大片空白。

### 自我檢查清單

新增頁面 / 調整視覺時務必確認：

- [ ] root `<div>` 是否有 `min-h-full flex flex-col`（content layout）
- [ ] 主內容容器是否有 `flex-1` 吃掉剩餘高度
- [ ] 1280×800 viewport 下底部與 SiteFooter 之間不應有空白
- [ ] 與設計稿 / 既有頁面（about、projects、blog）並排比對「視覺密度」一致
