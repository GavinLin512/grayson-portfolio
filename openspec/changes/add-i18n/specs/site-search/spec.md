## ADDED Requirements

### Requirement: Search SHALL only return pages in the current language

Pagefind SHALL build one index per `<html lang>` value, and the SearchModal SHALL search the index of the current page's language. After the visitor switches the language, the next search SHALL use the other language's index.

#### Scenario: Searching on a Chinese page

- **WHEN** the visitor searches for `agent` on `/blog`
- **THEN** the results contain only zh-TW pages (no `/en/...` URLs)

#### Scenario: Searching after switching the language

- **WHEN** the visitor switches from `/blog` to `/en/blog` and searches for `agent`
- **THEN** the results contain only `/en/...` pages

#### Scenario: Chinese words are found inside unspaced text

- **WHEN** the visitor searches for `供應鏈` on a zh-TW page
- **THEN** posts containing `供應鏈` inside a sentence are returned
