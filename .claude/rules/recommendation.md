# Recommendations

尚未實作、但建議日後採用的做法。與 `security.md`（強制規範）區分：本檔是「建議」，非硬規則。

---

## 統一錯誤管理（Error Handling）

### 背景：為什麼 log 故意很精簡

Bearer 的 `javascript_lang_logger_leak`（CWE-532）會擋下「把可能含敏感資料的變數寫進 log」。
`bearer.yml` 的 `fail-on-severity` 含 `low`，所以連 LOW 都會擋 PR。
因此 server 端 catch 區塊**只能 log 純靜態字串 / 可證明無敏感資料的值**（生成的 ID、數字 status），
不可 log 整個 `err` 物件或 request payload（name / email / message）。

> 現況：`server/api/contact.post.ts` 的 catch 只 `console.error('[contact] email send failed')`，
> 寄信錯誤的完整原因目前靠 **Resend Dashboard** 查（每封 send 都有 status + 錯誤訊息）。

### 原則：完整錯誤導到「會做 PII scrubbing 的受控 sink」，log 只留關聯 ID

| 完整細節存放處 | 設定成本 | 說明 |
|----------------|---------|------|
| Resend Dashboard | 0（已有） | 寄信錯誤本來就完整記錄，適合 contact-form |
| Sentry / 錯誤追蹤服務 | 中 | 全站統一、完整 stack trace、自動 PII scrubbing、可搜尋 |
| 結構化 console + requestId | 低 | Cloudflare Workers Logs 可見；只放數字 / 生成 ID，不放 payload |

### 建議寫法：Nitro 全域 error hook + requestId

在**單一檔案**統一處理所有 API 錯誤：完整錯誤送追蹤系統、log 只留關聯 ID、route 各自回 generic 訊息。

```ts
// server/plugins/error-handler.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    const requestId = event?.context.requestId ?? crypto.randomUUID()
    // 完整錯誤 → Sentry（自動 scrub PII），不進 console：
    // Sentry.captureException(error, { tags: { requestId } })

    // console 只放可證明無敏感資料的欄位：靜態 tag + 數字 status + 生成 id
    console.error(`api_error id=${requestId} status=${(error as any).statusCode ?? 500}`)
  })
})
```

route 端：`throw createError({ statusCode: 502, message: 'Failed to send message', data: { requestId } })`，
回查時拿 `requestId` 去 Sentry / Workers Logs 搜完整 trace。

**為什麼不會被 Bearer 擋**：log 只有生成 UUID + 數字 status + 靜態字串，無任何 payload；
完整原始錯誤進 Sentry（非 `console.*` logger，且自帶 scrubbing）。

### 接 Sentry 時的注意

- Cloudflare Workers / Pages runtime 要用 `@sentry/cloudflare`（非預設的 `@sentry/nuxt` Node 版），需額外 wiring。
- DSN 放 Cloudflare secret，不進 repo（依 `security.md` §4）。
- 開 `sendDefaultPii: false` 並確認 server-side data scrubbing。

### 觸發時機

目前只有 `contact.post.ts` 一個 API route，靠 Resend dashboard 足夠。
**等 API route 變多**（如 guestbook、search）再實作上述中央 hook，避免每個 route 各寫一套錯誤處理。
