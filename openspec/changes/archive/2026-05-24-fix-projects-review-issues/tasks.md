## 1. Null Safety Fix

- [x] 1.1 在 `app/pages/projects/index.vue` line 8，將 `projects.length` 改為 `projects?.length ?? 0`

## 2. Cool Background Fix

- [x] 2.1 在 `app/pages/projects/[slug].vue` lines 75-79，以 `<div class="h-[300px] bg-[var(--cool)]">` 包覆第二張 `<img>`，並將 `h-[300px]` 和 `bg-*` 從 `<img>` 移至容器 `<div>`

## 3. Git Ignore SQLite Cache

- [x] 3.1 在 `.gitignore` 新增 `.data/` 排除規則
- [x] 3.2 執行 `git rm --cached .data/content/contents.sqlite` 將已追蹤的 SQLite 檔案從 git index 移除（保留本地檔案）
