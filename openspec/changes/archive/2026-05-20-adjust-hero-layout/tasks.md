## 1. 滿版佈局修正

- [x] 1.1 `app/layouts/default.vue`：外層 `div` 的 `min-h-screen` 改為 `h-screen overflow-hidden`
- [x] 1.2 `app/layouts/default.vue`：`<main class="flex-1">` 改為 `<main class="flex-1 overflow-y-auto">`
- [x] 1.3 `app/pages/index.vue`：Hero 容器 `min-h-screen` 改為 `h-full`

## 2. SiteHeader 字級

- [x] 2.1 `app/components/SiteHeader.vue` line 5：`text-[10px]`（grayson / 2026）改為 `text-[14px]`
- [x] 2.2 `app/components/SiteHeader.vue` line 13：nav 連結 `text-[10px]` 改為 `text-[14px]`

## 3. SiteFooter 字級

- [x] 3.1 `app/components/SiteFooter.vue` line 2：`text-[10px]` 改為 `text-[14px]`

## 4. TagChip 字級

- [x] 4.1 `app/components/TagChip.vue` line 3：`text-[10px]` 改為 `text-[14px]`

## 5. Hero 輔助文字字級

- [x] 5.1 `app/pages/index.vue` line 13：左側說明段落 `text-[12px]` 改為 `text-[16px]`
- [x] 5.2 `app/pages/index.vue` line 19：`N° 2026 — 04` 的 `text-[11px]` 改為 `text-[15px]`
- [x] 5.3 `app/pages/index.vue` line 32：`a portfolio —` 的 `text-[12px]` 改為 `text-[16px]`
- [x] 5.4 `app/pages/index.vue` line 36：`design · code · craft` tagline 的 `text-[11px]` 改為 `text-[15px]`

## 6. 視覺 QA

- [x] 6.1 在 1280px 寬度確認 Hero 無縱向 scrollbar
- [x] 6.2 在 375px（mobile）確認 Hero 無縱向 scrollbar
- [x] 6.3 確認 nav 文字、footer 文字在 14px 下清晰可讀
- [x] 6.4 確認 TagChip pill 在 header 右側比例仍正常（非 1024px 窄桌面擠壓）
- [x] 6.5 確認 About / Blog 等長頁面（未來）可在 main 內正常捲動（`overflow-y-auto`）
