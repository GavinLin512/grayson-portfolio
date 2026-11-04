---
title: 給 AI 看的 Artisan 說明書：替 Laravel 專案寫一個 SKILL.md
date: 2026-10-30
tags: [ai, php, laravel]
description: Agent Skills 捐給 Linux Foundation 旗下的 AAIF，正式成為跨廠商標準。先看 Laravel 13 skeleton 自己帶的 AGENTS.md 叫 agent 做了什麼，再照規格寫一個 laravel-conventions skill：Pint、Larastan、測試一次跑完，最後談第三方 skill 的安全。
---

## Skill 變成業界標準了

10 月 22 日，Anthropic 宣布把 **Agent Skills** 捐給 Linux Foundation 旗下的 Agentic AI Foundation（AAIF），也就是之前接手 MCP 的那個基金會。幾個數字：

- 從 2025 年 12 月公開成標準以來，**超過 70 個 agent 平台**支援，包括 ChatGPT、Cursor、GitHub Copilot、VS Code
- 已經有 **100 萬個 skill** 被發布，安裝次數將近 **2.8 億**
- 之後由 Anthropic、Google、OpenAI 等公司的工程師以個人身分共同維護

Skill 的定義簡單到有點好笑：**一個資料夾，裡面放一個 `SKILL.md`**，需要的話再放一些腳本和參考文件。就這樣。

我第一次看到的感想是：這不就是寫給 AI 看的 Artisan command 說明書嗎？這篇就來實際幫一個 Laravel 專案寫一個。

## Skill、AGENTS.md、MCP，到底差在哪

剛開始接觸時我常搞混，整理成一張表：

| | 什麼時候被讀 | 適合放什麼 | Laravel 的類比 |
|---|---|---|---|
| `AGENTS.md` | agent 一啟動就**整份讀進去** | 整個專案都適用的背景知識 | `README.md` / `CONTRIBUTING.md` |
| Skill | 啟動時只讀**名稱和描述**，需要時才讀全文 | 特定任務的流程、規則、腳本 | 一個 Artisan command：`php artisan list` 只看到簽名和描述，執行時才跑 `handle()` |
| MCP server | agent 呼叫工具時 | 連接外部系統（資料庫、API、瀏覽器） | 一個外部服務的 driver |

Skill 最聰明的設計是**漸進式載入**（progressive disclosure），規格書寫得很具體：

1. **Metadata（約 100 tokens）**：所有 skill 的 `name` 和 `description`，在 agent 啟動時就載入
2. **Instructions（建議 < 5000 tokens）**：`SKILL.md` 本文，只有 agent 決定要用這個 skill 時才載入
3. **Resources（需要時）**：`scripts/`、`references/`、`assets/` 裡的檔案，用到才讀

所以你可以裝幾十個 skill，平常只會佔用幾十行描述的 context。這跟 `AGENTS.md`「不管用不用得到，整份都塞進去」很不一樣。

## 先看 Laravel 13 自己帶了什麼

動手寫之前，我先用 `composer create-project laravel/laravel` 開了一個新專案，結果發現 **Laravel 13 的 skeleton 已經內建了 `AGENTS.md` 和 `CLAUDE.md`**（兩份內容一樣，47 行，包在 `<laravel-boost-guidelines>` 標籤裡）。

內容大意是這樣：

1. 先確認有沒有 `php` 和 `composer`
2. 沒有的話，**偵測使用者的作業系統，自己執行安裝指令**：

```sh
# macOS / Linux
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

```powershell
# Windows PowerShell
... iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

3. 接著安裝 Laravel Boost：`composer require laravel/boost --dev`、`php artisan boost:install`
4. Boost 會把這份 `AGENTS.md` **換成針對這個專案產生的指引**，然後叫 agent 重新讀一次 `AGENTS.md`

`php.new` 是 Laravel 官方的安裝腳本，對新手來說這個設計很貼心：clone 下來、打開 agent，環境自己就裝好了。

但站在資安的角度，我讀到這裡心裡有點毛。這份檔案做的三件事：

- 叫 agent 執行從網路下載的腳本（`bash -c "$(curl ...)"`、`iex(...)`）
- 叫 agent 安裝新套件
- 叫 agent 改寫自己的指令檔，然後照新的內容做事

**跟惡意指令檔的攻擊手法，在形式上一模一樣**。差別只在於你信任寫這份檔案的人。[第 5 篇](/blog/2026-11-04-agents-md-hijack-defense)會詳細談一個真實的攻擊案例，到時候你會發現兩者有多像。

我的建議是：個人專案或學習用，留著很方便；**團隊專案**的話，用你們自己審過的內容取代它。那份「叫 agent 去裝 PHP」的指示，在一個所有人都已經裝好 PHP 的團隊裡，留著只是多一個風險。

### 順帶一提：Composer 沒有「最小發布時間」

建這個專案時，我順手看了一下 `composer.lock` 裡的發布時間：`laravel/framework` 本身，還有後面會裝的 `larastan/larastan`、`phpstan/phpstan`，**都是發布不到兩天的版本**。

Composer 很盡責地拿了最新版，但它沒有像 pnpm `minimumReleaseAge` 那樣的設定，可以要求「只裝發布超過幾天的版本」。[第 4 篇](/blog/2026-11-03-github-actions-hardening)會談到這個機制為什麼重要。PHP 這邊目前只能靠 `composer.lock` 加上「升級時看一下發布日期」的紀律。

## 實作：`laravel-conventions` skill

### 放在哪裡

規格本身沒有規定 skill 要放在哪裡，只規定資料夾裡要有什麼。不過官方給 agent 開發者的指南提到，**`.agents/skills/`** 已經成為跨工具共享的慣例；有些工具也會讀自己的原生目錄（例如 `.claude/skills/`）。我放在 `.agents/skills/`，如果你用的工具沒讀這裡，就照它的文件放。

```text
.agents/skills/laravel-conventions/
├── SKILL.md                  # 必要：metadata + 指示
├── references/
│   └── conventions.md        # 命名規則，需要時才讀
└── scripts/
    └── check.sh              # Pint + Larastan + 測試
```

### `SKILL.md`

````markdown
---
name: laravel-conventions
description: Team conventions for this Laravel app — naming for migrations, models, controllers and tests, plus the checks every change must pass (Pint, Larastan, tests). Use when creating or changing PHP code, migrations or tests in this repository, or before saying a task is done.
license: MIT
metadata:
  owner: pulse-team
  version: "1.0"
---

# Laravel conventions

## When to use

Use this skill whenever you add or change PHP code, migrations, or tests in this repository.

## Workflow

1. Read [references/conventions.md](references/conventions.md) before creating new files.
2. Make the change.
3. Run the checks from the repository root:

   ```bash
   bash .agents/skills/laravel-conventions/scripts/check.sh
   ```

4. If a check fails, fix the cause and run the script again. Do not edit `phpstan.neon` or `pint.json`, and do not skip or delete tests, to make a check pass. If you believe a rule is wrong, stop and ask the user.

## Available scripts

- **`scripts/check.sh`** — Runs Pint (`--test`), Larastan and the test suite. Prints one JSON summary line to stdout, tool output to stderr. Run with `--help` for options and exit codes.

## Rules that are easy to miss

- Ask the user before running `composer update` or adding a package. Use `composer install` only.
- Never call `env()` outside `config/`. Read settings through `config()`.
- Migrations are append-only: add a new migration instead of editing one that may already have run.
````

幾個寫的時候想清楚的點：

**`description` 是寫給「比對」用的，不是寫給人看的**。agent 啟動時只看得到名稱和描述，它要靠這一段判斷「現在這個任務該不該用這個 skill」。所以要寫清楚**做什麼**和**什麼時候用**，而且放關鍵字（PHP code、migrations、tests、before saying a task is done）。規格書給的反面例子是 `description: Helps with PDFs.`，太空泛，agent 根本不知道什麼時候該叫它。

**`name` 有嚴格規定**：只能用小寫英數和連字號，不能以連字號開頭或結尾，不能有連續的 `--`，而且**必須跟資料夾名稱一樣**。

**最重要的一條：「不准為了讓檢查通過去改設定或刪測試」**。用過 coding agent 的人應該都看過這種事：PHPStan 報錯，agent 的「修法」是把 level 調低，或在 `phpstan.neon` 加一行 `ignoreErrors`；測試失敗，就把測試標成 skip。這條規則就是在擋這種「讓指標變綠、但問題還在」的行為。

**規則用正面語氣寫**。我原本寫的是「Never run composer update ... without asking」，後來改成「Ask the user before running composer update」。原因在第 5 篇：我做的掃描器把「without asking」標成可疑片語，因為攻擊用的指令檔也很愛用這種句子。正面寫法語意一樣，也不會跟攻擊文字長得像。

**長的規則放 `references/`**。命名規則是一張表，只有 agent 要建立新檔案時才需要，放在 `references/conventions.md`，按需載入：

```markdown
# Naming and structure

| What | Convention | Example |
|------|------------|---------|
| Migration | `create_<table>_table` / `add_<column>_to_<table>_table` | `add_archived_at_to_projects_table` |
| Model | Singular StudlyCase | `Project`, `DeployLog` |
| Controller | Singular + `Controller`, resource methods only | `ProjectController@store` |
| Form request | `<Action><Model>Request` | `StoreProjectRequest` |
| Test | Mirrors the class under test | `tests/Feature/ProjectControllerTest.php` |

- Validation lives in Form Requests, not controllers.
- Every new route needs a feature test that covers the happy path and one failure.
```

### `scripts/check.sh`：寫給 agent 跑的腳本

官方的〈Using scripts in skills〉有幾條很實用的建議，我都照做了：

- **絕對不能互動**：agent 跑在非互動的 shell 裡，任何「按 y 繼續」都會讓它卡死
- **用 `--help` 說明介面**：這是 agent 學會用你腳本的主要方式
- **不同的失敗用不同的 exit code**，並寫在 `--help` 裡
- **stdout 放結構化資料，stderr 放診斷訊息**：agent 可以乾淨地讀結果，需要時再看細節

```bash
#!/usr/bin/env bash
# 依序執行 Pint、Larastan、測試。給 agent 用：不互動、--help 說明介面、
# stdout 只輸出一行 JSON 摘要，各工具的輸出都導到 stderr。
set -uo pipefail

usage() {
  cat <<'USAGE'
Usage: check.sh [--only pint|phpstan|tests]

Runs the repository checks from the project root:
  pint     vendor/bin/pint --test        (code style, no changes made)
  phpstan  vendor/bin/phpstan analyse    (Larastan, config in phpstan.neon)
  tests    php artisan test

stdout: one JSON line, e.g. {"pint":"pass","phpstan":"fail","tests":"pass"}
stderr: full tool output

Exit codes:
  0  all checks passed
  1  at least one check failed
  2  invalid arguments
  3  not run from a Laravel project root (artisan or vendor/ missing)
USAGE
}

only=""
case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  --only) only="${2:-}"
          [[ "$only" =~ ^(pint|phpstan|tests)$ ]] || { usage >&2; exit 2; } ;;
  "") ;;
  *) usage >&2; exit 2 ;;
esac

if [[ ! -f artisan || ! -d vendor ]]; then
  echo "check.sh: run from the Laravel project root after composer install" >&2
  exit 3
fi

declare -A result
failed=0
run() {  # run <name> <command...>
  local name=$1; shift
  [[ -n "$only" && "$only" != "$name" ]] && return
  echo "== $name: $*" >&2
  if "$@" >&2; then result[$name]=pass; else result[$name]=fail; failed=1; fi
}

run pint    vendor/bin/pint --test
run phpstan vendor/bin/phpstan analyse --no-progress --memory-limit=512M
run tests   php artisan test

json="{"; sep=""
for name in pint phpstan tests; do
  [[ -n "${result[$name]:-}" ]] || continue
  json+="${sep}\"$name\":\"${result[$name]}\""; sep=","
done
echo "$json}"
exit "$failed"
```

`pint --test` 只檢查不修改，避免 agent「跑一下檢查」就順手改了一堆檔案。測試用 `php artisan test`，不管你的專案用 PHPUnit 還是 Pest 都能跑（Laravel 13 的 skeleton 預設是 PHPUnit，但 `composer.json` 已經預先放行了 Pest 的 Composer plugin）。

Larastan 要另外裝，加一個最基本的 `phpstan.neon`：

```bash
composer require --dev larastan/larastan
```

```yaml
# phpstan.neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    paths:
        - app/
    level: 5
```

### 實際跑一次

我在 `php:8.4.27-cli` 容器裡執行（剛好是[第 1 篇](/blog/2026-10-29-php2shell-patch-pipeline) PHP2Shell 的修補版）。新專案，全部通過：

```bash
bash .agents/skills/laravel-conventions/scripts/check.sh 2>/dev/null
# {"pint":"pass","phpstan":"pass","tests":"pass"}
# exit=0
```

然後我故意放了一個有三個問題的 class：格式不對、呼叫不存在的方法，再加一個預期值寫錯的測試：

```php
<?php

namespace App\Support;

class DeployWindow
{
    public function minutesLeft(int $closesAt): int
    {
        $now=time();
        return max(0, (int) round(($closesAt - $now) / 60));
    }

    public function label(int $closesAt): string
    {
        return $this->minutesLeft($closesAt) . ' min left' . $this->unknownSuffix();
    }
}
```

stdout 只有一行，agent 一眼就知道哪裡壞了：

```text
{"pint":"fail","phpstan":"fail","tests":"fail"}
exit=1
```

stderr 裡是完整的細節（節錄）：

```text
== pint: vendor/bin/pint --test
    FAIL   ........................................... 28 files, 1 style issue
  ⨯ app/Support/DeployWindow.php concat_space, blank_line_before_statement, b…
== phpstan: vendor/bin/phpstan analyse --no-progress --memory-limit=512M
  15     Call to an undefined method
         App\Support\DeployWindow::unknownSuffix().
 [ERROR] Found 1 error
== tests: php artisan test
  ⨯ open window counts minutes
  Failed asserting that 15 is identical to 10.
  Tests:    1 failed, 3 passed (4 assertions)
```

注意測試那一項：`time() + 900` 是 15 分鐘，**錯的是測試的預期值，不是程式**。這正是 skill 裡那條規則的用意：agent 該做的是修正預期值、並說明為什麼，而不是把測試刪掉或 skip。

錯誤的參數也會照 `--help` 寫的回傳 exit code 2：

```bash
bash .agents/skills/laravel-conventions/scripts/check.sh --only lint
# exit=2
```

### 用官方工具驗證 SKILL.md

規格書提到可以用 `skills-ref` 驗證格式。這個套件在 PyPI 上的名字是 `skills-ref`，但**裝好後的指令叫 `agentskills`**，我找了一下才發現：

```bash
pip install skills-ref==0.1.1
agentskills validate .agents/skills/laravel-conventions
# Valid skill: .agents/skills/laravel-conventions
```

拿一個故意寫錯名稱的 skill 試試：

```bash
agentskills validate badskill/Laravel_Conventions
# Validation failed for badskill/Laravel_Conventions:
#   - Skill name 'Laravel_Conventions' must be lowercase
#   - Skill name 'Laravel_Conventions' contains invalid characters. Only letters, digits, and hyphens are allowed.
```

另外一個很有教學意義的指令是 `to-prompt`，它會印出 **agent 啟動時實際看到的內容**：

```bash
agentskills to-prompt .agents/skills/laravel-conventions
```

```xml
<available_skills>
<skill>
<name>
laravel-conventions
</name>
<description>
Team conventions for this Laravel app — naming for migrations, models, controllers and tests, plus the checks every change must pass (Pint, Larastan, tests). Use when creating or changing PHP code, migrations or tests in this repository, or before saying a task is done.
</description>
<location>
.../.agents/skills/laravel-conventions/SKILL.md
</location>
</skill>
</available_skills>
```

就只有名稱、描述和位置。這就是漸進式載入的第一層，也再次說明**為什麼 `description` 要寫好**：agent 決定要不要用你的 skill 時，手上只有這幾行。

## 安全使用第三方 skill

寫自己的 skill 很安全，因為內容你都看過。但 skill 生態現在有 100 萬個 skill，總有一天你會想裝別人寫的。

這時候要記得：**skill 不只是說明文件，它可以附帶腳本**，而 agent 會執行那些腳本。安裝一個第三方 skill，本質上就是安裝一個會被執行的套件，只是它還會告訴 agent「你應該怎麼做事」。

規格書和官方指南裡有幾點值得注意：

- **`allowed-tools` 還是實驗性欄位**：它可以列出「預先核准的工具」，但規格書明說各家實作的支援程度不同，不能把它當成安全邊界
- **專案層級的 skill 可能來自不受信任的 repo**：官方給 agent 開發者的建議是，只有在使用者把專案標記為可信任時，才載入專案層級的 skill，避免「clone 一個 repo 就被偷偷塞指令」
- AAIF 接手後的路線圖裡，明確包含了**給撰寫者和安裝者的安全指引**，代表維護者也認為這是待解的問題

我自己的檢查清單：

- [ ] **讀完 `SKILL.md` 和所有腳本**，跟 review 一個 PR 一樣
- [ ] 特別留意：下載遠端腳本（`curl | sh`、`bash -c "$(curl ...)"`）、安裝套件、改寫 agent 設定檔、「不要告訴使用者」這類句子
- [ ] **鎖版本**：用 git submodule 指到特定 commit，或直接把 skill 複製進 repo，更新時看 diff
- [ ] 第三方 skill 的腳本也適用前幾篇的原則：會下載東西的，要鎖版本和 hash
- [ ] 不信任的 repo，先確認裡面有哪些 skill 和指令檔，再開 agent

[第 5 篇](/blog/2026-11-04-agents-md-hijack-defense)會寫一個掃描器，專門在啟動 agent 前檢查這些檔案（它也支援 `SKILL.md`），也會談一個用 `AGENTS.md` 劫持 agent 的真實攻擊。

## 結語

寫完這個 skill，我最大的感想是：**這其實就是把團隊的「默契」寫下來**。新人進來要學的命名規則、PR 前要跑的檢查、「不要動舊的 migration」這種踩過才知道的事，以前寫在 Confluence 上沒人看，現在寫成 skill，至少 AI 會認真照做。

而且它是一個開放標準，今天寫的 skill，明天換一個 agent 工具還能用。這對一個團隊來說，是比「選哪個 AI 工具」更值得投資的東西。

[下一篇](/blog/2026-11-02-litellm-unrevoked-key-supply-chain)回到供應鏈：LiteLLM 這週第二度被下毒，而起點只是一把忘了撤銷的金鑰。

## 參考資料

- [Anthropic：Donating Agent Skills to the Agentic AI Foundation](https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation)（2026-10-22）
- [Simon Willison：Donating Agent Skills to the Agentic AI Foundation](https://simonwillison.net/2026/Oct/22/donating-agent-skills/)
- [Agent Skills 規格書](https://agentskills.io/specification)
- [Agent Skills：Using scripts in skills](https://agentskills.io/skill-creation/using-scripts)
- [Agent Skills：How to add skills support to your agent](https://agentskills.io/client-implementation/adding-skills-support)
- [Larastan](https://github.com/larastan/larastan)
- [Laravel Pint](https://laravel.com/docs/pint)
