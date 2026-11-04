# agent-scan

啟動 coding agent（Codex、Claude Code、Cursor…）之前，先列出 agent 會讀的指令檔 / 設定檔，並標出可疑內容。
同一個 CLI 用 Python、Go、TypeScript 各寫一次，三者輸出逐字相同。說明文章見 journal 的〈你的 AI 助手會讀 Downloads 裡的 AGENTS.md〉。

> 這是本機用的小工具，不會部署到網站上。

## 使用

```bash
python3 -I py/agent_scan.py [PATH]          # Python 3.10+
node ts/agent-scan.ts [PATH]                # Node 22.18+（內建 type stripping，不用編譯）
(cd go && go build -o agent-scan .) && go/agent-scan [PATH]
```

回傳碼：有 HIGH / MEDIUM 為 1，否則 0；PATH 不存在為 2。

## 規則

| 規則 | 嚴重度 | 內容 |
|------|--------|------|
| `instruction-file` / `config-file` | INFO | 列出 agent 會讀的檔案 |
| `risky-location` | HIGH | 指令檔位於 `Downloads` 資料夾 |
| `invisible-unicode` | HIGH | 零寬字元、bidi 控制字元、Unicode Tag 字元（會解碼出藏起來的 ASCII）|
| `dangerous-command` | HIGH | `curl \| sh`、`base64 -d \| sh`、`npm install -g`、`Invoke-Expression` |
| `agent-config-tamper` | HIGH | 提到 agent 設定檔或權限繞過（`approval_policy`、`bypassPermissions`…）|
| `hidden-html-comment` | MEDIUM | 指令檔裡含文字的 HTML 註解（render 後看不到）|
| `instruction-override` | MEDIUM | 「ignore previous instructions」「do not tell the user」等 |
| `mcp-unpinned-package` | MEDIUM | MCP 設定用 `npx` / `bunx` / `uvx` 執行沒鎖確切版本的套件 |

## 測試

```bash
./run-all.sh                     # 產生 fixtures 到暫存目錄，三種語言交叉比對
./run-all.sh /path/to/project    # 掃指定目錄並比對三者輸出
(cd py && python3 -m unittest)
(cd go && go test ./...)
(cd ts && node --test)
```

fixtures 含模擬的 prompt injection 文字，所以只由 `fixtures/make_fixtures.py` 產生到暫存目錄，
不 commit 進 repo；產生器裡的注入文字也以 base64 存放，避免在這個 repo 工作的 agent 讀到明文。

## sandbox/

把 agent 關進 Docker：唯讀根檔案系統、非 root、capabilities 全清、只掛載專案目錄，
對外只能經過 Squid allowlist proxy。驗證：`PROJECT_DIR=/path/to/project ./sandbox/verify.sh`
（專案目錄需可被 uid 1000 寫入）。
