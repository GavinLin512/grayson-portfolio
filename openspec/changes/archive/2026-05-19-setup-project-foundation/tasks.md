## 1. Nuxt 4 Scaffold

- [x] 1.1 Run `pnpm dlx nuxi@latest init .` (or merge if current directory not empty)
- [x] 1.2 Verify `package.json`, `nuxt.config.ts`, `tsconfig.json`, `app/` directory exist
- [x] 1.3 Confirm `app/` directory convention is active (Nuxt 4 default; no `future.compatibilityVersion` flag needed)
- [x] 1.4 Write minimal `app/app.vue` displaying "hello world"
- [x] 1.5 Run `pnpm dev` and verify `http://localhost:3000` shows "hello world"

## 2. Cloudflare Pages Preset

- [x] 2.1 Add `nitro: { preset: 'cloudflare-pages' }` to `nuxt.config.ts`
- [x] 2.2 Run `pnpm build` and confirm `dist/` directory is created with `_worker.js`, `_routes.json`, `_nuxt/`

## 3. Git Hygiene

- [x] 3.1 Edit `.gitignore` to include: `.nuxt/`, `.output/`, `dist/`, `.wrangler/`, `node_modules/`, `.env`, `.env.*`, `!.env.example`, `.DS_Store`
- [x] 3.2 Create `.env.example` with a header comment explaining its purpose (kept empty for now; future changes will append vars)
- [x] 3.3 Run `git status` after creating a test `.env` file and verify it is ignored
