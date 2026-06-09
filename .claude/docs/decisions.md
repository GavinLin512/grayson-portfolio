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
