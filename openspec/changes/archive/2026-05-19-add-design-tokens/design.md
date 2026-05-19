## Context

The design language is Japanese minimal with beige base + ink + cool accent. Three font families carry distinct semantic roles. Dark mode must be supported. We must avoid having two parallel color systems (one in Tailwind theme, one in CSS Variables) that drift apart.

## Goals / Non-Goals

**Goals:**
- One source of truth for colors: CSS Variables on `:root` and `.dark`
- Tailwind utilities (`bg-bg`, `text-ink`) resolve to those CSS Variables
- Dark mode toggleable via `useColorMode()`

**Non-Goals:**
- Building any UI components (deferred to `add-shared-layout`)
- Adding interactive theme switcher UI (just basic toggle button in `app.vue` for verification)

## Decisions

- **CSS Variables as primary; Tailwind theme wraps them**: `tailwind.config.ts` defines `colors: { bg: 'var(--bg)', ... }`. Rationale: dark mode only needs to change Variables on `:root` and `.dark`, never touch Tailwind config. Alternative considered: pure Tailwind `dark:` prefix — rejected because every component would need `dark:bg-[#1a1815]` everywhere.
- **Class-based dark mode (`.dark`)**: Aligned with `@nuxtjs/color-mode` `classSuffix: ''` and Tailwind `darkMode: 'class'`. Rationale: all three layers (color-mode, Tailwind, CSS) speak the same convention. Alternative: `[data-theme="dark"]` attribute — rejected because color-mode doesn't set it by default.
- **No UI library**: Pure Tailwind only. Rationale: any UI lib (`@nuxt/ui`, `shadcn-vue`) brings its own color tokens that fight with our custom beige system. The design has no complex interactive primitives that justify a lib.
- **Fonts via `@nuxtjs/google-fonts` module**: Handles preconnect and `display: swap` automatically, avoiding FOUT. Alternative: manual `<link>` in `app.vue` — works but more boilerplate.

## Risks / Trade-offs

- **Risk**: Shippori Mincho has limited Chinese glyph coverage → Mitigation: Site big titles stay English (`Grayson's Portfolio.`). Chinese fallback (Noto Serif TC) is deferred to post-MVP i18n change.
- **Risk**: Dark mode color palette was extrapolated (not in original design) → Mitigation: visual review during implementation; iterate post-launch
- **Trade-off**: `font-mono` arbitrary text sizes (e.g. `text-[11px]`) bloat the generated CSS slightly. Acceptable given site size.
