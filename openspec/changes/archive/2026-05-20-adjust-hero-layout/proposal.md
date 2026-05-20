## Why

Hero 頁面目前存在兩個視覺問題：

1. **字體太小**：nav、footer、hero 輔助文字均使用 10–12px，在螢幕上難以辨讀。標題（Mincho 大字）除外，其餘所有文字需調升至少 4px，確保最小字級達 14px。
2. **背景超出畫面**：`default.vue` 使用 `min-h-screen`，加上 Hero 內層也是 `min-h-screen`，導致 header + hero + footer 總高度超過 viewport，產生縱向 scrollbar，破壞「一屏滿版」效果。

## What Changes

### 字級調整（+4px 規則）

| 位置 | 元素 | 舊值 | 新值 |
|------|------|------|------|
| `SiteHeader.vue` | `grayson / 2026` 標籤 | `text-[10px]` | `text-[14px]` |
| `SiteHeader.vue` | nav 連結 | `text-[10px]` | `text-[14px]` |
| `SiteFooter.vue` | 整列 footer 文字 | `text-[10px]` | `text-[14px]` |
| `TagChip.vue` | pill 文字 | `text-[10px]` | `text-[14px]` |
| `index.vue` | 左側說明段落 | `text-[12px]` | `text-[16px]` |
| `index.vue` | `N° 2026 — 04` 日期 | `text-[11px]` | `text-[15px]` |
| `index.vue` | `a portfolio —` 副標 | `text-[12px]` | `text-[16px]` |
| `index.vue` | `design · code · craft` tagline | `text-[11px]` | `text-[15px]` |

### 滿版修正

- **`app/layouts/default.vue`**：外層 `div` 改為 `h-screen overflow-hidden`；`<main>` 加上 `overflow-y-auto`，讓其他頁面仍可在 main 內捲動。
- **`app/pages/index.vue`**：Hero 容器由 `min-h-screen` 改為 `h-full`，填滿 flex 分配的剩餘高度。

## Capabilities

### Modified Capabilities

- `shared-layout`：header / footer 文字可讀性提升；TagChip 文字同步調大。
- `hero-page`：Hero 真正滿版，消除縱向 scrollbar；左側輔助文字更易閱讀。

## Impact

- 修改檔案：`app/layouts/default.vue`、`app/components/SiteHeader.vue`、`app/components/SiteFooter.vue`、`app/components/TagChip.vue`、`app/pages/index.vue`
- 不新增路由、不改動 CSS tokens、不影響 dark mode
- TagChip 字級調大後，header 右側 pill 外觀會略寬，需目測確認比例是否合理
