# CI / Argos Visual Testing

## 執行流程

Argos CI 本身不指定測試檔案，由 Playwright 負責掃描並執行：

1. `.github/workflows/argos.yml` 在 push/PR 到 `main` 時觸發
2. 啟動 dev server（`pnpm dev &`），等待 `localhost:3000` 就緒
3. 執行 `pnpm exec playwright test`
4. Playwright 讀取 `playwright.config.ts`，掃描 `tests/` 目錄下所有 `**/*.spec.ts`
5. 每個 spec 內的 `argosScreenshot()` 透過 reporter 把截圖上傳到 Argos
6. Argos 與 baseline 比對，回報視覺差異

## 重要觀念

- **Argos 識別截圖的 key** 是 `argosScreenshot(page, "<name>")` 的第二個參數，不是檔名
- 改第二個參數 → Argos 視為新截圖，與舊 baseline 脫鉤，需重新核准
- **上傳時機**：只有在 CI 環境（`process.env.CI` 為 true）才上傳，本地執行不會上傳

## 新增測試頁面

在 `tests/` 目錄下新增任意 `*.spec.ts`，Playwright 自動掃描，無需修改任何設定。

範例：

```ts
import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";

test("screenshot about", async ({ page }) => {
  await page.goto("http://localhost:3000/about");
  await argosScreenshot(page, "about");
});
```

## 重新命名規則

| 操作 | 影響 |
|------|------|
| 改 spec 檔名 | 無影響，Playwright 自動掃描 |
| 移出 `tests/` 目錄 | 測試不執行 |
| 改 `argosScreenshot` 第二個參數 | Argos baseline 脫鉤，視覺比對重置 |
