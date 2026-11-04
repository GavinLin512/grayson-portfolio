---
title: 一把沒撤銷的金鑰，如何讓 LiteLLM 被下毒
date: 2026-11-02
tags: [security, devops, python]
pinned: true
description: 拆解 LiteLLM 1.107.0 供應鏈攻擊：從 5 月一次誤 commit，到 10 月被植入竊密程式的正式版本。為什麼 GitHub CLI token 特別危險、為什麼簽章擋不住，以及實際跑過的 gitleaks、hash 鎖版與 .pth 掃描防線。
---

## 先講結論：這不是什麼高深的 0-day

10 月 21 日，LiteLLM 在 PyPI、Docker Hub 和 GHCR 上發布了 `1.107.0`。這個版本裡面藏了竊密程式和後門。

LiteLLM 是什麼？簡單說就是一個 AI 閘道：你的程式只要串它，就能用同一套 API 打 OpenAI、Anthropic、Bedrock。很多團隊拿它當 LLM 的統一入口，所以它所在的機器上，通常就躺著一堆 API key 和雲端憑證。

PyPI 上架不到兩小時就被隔離，但根據 Wiz 引用的 ClickPy 數據，這段時間還是被下載了大約 **49,000 次**。

我寫 Laravel 十幾年，讀完官方的 root cause analysis 之後，第一個反應是：

> 「欸，這不就是 `.env` 被 commit 上去，大家以為刪掉就沒事那種事嗎？」

對，起點就是這麼樸實。只是這次它一路從一個實驗性專案的設定檔，燒到了數萬台機器的雲端金鑰。這篇我想把整條攻擊鏈拆開來看，每一環都問一句「換成我的專案，擋得住嗎？」最後附上我實際跑過的防線。

## 攻擊鏈：從一次 commit 到一個惡意版本

以下整理自 LiteLLM 10 月 23 日發布的 [root cause analysis](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain)（時間皆為 UTC）：

| 時間 | 發生了什麼 |
|---|---|
| 5/27 | 含 Agent Platform 管理金鑰的 `opencode.json` 被 commit 到公開 repo |
| 5/27 約 3 小時後 | 另一個 commit 刪除檔案，但**金鑰沒有撤銷**，原 commit 仍留在公開歷史中 |
| 10/10 | 攻擊者用這把金鑰呼叫內部 Agent Platform API，拿到組織 owner 的 GitHub CLI token |
| 10/10 | 推送拋棄式分支，讓 CI workflow 把 repo secrets 送到外部 endpoint，又拿到兩位 maintainer 的 token |
| 10/21 | 用 owner 權限覆寫 branch protection，改寫 release workflow，讓它能從仿冒組織 `Berri-AI` 的 fork 建置 |
| 10/21 11:40 | 用 maintainer token 核准 production gate，`1.107.0` 發布到 PyPI、Docker Hub、GHCR |
| 10/21 11:53 起 | 刪除 workflow 紀錄、force-push `main` 掩蓋痕跡 |
| 10/21 12:06 | 社群成員開 issue 指出版本遭竄改，約 13:23 PyPI 隔離該版本 |

注意那個時間差：**金鑰外洩到被利用，中間隔了四個多月**。很多人對「不小心 commit 了 key」的心態是「應該沒人看到吧」，這個案例很直接地告訴你：會有人看到，而且他們很有耐心。

接下來一環一環拆。

## 第一環：刪檔不等於撤銷

官方的說法很誠實：失誤其實 3 小時內就被發現了，也有人記下「這把 key 要撤銷」，但因為人為疏失，沒人真的去做。

這裡有兩個常見誤解，我自己以前也有：

1. **「我刪掉那個檔案了」**：刪檔只是多一個 commit，原本那個 commit 還在歷史裡，任何人 `git log -p` 就看得到。
2. **「那我 force-push 改寫歷史總行了吧」**：也不行。你不知道有誰已經 clone 過、有沒有被 GitHub 的 fork 網路或各種鏡像抓走。而且 secret 掃描機器人通常幾分鐘內就會掃到公開 repo 的新 commit。

所以正確的心態只有一個：**一旦 push 出去，就當它已經外洩，第一件事是讓那把 key 失效**。

## 第二環：為什麼偏偏是 GitHub CLI token

攻擊者用那把管理金鑰呼叫 Agent Platform 的 API，`GET /api/v1/managed_agents/agents` 一打，回傳內容裡就有一個 GitHub token。

問題是這個 token 的來歷。Agent Platform 需要開 PR，所以要設定一個 GitHub token。照理說應該給它一個只能碰特定 repo、只有特定權限的 token，但實際設定的卻是**組織 owner 本人的 GitHub CLI OAuth token**，也就是你在電腦上跑 `gh auth login` 拿到的那個。

這個選擇為什麼致命？我整理了一下常見的三種 GitHub 憑證：

| | GitHub CLI OAuth token | Fine-grained PAT | GitHub App installation token |
|---|---|---|---|
| 權限範圍 | 跟著你的帳號，你能做的它都能做 | 可限定 repo 與個別權限 | 限定安裝的 repo 與 App 宣告的權限 |
| 有效期限 | 長期有效，直到你撤銷 | 可設到期日 | **1 小時**自動過期 |
| 敏感操作的 2FA 重新驗證（sudo mode） | **不會觸發**（官方原話：post-2fa） | 視情況 | 不適用（不是人的帳號）|
| 適合給自動化用嗎 | ❌ | 勉強可以 | ✅ 首選 |

GitHub CLI token 等於是「已經過了 2FA 的你」。攻擊者拿到它，就是拿到 owner 本人，而且 GitHub 不會再跳出任何確認。

更扯的是後面那段：官方的憑證表顯示，`BerriAI/litellm` 的 repo secret `GH_TOKEN` 裡存的，**也是某位 maintainer 的 GitHub CLI token**。也就是說，「把個人 CLI token 塞進 CI secret」這件事不只發生一次。

### 插曲：一開始的說法是「token 從 log 外洩」

事發當天，LiteLLM 在 GitHub issue 上的說法不是這樣的。根據 Wiz 引用的官方留言，他們當時觀察到 Claude Code 在某些情況下會把使用者的 GitHub CLI OAuth token 放進 response body，**如果 response body 被記錄下來，token 就會出現在 LiteLLM 的 log 裡**；他們推測攻擊者是從一個對外暴露的內部 LiteLLM 部署裡，撈 log 拿到 token 的。

不少早期報導都採用了這個說法，我自己追蹤新聞時拿到的週報也是。兩天後的 root cause analysis 推翻了它：request log 顯示，第一個 token 是從 Agent Platform 的 API 拿到的，跟 log 無關。

我從這裡學到兩件事：

1. **事件剛發生時的說法常常會被修正**。寫文章、做決策，盡量等官方的 RCA，引用時也標清楚日期
2. **「token 出現在 log 裡」雖然不是這次的主因，本身仍是真實的風險**。AI gateway 和 agent 的 request / response 很容易夾帶憑證，正式環境不要整包記錄 body，要記的話先遮罩（例如 `ghp_`、`gho_`、`sk-` 開頭的字串），並限制誰能讀 log

換到我們熟悉的場景：這就像你在 Forge 或 Envoyer 上用自己的個人帳號 token 做部署，然後某天那個 token 外洩了。你的權限有多大，攻擊者就有多大。

## 第三環：CI 本身變成竊取管道

拿到 owner token 之後，攻擊者沒有去打任何伺服器。他做的事情簡單到有點諷刺：

1. 在 `BerriAI/litellm` 推一個叫 `ci-tmp-a351cc` 的分支
2. 這個分支上的 workflow 把 6 個 repo secrets POST 到 `webhook.site`
3. 2 分多鐘後，把這次 workflow run 刪掉

整個過程不到 3 分鐘。為什麼可行？因為 **GitHub Actions 對同一個 repo 裡的分支是信任的**：只要你能推分支，那個分支的 workflow 就能讀到 repo 層級的 secrets。

這是我覺得最值得 Laravel 開發者警惕的地方。我們很習慣把 `DEPLOY_KEY`、`FORGE_TOKEN` 直接設成 repo secret，然後覺得「反正只有我們團隊能 push」。但只要有一個人的 token 外洩，所有 repo secrets 就等於一起外洩。

比較好的做法是把敏感 secret 放進 **Environment**，而不是 repo 層級：

- Environment secret 只有在 job 宣告 `environment: production` 時才讀得到
- Environment 可以限定「只有 `main` 分支能部署」（deployment branches），隨便推一個 `ci-tmp-xxx` 分支拿不到
- 可以設 required reviewers，而且要勾 **Prevent self-review**，自己觸發的部署不能自己核准

## 第四環：Branch protection 擋不住 owner

攻擊者要改 release workflow 時，第一次推送其實**被 branch protection 擋下來了**（要求 PR、兩個 check、codeowner 核准）。5 秒後，他換成 owner 的 token，直接覆寫規則推上去。

這就是 branch protection 的盲點：預設情況下，admin 和 owner 可以 bypass。如果你的 repo 用的是 Rulesets，要特別檢查 bypass list 裡有誰。對 release 相關的分支和檔案，最好讓 bypass list 是空的，連 owner 都要走 PR。

另外一個細節：攻擊者在仿冒組織 `Berri-AI`（多了一個 hyphen）建了 fork，release 是從 fork 的 commit 建置的。但這個 commit 可以用 `github.com/BerriAI/litellm/commit/20535d8f` 打開，因為 GitHub 讓 fork 和原 repo 共用 git 物件。乍看之下，你會以為它是原 repo 的 commit。

## 第五環：release 流程「暫時」放寬了

這段我讀到的時候嘆了一口氣。正常情況下，LiteLLM 發布 release 需要「授權的工程師觸發 + 一個綁定辦公室實體裝置的特殊帳號核准」。但事發那週，為了加快發版和 backport，流程暫時放寬成「任意兩位工程師一個觸發、一個核准」。

攻擊者手上剛好有兩位 maintainer 的 token。

我想每個工程師都經歷過「這週比較趕，先放寬一下」。這個案例告訴我們：**安全控制被放寬的那段時間，就是最脆弱的時間**。如果一定要放寬，至少要有到期時間，並且在那段期間加強監控。

## 最反直覺的一點：簽章是真的

官方事後檢討裡有一句話：pipeline 照常 **signed and published** `v1.107.0`。

意思是：這個惡意版本是透過 LiteLLM 自己的正式 release pipeline 建置、簽章、發布的。如果你有在驗證「這個套件是不是從官方 pipeline 發出來的」，答案是：是。

這也是為什麼我在[下一篇](/blog/2026-11-03-github-actions-hardening)會談到的 pnpm `trustPolicy`、npm provenance 這類機制，**擋不住這一種攻擊**：它們檢查的是「發布方式有沒有改變」，而這次發布方式完全沒變，只是 pipeline 本身被劫持了。

能擋住它的，反而是最樸素的東西：**不要裝剛發布兩小時的版本**。後面會實作。

## `.pth`：Python 套件「裝了就中」的原因

再來看惡意碼本身。根據 [Wiz 的分析](https://www.wiz.io/blog/litellm-compromised-steals-credentials)，惡意版本會在 `site-packages` 根目錄放三個檔案：`cook.pth`、`cook.py`、`sitecustomize.py`。

`.pth` 是什麼？Python 啟動時，標準函式庫的 `site` 模組會掃 `site-packages` 裡所有 `.pth` 檔。本來它是拿來「加 import 路徑」用的，但有一條規則：**以 `import` 開頭的行會被直接執行**。

所以你根本不用 `import litellm`。只要在這個環境裡啟動 Python，任何指令都算，包括 `pip` 本身，惡意碼就已經跑完了。

講不如做，用一個無害的模擬檔親眼看看：

```bash
python3 -m venv /tmp/pth-demo
SITE=$(/tmp/pth-demo/bin/python -c "import site; print(site.getsitepackages()[0])")

# 模擬檔：只印出一行字
echo 'import sys; sys.stderr.write("[demo] cook.pth executed before your code\n")' \
  > "$SITE/cook.pth"

/tmp/pth-demo/bin/python -c 'print(1)'
# [demo] cook.pth executed before your code
# 1
```

`print(1)` 跟 LiteLLM 八竿子打不著，`.pth` 還是先跑了。

`sitecustomize.py` 則是 Python 啟動時會自動 import 的另一個模組。兩種機制一起用，確保自己一定會被執行。Wiz 說這是他們所知第一個在野外同時使用這兩種技巧的案例。

被偷的東西清單很長：

- 瀏覽器（Chrome、Firefox、Edge、Safari）的帳密與 cookie
- `~/.aws/` 和 EC2/ECS metadata 裡的 AWS 憑證
- GCP service account、Azure CLI token
- SSH、GPG 私鑰和 shell history
- OpenAI、Anthropic 等 LLM provider 的 API key

它甚至會直接查 LiteLLM Proxy 的 PostgreSQL：`SELECT * FROM "LiteLLM_CredentialsTable"`，把裡面存的上游 provider 金鑰一次拿走。

Wiz 還觀察到，外洩發生約 4.5 小時後，攻擊者就開始拿偷來的 AWS 憑證呼叫 `sts:GetCallerIdentity` 和 `bedrock:ListFoundationModels`。目的很明顯：**盜用你的 LLM 額度（LLMjacking）**。

## 換成 PHP 世界：一樣的錯，換個生態系

如果你覺得「這是 Python 的問題」，可以對照一下：

| LiteLLM 事件 | Laravel / PHP 的對應風險 |
|---|---|
| 金鑰 commit 進公開 repo，只刪檔不撤銷 | `.env` 或 `config/services.php` 寫死 key 被 commit |
| `.pth` 在 Python 啟動時自動執行 | Composer plugin 在 `composer install` 時就會執行（所以 Composer 2.2 起要在 `allow-plugins` 明確允許）|
| 用 owner 的 CLI token 跑自動化 | Forge / Envoyer / CI 用個人帳號 token 部署 |
| repo 層級 secrets 任何分支都讀得到 | 把 `FORGE_TOKEN`、SSH deploy key 設在 repo secrets |
| 從仿冒 fork 建置 release | `composer.json` 的 `repositories` 指向不受信任的 VCS 來源 |

語言不同，模式一模一樣：**長期有效、權限過大的憑證，加上會自動執行的安裝流程**。

## 防線一：讓金鑰進不了 repo，進去了也抓得到

[gitleaks](https://github.com/gitleaks/gitleaks) 是開源的 secret 掃描工具。先重現 LiteLLM 的情境：commit 一個含 token 的設定檔，再用另一個 commit 刪掉。

```bash
mkdir leak-demo && cd leak-demo && git init -q

# 產生一個隨機的「假」GitHub token（格式正確但不是真的）
printf '{\n  "github_token": "ghp_%s"\n}\n' "$(openssl rand -hex 18)" > opencode.json
git add . && git commit -qm "add harness config"
git rm -q opencode.json && git commit -qm "remove config (oops)"

gitleaks dir .              # 只掃目前的檔案
# INF no leaks found

gitleaks git . --redact -v  # 掃整個 git 歷史
# RuleID:      github-pat
# File:        opencode.json
# Commit:      21ea758...
# WRN leaks found: 1
```

看到了嗎？只看目前的檔案：乾淨。掃歷史：抓到。這就是「刪檔不等於撤銷」最直接的證明。

再加上 pre-commit hook，讓 key 根本 commit 不進去：

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.30.1
    hooks:
      - id: gitleaks
```

```bash
pip install pre-commit && pre-commit install

printf 'GITHUB_TOKEN=ghp_%s\n' "$(openssl rand -hex 18)" > .env.local
git add .env.local && git commit -m "add env"
# RuleID: github-pat  File: .env.local
# WRN leaks found: 1
# → commit 被擋下，不會產生
```

不過我想強調：**工具只是輔助，真正重要的是 runbook**。一旦發現外洩，順序必須是：

1. **先撤銷或輪替金鑰**（到 provider 後台讓它失效）
2. 查撤銷前的存取紀錄，評估有沒有被用過
3. 最後才清理 git 歷史，而且要假設已經有人 clone 過

LiteLLM 做了第 3 步的一部分，卻跳過了第 1 步。

## 防線二：鎖版本，連「內容」一起鎖

### Python：`--require-hashes`

只寫 `litellm==1.106.2` 鎖的是版本號；加上 hash，才是連檔案內容一起鎖。用小套件 `six` 示範：

```bash
pip download --no-deps six==1.16.0 -d dl
pip hash dl/six-1.16.0-py2.py3-none-any.whl
# --hash=sha256:8abb2f1d86890a2dfb989f9a77cfcfd3e47c2a354b01111771326f8aa26e0254
```

```text
# requirements.txt
six==1.16.0 --hash=sha256:8abb2f1d86890a2dfb989f9a77cfcfd3e47c2a354b01111771326f8aa26e0254
```

```bash
pip install --require-hashes -r requirements.txt
```

下載到的檔案和 hash 對不上，pip 直接拒絕：

```text
ERROR: THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE.
    Expected sha256 0000000000000000000000000000000000000000000000000000000000000000
         Got        8abb2f1d86890a2dfb989f9a77cfcfd3e47c2a354b01111771326f8aa26e0254
```

如果 requirements 裡有任何一個套件沒寫 hash，`--require-hashes` 模式也會整個拒絕，不會讓你漏掉。實務上不用手算，`pip-compile --generate-hashes` 或 `uv pip compile --generate-hashes` 都能自動產生。PHP 這邊反而比較吃虧：`composer.lock` 雖然有 `dist.shasum` 欄位，但從 GitHub 下載的套件這欄常常是空的，所以 Composer 沒有真正等價的內容鎖定，只能靠 `composer audit` 和「不要急著升級」的紀律補強。

但要老實說 hash 鎖版**防不了什麼**：如果你主動升級到 1.107.0 並重新產生 hash，它照樣會裝。它防的是「版本號沒變、內容被換掉」，以及「沒人注意到的自動升級」。

### 真正擋得住這次攻擊的：最小發布時間

這次的惡意版本只活了兩小時。如果你的安裝流程只接受「發布超過幾天」的版本，幾乎不可能裝到它。新版 pip 已經內建這個選項（我測試用的是 pip 26.2）：

```bash
pip install --uploaded-prior-to P7D litellm
# 只考慮 7 天前就已上傳的版本
```

我實測時，PyPI 上最新的是 1.106.6，加上 `P7D` 後 pip 選了 1.106.5。uv 對應的是 `--exclude-newer`。

代價是緊急的資安修補會晚幾天才拿到，所以遇到需要立刻升級的情況，要能針對單一套件放行。這是取捨，但我認為對大多數團隊來說很划算。

### 用 uv 的話：`uv.lock` 加上相對時間的 `exclude-newer`

如果你的 Python 專案用 uv 管理，上面兩件事它都內建了。在 `pyproject.toml` 加上：

```toml
[tool.uv]
# 只解析 7 天前就已發布的版本（相對時間）
exclude-newer = "7 days"
```

`uv add` 之後產生的 `uv.lock`，每個檔案都記了 hash 和上傳時間，相對時間也被記成 `P7D`：

```toml
exclude-newer-span = "P7D"

[[package]]
name = "six"
version = "1.17.0"
wheels = [
    { url = "https://files.pythonhosted.org/.../six-1.17.0-py2.py3-none-any.whl", hash = "sha256:4721f391ed90541fddacab5acf947aa0d3dc7d27b2e1e8eda2be8970586c3274", size = 11050, upload-time = "2024-12-04T17:35:26.475Z" },
]
```

CI 裡用 `uv sync --locked` 安裝。如果有人改了 `pyproject.toml` 卻沒更新 lockfile，它會直接失敗，不會偷偷重新解析：

```bash
uv sync --locked
# error: The lockfile at `uv.lock` needs to be updated, but `--locked` was provided.
```

這就是 Python 版的 `composer install` 對上 `composer update`。

### Docker：用 digest，不要用 tag

這次被污染的 tag 包括 `v1.107.0`、`latest`、`main-latest`、`main-stable`。tag 只是一個可以被改指向的標籤，`latest` 更是天天在變。要鎖住內容，就要用 digest：

```bash
docker buildx imagetools inspect ghcr.io/berriai/litellm:v1.106.2
# Digest: sha256:7294b90f868c5c38c99b83021c7ba46f9b439e95f8e32964c925c7d2563a03f7
```

```yaml
# docker-compose.yml
services:
  litellm:
    image: ghcr.io/berriai/litellm:v1.106.2@sha256:7294b90f868c5c38c99b83021c7ba46f9b439e95f8e32964c925c7d2563a03f7
```

tag 和 digest 同時寫的時候，Docker 以 digest 為準，tag 只是寫給人看的。

## 防線三：在 CI 裡掃描 Python 啟動 hook

最後寫一支小腳本，列出所有會在 Python 啟動時自動執行的東西。

這裡我踩了一個坑，值得分享：**掃描器本身也是 Python，它啟動時也會觸發 `.pth`**。我第一版直接跑，結果掃描器自己先把模擬的 `cook.pth` 執行了一次。

解法是用 `python -S` 執行：`-S` 代表不載入 `site` 模組，`.pth` 就不會被處理。但這又帶來第二個坑：不載入 `site` 的話，Python 也不會讀 venv 的 `pyvenv.cfg`，`sys.prefix` 會指向系統 Python，結果掃錯地方。所以要自己從執行檔位置推回 venv 根目錄：

```python
#!/usr/bin/env python3
"""列出 Python 啟動時會自動執行的程式碼：.pth 中的 import 行、sitecustomize / usercustomize。

用法：python3 -S -I scan_startup_hooks.py [--allow 檔名 ...]
  務必加 -S：不載入 site，掃描時就不會先執行到可疑的 .pth。
回傳碼：發現未列入 allowlist 的項目時為 1（可直接放進 CI）。
"""
import argparse
import site
import sys
from pathlib import Path

# 常見、可預期的 .pth（setuptools、virtualenv、editable install）
DEFAULT_ALLOW = {"distutils-precedence.pth", "zz-distutils-precedence.pth", "_virtualenv.pth"}
HOOK_MODULES = ("sitecustomize.py", "usercustomize.py")


def site_dirs() -> list[Path]:
    # -S 模式下 site 不會處理 pyvenv.cfg，sys.prefix 仍指向系統 Python，
    # 所以自己從執行檔位置找出 venv 根目錄
    prefixes = [sys.prefix]
    venv_root = Path(sys.executable).parent.parent
    if (venv_root / "pyvenv.cfg").exists():
        prefixes.insert(0, str(venv_root))
    dirs = set(site.getsitepackages(prefixes))
    if site.ENABLE_USER_SITE:
        dirs.add(site.getusersitepackages())
    return sorted(Path(d) for d in dirs if Path(d).is_dir())


def scan(allow: set[str]) -> list[str]:
    findings = []
    for d in site_dirs():
        for pth in sorted(d.glob("*.pth")):
            if pth.name in allow or pth.name.startswith("__editable__"):
                continue
            for no, line in enumerate(pth.read_text(errors="replace").splitlines(), 1):
                # site.py 只會「執行」以 import 開頭的行，其餘行視為路徑
                if line.lstrip().startswith(("import ", "import\t")):
                    findings.append(f"[pth]  {pth}:{no}: {line.strip()[:120]}")
        for name in HOOK_MODULES:
            if (d / name).exists():
                findings.append(f"[hook] {d / name}")
    return findings


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--allow", nargs="*", default=[], help="額外允許的 .pth 檔名")
    args = p.parse_args()
    findings = scan(DEFAULT_ALLOW | set(args.allow))
    print(f"python: {sys.executable}")
    for f in findings:
        print(f)
    print(f"{len(findings)} 個需要人工確認的啟動 hook")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
```

在前面放了模擬 `cook.pth` 與 `sitecustomize.py` 的 venv 裡執行：

```bash
/tmp/pth-demo/bin/python -S -I scan_startup_hooks.py
# [pth]  .../site-packages/cook.pth:1: import sys; sys.stderr.write(...)
# [hook] .../site-packages/sitecustomize.py
# 2 個需要人工確認的啟動 hook
# (exit code 1)
```

輸出裡**沒有** `[demo] cook.pth executed`，代表這次掃描沒有觸發它。

放進 CI 的方式很簡單：`pip install` 之後加一個 step 跑這支腳本，exit code 不是 0 就讓 job 失敗；確認過沒問題的 `.pth` 再加進 `--allow`。

## 如果你是維護者：保護自己的 release 流程

上面三道防線是「使用者」的視角。如果你自己也有發布套件或 Docker image，LiteLLM 的教訓可以整理成一張檢查表：

- [ ] 自動化一律用 **GitHub App** 或 fine-grained PAT，絕不用個人的 `gh` CLI token，更不要把它存成 secret
- [ ] 發布到 PyPI / npm 改用 **trusted publishing（OIDC）**，CI 裡不存長期有效的發布 token。但要記得它防的是「token 被偷去別處發布」，**擋不住 pipeline 本身被劫持**，這次就是後者
- [ ] log 裡不要出現 token：request / response body 不整包記錄，必要時先遮罩
- [ ] 發布用的 secret 放在 **Environment**，限定只有 `main` 或 release tag 能使用
- [ ] Environment 設 required reviewers，並開啟 **Prevent self-review**
- [ ] release 分支的 Rulesets **不留 bypass**，連 owner 都要走 PR
- [ ] 安全控制如果要暫時放寬，要寫明到期時間並加強監控
- [ ] 定期看 organization audit log 裡的「bypass branch protection」與「workflow run deleted」事件，這次攻擊兩樣都有

## 如果你裝過 1.107.0

依照 LiteLLM 官方[事件公告](https://docs.litellm.ai/blog/security-incident-oct-21-2026)與 Wiz 的建議：

- [ ] 檢查 `site-packages` 是否有 `cook.pth`、`cook.py`、`sitecustomize.py`，或 `/tmp/.pc_once_*` 標記檔
- [ ] 檢查網路紀錄是否連線過 `litellm[.]dev`（仿冒網域，官方是 `litellm.ai`）
- [ ] **假設這台機器能存取的所有憑證都已外洩**：雲端金鑰、LLM API key、資料庫連線字串、SSH key，全部輪替
- [ ] 若 LiteLLM Proxy 有連 PostgreSQL，裡面存的上游 provider 金鑰也要輪替
- [ ] 檢查 AWS CloudTrail 有沒有異常的 `sts:GetCallerIdentity`、`bedrock:ListFoundationModels` 呼叫
- [ ] 重建受影響的環境，不要只是升級套件，因為惡意碼可能早就執行過了

## 結語

回頭看整條攻擊鏈，每一環單獨看都很常見：誤 commit 金鑰、自動化用了權限過大的 token、CI 能讀所有 secrets、owner 可以 bypass branch protection、release 審核為了趕進度暫時放寬。可怕的是它們剛好串在一起。

身為正在從 Laravel 走向 DevOps 的開發者，我從這次事件帶走四件事：

1. **金鑰外洩的處理順序是撤銷 → 調查 → 清理**，絕對不能反過來
2. **自動化的憑證要最小權限、會過期**：GitHub App 優先，個人 CLI token 免談
3. **鎖版要連內容一起鎖**：hash、digest、最小發布時間，三者疊加使用
4. **簽章和 provenance 證明的是「從哪裡來」，不是「安全」**

[下一篇](/blog/2026-11-03-github-actions-hardening)會開一個全新的 Vite + React 專案，照我平常的習慣把 CI 配好，再實際跑一次 zizmor，看看「正常」的 CI 有多少洞。

## 參考資料

- [LiteLLM：The attack chain behind the v1.107.0 LiteLLM release](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain)（2026-10-23）
- [Wiz：LiteLLM Compromised, Steals Credentials](https://www.wiz.io/blog/litellm-compromised-steals-credentials)（2026-10-21）
- [The Register：LiteLLM supply chain attack started with an exposed master key](https://www.theregister.com/security/2026/10/26/litellm-supply-chain-attack-started-with-an-exposed-master-key/5305544)（2026-10-26）
- [Python 文件：site — Site-specific configuration hook](https://docs.python.org/3/library/site.html)
- [GitHub 文件：Sudo mode](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/sudo-mode)
- [gitleaks](https://github.com/gitleaks/gitleaks)
