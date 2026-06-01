## Context

Skills page is pure content, no interactivity. The goal is fast scannability of technical breadth, organized by category.

## Goals / Non-Goals

**Goals:**
- Simple, scannable 4-column grid on desktop
- Data-driven from YAML (no code edit to update skills)
- Responsive collapse to 2 / 1 columns

**Non-Goals:**
- Proficiency bars / Tech Radar (decision: grid layout chosen over bars)
- Per-skill detail pages (chips are not links)
- Skill icons (text only)

## Decisions

- **YAML over Markdown**: `content/skills.yml` is shape-typed, easier to update than parsing Markdown lists. `@nuxt/content` v3 reads YAML natively via `queryContent`.
- **4 fixed categories**: Backend / Frontend / DevOps / Database. Rationale: matches portfolio's positioning as a backend-leaning fullstack engineer. New categories (e.g., "Mobile") can be added later if needed.
- **Caveat note per column**: Personal touch matching the wireframe's handwriting accents

## Risks / Trade-offs

- **Risk**: 4-column rigid layout limits future scalability if categories grow → Mitigation: schema validation in `content/skills.yml`; if a 5th category is added, page would need to update grid template
- **Trade-off**: No skill levels means visitors can't distinguish "I touched this once" from "I built production systems with this". Acceptable trade-off for honesty: chips listed are all production-grade
