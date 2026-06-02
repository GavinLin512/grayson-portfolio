## Context

`add-skills-page` 以「chip 群集 + 每欄 Caveat」實作 skills 頁。新版設計稿 `uiux-fix/skills.png` 改為更具編輯感（editorial）的版面：逐列技能、右側熟練度方塊、虛線分隔、欄位刻意錯落。本 change 對齊該設計稿。

## Goals / Non-Goals

**Goals:**
- 像素級對齊 `uiux-fix/skills.png`：編號分類、row + 5 格方塊、虛線、錯落欄位、雙註解
- 資料驅動且可擴充（分類為陣列，非寫死 4 key）
- 維持 `content` layout 滿版規範（root `h-full flex flex-col`，主區塊 `flex-1`）

**Non-Goals:**
- 互動（hover / 篩選）— 本頁仍為純內容頁
- 熟練度 tooltip 或數字標示 — 僅以方塊視覺呈現
- 行動版完全重現錯落 — 小螢幕收斂為對齊單/雙欄即可

## Decisions

### 資料形狀：`categories` 陣列 + `{ name, level }`
取代原本 4 個固定字串陣列。理由：(1) 解決原 change「4 欄硬寫死、第 5 分類需改版」的 risk；(2) `level` 內建於資料，頁面零邏輯。

```yaml
header: what i carry in the toolbox
categories:
  - index: "01"
    label: languages
    skills:
      - { name: typescript, level: 5 }
      - { name: go,         level: 4 }
      - { name: python,     level: 5 }
      - { name: css,        level: 4 }
      - { name: sql,        level: 5 }
  - index: "02"
    label: frameworks
    skills:
      - { name: react,    level: 5 }
      - { name: next.js,  level: 4 }
      - { name: svelte,   level: 5 }
      - { name: fastify,  level: 4 }
      - { name: tailwind, level: 5 }
  - index: "03"
    label: craft
    skills:
      - { name: design systems, level: 5 }
      - { name: motion,         level: 4 }
      - { name: a11y,           level: 5 }
      - { name: data viz,       level: 4 }
      - { name: type,           level: 5 }
  - index: "04"
    label: tools
    skills:
      - { name: figma,     level: 5 }
      - { name: linear,    level: 4 }
      - { name: vercel,    level: 5 }
      - { name: sentry,    level: 4 }
      - { name: plausible, level: 5 }
currentlyLearning: "rust · webgpu · WAI-ARIA practices '26"
notInterested: "moving fast and breaking things."
```

對應 `content.config.ts`：

```ts
skills: defineCollection({
  type: 'data',
  source: 'skills.yml',
  schema: z.object({
    header: z.string(),
    categories: z.array(z.object({
      index: z.string(),
      label: z.string(),
      skills: z.array(z.object({
        name: z.string(),
        level: z.number().min(0).max(5),
      })),
    })),
    currentlyLearning: z.string(),
    notInterested: z.string(),
  }),
}),
```

### `SkillMeter.vue` 元件
5 個方塊；前 `level` 個 `bg-ink`，其餘 `border border-ink`（空心）。尺寸約 8px、間距約 4px，與設計稿一致。

```vue
<template>
  <span class="inline-flex gap-[3px]" :aria-label="`${level} of 5`">
    <span
      v-for="n in 5"
      :key="n"
      class="w-[8px] h-[8px]"
      :class="n <= level ? 'bg-ink' : 'border border-ink'"
    />
  </span>
</template>
<script setup lang="ts">
defineProps<{ level: number }>()
</script>
```

### 技能 row 與虛線
每 row：`flex items-center justify-between py-[10px] border-b border-dotted border-line`，左為 serif 名（`font-mincho` 體系，約 18px），右為 `<SkillMeter>`。最後一列是否保留底線可微調對齊設計稿。

### 錯落（staggered）構圖
四欄置於 `lg:grid-cols-4`，但各欄套不同 `lg:mt-*` 偏移以重現設計稿波浪（col2 最低）。建議起點：languages `mt-0`、frameworks `lg:mt-10`、craft `lg:mt-3`、tools `lg:mt-6`，最終以 1280×800 對照 `skills.png` 微調。小於 `lg` 取消偏移（`mt-0`）以保乾淨堆疊。

### 底部雙註解
與分類網格分離的區塊，靠 grid 對齊到第 1、3 欄位置：
- `currently learning`（mono、小、低透明度 label）→ `currentlyLearning`（hand 字體）
- `not interested in` → `notInterested`（hand 字體）

## Risks / Trade-offs

- **Argos baseline 變動**：版面全改，skills 截圖須重新核准 → 預期內，CI 流程已支援。
- **錯落偏移為魔術數字**：以註解標明來源為 `skills.png`，並限定僅 `lg` 以上生效，降低維護成本。
- **熟練度主觀**：`level` 值為自評，僅視覺示意，不附說明 → 可接受，符合作品集語氣。
