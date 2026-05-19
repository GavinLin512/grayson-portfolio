## 1. Page Setup

- [x] 1.1 Create `app/pages/index.vue` (uses `default` layout implicitly)
- [x] 1.2 Wrap content in `<div class="relative min-h-screen">` as the absolute-positioning anchor

## 2. PhiLines

- [x] 2.1 Pass to `<PhiLines>`:
  - `lines=[{x1:0, y1:'38.2%', x2:'100%', y2:'38.2%', width:1}, {x1:'5%', y1:'23.6%', x2:'38.2%', y2:'23.6%', width:0.5, opacity:0.55}, {x1:'61.8%', y1:'8%', x2:'61.8%', y2:'94%', width:0.5}]`
  - `dot={cx:'61.8%', cy:'38.2%', r:5}`

## 3. Left-Side Decorations

- [x] 3.1 Left-top `<WfNote>` equivalent: `<p class="absolute left-[60px] top-[130px] font-mono text-[12px] leading-[1.55] opacity-85">— 01 / hello.<br/>portfolio of grayson — a frontend<br/>engineer based in taipei.</p>`
- [x] 3.2 Left-middle label: `<span class="absolute left-[60px] top-[320px] font-mono text-[11px] opacity-55 tracking-[0.02em]">N° 2026 — 04</span>`
- [x] 3.3 Left-bottom `<TickWall :count="5" :length="56" :gap="16"  class="absolute left-[60px] bottom-[120px]" />`

## 4. Bottom-Right Title

- [x] 4.1 Container: `<div class="absolute right-[60px] bottom-[90px] text-right">`
- [x] 4.2 Sub: `<div class="font-mono text-[12px] tracking-[0.04em] opacity-70">a portfolio —</div>`
- [x] 4.3 Big: `<div class="font-mincho font-extrabold text-[144px] leading-[0.95] mt-[10px] lg:text-[144px] md:text-[96px] text-[64px]">Grayson's<br/>Portfolio.</div>`
- [x] 4.4 Byline: `<div class="font-mono text-[11px] mt-[10px] opacity-70">design · code · craft / 2018 → 2026</div>`

## 5. Responsive

- [x] 5.1 Hide left-side decorations below `lg:` breakpoint via `hidden lg:block` on each
- [x] 5.2 Big title scales: mobile `text-[64px]`, tablet `md:text-[96px]`, desktop `lg:text-[144px]`
- [x] 5.3 Title right padding: `right-[24px]` on mobile, `right-[60px]` on desktop

## 6. Route Rule

- [x] 6.1 Confirm `routeRules` in `nuxt.config.ts` includes `'/': { prerender: true }`

## 7. Visual QA

- [x] 7.1 Compare against design Hero A artboard at 1280×720: verify cool dot lands at the intersection
- [x] 7.2 Test at 375 / 768 / 1280 widths: title scales, decorations hide appropriately
- [x] 7.3 Run `pnpm build` and verify `.output/public/index.html` contains rendered hero markup
