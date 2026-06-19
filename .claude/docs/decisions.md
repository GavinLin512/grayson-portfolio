# 技術決策紀錄

本文件記錄專案中「為什麼這樣做」的決策與背後推理，供日後回溯。

---

## Comments.vue 為何用 `<ClientOnly>` 包住登入狀態 UI

### 問題

`app/components/Comments.vue` 的 `<ClientOnly>` 只包住「登入狀態相關 UI」
（Sign in 按鈕 vs. 已登入的頭像＋留言框），這塊的狀態來自 `useUserSession()` 的 `currentUser`。
這個 `<ClientOnly>` 是必要的嗎？

### 結論：必要，需保留

關鍵在於 `Comments.vue` 的兩個使用場景的渲染方式：

| 頁面 | 渲染方式 |
|------|----------|
| `app/pages/blog/[slug].vue` | **prerender**（`nuxt.config.ts` 設 `/blog/**` → 靜態 HTML） |
| `app/pages/guestbook.vue` | `ssr: true` |

問題出在 **prerender 的 blog 頁**：

- 靜態 HTML 是 **build 時**產生的，當下沒有任何 request／cookie → `currentUser` 永遠是 `undefined`
  → 烤進 HTML 的一律是「Sign in」按鈕。
- 使用者實際載入頁面時若已登入，client 端 `useUserSession()` 解析出 user → 想渲染「頭像＋留言框」。
- 兩者不一致 → **hydration mismatch**（且所有人拿到的靜態檔都是登出版本）。

`<ClientOnly>` 讓這塊只在 client 渲染，避開 mismatch，也讓登入狀態能正確反映每位訪客。
這是「預渲染 + 認證狀態由客戶端決定」情境下的標準做法。

### 為什麼下面的留言列表不用包 `<ClientOnly>`

`entries` 那段在 `v-if` 外沒有 `ClientOnly`，但它不需要——
因為 `useFetch` 用了 `server: false` + `default: () => []`：

- SSR／prerender 時 `entries` 是 `[]` → 渲染「No comments yet.」
- client 初次 hydration 也是 `[]` → 一致，無 mismatch
- fetch 回來後再 reactive 更新

### 補充：可否拿掉

若想拿掉 `<ClientOnly>`，唯一安全的前提是 blog 頁改成 `ssr: true`
（每次請求由 server 讀 cookie 算出登入狀態）。
但那會放棄 blog 頁的靜態化效益，不划算。維持現狀（保留 `<ClientOnly>`）是正解。

---

## guestbook 截圖測試為何只等登入按鈕、且不可吞掉 timeout

### 問題

guestbook 截圖一度拍到**空白 auth 區塊**（看不到「Sign in with GitHub →」），但下方「No messages yet.」正常。

### 根因

登入按鈕在 `<ClientOnly>` 內、hydration 後才渲染；「No messages yet.」`<p>` 不在 ClientOnly、SSR 即有。
舊版用 OR 等待且吞錯，被 always-SSR 的 fallback 搶先 resolve → 按鈕出現前就截圖，`.catch` 又吞掉 timeout 而假通過：

```ts
// ✗ await page.waitForSelector('a[href*="/auth/login"], p:has-text("No messages")', { timeout: 5000 }).catch(() => {})
```

### 結論

```ts
// ✓ 只等按鈕本身、不吞錯
await page.waitForSelector('a[href*="/auth/login"]', { timeout: 10000 })
```

- 不可與 always-SSR 的 fallback 做 OR（會提前 resolve）。
- 不 `.catch()` timeout：等不到就拋 `TimeoutError` 讓 test 紅燈（hydration 壞了本該失敗，而非上傳空白 baseline）。

### 補充：失敗的預設條件

`waitForSelector` 預設 `state:'visible'`，「不在 DOM」與「在 DOM 但不可見（`display:none`／0 尺寸）」都算失敗。
只需確認存在、不要求可見時才改用 `state:'attached'`；截圖場景要的就是視覺可見，維持預設即可。

### 附帶影響

截圖內容變了但 Argos baseline key 仍是 `"guestbook"`，下次 CI 會有視覺 diff，需到後台核准一次作為新 baseline（屬預期）。

---

## Sitemap：為何用 `@nuxtjs/sitemap` + dynamic source（add-deployment-pipeline）

### 套件選擇

tasks.md 原寫 `nuxt-simple-sitemap`，但它鎖 Nuxt `^3.9.0`，本專案 Nuxt 4.4.6 啟動時會印
`Module ... is disabled due to incompatibility` 而**靜默不產生** `/sitemap.xml`。
改用同作者、改名後支援 Nuxt 4 的 **`@nuxtjs/sitemap` v8**。設定只需 `site.url`。

### 動態內容（blog / projects）的正解

只設 `site.url` 時 sitemap 只有 8 個頂層靜態頁，**blog/project 詳細頁不會自動出現**
（@nuxt/content v3 + CF Pages 組合下 auto-discovery 不生效）。依官方文件用 **dynamic source**：

```ts
// nuxt.config.ts
sitemap: { sources: ['/api/__sitemap__/urls'] }
```

```ts
// server/api/__sitemap__/urls.ts
export default defineSitemapEventHandler(async (event) => {
  const [posts, projects] = await Promise.all([
    queryCollection(event, 'blog').all(),
    queryCollection(event, 'projects').all(),
  ])
  return [...posts, ...projects].map(p => ({ loc: p.path }))
})
```

**關鍵陷阱**：不可 `import { serverQueryContent } from '#content/server'`（content v2 API），
CF Pages bundle 會報 `Cannot resolve "#content/server" ... externals are not allowed`。
content v3 改用 **auto-import 的 `queryCollection(event, 'collection')`**（連同 `defineSitemapEventHandler`
都是 auto-import，零 `import` 行 → 不觸發 externals 解析）。

> 試過的死路：在 `nuxt.config.ts` 用 `fs.readdirSync` 直接讀 `content/` 目錄塞 `sitemap.urls`。
> 能動但繞過官方機制、與 content schema 脫鉤，已棄用。

### XSL 預覽標題顯示 `undefined`

瀏覽器開 `/sitemap.xml` 會套 `@nuxtjs/sitemap` 的 XSL 樣式表，`<h1>` 標題由
`sitemap.xsl.js` 動態讀 **Nuxt Site Config 的 `site.name`**。只設 `site.url`、沒設 `name`
→ `${siteName}` 字串化成 `"undefined"`。補 `site.name` 即可（此 key 也供 OG / 其他 SEO 共用）。

- 此 XSL 由 worker **執行時**產生（dist 無預渲染檔）→ 改 `site.name` **必須重新 build**，worker bundle 才更新。
- XSL 帶 `Cache-Control: max-age`，**瀏覽器會快取**：worker 已更新仍可能看到舊的 undefined。
  驗證用 `curl -s .../__sitemap__/style.xsl | grep '<h1>'`（繞過快取）；瀏覽器端用無痕／`Cmd+Shift+R`。
- 此標題純預覽裝飾，不影響 XML 內容與 Google 解析。

---

## Contact form 為何用 Resend send 而非 inbound/receive

訪客是用 **HTTP 表單**送出，不是寄 email——資料 POST 進來時 server 早就拿到了，**沒有任何 email 需要被「接收」**。
`mail.ts` 的 Resend **send** 只是把已到手的資料主動推一封通知信到站長信箱，方便用現成 inbox 讀 + `reply_to` 回覆。

- **Resend inbound** 解決的是「別人真的寄 email 到某地址、要讓程式處理」：需設網域 MX、收到是 webhook（非可讀信箱），還得自己存/轉寄。用在 contact form 上 = 把自己的資料寄出去再收回來，繞圈且無意義。
- 若需求是「想要 `xxx@grayson512portfolio.dpdns.org` 收件地址」→ 那是 **Cloudflare Email Routing**（免費轉寄到真信箱），與 contact form 無關。
- 替代設計：表單不寄信、直接存 D1 再做後台頁。可行但要多寫 UI，不如推到現成 inbox 簡單——當初的取捨。
