## 1. PHI Constants

- [x] 1.1 Create `app/composables/usePhi.ts`
- [x] 1.2 Export `PHI_INV = 0.6180339887` and `PHI_INV2 = 0.3819660113`

## 2. PhiLines Component

- [x] 2.1 Create `app/components/PhiLines.vue`
- [x] 2.2 Define props: `lines: Array<{x1, y1, x2, y2, width?, opacity?}>`, `dot?: {cx, cy, r?}`
- [x] 2.3 Template renders `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">`
- [x] 2.4 v-for `<line>` elements from `lines`, applying `stroke="var(--ink)"`, `stroke-width` from `width`, `stroke-opacity` from `opacity`
- [x] 2.5 Render optional `<circle>` from `dot` with `fill="var(--cool)"`
- [x] 2.6 Handle coordinate values: percentage strings (e.g. `'38.2%'`) pass through; numbers append `'px'` only for viewBox-relative values

## 3. Verification

- [x] 3.1 In `app/app.vue`, add a `relative h-[400px] w-full` container with `<PhiLines :lines="[...]" :dot="..." />`
- [x] 3.2 Pass: `lines=[{x1:0, y1:'38.2%', x2:'100%', y2:'38.2%', width:1}, {x1:'61.8%', y1:'10%', x2:'61.8%', y2:'90%', width:0.5, opacity:0.4}]` and `dot={cx:'61.8%', cy:'38.2%'}`
- [x] 3.3 Verify in browser at 1280, 768, 375 widths that line endpoints stay at the same percentage positions and the dot lands at the intersection
- [x] 3.4 Run `pnpm build && pnpm preview` to confirm no hydration warnings in console
