# Security Rules

本文件涵蓋此專案所有資安相關規範。技術棧：Nuxt 4、Cloudflare Pages、D1（規劃中）。

**自動化掃描**：CI 已整合 Bearer CLI（`.github/workflows/bearer.yml`），所有 PR 自動執行 diff 掃描，push 到 `dev`/`main` 執行完整掃描，涵蓋 critical / high / medium 層級。

---

## 1. XSS（Cross-Site Scripting）

**規則：禁止手動 escape，必須使用受信任的函式庫。**

手刻字串替換（如自訂 `escapeXml` / `escapeHtml`）容易遺漏攻擊向量。

| 輸出格式 | 推薦函式庫 | 使用方式 |
|----------|-----------|---------|
| XML（RSS、Sitemap） | `entities` | `encodeXML(str)` |
| HTML（富文字、使用者輸入） | `sanitize-html` | `sanitizeHtml(str, options)` |

```ts
// ✓ 正確
import { encodeXML } from 'entities'
`<title>${encodeXML(post.title)}</title>`

// ✗ 禁止
str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
```

**高風險位置**：`server/routes/rss.xml.ts`（已修復）、未來的 guestbook 留言渲染。

---

## 2. SQL Injection（D1 資料庫）

**規則：所有 SQL 查詢必須使用 Prepared Statements，禁止字串拼接 SQL。**

D1（`add-d1-database`、`add-guestbook-feature`）上線後適用。

```ts
// ✓ 正確：Prepared Statement
const stmt = db.prepare('SELECT * FROM posts WHERE id = ?').bind(id)

// ✗ 禁止：字串拼接
db.exec(`SELECT * FROM posts WHERE id = ${id}`)
```

---

## 3. 表單輸入驗證（Contact Form、Guestbook）

**規則：所有使用者輸入在 server 端必須驗證型別與長度，不依賴 client 端驗證。**

- 使用 `zod` schema 驗證 request body
- 驗證失敗回傳 `400`，不洩漏 stack trace
- 敏感欄位（email、訊息內容）在存入 DB 前先 sanitize

```ts
// ✓ 正確：server route 驗證
import { z } from 'zod'
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
})
const body = await readBody(event)
const result = schema.safeParse(body)
if (!result.success) throw createError({ statusCode: 400 })
```

---

## 4. 環境變數與 Secrets

**規則：Secrets 只能放 `.env`（已 git-ignore），絕不寫入程式碼或 `.env.example`。**

- `.env.example` 只放變數名稱與說明，值留空
- Cloudflare 的 secrets（API key、D1 binding token）透過 Wrangler 或 Cloudflare Dashboard 設定，不放 repo
- 新增 secret 變數時，同步更新 `.env.example` 的 schema 說明

```bash
# .env.example ✓ 正確
CONTACT_FORM_SECRET=          # Turnstile secret key

# ✗ 禁止
CONTACT_FORM_SECRET=sk_live_abc123
```

---

## 5. HTTP Headers（Cloudflare Pages）

**規則：透過 `dist/_headers`（由 `nuxt.config.ts` routeRules 產生）設定安全 headers。**

建議最低配置（於 `nuxt.config.ts` 的 `routeRules` 或 `headers` 欄位加入）：

| Header | 建議值 |
|--------|--------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

---

## 6. 依賴套件安全

**規則：定期執行 `pnpm audit`，不引入有已知高危漏洞的套件。**

- 新增套件前確認維護狀態與下載量
- 不使用已棄用（deprecated）的套件作為直接依賴
- 手動 escape / sanitize 需求出現時，優先找現有受信任的函式庫，不自行實作
