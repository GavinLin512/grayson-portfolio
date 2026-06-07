# Task Order

`setup-project-foundation`、`add-design-tokens`、`add-phi-geometry-system`、`add-shared-layout`、`add-hero-page`、`add-about-page`、`add-projects-feature`、`add-blog-feature`、`add-skills-page`、`add-journey-timeline`、`add-contact-form`、`add-site-search`、`add-d1-database`、`add-guestbook-feature` 已完成（`adjust-hero-layout`、`fix-projects-list-ux`、`fix-projects-review-issues`、`redesign-projects-list-layout`、`refine-about-design`、`refine-blog-list-design`、`redesign-skills-layout`、`refine-contact-design` 為額外新增 `[+]`）。以下是剩餘 changes 的建議實作順序：

## 依賴鏈

```
setup-project-foundation ✓
         │
         ▼
  add-design-tokens ✓        字型、色票、Tailwind config
         │
         ▼
  add-phi-geometry-system ✓  PhiLines 元件、φ composable
         │
         ▼
  add-shared-layout ✓        SiteHeader / SiteFooter / TickWall
         │
         ▼
  add-hero-page ✓            首頁 Hero A
         ├── adjust-hero-layout ✓ [+]
         │
    ┌────┴──────────┐
    ▼               ▼
  add-about-page ✓  add-projects-feature ✓  （互相獨立）
    ├── refine-about-design ✓ [+]  ├── fix-projects-list-ux ✓ [+]
    │                              ├── fix-projects-review-issues ✓ [+]
    │                              └── redesign-projects-list-layout ✓ [+]
    │
    ▼
  add-blog-feature ✓
    ├── refine-blog-list-design ✓ [+]
  add-skills-page ✓
    ├── redesign-skills-layout ✓ [+]
  add-journey-timeline ✓
    │
    ▼
  add-contact-form ✓
    ├── refine-contact-design ✓ [+]
  add-site-search ✓
    │
    ▼
  add-d1-database ✓
    │
    ▼
  add-guestbook-feature ✓
    ├── add-blog-comments [+]  重用 D1+OAuth，抽共用 <Comments> 元件
    │
    ▼
  add-deployment-pipeline    最後執行
```

## 規則

- 每個 change 必須等其依賴完成後才能開始實作。
- 頁面層（about、projects、blog、skills、journey）之間互相獨立，可平行進行。
- `add-deployment-pipeline` 需等全站功能完成後再做。
