---
title: 一把沒撤銷的金鑰，如何讓 LiteLLM 被下毒
date: 2026-11-03
tags: [security, devops, python]
pinned: true
description: 拆解 LiteLLM 1.107.0 供應鏈攻擊：從 5 月一次誤 commit，到 10 月被植入竊密程式的正式版本。附上可直接執行的 gitleaks、hash 鎖版與 .pth 掃描防線。
---

## 為什麼這件事值得 PHP 開發者在意

LiteLLM 是很多團隊用來統一串接 OpenAI、Anthropic、Bedrock 的 AI 閘道。10 月 21 日，它在 PyPI 和 Docker Hub、GHCR 上發布了一個被植入竊密程式的正式版本 `1.107.0`。PyPI 上架不到兩小時就被隔離，但根據 Wiz 引用的 ClickPy 數據，這段時間仍被下載了約 **49,000 次**。

我寫了十幾年 Laravel，看完官方的事後檢討，第一個反應是：「這不就是 `.env` 被 commit 上去，然後大家以為刪掉就沒事了嗎？」

攻擊的起點不是什麼高深的 0-day，而是一個所有語言的開發者都犯過的錯。只是這次，它一路從一個實驗性專案的設定檔，延燒到數萬台機器的雲端金鑰。

## 事件時間線：從一次 commit 到一個惡意版本

以下整理自 LiteLLM 10 月 23 日發布的 [root cause analysis](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain)（時間皆為 UTC）：

| 時間 | 發生了什麼 |
|---|---|
| 5/27 | 含 Agent Platform 管理金鑰的 `opencode.json` 被 commit 到公開 repo |
| 5/27 約 3 小時後 | 另一個 commit 刪除檔案，但**金鑰沒有撤銷**，原 commit 仍留在公開歷史中 |
| 10/10 | 攻擊者用這把金鑰呼叫內部 Agent Platform API，拿到組織 owner 的 GitHub CLI token |
| 10/10 | 推送拋棄式分支，讓 CI workflow 把 repo secrets 送到外部 endpoint，取得另外兩位 maintainer 的 token |
| 10/21 | 用 owner 權限覆寫 branch protection，改寫 release workflow，讓它能從仿冒組織 `Berri-AI` 的 fork 建置 |
| 10/21 11:40 | 用 maintainer token 核准 production gate，`1.107.0` 發布到 PyPI、Docker Hub、GHCR |
| 10/21 11:53 起 | 刪除 workflow 紀錄、force-push `main` 掩蓋痕跡 |
| 10/21 12:06 | 社群成員開 issue 指出版本遭竄改，約 13:23 PyPI 隔離該版本 |

幾個值得停下來想的細節：

- **刪檔不等於撤銷。** 5 月那次失誤其實很快就被發現，也有人記下「這把金鑰需要撤銷」，但因為人為疏失沒人去做。四個多月後，這把金鑰依然有效。
- **權限給錯了。** Agent Platform 需要一個 GitHub token 來開 PR，但設定的不是限定 repo 與權限的 fine-grained PAT，而是**組織 owner 的 GitHub CLI OAuth token**。官方特別指出，這類 token 沒有 scope 限制，也不會觸發 GitHub 敏感操作的 2FA 重新驗證。
- **CI 本身變成竊取管道。** 拿到 owner 權限後，攻擊者不需要入侵任何伺服器，只要推一個分支，讓 CI workflow 把 secrets POST 出去，再刪掉 run 紀錄。
- **Branch protection 擋不住 owner。** 推送到 `main` 一開始被 branch protection 拒絕，但 owner token 可以直接覆寫規則。

## `.pth` 檔：Python 套件「裝了就中」的原因

根據 [Wiz 的分析](https://www.wiz.io/blog/litellm-compromised-steals-credentials)，惡意版本會在 `site-packages` 根目錄放三個檔案：`cook.pth`、`cook.py`、`sitecustomize.py`。

關鍵在 `.pth`。Python 啟動時，`site` 模組會讀取 `site-packages` 裡所有 `.pth` 檔，其中**以 `import` 開頭的行會被直接執行**。也就是說，你根本不用 `import litellm`，只要在這個環境裡跑任何 Python 指令，惡意碼就已經執行了，連 `pip` 本身也不例外。

我們可以用一個無害的模擬檔親眼確認：

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

`print(1)` 跟 LiteLLM 毫無關係，但 `.pth` 還是先跑了。另一個 `sitecustomize.py` 也是 Python 啟動時會自動 import 的模組，等於一次用兩種機制確保自己被執行。Wiz 表示，同時使用這兩種技巧，是他們所知第一個在野外被記錄到的案例。

竊密程式蒐集的範圍包括瀏覽器的帳密與 cookie、`~/.aws/` 與 EC2/ECS metadata 中的 AWS 憑證、GCP service account、Azure CLI token、SSH 私鑰，以及 OpenAI、Anthropic 等 LLM provider 的 API key。它甚至會直接查詢 LiteLLM Proxy 的 PostgreSQL，把裡面存的上游 provider 金鑰一次拿走。

## 對照 PHP 世界：同樣的錯，換個生態系

如果你覺得「Python 生態才會這樣」，可以對照一下 Laravel 專案：

| LiteLLM 事件 | Laravel / PHP 的對應風險 |
|---|---|
| 金鑰 commit 進公開 repo，只刪檔不撤銷 | `.env` 或 `config/services.php` 寫死 key 被 commit |
| `.pth` 在 Python 啟動時自動執行 | Composer plugin 在 `composer install` 時就會執行（所以 Composer 2.2 起要在 `allow-plugins` 明確允許）|
| 用權限過大的 owner token 跑自動化 | Forge / Envoyer / CI 用個人帳號的 token 部署 |
| 從仿冒 fork 建置 release | `composer.json` 的 `repositories` 指向不受信任的 VCS 來源 |

差別只在語言，模式完全相同：**一個長期有效、權限過大的憑證，加上會自動執行的安裝流程。**

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

這就是「刪檔不等於撤銷」最直接的證明：檔案已經不在了，但歷史裡的金鑰任何人都能撈出來。

接著加上 pre-commit hook，讓金鑰在 commit 之前就被擋下：

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

**最重要的一步不是工具，而是 runbook。** 一旦掃到外洩，順序必須是：

1. **先撤銷或輪替金鑰**（到 provider 後台讓它失效）
2. 確認撤銷前的存取紀錄，評估是否已被使用
3. 最後才清理 git 歷史（而且要假設已經有人 clone 過）

LiteLLM 做了第 3 步的一部分，卻跳過了第 1 步。

## 防線二：鎖定版本，連「內容」一起鎖

### Python：`--require-hashes`

只寫 `litellm==1.106.2` 只鎖了版本號；加上 hash，等於連檔案內容一起鎖。以下用小套件 `six` 示範：

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

如果下載到的檔案和 hash 不符，pip 會直接拒絕：

```text
ERROR: THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE.
    Expected sha256 0000000000000000000000000000000000000000000000000000000000000000
         Got        8abb2f1d86890a2dfb989f9a77cfcfd3e47c2a354b01111771326f8aa26e0254
```

實務上不需要手動算 hash，`pip-compile --generate-hashes` 或 `uv pip compile --generate-hashes` 都能自動產生。

要特別說清楚 hash 鎖版**防不了什麼**：如果你主動升級到 1.107.0 並重新產生 hash，它照樣會裝。它防的是「版本號沒變、內容卻被換掉」，以及「沒人注意到的自動升級」。

### 擋住「剛發布就中毒」的版本

這次的惡意版本只活了不到兩小時。如果你的安裝流程只接受「發布超過幾天」的版本，就幾乎不可能裝到它。新版 pip 已經內建這個選項（我測試用的是 pip 26.2）：

```bash
pip install --uploaded-prior-to P7D litellm
# 只考慮 7 天前就已上傳的版本
```

我實測時，PyPI 上最新的是 1.106.6，加上 `P7D` 後 pip 選了 1.106.5。uv 也有對應的 `--exclude-newer`。代價是你會晚幾天拿到修補版本，所以遇到需要緊急升級的資安更新時，要能針對單一套件放行。

### Docker：用 digest，不要用 tag

這次被污染的 tag 包含 `v1.107.0`、`latest`、`main-latest`、`main-stable`。tag 是可變的指標，`latest` 更是隨時會被指向新的映像檔。改用 digest 才能鎖定確切的內容：

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

同時寫 tag 和 digest 時，Docker 以 digest 為準，tag 只是方便人類閱讀。

## 防線三：在 CI 裡掃描 Python 啟動 hook

最後，寫一支小腳本列出所有會在 Python 啟動時自動執行的程式碼。重點是**掃描器本身不能被觸發**，所以要用 `python -S` 執行（不載入 `site`，`.pth` 就不會被處理）：

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

注意輸出裡**沒有** `[demo] cook.pth executed`，代表掃描過程沒有觸發它。我第一版沒加 `-S`，掃描器自己就先把 `.pth` 執行了一次，這個坑值得記下來。

放進 CI 的方式很簡單：在 `pip install` 之後加一個 step 執行這支腳本，exit code 非 0 就讓 job 失敗，再把確認過的 `.pth` 加進 `--allow`。

## 如果你裝過 1.107.0

依照 LiteLLM 官方[事件公告](https://docs.litellm.ai/blog/security-incident-oct-21-2026)與 Wiz 的建議：

- [ ] 檢查 `site-packages` 是否有 `cook.pth`、`cook.py`、`sitecustomize.py`，或 `/tmp/.pc_once_*` 標記檔
- [ ] 檢查網路紀錄是否連線過 `litellm[.]dev`（仿冒網域，不是官方的 `litellm.ai`）
- [ ] **假設這台機器能存取的所有憑證都已外洩**：雲端金鑰、LLM API key、資料庫連線字串、SSH key，全部輪替
- [ ] 若 LiteLLM Proxy 有連 PostgreSQL，裡面存的上游 provider 金鑰也要輪替
- [ ] 檢查 AWS CloudTrail 是否有異常的 `sts:GetCallerIdentity`、`bedrock:ListFoundationModels` 呼叫（Wiz 觀察到攻擊者在外洩約 4.5 小時後開始驗證憑證，目的是盜用 LLM 額度）
- [ ] 重建受影響的環境，不要只是升級套件，因為惡意碼可能早已執行過

## 結語

回頭看整條攻擊鏈，每一個環節單獨看都不算罕見：誤 commit 金鑰、自動化用了權限過大的 token、CI 能存取 secrets、release 流程為了趕進度暫時放寬審核。可怕的是它們串在一起。

身為正在從 Laravel 走向 DevOps 的開發者，我從這次事件帶走三件事：

1. **金鑰外洩的處理順序是撤銷 → 調查 → 清理**，不是反過來
2. **自動化用的憑證要最小權限、有期限**，絕對不要用個人帳號的 owner token
3. **鎖版要連內容一起鎖**：hash、digest、最小發布時間，三者能疊加使用

下一篇會延續這個主題，談 GitHub Actions 本身的加固：tag 為什麼不可靠、`permissions` 怎麼設，以及如何用這些手法保護一個 Laravel + Vite 專案。

## 參考資料

- [LiteLLM：The attack chain behind the v1.107.0 LiteLLM release](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain)（2026-10-23）
- [Wiz：LiteLLM Compromised, Steals Credentials](https://www.wiz.io/blog/litellm-compromised-steals-credentials)（2026-10-21）
- [The Register：LiteLLM supply chain attack started with an exposed master key](https://www.theregister.com/security/2026/10/26/litellm-supply-chain-attack-started-with-an-exposed-master-key/5305544)（2026-10-26）
- [Python 文件：site — Site-specific configuration hook](https://docs.python.org/3/library/site.html)
- [gitleaks](https://github.com/gitleaks/gitleaks)
