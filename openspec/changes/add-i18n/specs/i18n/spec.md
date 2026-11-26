## ADDED Requirements

### Requirement: Routes SHALL serve zh-TW at the root and en under /en

The site SHALL use `@nuxtjs/i18n` with the `prefix_except_default` strategy: `zh-TW` is the default locale and has no prefix, `en` is served under `/en`. Every page route SHALL exist in both locales.

#### Scenario: Chinese at the root

- **WHEN** a visitor opens `/about`
- **THEN** the page renders with the zh-TW interface and `<html lang="zh-TW">`

#### Scenario: English under /en

- **WHEN** a visitor opens `/en/about`
- **THEN** the page renders with the English interface and `<html lang="en">`

### Requirement: The browser language SHALL be detected only on the root path, once

On a first visit to `/` only, the site SHALL redirect to the locale matching the browser's language and SHALL remember the locale in a cookie. The root SHALL be server-rendered (not prerendered), so the redirect is an HTTP redirect decided on the server and no Chinese page is shown first. Any other URL SHALL be shown in the language of its path, regardless of the browser's language.

#### Scenario: First visit to the home page with an English browser

- **WHEN** a visitor with no locale cookie and `Accept-Language: en-US` opens `/`
- **THEN** the visitor is redirected to `/en` and a locale cookie is set

#### Scenario: The redirect happens on the server

- **WHEN** `curl -sI -H 'Accept-Language: en-US' https://<site>/` is run with no cookie
- **THEN** the response is a 3xx redirect with `Location` ending in `/en`, and its body is not the zh-TW home page

#### Scenario: A shared article link is not redirected

- **WHEN** a visitor with an English browser opens `/blog/2026-11-04-agents-md-hijack-defense`
- **THEN** the Chinese article is shown and no redirect happens

#### Scenario: A returning visitor keeps their choice

- **WHEN** a visitor who switched to zh-TW with the language switch later opens `/` with an English browser
- **THEN** the zh-TW home page is shown

### Requirement: Interface strings SHALL come from locale files

Interface text SHALL be rendered from `i18n/locales/zh-TW.json` and `i18n/locales/en.json` through vue-i18n (`$t` / `t`), not written in templates. Both files SHALL have the same keys. English texts SHALL stay as each page's spec defines them.

#### Scenario: The interface follows the locale

- **WHEN** the contact page is rendered at `/contact` and at `/en/contact`
- **THEN** its form labels come from zh-TW.json and en.json respectively

#### Scenario: Locale files stay in step

- **WHEN** a pull request adds a key to zh-TW.json but not to en.json
- **THEN** the l10n-review check reports the missing key on the pull request

### Requirement: Brand names and design labels SHALL stay in English

Brand names (`Grayson's Portfolio.`, `grayson`, `EN`) and the lowercase design labels (the navigation items such as `index` and `journal`, and section labels such as `— 06 / about`) SHALL be identical in both locales. Sentences and functional texts (buttons, form labels, messages, `aria-label`s) SHALL be translated.

#### Scenario: Navigation is the same in both locales

- **WHEN** the header is rendered at `/` and at `/en`
- **THEN** both show the navigation items `index`, `projects`, `journal`, `about`, `skills`, `journey`, `contact`

#### Scenario: Functional text is translated

- **WHEN** the comments section is rendered at `/blog/<slug>` with no comments
- **THEN** the empty-state message is in Chinese

#### Scenario: Single-word functional labels are translated

- **WHEN** the mobile menu and the contact form are rendered at `/`
- **THEN** `menu`, `close`, `search` and the form labels `name`, `email`, `message` appear in Chinese, while the navigation items stay `index`, `projects`, `journal`…

#### Scenario: The home page introduction is translated

- **WHEN** `/` is rendered
- **THEN** the line `portfolio of grayson — a frontend engineer based in taipei.` appears in Chinese, and `Grayson's Portfolio.` stays in English

### Requirement: The language switch SHALL keep the visitor on the same page

Switching the language SHALL navigate to the same page in the other locale. For a journal post that has no version in the other locale, the switch SHALL navigate to that locale's journal list.

#### Scenario: Switching on a page

- **WHEN** a visitor on `/projects/01-field` switches to English
- **THEN** the browser navigates to `/en/projects/01-field`

#### Scenario: Switching on a post without a translation

- **WHEN** a visitor on a Chinese post that has no English version switches to English
- **THEN** the browser navigates to `/en/blog`

### Requirement: Pages SHALL declare their language and alternates

Every page SHALL set `<html lang>` to its locale and SHALL include `<link rel="alternate" hreflang>` entries for `zh-TW`, `en` and `x-default` (the zh-TW URL), plus a canonical URL, all fully qualified with the site URL.

#### Scenario: Alternates on an English page

- **WHEN** `/en/about` is rendered
- **THEN** its head contains `hreflang="zh-TW"` → `/about`, `hreflang="en"` → `/en/about`, `hreflang="x-default"` → `/about`, and `rel="canonical"` → `/en/about`

### Requirement: Content without a translation SHALL be marked with its language

Projects, skills and the journey timeline are not translated in this change. On zh-TW pages, their English content SHALL be wrapped in an element with `lang="en"`, so screen readers and fonts treat it as English.

#### Scenario: An English project on a Chinese page

- **WHEN** `/projects/01-field` is rendered
- **THEN** the interface text is Chinese and the project's body is inside an element with `lang="en"`
