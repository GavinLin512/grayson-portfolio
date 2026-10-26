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

---

## 首頁時針與星座為何在自動化（Argos）下要凍結

### 問題

首頁星盤的時針指向**真實時刻**、星座線由 canvas 逐段畫出再淡去。這兩者都依賴時間 / 計時器：
CSS 動畫可被 Playwright 的 `animations: 'disabled'` 快轉到終態，但 **JS 驅動的內容不會**。
不處理的話，Argos 每次截圖時針角度不同、星座畫到不同進度 → 首頁每次都假性 diff。

### 做法

與光塵 / 流星 / 開場一致，以 `navigator.webdriver` 偵測自動化並走確定性路徑：

- 時針：不呼叫 `setHand()`，停在 `rotate(0deg)`（XII）。
- 星座：不跑 rAF 狀態機，改單次以 0.18 alpha 靜態畫出三組（reduced-motion 同此路徑）。
- 光塵、流星、開場：既有行為，同樣略過。

一般使用者（含 `prefers-reduced-motion`）仍看到**真實時刻**的時針——reduced-motion 只關掉緩動，不該連資訊一起關。

### 驗證

模擬 Argos 條件（`navigator.webdriver = true`、`page.screenshot({ animations: 'disabled' })`）
於 `.qc-play` 之後分三個時間點連拍，三張 SHA-1 相同。

> 注意：驗證**一般使用者體驗**時，Playwright 預設啟動會讓 `navigator.webdriver = true`，JS 特效全被略過、看不到動態。
> 需 `ignoreDefaultArgs: ['--enable-automation']` + `--disable-blink-features=AutomationControlled`。

---

## 手機版 nav / footer 為何收成 footer 抽屜

### 問題

- 原本 header 的 7 個連結加控制區約 950px，完全沒有 RWD：390px 被截斷，768px 也會。
- guestbook 只在 footer 有入口，不在 `navItems`。
- 首頁用 `default` layout（`h-screen overflow-hidden`），多一列或多一條底部列都會直接吃掉 hero 高度。

### 做法

- 斷點用 `lg`（1024px）。`lg` 以上桌機 markup 完全不動（Argos 只截桌機 viewport，基準圖不受影響）。
- 手機版 header 只留 logo 與搜尋；footer 變成 sticky 底欄（目前頁名稱 + 實心 `menu` 膠囊），點開向上展開目錄：8 頁（含 guestbook）、EN、深淺色。
- 評估後放棄的：全螢幕覆蓋層（換頁要點兩次）、橫向捲動第二列（首頁多吃約 76px）、當前頁選擇器（頁碼與 PageHeader 對不上，about / journey 原本就重複為 06）、底部 5 欄導覽（像 app，不像文件）。
- 此方案最大風險是入口藏在一次點擊後，所以底欄用 paper 底色、實心膠囊、並讓箭頭在載入後上浮三次（用 `translate`，可與開啟時的 `rotate` 疊加）。
- `default.vue` 的 `h-screen` 改 `h-dvh`，避免 iOS 網址列蓋住底欄。

### 陷阱

- Teleport 到 `body` 的內容**不繼承** layout 根節點的 `text-ink`，暗色下文字會變黑。傳送出去的容器要自己加 `text-ink`。
- `bg-ink/30`、`border-ink/60` 這類透明度修飾詞對 `var(--x)` 色票**不會產生 class**（`tailwind.config.ts` 的色票是裸 `var()`，沒有 `<alpha-value>`）。遮罩改用 `bg-black opacity-30`。既有的 `SearchModal` 遮罩與 header 的 `kbd` 邊框有同樣問題，尚未修。
- 範本裡直接使用自動匯入的函式／常數不可靠（新增 composable 後曾出現 `_ctx.padNum is not a function`），要在 `<script setup>` 明確 import。
- 選單開啟時鎖背景捲動；換頁、按 Esc、視窗放大到桌機寬度都要關閉（`useDisclosure`）。點到目前所在頁的連結不會換頁，所以連結要自己 `@click="close"`。

### 尚未處理

開啟時的焦點鎖定、關閉後還原焦點。

---

## 桌機版調色盤：可拖曳 chip，預設在右下角

### 問題

- 原本 `fixed right-[60px] bottom-[112px]`：首頁壓到右下角的頁框角飾（角飾是 84px，註解還寫 72px），內容頁則浮在文字上，沒有對齊任何東西。
- 後來的 hover 扇形（放在 header 右側）要 hover 才出現，不直覺，所以改成常駐的 chip。

### 做法

- `ink/Chip.vue`：一顆小膠囊顯示目前墨水名稱，點開橫向展開墨色與清除；可拖曳，吸附左右邊，位置記在 `localStorage['ink-chip']`。`InkPen` 仍是全域 `fixed`（畫布與筆跡要跨頁保留）。
- 預設位置（`.is-home`，`y == null`，由 CSS 決定）：所有寬度都是 `right:40px; bottom:156px`。`right:40px` 是為了讓開首頁頁框的右緣線與刻度（24px 加刻度），`bottom:156px` 讓開 footer 與頁框底部的裝飾。
- 曾試過兩個預設位置，都被放棄：
  - header 右端（與 Search 同高，`SiteHeader` 留空位）：1024px 時 header 只剩約 69px 餘裕放不下 chip，要加寬度門檻與「被拖走就釋放空位」的邏輯。
  - 右側、與首頁小字「portfolio of grayson」同高（`top:200px`）：1280 寬的 `/about` 會壓到標題尾端。
- 橡皮擦（`useInk` 的 `eraser`，chip 的 `eraser` 按鈕與墨色同屬一個 radiogroup，選墨色即關掉橡皮擦）：固定 24px 直徑，擦過的任何位置都清掉。每一道擦痕都記進 `strokes`（`erase: true`）並依序重播，不能只在畫布上用 `destination-out` 擦掉就算。原因：`onDown` / `endStroke` 會加減 `<html>` 的 `ink-noselect` class，`MutationObserver` 因此在每次按下、放開都 `redrawPerm()`，再加上換主題與縮放，只擦像素的話下一次點擊就會把墨跡重畫回來。
  - 每次擦都包在 `save()` / `restore()`，`destination-out` 不能漏到後面的畫筆，否則之後的筆會變成橡皮擦。
  - 橡皮擦沒有懸停拖尾與墨點：游標移動不留軌跡，單擊擦一個圓點（也記成一道擦痕）。
  - 頁面沒有可見游標，所以橡皮擦用一個同寬的圓環當游標、隱藏筆的圖示；chip 的主按鈕顯示橡皮擦圖示與名稱。
  - 橡皮擦可以從連結、按鈕上開始擦（`/projects`、`/journal` 整列都是連結，規格是「任意位置」），只擋 chip 本身與表單欄位；畫筆仍然不能從連結、按鈕上開始。
    - 從連結上開始的擦除一旦拖過 4px 就算拖曳：在 window 捕獲階段吞掉接著的 click（`preventDefault` + `stopPropagation`），不會跳頁。沒拖動的單純點擊仍然是正常點擊，也不會擦出圓點。
    - 吞 click 的旗標在下一次 `pointerdown` 與 `pointerup` 後的 `setTimeout(0)` 清掉：從連結拖到別處放開時瀏覽器可能不會產生 click，否則旗標會吃掉使用者下一次真正的點擊。
  - 圓環按下時不縮小（曾縮到 0.88，但實際擦除寬度不變，圓環會比實際擦的範圍小），只加深邊線。游標在 chip 上時改顯示筆的圖示、隱藏圓環，免得 24px 圓環壓在 18px 色點上不好選色。
  - `InkPen` 的監聽器是在 `onMounted` 的 `await` 之後才掛，`onBeforeUnmount` 在那裡註冊不上（就是一直出現的警告），HMR 重新掛載會留下舊的監聽器與 `requestAnimationFrame` 迴圈。改成在 setup 同步註冊 `onBeforeUnmount`，由它呼叫 `onMounted` 內設定的 `cleanup`。
- 曾做過四檔固定寬度的筆粗細選項（寬度改成每筆固定、收尖改依路徑距離），使用者決定不要，已撤回，維持原本由速度決定的寬度（慢則粗、快則細）。

### 陷阱

- 選墨色後自動收合；Esc 與任何一次在別處按下（同時也是開始畫線）也收合。
- `.chip-more` 的 `overflow: hidden` 會裁掉選中色點的外框，所以要有垂直 padding。
- 拖曳：在抓手上單純點一下（移動 < 4px）不算移動，否則會把預設位置改成「已移動」並存起來。雙擊抓手回預設位置。拖曳範圍夾在 header 之下（`TOP = 64`）與 footer 之上。
- 位置在 `onMounted` 才從 `localStorage` 還原，所以移動過的人重新整理時 chip 會從預設位置跳到記住的位置一次；SSR 與預設位置不受影響。
- 桌機截圖會變：`InkPen` 在 Playwright 下也會出現（`pointer: fine`），chip 會出現在所有桌機基準圖，Argos 需重新核准。
- 評估過五案（邊緣墨軌、書籤緞帶、點擊色卡、筆尖輪盤、可拖曳小盤），選可拖曳小盤；`?pal=` 預覽切換與其餘四案已移除。輪盤靠右鍵與熱鍵，沒有可見入口；緞帶與色卡只在 `lg` 以上才有。

---

## 手機版背景：光與空氣

### 做法

- 評估過三案：頁框（首頁加縮小的頁框）、光與空氣、觸碰與時辰。選「光與空氣」，因為它是全站、純 CSS、沒有 JS 與事件監聽，其餘兩案只作用在首頁。
- `BgLayer`（`app/components/bg/Layer.vue`）掛在 `default` 與 `content` 兩個 layout 的第一個子節點，`lg:hidden fixed inset-0 z-[-1]`，由紙到金的色調漸層、底部暖色燭光（7 秒呼吸）、紙紋三層組成。
- 首頁在手機另外讓半露的星盤（`max-lg:left-[100%] max-lg:top-[27%] max-lg:scale-[.66]`）與五顆星芒（`MOBILE_STARS`）顯示，並關掉首頁自己的紙紋（`max-lg:hidden`）避免與 `BgLayer` 的紙紋疊加。這些全是 `max-lg:` 修飾，桌機輸出不變。

### 陷阱

- 負 z-index 的背景層要靠兩個 layout 根節點的 `isolate` 才會畫在 `bg-bg` 之上；目前沒有任何頁面用負 z-index，加 `isolate` 是安全的。之後若新增負 z-index 要留意。
- 不用 `filter: blur`、`mix-blend-mode`、`background-attachment: fixed`（iOS 效能與相容性），只用 transform / opacity。
- 手機上唯一持續重繪的是星盤內環（160 秒轉一圈）。若實機發熱，改成靜止即可，其餘都是 opacity。
- 本案原本做過 `?bg=1~3` 的預覽切換，已移除；選定後不再保留切換機制。

---

## 內頁插畫（PageSketch）為何不能撐高版面

### 問題

about、projects、journal、skills、journey、contact、guestbook 的內容下方或側欄有空白，要各放一張筆線插畫（`app/components/PageSketch.vue`，`kind` 選圖）。但 `content` layout 的頁面根節點 `min-h-full` 實際上解析不到高度，頁面高度＝內容高度，所以空白是在「內容之下」，不是在被撐滿的根節點裡：`absolute bottom-0` 與 `mt-auto` 都只會貼在內容底部。

### 做法

- 插畫只在 `lg` 以上出現（手機有 `BgLayer`），一律不讓頁面變高：
  - about / journal / skills：放在該欄最後，`max-h-[calc(100dvh_-_Kpx)]` 依視窗剩餘高度縮小（K 是沒有插畫時的頁高加間距），剩不到約 90px 時用 `[@media(max-height:…)]:!hidden` 隱藏。about 另外只在 `xl` 以上出現，因為 `lg` 寬度下文字換行讓頁面變高。
  - contact：放在零高度的 `relative` 容器裡、`absolute` 往下懸掛。若佔版面，左欄變高會把右欄表單的 `flex-1` textarea 一起拉長。
  - projects：寬螢幕的預覽圖（4:3）會變高，標籤下方幾乎沒空間，真正的空白是在內容與 footer 之間。所以只有這頁在 `lg` 以上用 `lg:min-h-[calc(100vh_-_212px)]`（header 56 + main 上下 padding 120 + footer 36，`lg` 以上都是固定高度）讓根節點自己撐到 footer。內容較高時這個值不起作用，所以不會多出捲動。右欄改成 `flex-col`，插畫放在 `flex-1 min-h-0` 的容器裡，`absolute` 加 `max-h-[calc(100%_-_24px)]`，依剩下的高度等比縮小，本身不佔高度。容器設 `container-type: size`，剩不到 110px 時用 `@container` 隱藏，不會只露一截。只改這一頁，不動 `content.vue`：全域修好高度鏈會讓 7 頁的 `flex-1`／`mt-auto` 一起移位。
  - journey、guestbook：右欄本來就比左欄短，直接放在右欄。
- 每條筆線用 `pathLength=1` 的 dash 動畫依序畫出；虛線（journey 的路線、projects 的未畫弧）用同樣畫出的遮罩顯示。

### 陷阱

- Chrome 擷取比視窗高的整頁截圖時，會重播 SVG 元素上的 CSS 動畫，插畫被截成空白（`animations: 'disabled'` 也一樣）。Argos 是整頁截圖，所以 `navigator.webdriver` 時直接顯示完成狀態（`.ps-still`），與首頁凍結時針同一招。
- Argos 用 Playwright 預設的 1280×720，這個高度下 about / journal / skills / contact 的插畫是隱藏的，基準圖只會看到 projects、journey、guestbook 的插畫。
- about 顯示插畫時右欄變高，左欄的「— grayson, somewhere in taipei.」會被 `flex-1` 推到肖像欄底部（原設計意圖），插畫隱藏時則維持原位。
