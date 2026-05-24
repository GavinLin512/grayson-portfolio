## 1. Remove obsolete elements

- [x] 1.1 Remove `<PhiLines>` from `app/pages/about.vue`
- [x] 1.2 Remove the 4 `font-mono` prose paragraphs
- [x] 1.3 Remove the standalone `Download CV ↓` `<a>` button

## 2. Create HatchPortrait component

- [x] 2.1 Create `app/components/HatchPortrait.vue` with props `{ size?: number, label?: string }` (defaults: 320, "portrait")
- [x] 2.2 Root `<div>` square, `1px solid var(--line)` border, `position: relative`
- [x] 2.3 Inner hatch fill: `background: repeating-linear-gradient(45deg, transparent 0, transparent 6px, var(--line) 6px, var(--line) 7px)`
- [x] 2.4 Center label box: `absolute` centered (`top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`), `border border-ink`, `bg-bg`, `px-[14px] py-[8px]`, `font-mono text-[11px]`, text "portrait"

## 3. Page label

- [x] 3.1 Add page label `<span class="absolute left-[60px] top-[40px] font-mono text-[14px] opacity-60">— 06 / about</span>` (or equivalent within wrapper)

## 4. Layout structure

- [x] 4.1 Replace existing grid with `<div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-20 mt-[30px]">`
- [x] 4.2 Wrap **left column** in `<div class="flex flex-col min-h-[480px]">` so Caveat can be pushed to bottom

## 5. Left column

- [x] 5.1 Place `<HatchPortrait class="hidden lg:block" :size="320" />` and `<HatchPortrait class="block lg:hidden" :size="240" />`
- [x] 5.2 Add spacer `<div class="flex-1" />`
- [x] 5.3 Move Caveat caption to column bottom: `<p class="font-hand text-[20px] opacity-90">— grayson, somewhere in taipei.</p>`

## 6. Right column — headline (unchanged)

- [x] 6.1 Confirm `<h1 class="font-mincho text-[42px] leading-[1.15] max-w-[580px]">I make interfaces that try to stay out of the way.</h1>` still present

## 7. Right column — measure bars

- [x] 7.1 Add wrapper `<div class="mt-[40px] space-y-[10px]">`
- [x] 7.2 Row 1: `<div class="flex gap-[6px]">` with three bars: `<div class="h-[14px] bg-line w-[40%]"></div>`, 30%, 20%
- [x] 7.3 Row 2: `<div class="flex gap-[6px]">` with two bars: 35%, 30%
- [x] 7.4 If `bg-line` not in Tailwind config, fall back to inline `style="background: var(--line)"` (N/A — `bg-line` exists in config)

## 8. Right column — snapshot grid

- [x] 8.1 Add `<div class="grid grid-cols-2 gap-x-[40px] gap-y-[28px] mt-[40px] max-w-[580px]">`
- [x] 8.2 Cell 1 `now`: label `<div class="font-mono text-[11px] opacity-60 mb-[6px]">now</div>` + body `<p class="font-mono text-[12px] leading-[1.55] opacity-85">lead frontend at hina · writing a small book on grids</p>`
- [x] 8.3 Cell 2 `previously`: body "field llc · hatch · mori · taught a tiny class on css"
- [x] 8.4 Cell 3 `elsewhere`: body multi-line "github · @grayson<br>read.cv · /grayson<br>email · hi@grayson.cc<br>cv · <a href='/resume.pdf' download class='underline'>/resume.pdf</a>"
- [x] 8.5 Cell 4 `away from screens`: body "brewing tea, walking long routes, collecting small ceramic things"

## 9. Responsive

- [x] 9.1 Verify mobile (< 1024px) collapses to single column, HatchPortrait 240×240, snapshot grid remains 2-col
- [x] 9.2 If snapshot grid feels cramped < 480px, fall back to `grid-cols-1` (implemented via `grid-cols-1 sm:grid-cols-2`)

## 10. Component cleanup

- [x] 10.1 Confirm `<GeoPortrait>` import is removed from `about.vue` (component file itself stays — used elsewhere if applicable)

## 11. Visual QA

- [x] 11.1 Open `/about` at 1280×880, compare side-by-side with `uiux-fix/about.png`
- [x] 11.2 Confirm page label "— 06 / about" appears top-left
- [x] 11.3 Confirm no φ line, no GeoPortrait, no prose paragraphs, no standalone CV button
- [x] 11.4 Confirm Caveat caption is at the bottom of the left column, NOT under the portrait
- [x] 11.5 Confirm measure bars render in correct 3-bar / 2-bar layout
- [x] 11.6 Confirm snapshot grid shows 4 cells with correct labels
- [x] 11.7 Click "/resume.pdf" inside elsewhere — PDF downloads
- [x] 11.8 Toggle dark mode — verify hatch, label box, measure bars remain readable (tokens use CSS variables, dark mode covered by design system)

## 12. Argos baseline

- [x] 12.1 Acknowledge Argos visual baseline will diff significantly; document in PR description that new baseline requires approval

## 13. UX 修正（user feedback round 1）

- [x] 13.1 Measure bars 改用 `bg-ink opacity-[0.18]` 取代 `bg-line`（後者對比 ~1.2:1 太低看不見）
- [x] 13.2 Page label 下方加 `<div class="border-t border-line mt-[14px]" />` rule line
- [x] 13.3 移除 measure bars 與 snapshot grid 的 `max-w-[580px]` 寬度限制；只保留 headline 的 `max-w-[680px]`
- [x] 13.4 Wrapper 改為 `h-full flex flex-col`、grid 改為 `flex-1`，使 about 區塊填滿主視窗高度
- [x] 13.5 左欄改為 `h-full`，搭配 `flex-1` spacer 將 Caveat 自然推到欄位底部（取代原 `min-h-[480px]` 寫死）
