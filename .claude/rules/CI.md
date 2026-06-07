# CI

## Workflows 總覽

| 檔案 | 用途 | 觸發策略 |
|------|------|---------|
| `.github/workflows/argos.yml` | 視覺回歸測試（Argos + Playwright） | push dev/main、或 PR 帶 `run-argos-ci` label（opt-in） |
| `.github/workflows/bearer.yml` | 靜態安全掃描（Bearer CLI SAST） | push dev/main（完整掃描）、所有 PR（diff 掃描） |

Bearer 掃描 PR 時使用 `diff: true` 只掃變更檔案；push 到 `dev`/`main` 時完整掃描。阻擋層級依 `bearer.yml` 的 `fail-on-severity`：`critical`、`high`、`medium`、`low`。

---

# Argos Visual Testing

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

設計目標：**paths 混合式** —— UI 檔案變動自動跑，或手動加 `run-argos-ci` label 強制跑（接住 paths 沒涵蓋的情況）。

判斷邏輯由 `decide` gate job 負責：

```
跑 Argos = push 到 dev/main  OR  UI 檔有變動  OR  PR 帶 run-argos-ci label
```

```yaml
on:
  push:
    branches: [dev, main]              # 合併進整合/正式分支 → 更新 baseline
  pull_request:
    types: [opened, synchronize, reopened, labeled]

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true

jobs:
  decide:                              # 輕量 gate，輸出 run=true/false
    runs-on: ubuntu-latest
    outputs:
      run: ${{ steps.gate.outputs.run }}
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }       # diff 需要 base/head 歷史
      - id: gate
        run: |
          if [ "${{ github.event_name }}" = "push" ] \
             || [ "${{ contains(github.event.pull_request.labels.*.name, 'run-argos-ci') }}" = "true" ]; then
            echo "run=true" >> "$GITHUB_OUTPUT"; exit 0
          fi
          changed=$(git diff --name-only \
            "${{ github.event.pull_request.base.sha }}" \
            "${{ github.event.pull_request.head.sha }}")
          if echo "$changed" | grep -qE \
             '^(app/|content/|public/|tests/)|\.(vue|css)$|^(content|nuxt|tailwind|playwright)\.config\.ts$'; then
            echo "run=true" >> "$GITHUB_OUTPUT"
          else
            echo "run=false" >> "$GITHUB_OUTPUT"
          fi

  argos:
    needs: decide
    if: needs.decide.outputs.run == 'true'
    # ... playwright + argos steps
```

| 事件 | 行為 |
|------|------|
| push 到 `dev` / `main` | 一律跑，產生新 baseline build |
| PR 改了 UI 檔（`app/**`、`*.vue`、`*.css`…）| 自動跑，免 label |
| PR 只改 README / 後端邏輯 | 不跑 |
| 想強制跑（paths 沒接到）| 手動加 `run-argos-ci` |
| 同時掛多個 label | gate 看完整狀態 → 結果永遠正確，**與順序無關** |

### 監看的 UI 路徑

`app/**`、`content/**`、`public/**`、`tests/**`、`*.vue`、`*.css`、
`content.config.ts`、`nuxt.config.ts`、`tailwind.config.ts`、`playwright.config.ts`。

**維護提醒**：日後新增會影響畫面的目錄（如新的 `assets/`）要記得加進 `decide` 的 grep。

### 為什麼用 gate job 而非 `on.paths`

`on.paths` 是「硬過濾」——沒命中就整個 workflow 不跑，無法和 label 做 OR。
改用 gate job 後，判斷依「PR 當下完整的 label 集合與 diff」，與哪個事件觸發無關，
所以多 label 同時掛上也**沒有順序問題**，concurrency 可維持單純的 `head_ref`。

> 若改用現成 action（如 `dorny/paths-filter`）取代手刻 grep，務必 **pin 到 commit SHA**
> （2025 年 `tj-actions/changed-files` 曾遭供應鏈攻擊）。native git diff 版無此風險。

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

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true
```

以來源分支為 key，搭配 `cancel-in-progress: true`，同分支連續觸發只留最新一個 run。

因為「要不要跑」改由 `decide` job 依 PR 完整狀態判斷（非靠觸發事件），
即使多 label 同時掛上、存活的 run 也一定算對，故不需要早期的 label-name key hack。
副作用：多 label 同時掛時仍會看到 `Cancelling ...` 訊息（純視覺雜訊，結果正確）。

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

## 遮罩非確定性區塊（mask）

含動態內容（如 Turnstile iframe）的頁面，須遮罩該區塊避免每次截圖都假性 diff：

```ts
await argosScreenshot(page, "contact", { mask: [page.locator(".cf-turnstile-box")] })
```

給目標元素一個穩定 class 供 mask 鎖定。

> **contact 的 mask 現況（保險用，非必要）**：表單的 Turnstile 用 `execution:'execute'`，挑戰延到送出才跑，**截圖（page load、不按送出）當下 `.cf-turnstile-box` 是 0 高度、無 iframe**，所以畫面上沒有可 diff 的非確定性內容——mask 目前是 no-op。**仍保留**作為保險：萬一日後有人把 `execution:'execute'` 改回 managed/auto，widget 會在載入時出現，mask 還能擋住假性 diff。真正的防線是那個 render 選項，mask 只是備援；因隱形不佔版面，無需再加 `min-h`。

## 重新命名規則

| 操作 | 影響 |
|------|------|
| 改 spec 檔名 | 無影響，Playwright 自動掃描 |
| 移出 `tests/` 目錄 | 測試不執行 |
| 改 `argosScreenshot` 第二個參數 | Argos baseline 脫鉤，視覺比對重置 |
