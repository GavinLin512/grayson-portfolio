## 1. Install Modules

- [x] 1.1 Run `pnpm add -D @nuxtjs/tailwindcss @nuxtjs/color-mode @nuxtjs/google-fonts`
- [x] 1.2 Add the three modules to `nuxt.config.ts` `modules` array

## 2. CSS Variables

- [x] 2.1 Create `app/assets/css/tokens.css` with `:root` block defining `--bg`, `--paper`, `--ink`, `--ink2`, `--line`, `--cool`, `--warm`
- [x] 2.2 Add a `.dark` block in the same file with the dark mode variants
- [x] 2.3 Add `css: ['~/assets/css/tokens.css']` to `nuxt.config.ts`

## 3. Tailwind Config

- [x] 3.1 Create `tailwind.config.ts`
- [x] 3.2 Set `darkMode: 'class'`
- [x] 3.3 Define `theme.extend.colors` to wrap CSS variables (`bg: 'var(--bg)'`, etc. for all 7 colors)
- [x] 3.4 Define `theme.extend.fontFamily`: `mincho`, `mono`, `hand`

## 4. Color Mode Configuration

- [x] 4.1 Add `colorMode: { classSuffix: '', preference: 'system', fallback: 'light' }` to `nuxt.config.ts`

## 5. Google Fonts

- [x] 5.1 Add `googleFonts` config to `nuxt.config.ts` with families: Shippori Mincho [400,600,800], Space Mono [400,700], Caveat [400,600]; `display: 'swap'`; `preconnect: true`

## 6. Verification

- [x] 6.1 In `app/app.vue`, render a `<div class="bg-bg text-ink font-mincho text-4xl">Test</div>`
- [x] 6.2 Add a button that calls `useColorMode().preference = 'dark'`
- [x] 6.3 Verify in browser that clicking the button flips the page from beige to dark, and font is Shippori Mincho
