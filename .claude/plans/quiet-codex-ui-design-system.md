# Quiet Codex UI — Design System

> 中古世紀知識手抄本 × 日系靜謐簡約 UI

---

# Design Philosophy

這套設計風格的核心不是奇幻感，而是：

- 安靜
- 留白
- 知識感
- 手工感
- 文學感
- 修道院書庫氣質

整體氛圍更像：

> 一本安靜收藏於修道院書庫中的植物學手抄本。

而不是：

- RPG UI
- 高奇幻遊戲介面
- 華麗鍊金術網站

---

# Core Keywords

- Medieval Manuscript
- Quiet Fantasy
- Literary Minimalism
- Herbal Codex
- Monastic Library
- Ink Illustration
- Wabi-Sabi
- Japanese Editorial Design
- Botanical Study
- Handcrafted Knowledge

---

# Visual Direction

## 保留元素

- 羊皮紙質感
- 鋼筆線稿
- 手抄本氣質
- 植物學插畫
- 古籍編排
- 少量 ornament
- 日系留白

---

## 移除元素

- 過度金色裝飾
- RPG UI 感
- 太多鍊金術符號
- 高彩度奇幻配色
- 大量 ornament border
- 科技感 glassmorphism
- 強烈陰影

---

# 1. Color System

整體色彩方向：

> 退色礦物顏料 × 舊紙張

避免：

- 高飽和
- 純黑
- Neon
- 現代科技藍

---

## Parchment Colors

```css
--bg-primary: #F4EBDD;
--bg-secondary: #E8DED2;
--bg-muted: #D9CCBD;
```

用途：

- 網站背景
- Section 底色
- 閱讀區塊

---

## Ink Colors

```css
--ink-dark: #3D342F;
--ink-main: #5A4D45;
--ink-light: #85766A;
```

用途：

- 文字
- 插畫線條
- border

---

## Dusty Herbal Green

```css
--green-primary: #6A745E;
--green-soft: #8C9681;
--green-deep: #505847;
```

特色：

- 更霧化
- 更像舊植物標本

---

## Dusty Mineral Blue

```css
--blue-primary: #5F6F73;
--blue-soft: #7B8B8F;
--blue-deep: #46545A;
```

特色：

- 像退色布料
- 舊礦物顏料

---

## Muted Gold

```css
--gold-main: #8C7853;
--gold-soft: #A08F73;
```

原則：

- 金色只少量出現
- hover 時才稍微明顯
- 避免儀式感過強

---

# 2. Typography System

核心方向：

> 文庫本 × 學術書籍

---

## English Heading

推薦：

- Cormorant Garamond
- EB Garamond
- Source Serif
- Iowan Old Style

避免：

- Cinzel
- 過度神殿感字體

---

## Body Text

推薦：

- Source Serif
- Inter
- IBM Plex Sans
- Noto Serif

---

## Chinese Typography

推薦：

- 思源宋體
- Noto Serif TC
- Source Han Serif

少量標題可用：

- 霞鶩文楷

避免：

- 過度手寫感
- 商務黑體
- 科技感字型

---

# 3. Layout System

## Editorial Layout

網站應該更像：

- 文學雜誌
- 古籍排版
- 研究手札

而不是：

- SaaS Dashboard
- 科技產品網站

---

## Content Width

```css
max-width: 680px;
```

目的：

- 增加閱讀感
- 提升靜謐氛圍
- 增加孤獨感與專注感

---

## Section Spacing

```css
padding: 140px 0;
```

重點：

- 大量留白
- 安靜節奏
- 空氣感

---

## Asymmetrical Composition

建議：

```text
[ small illustration ]

          text block
```

特點：

- 插畫偏角落
- 小比例
- 像書頁插圖

---

# 4. Border & Ornament System

## Ornament Principle

核心原則：

> Ornament 必須克制。

---

## 保留

- 極細線條
- 少量植物紋
- 角落裝飾
- 微弱幾何感

---

## 移除

- 大量花紋框
- 強烈鍊金術圖騰
- RPG 感 ornament

---

## Border Style

```css
border: 1px solid rgba(60,50,40,.12);
```

---

## Radius

```css
border-radius: 4px;
```

避免：

- 大圓角
- 現代科技 UI 感

---

# 5. Texture System

## Paper Texture

加入：

- 羊皮紙 Noise
- 紙張纖維
- 極淡墨水暈染

透明度：

```css
opacity: 0.03 ~ 0.06;
```

原則：

- 幾乎感覺不到
- 只增加呼吸感

---

# 6. Illustration Direction

## Illustration Style

推薦：

- 鋼筆線稿
- Cross Hatching
- 植物學插畫
- 中古服飾
- 小型頁面插圖

---

## 插畫比例

插畫不應該主導畫面。

更像：

- 書頁旁註
- 研究插圖
- 文學裝飾

---

## Avoid

- Anime Hero Art
- 大型角色視覺
- 3D icon
- 扁平 vector

---

# 7. UI Components

## Button

按鈕應該更像：

```text
[ 閱讀更多 → ]
```

而不是：

```text
[ START ]
```

---

## Primary Button

```css
background: transparent;
border-bottom: 1px solid var(--ink-main);
padding: 0;
```

Hover：

```css
opacity: .72;
```

---

## Card

```css
border: 1px solid rgba(60,50,40,.12);
background: rgba(255,250,245,.82);
```

原則：

- 幾乎沒有 shadow
- 更像紙卡
- 更像書籤

---

## Divider

推薦：

```text
────────────
┈┈┈┈┈
```

少量使用：

```text
❦
```

---

# 8. Motion Design

核心原則：

> 動畫像空氣流動。

---

## Animation Speed

```css
transition: opacity 800ms ease;
```

---

## 適合動畫

- 緩慢 fade
- 微弱浮動
- 紙張感位移
- 柔和 hover

---

## 避免

- Bounce
- Scale hover
- 科技 loading
- 強烈 easing

---

# 9. UI Mood Mapping

| 元素 | 情緒 |
|---|---|
| 羊皮紙 | 溫暖 |
| 墨水 | 知性 |
| 留白 | 安靜 |
| 植物綠 | 生命力 |
| 礦石藍 | 旅途感 |
| 細線裝飾 | 文學感 |

---

# 10. Suitable Website Types

這套風格適合：

- 個人作品集
- 古籍知識網站
- 法規資料平台
- 插畫網站
- 世界觀網站
- 故事型 Landing Page
- 編輯式 Blog
- 文學型 SaaS

---

# Design Positioning

## Main Positioning

> Quiet Codex UI

---

## Alternative Naming

- Literary Medieval Minimalism
- Monastic Quiet Interface
- Editorial Fantasy UI
- Herbal Manuscript System

---

# Final Design Language

## Version A

> 「像一本安靜收藏於修道院書庫中的植物學手抄本。」

---

## Version B

> 「中古世紀知識手抄本 × 日系靜謐簡約 UI」

---

## Version C

> 「文學感古籍編排 × 安靜留白的中古世界觀介面」
