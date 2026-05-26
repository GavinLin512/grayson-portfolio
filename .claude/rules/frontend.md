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
