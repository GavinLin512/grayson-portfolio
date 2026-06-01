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

`app/layouts/content.vue` 在 `<main>` 套用統一 padding：

```
px-6 lg:px-[60px] py-[60px]
```

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

`content` layout 已將 `<main>` 設為 `h-screen` 內的 `flex-1 overflow-y-auto`。頁面若沒有 `h-full`，內容只會自然高度展開，視覺上會在 SiteFooter 之上出現一大塊空白，與 hero / about / projects 等既有頁面的「滿版排版」不一致。

### 規則

1. **`layout: 'content'` 的頁面** root `<div>` 必須是：
   ```html
   <div class="relative h-full flex flex-col">
   ```
   並用 `flex-1` 讓主要內容區塊吃掉剩餘高度（例如 `<div class="flex-1 grid ...">`）。

2. **`layout: 'default'` 的全出血頁面**（如 Hero）使用絕對定位或自帶 `h-screen` 撐滿，不依賴 layout 的 main padding。

3. **避免**在頁面 root 直接使用 `min-h-screen` 或省略高度宣告 — 會破壞 layout 既定的 flex chain。

### 自我檢查清單

新增頁面 / 調整視覺時務必確認：

- [ ] root `<div>` 是否有 `h-full flex flex-col`（content layout）
- [ ] 主內容容器是否有 `flex-1` 吃掉剩餘高度
- [ ] 1280×800 viewport 下底部與 SiteFooter 之間不應有空白
- [ ] 與設計稿 / 既有頁面（about、projects、blog）並排比對「視覺密度」一致
