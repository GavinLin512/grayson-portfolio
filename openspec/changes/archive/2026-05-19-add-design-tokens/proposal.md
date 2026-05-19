## Why

所有後續頁面元件都需要引用統一的 design tokens（顏色、字體、dark mode）。若各頁面各自寫色碼字級，視覺會發散且 dark mode 切換無法集中管理。先建立 tokens 層可避免後改要全站翻新。

## What Changes

- 新增 `app/assets/css/tokens.css`：CSS Variables 定義 light + dark 兩組色票
- 安裝 `@nuxtjs/tailwindcss`、`@nuxtjs/color-mode`、`@nuxtjs/google-fonts` 三個 modules
- `tailwind.config.ts` 設定 `darkMode: 'class'`，`theme.extend.colors` 與 `fontFamily` 包裹 CSS Variables
- 整合 Google Fonts：Shippori Mincho、Space Mono、Caveat（含 `preconnect` 與 `display: swap`）
- `@nuxtjs/color-mode` 設 `classSuffix: ''`，與 Tailwind 統一用 `.dark` class 策略
- 在 `app/app.vue` 加 dark mode 切換按鈕驗證

## Capabilities

### New Capabilities
- `design-tokens`：提供米色 + ink + cool accent 配色、三組字體、dark mode 切換的設計系統基礎層

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/assets/css/tokens.css`、`tailwind.config.ts`
- 修改檔案：`nuxt.config.ts`（加入 modules、`css` 陣列、`colorMode`、`googleFonts` 設定）
- 依賴：`setup-project-foundation`
