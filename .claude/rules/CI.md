# CI / Argos Visual Testing

## 執行流程

Argos CI 本身不指定測試檔案，由 Playwright 負責掃描並執行：

1. `.github/workflows/argos.yml` 在 push 到 `dev`/`main`、或任意 PR 帶 `run-argos-ci` label 時觸發（詳見下方「觸發策略」）
2. 啟動 dev server（`pnpm dev &`），等待 `localhost:3000` 就緒
3. 執行 `pnpm exec playwright test`
4. Playwright 讀取 `playwright.config.ts`，掃描 `tests/` 目錄下所有 `**/*.spec.ts`
5. 每個 spec 內的 `argosScreenshot()` 透過 reporter 把截圖上傳到 Argos
6. Argos 與 baseline 比對，回報視覺差異

## 重要觀念

- **Argos 識別截圖的 key** 是 `argosScreenshot(page, "<name>")` 的第二個參數，不是檔名
- 改第二個參數 → Argos 視為新截圖，與舊 baseline 脫鉤，需重新核准
- **上傳時機**：只有在 CI 環境（`process.env.CI` 為 true）才上傳，本地執行不會上傳

## 觸發策略（三分支必須同步）

git flow 是 `feature → dev → main`，全部走 PR。`argos.yml` 觸發規則：

設計目標：**opt-in（只有畫面相關的 PR 才手動加 `run-argos-ci` label 才跑），且剛好跑一次。**

```yaml
on:
  push:
    branches: [dev, main]              # 合併進整合/正式分支 → 更新 baseline
  pull_request:
    # 不含 opened：避免「開 PR 帶 label」時 opened 與 labeled 重疊成兩個 run
    types: [synchronize, reopened, labeled]

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true

jobs:
  argos:
    if: >-
      github.event_name == 'push' ||
      (github.event.action == 'labeled' && github.event.label.name == 'run-argos-ci') ||
      (github.event.action != 'labeled' && contains(github.event.pull_request.labels.*.name, 'run-argos-ci'))
```

| 事件 | 行為 |
|------|------|
| push 到 `dev` / `main` | 一律跑，產生新 baseline build |
| 開 PR 時就掛 `run-argos-ci` | `labeled:run-argos-ci` 跑一次（`opened` 不觸發） |
| 事後才補 `run-argos-ci` | 補 label 當下跑一次 |
| 加其他 label（如 `enhancement`） | skip |
| 已 label 的 PR 再 push commit | `synchronize` 跑一次 |
| 沒掛 label 的 PR | 不跑（opt-in） |

### 為什麼「剛好一次」而非靠 concurrency 取消

`labeled` 觸發類型會「每加一個 label 觸發一次」。若同時保留 `opened` + 多個 label，
開 PR 當下會產生 `opened` + `labeled`×N 個 run，再靠 concurrency 取消多餘的——
症狀就是「Canceling since a higher priority waiting request ... exists」。

根本解法：**拿掉 `opened`**（帶 label 開 PR 時 GitHub 必發 `labeled`，故以它當啟動點），
並用 `github.event.action == 'labeled' && github.event.label.name == 'run-argos-ci'`
讓 labeled 事件**只認指定 label**。如此正常流程不會再產生需要被取消的重複 run。

> 另一種大公司常見做法是用 `paths:` 過濾（只有 `app/**`、`*.vue`、`*.css` 等 UI 檔案變動才跑），
> 自動判斷是否畫面相關、免人工掛 label。本專案採人工 label 以保留每個 PR 的明確控制權。

### 為什麼三分支內容必須一致

GitHub Actions 對 `pull_request` 事件，**使用 PR base 分支裡的 workflow 檔**。
所以 `feature → dev` 的 PR 吃的是 `dev` 上的 `argos.yml`、`dev → main` 吃 `main` 上的。
三分支內容若不一致，會出現「同一 commit 掛在不同 base PR 上、各跑一份不同規則」的重複觸發。

**規則：修改 `argos.yml` 後，務必確認三分支內容一致**（靠 PR 合併自然傳播，不直接 push 保護分支）。
驗證指令：

```bash
for b in feature dev main; do echo "$b $(git rev-parse $b:.github/workflows/argos.yml)"; done
# 三個 blob hash 必須相同
```

### concurrency 去重

`group` 以 `github.head_ref`（PR 來源分支名）為 key，搭配 `cancel-in-progress: true`：
同一來源分支即使同時掛在 `dev` 與 `main` 兩個 PR 上，也只保留最新一個 run。

## Baseline 與 reference branch

- Argos 每個 build 會跟 **reference branch 上最近一次 approved build** 比對。
- reference branch 預設 = repo 預設分支（`main`）。若 `main` 很久才合併一次，baseline 會卡在很舊的版本，PR 永遠跟舊版比。
- **設定**：Argos 後台 → Project → Settings → reference branch 設為 `dev`（最新整合狀態）。
- 配合 `push: [dev, main]` 觸發，每次合併都會產生新 baseline，PR 即與「上一版」比對。
- 此設定須在 Argos 網站手動操作，無法由程式碼控制。

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
