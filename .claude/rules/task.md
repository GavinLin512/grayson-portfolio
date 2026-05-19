# Task Order

`setup-project-foundation` 已完成。以下是剩餘 changes 的建議實作順序：

## 依賴鏈

```
setup-project-foundation ✓
         │
         ▼
  add-design-tokens          字型、色票、Tailwind config
         │
         ▼
  add-phi-geometry-system    PhiLines 元件、φ composable
         │
         ▼
  add-shared-layout          SiteHeader / SiteFooter / TickWall
         │
         ▼
  add-hero-page              首頁 Hero A
         │
    ┌────┴──────────┐
    ▼               ▼
  add-about-page   add-projects-feature   （互相獨立）
    │
    ▼
  add-blog-feature
  add-skills-page
  add-journey-timeline
    │
    ▼
  add-contact-form
  add-site-search
    │
    ▼
  add-d1-database
    │
    ▼
  add-guestbook-feature
    │
    ▼
  add-deployment-pipeline    最後執行
```

## 規則

- 每個 change 必須等其依賴完成後才能開始實作。
- 頁面層（about、projects、blog、skills、journey）之間互相獨立，可平行進行。
- `add-deployment-pipeline` 需等全站功能完成後再做。
