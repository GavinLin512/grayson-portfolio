## 1. SiteHeader

- [x] 1.1 Create `app/components/SiteHeader.vue` with 56px height, `flex justify-between items-center px-7 border-b border-line`
- [x] 1.2 Left section: ◇ mark (Mincho 18px) + "grayson / 2026" label
- [x] 1.3 Center: 7 nav items via `<NuxtLink>` to `/`, `/projects`, `/blog`, `/about`, `/skills`, `/journey`, `/contact`
- [x] 1.4 Active route detection: nav item gains `opacity-100 border-b border-ink` when route matches
- [x] 1.5 Right section: `EN` pill (TagChip styled) + theme toggle pill using `useColorMode().preference`

## 2. SiteFooter

- [x] 2.1 Create `app/components/SiteFooter.vue` with 36px height, `flex justify-between items-center px-7 border-t border-line text-[10px] opacity-70`
- [x] 2.2 Left: `© 2026 — grayson · index 00`
- [x] 2.3 Middle: `— a portfolio in beige`
- [x] 2.4 Right: `scroll ↓`

## 3. TickWall

- [x] 3.1 Create `app/components/TickWall.vue` with props: `count: number`, `length: number`, `gap: number` (defaults: 5, 56, 16)
- [x] 3.2 Render `count` horizontal lines via v-for, each `border-top: 0.7px solid var(--ink); opacity: 0.7`
- [x] 3.3 Every 3rd line shorter (`length - 14`) per design

## 4. TagChip

- [x] 4.1 Create `app/components/TagChip.vue` with props: `active: boolean = false`
- [x] 4.2 Styling: `inline-block font-mono text-[10px] border border-ink px-[10px] py-[3px] rounded-full`
- [x] 4.3 Active state: `bg-ink text-bg`
- [x] 4.4 Slotted text content

## 5. GeoPortrait

- [x] 5.1 Create `app/components/GeoPortrait.vue` with `width: number = 400`, `height: number = 460` props
- [x] 5.2 Compose 3-5 rectangles of varying sizes using `var(--cool)` and `var(--bg)`, positioned with absolute coordinates anchored to φ subdivisions

## 6. Default Layout

- [x] 6.1 Create `app/layouts/default.vue` with `<SiteHeader />`, `<main><slot /></main>`, `<SiteFooter />`

## 7. Playground Page

- [x] 7.1 Create `app/pages/playground.vue`
- [x] 7.2 Render each component with sample data in clearly labeled sections
- [x] 7.3 Include a `<PhiLines>` demo with the design manifesto's `(0, h·φ⁻¹) → (w, h·φ⁻²)` line

## 8. Visual QA

- [x] 8.1 Open `/playground` at 1280px and compare to design file's manifesto + TopBar + FootBar regions
- [x] 8.2 Switch to dark mode and verify all components remain readable
