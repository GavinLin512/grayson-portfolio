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
