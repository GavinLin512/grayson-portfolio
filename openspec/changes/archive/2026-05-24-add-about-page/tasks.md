## 1. Page Setup

- [x] 1.1 Create `app/pages/about.vue` (uses `default` layout)
- [x] 1.2 Wrap content in `<div class="relative px-[60px] py-[80px]">`

## 2. Background φ Line

- [x] 2.1 Add `<PhiLines :lines="[{x1:0, y1:'38.2%', x2:'100%', y2:'18%', width:0.55, opacity:0.55}]" />`

## 3. Two-Column Layout

- [x] 3.1 Outer grid: `<div class="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-20 mt-[30px]">`

## 4. Left Column (Portrait)

- [x] 4.1 `<GeoPortrait :width="400" :height="460" />` (responsive: `lg:w-[400px] w-[240px]`)
- [x] 4.2 Below portrait: `<p class="font-hand text-[20px] opacity-90 mt-3">— grayson, somewhere in taipei.</p>`

## 5. Right Column (Headline + Body)

- [x] 5.1 Headline: `<h1 class="font-mincho text-[42px] leading-[1.15] max-w-[580px]">I make interfaces that try to stay out of the way.</h1>`
- [x] 5.2 Body paragraphs: 4 paragraphs of `font-mono text-[12px] leading-[1.55] opacity-85`
- [x] 5.3 Spacing: `mt-[26px]` between headline and body

## 6. Resume Download Button

- [x] 6.1 At page bottom: `<a href="/resume.pdf" download class="inline-block border border-ink px-4 py-2 font-mono text-[12px] mt-12">Download CV ↓</a>`
- [x] 6.2 Place a placeholder `public/resume.pdf` (can be 1px empty PDF or real file)

## 7. Responsive

- [x] 7.1 Mobile: single column (`grid-cols-1`), portrait scales to 240×280
- [x] 7.2 Tablet+: two-column layout activates at `lg:` breakpoint

## 8. Route Rule

- [x] 8.1 Confirm `/about: { prerender: true }` in `routeRules`

## 9. Visual QA

- [x] 9.1 Compare to design AboutPage artboard at 1280×880
- [x] 9.2 Verify "Download CV" downloads the placeholder PDF
- [x] 9.3 Confirm no now/previously sections appear
