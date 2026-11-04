---
title: PHP2Shell：應用程式碼還沒跑，伺服器就被打了
date: 2026-10-29
tags: [security, php, docker]
description: PHP 核心爆出兩個未授權 RCE（CVE-2026-109618/109619），發生在任何 Laravel 程式碼執行之前。從白話解析、盤點、Docker image 鎖 digest、CI 版本守門員，到 Trivy 為什麼抓不到它，一次整理成可以重複使用的修補流程。
---

## 寫了十幾年 PHP，第一次遇到這種漏洞

10 月底這週，業界有人叫它「Black October」。對 PHP 開發者來說，最重的一記是 **PHP2Shell**：PHP 核心的兩個漏洞，CVE-2026-109618 和 CVE-2026-109619，CVSS v4.0 都是 9.2。

我寫 PHP 十幾年，看過很多 RCE，但大多是「某個套件寫錯了」、「某個 CMS 外掛沒驗證輸入」。這次不一樣：

- **攻擊者不需要帳號**，只要能送 HTTP 請求到你的伺服器
- **漏洞發生在你的應用程式碼執行之前**，Laravel 都還沒開始 boot
- **影響所有對外提供 web 服務的 PHP**：PHP-FPM、Apache mod_php、php-cgi、FrankenPHP、LiteSpeed，從 PHP 5.4 一路到 8.5

也就是說，你的 Laravel 寫得再乾淨、middleware 檢查得再嚴，都沒用。問題在你腳下那一層。

然後最讓我在意的一個數字：根據 OX Security 的統計，**揭露後第 5 天（10/26），仍有 93.6% 的系統還沒修補**。

## 先講結論：現在該做什麼

如果你只有 30 秒，就看這裡：

1. **升級 PHP**：8.5.12、8.4.27、8.3.36、8.2.35（依你的版本線）。官方的原話是：「沒有完整的緩解措施，更新是唯一安全的選擇。」
2. **升級完要重啟所有 PHP worker**，不然記憶體裡跑的還是舊的
3. **10/23 又公布了第三個漏洞 CVE-2026-115560**，到我寫這篇時還沒有修補版。官方建議在下一次 bugfix release 前，先在 `php.ini` 或 FPM pool 設定 `session.upload_progress.enabled = 0`
4. 如果攻擊者可能在你修補前讀過 worker 的記憶體，**假設裡面的密碼、token、API key 都外洩了**，全部輪替

PHP 8.1 以前官方已經不出新版。有些發行版和 LTS 廠商提供 backport，但那是過渡方案，該升級了。

## 時間線：AI 把「揭露到攻擊」壓縮到幾小時

整理自 Varonis、watchTowr、Hostinger 的報告：

| 時間 | 發生了什麼 |
|---|---|
| 8/1 | Calif 的研究人員（在 OpenAI 的 Patch the Planet 計畫下）發現第一個漏洞 |
| 8/11 | Calif 通報 PHP |
| 8/19–24 | Wiz Research 用 AI 輔助工具**獨立發現**同樣的漏洞，兩天內就在 WordPress、Drupal、Joomla 上做出遠端執行 |
| 10/17 | Amazon 的蜜罐（MadPot）**在公開揭露前 4 天**就記錄到攻擊嘗試 |
| 10/20 | CVE 編號在網路上提前外洩，PHP 宣布 10/21 緊急發版 |
| 10/21 14:00 UTC | PHP 發布 8.5.12、8.4.27、8.3.36、8.2.35；watchTowr 的蜜罐同日觀察到攻擊 |
| 10/22 | Cloudflare 回報攻擊嘗試從數千次暴增到數百萬次 |
| 10/23 | PHP 公布第三個相關漏洞 CVE-2026-115560 |
| 10/26 | CISA 把 CVE-2026-109618 列入已知遭利用漏洞清單（KEV）；OX Security：93.6% 仍未修補 |

Cloudflare CEO 的描述很有畫面：公開前 10 小時就看到數千次嘗試，公開後 45 分鐘變成數萬次，2 小時內數十萬次，然後是數百萬次。

這裡有一個趨勢值得 PHP 工程師認真想：Varonis 的報告指出，研究人員表示 **AI 把原本需要專家花幾個月的工作壓縮到幾天**，那些「十年前就知道、但太難利用」的 bug 類型，現在變得可以利用了。而攻擊者手上的工具跟研究人員一樣。

換句話說，「等下個月例行維護再升級」這種節奏，在這種等級的漏洞面前已經不成立了。

## 白話解析：一個「記憶體用完」怎麼變成 RCE

技術細節來自 [Varonis 的分析](https://www.varonis.com/blog/php2shell)。我用 PHP 開發者熟悉的概念重講一次。

### 先理解兩件事

**第一，PHP worker 會被重複使用**。PHP-FPM 不是每個請求都開一個新 process，而是一群 worker 輪流處理請求。所以 `pm.max_requests` 這個設定才有意義：同一個 worker 會連續處理很多個請求。

**第二，PHP 在你的程式碼跑之前，就會先處理 multipart 上傳**。你在 Laravel 裡拿到 `$request->file('avatar')` 的時候，PHP 早就把整個上傳解析完了。其中有一個叫 **session upload progress** 的功能，是用來做上傳進度條的，它在解析上傳的過程中就會開始運作。

### 攻擊流程

1. 攻擊者送出一個精心設計的上傳請求，讓 PHP 在處理 upload progress 時**記憶體用完**（超過 `memory_limit`）
2. PHP 拋出 fatal error，中斷這個請求，但**本來該在請求之間做的清理被跳過了**
3. 幾個 PHP 引擎內部的全域指標，還指著已經釋放掉的記憶體（這就是 use-after-free）
4. **同一個 worker 接著處理下一個請求**，攻擊者想辦法讓自己的資料剛好填進那塊被釋放的記憶體

接下來就有好幾條路：

- **記憶體外洩**：PHP 把那塊被攻擊者填過的記憶體，當成 session ID 編碼後放進 `PHPSESSID` cookie 回傳。攻擊者讀 cookie，就讀到 worker 的記憶體內容
- **遠端執行程式碼**：利用 unserializer 的 use-after-free 加上前面外洩的位址資訊，研究人員在最新版的 WordPress、Drupal、Joomla 容器上都做到了 RCE
- 另外還有 fatal error backtrace 的 use-after-free，以及一個跨 worker 的 OPcache 型別混淆

### 對 Laravel 開發者的三個重點

**一、你的程式碼完全插不上手**。整個攻擊發生在 Laravel 的 `public/index.php` 被執行之前。Middleware、FormRequest 驗證、Laravel 的 log，全部都還沒開始運作。Varonis 也提醒：**應用層的 log 可能什麼都沒記到**。

**二、「Laravel 不用 PHP 原生 session」救不了你**。Laravel 用自己的 session driver，不呼叫 `session_start()`，我第一個反應是「那 upload progress 應該跟我無關吧？」但研究人員明確指出，**連一個 Hello World 的 PHP 程式都可能受影響**。這個功能是 PHP 在解析上傳時自己啟動的，跟你的應用怎麼處理 session 無關。

**三、worker 記憶體裡有什麼**？想想一個 Laravel 的 FPM worker 記憶體裡有什麼：`.env` 載入的 `DB_PASSWORD`、`APP_KEY`、第三方 API key、處理中的使用者資料。記憶體外洩的漏洞，等於這些東西都可能被讀走。

所以如果你的伺服器在修補前就暴露在網路上，輪替金鑰不是可有可無的建議。Laravel 11 之後有個很實用的功能：`APP_PREVIOUS_KEYS`。你可以換一把新的 `APP_KEY`，把舊的放進 `APP_PREVIOUS_KEYS`，Laravel 會用新 key 加密、但仍能用舊 key 解密既有資料，不會讓所有人瞬間被登出、加密資料也不會壞掉。

## 第一步：盤點所有跑 PHP 的地方

Varonis 的建議第一條就是盤點，而且要「超越那些明顯的 web app」。我整理成一張表：

| 位置 | 怎麼確認 | 容易漏掉的地方 |
|---|---|---|
| VM / Laravel Forge | `ls /etc/php`、`php8.4 -v` | 伺服器上**每一個**裝了的 PHP 版本都要升，包括目前沒有網站在用的 |
| Docker image | 看 Dockerfile 的 `FROM`，或在 image 裡跑 `php -v` | 很久沒重建的 image、別人維護的 base image |
| CI runner | `setup-php` 的版本設定 | 通常不對外，優先度較低 |
| 被遺忘的工具 | 掃描對外服務 | phpMyAdmin、webmail、內部後台、「當初裝一下就沒管」的東西 |

### 用 Forge 的人特別注意

Laravel Forge 的官方說明寫得很清楚：**Forge 的自動安全更新不會更新 PHP**。PHP 是從 Ondřej Surý 的套件庫裝的，Ubuntu 的 unattended upgrades 只會處理 Ubuntu 自己的安全更新。所以要自己到 Forge 後台的 PHP 分頁按「Update PHP X.X」，或 SSH 進去手動升級。

還有一個坑：**PHP 8.1 以前的 backport，`php -v` 顯示的版本號不會變**。因為官方沒出新版，是套件維護者把修補 backport 回舊版本，版本號維持原樣。要確認有沒有修到，得看套件 revision：

```bash
# 列出 8.1 相關套件的版本（revision 要達到 Forge 文件列的數字，例如 8.1.34-9）
dpkg -l 'php8.1*' | awk '/^ii/ {print $2, $3}'

# 升級前先看 apt 會裝哪個版本
sudo apt-get update
apt-cache policy php8.4-fpm
```

## 第二步：`composer update` 不等於 PHP 更新

這是 Laravel 開發者最容易有的錯覺。`composer.json` 裡的這行：

```json
"require": {
  "php": "^8.3"
}
```

它只是「這個專案需要 PHP 8.3 以上」的**宣告**，Composer 檢查的是「裝套件的那台機器」上的 PHP。如果你還在 `config.platform.php` 寫了假的版本號（很多人為了讓 CI 和正式環境的套件解析一致會這樣做），Composer 連檢查都不檢查真實的 PHP。

你更新了所有套件、`composer audit` 全綠，但跑在正式環境的 PHP 可能還是 8.4.26。**套件更新和 runtime 更新是兩件獨立的事**。

## 第三步：在實際要部署的 image 裡檢查

所以我寫了一支小腳本，直接在「真正會執行的那個 PHP」裡檢查版本和緩解設定：

```php
<?php
// 檢查目前這個 PHP 是否已修補 PHP2Shell（CVE-2026-109618 / CVE-2026-109619）
// 以及 CVE-2026-115560 的暫時緩解設定。
// 用法：php php2shell-check.php [--strict]
// 回傳碼：0 = 通過；1 = 有漏洞（或 --strict 時有警告）
declare(strict_types=1);

$fixed = ['8.2' => '8.2.35', '8.3' => '8.3.36', '8.4' => '8.4.27', '8.5' => '8.5.12'];
$branch = PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;
$errors = [];
$warnings = [];

if (isset($fixed[$branch])) {
    if (version_compare(PHP_VERSION, $fixed[$branch], '<')) {
        $errors[] = sprintf('PHP %s 未修補，請升級到 %s 以上', PHP_VERSION, $fixed[$branch]);
    }
} elseif (version_compare($branch, '8.5', '<')) {
    // 8.1 以前官方不再發版；發行版的 backport 不會改版本號，這裡無法判斷
    $errors[] = sprintf('PHP %s 已停止支援：官方沒有修補版，請確認發行版 backport 的套件版本，或升級到受支援版本', PHP_VERSION);
}

// CVE-2026-115560：官方建議在下一個 bugfix release 前關閉 upload progress
// 注意：必須寫在 php.ini 或 FPM pool，ini_set() 和 .user.ini 都來不及
if (filter_var(ini_get('session.upload_progress.enabled'), FILTER_VALIDATE_BOOLEAN)) {
    $warnings[] = 'session.upload_progress.enabled 仍是開啟的（CVE-2026-115560 建議先關閉）';
}
// PHP 8.5：官方列出的另一個降低風險設定
if ($branch === '8.5' && filter_var(ini_get('fatal_error_backtraces'), FILTER_VALIDATE_BOOLEAN)) {
    $warnings[] = 'fatal_error_backtraces 仍是開啟的（8.5 建議關閉）';
}

printf("PHP %s (%s)\n", PHP_VERSION, PHP_SAPI);
foreach ($errors as $e) {
    echo "  [FAIL] {$e}\n";
}
foreach ($warnings as $w) {
    echo "  [WARN] {$w}\n";
}
if (!$errors && !$warnings) {
    echo "  [OK] 已修補，緩解設定也已套用\n";
}

$strict = in_array('--strict', $argv, true);
exit($errors || ($strict && $warnings) ? 1 : 0);
```

用官方的 `php` Docker image 實際跑四種情況：

```bash
docker run --rm -v "$PWD:/app:ro" -w /app php:8.4.26-cli php php2shell-check.php
# PHP 8.4.26 (cli)
#   [FAIL] PHP 8.4.26 未修補，請升級到 8.4.27 以上
#   [WARN] session.upload_progress.enabled 仍是開啟的（CVE-2026-115560 建議先關閉）
# exit=1

docker run --rm -v "$PWD:/app:ro" -w /app php:8.4.27-cli php php2shell-check.php
# PHP 8.4.27 (cli)
#   [WARN] session.upload_progress.enabled 仍是開啟的（CVE-2026-115560 建議先關閉）
# exit=0

# 加 --strict：警告也算失敗
docker run --rm -v "$PWD:/app:ro" -w /app php:8.4.27-cli php php2shell-check.php --strict
# exit=1
```

注意第二個結果：**升級到 8.4.27 之後，upload progress 預設還是開著的**。10/21 的修補版處理的是 PHP2Shell 那兩個 CVE，第三個 CVE-2026-115560 要靠你自己關。

### 為什麼不能用 `ini_set()` 關？

官方公告特別寫了：**不要依賴 `ini_set()` 或 FPM 的 `.user.ini`**。原因回到前面的白話解析：攻擊發生在 PHP 解析上傳的階段，那時候你的程式碼根本還沒執行，`ini_set()` 來不及；`.user.ini` 也是在請求處理過程中才讀取的。必須寫在 `php.ini`、`conf.d`，或 FPM pool 的設定裡。

## 第四步：Docker image 鎖 digest，加上緩解設定

```ini
; docker/php/zz-php2shell.ini
; CVE-2026-115560 的暫時緩解：官方修補前先關閉 upload progress
; 必須在 php.ini / conf.d 設定（ini_set() 與 .user.ini 都來不及生效）
session.upload_progress.enabled = 0
```

```dockerfile
# 以 digest 鎖定 base image：8.4.27 是 PHP2Shell 的修補版
# （digest 來自 docker buildx imagetools inspect php:8.4.27-fpm）
FROM php:8.4.27-fpm@sha256:3a6527017daca7917709afa08a37388ec108db093857f31d642cfff2e6f0449e

# CVE-2026-115560 的暫時緩解，CLI 與 FPM 都會讀 conf.d
COPY docker/php/zz-php2shell.ini /usr/local/etc/php/conf.d/zz-php2shell.ini

# 把檢查腳本放進 image，CI 才能在「實際要部署的 image」裡驗證
COPY php2shell-check.php /usr/local/bin/php2shell-check.php
```

為什麼要鎖 digest？我查的時候，`php:8.4-fpm` 這個 tag 已經指向 8.4.27 了，但它明天可能指向 8.4.28，也可能被意外指回別的東西。寫 `8.4.27-fpm@sha256:...`，tag 給人看，digest 保證內容。這跟[第 3 篇](/blog/2026-11-02-litellm-unrevoked-key-supply-chain)談 LiteLLM 的 Docker image 是同一個原則。

build 完之後，我特別確認了**FPM 自己**讀到的設定，因為 CLI 和 FPM 的設定可能不一樣（FPM pool 可以用 `php_admin_value` 另外覆寫）：

```bash
docker build -t pulse-api:test .

docker run --rm pulse-api:test php /usr/local/bin/php2shell-check.php --strict
# PHP 8.4.27 (cli)
#   [OK] 已修補，緩解設定也已套用

docker run --rm pulse-api:test php-fpm -i | grep -E "^(Server API|session.upload_progress.enabled)"
# Server API => FPM/FastCGI
# session.upload_progress.enabled => Off => Off
```

## 第五步：為什麼 Trivy 抓不到 PHP2Shell

我原本的計畫是「CI 裡加一個 Trivy 掃描就好」。實際跑了才發現一個大坑。

用 Trivy 0.76.1 掃有漏洞的 `php:8.4.26-cli`：

```text
Total: 132 (HIGH: 129, CRITICAL: 3)
```

132 個 HIGH/CRITICAL，看起來很盡責。但我在結果裡搜尋 CVE-2026-109618、CVE-2026-109619：**零筆**。

原因是：官方 `php` image 裡的 PHP **是從原始碼編譯的**，不是用 `apt-get install php` 裝的。Trivy 掃的是 Debian 的套件資料庫（log 裡寫著 `Detected OS family="debian"`、`pkg_num=172`），它看得到 `libxml2`、`libbrotli1` 這些系統套件，但**完全看不到 PHP 本身**。

所以如果你的 CI 只有 Trivy，它會很認真地回報 132 個問題，然後讓真正致命的那個從旁邊溜過去。這也是為什麼上面那支檢查腳本是必要的：**掃描工具的盲點，要用明確的 runtime 檢查補起來**。

順帶一提，比較 8.4.26 和 8.4.27 兩個 image 的 Trivy 結果，差的那一筆是 `libbrotli1` 的 CVE-2026-111497，也就是同一週 Node.js 那個「Node2Shell」的 Brotli 解碼器漏洞。新版的 PHP image 順便帶進了修好的系統套件。

## 第六步：CI 守門員

把上面全部串成一條 workflow。它通過了 actionlint 和 zizmor 的檢查，沿用[第 4 篇](/blog/2026-11-03-github-actions-hardening)的所有加固原則：

```yaml
name: PHP Image

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "17 3 * * 1" # 每週一重建，拿到 base image 與 Debian 套件的安全更新

permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true

jobs:
  build-and-gate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
        with:
          persist-credentials: false

      - name: Build image
        run: docker build -t app:ci .

      # 在「實際要部署的 image」裡檢查 PHP 版本與緩解設定
      - name: PHP2Shell gate
        run: docker run --rm app:ci php /usr/local/bin/php2shell-check.php --strict

      # Trivy 只認得 OS 套件：官方 php image 的 PHP 是從原始碼編譯的，PHP2Shell 本身不會出現在這裡
      - name: Trivy (OS packages)
        run: |
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v "$PWD/.trivyignore:/.trivyignore:ro" \
            aquasec/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c \
            image --scanners vuln --severity CRITICAL --ignore-unfixed \
            --ignorefile /.trivyignore --exit-code 1 app:ci
```

幾個設計上的選擇：

- **每週排程重建**：鎖 digest 的代價是不會自動拿到更新，所以每週重建一次。這條路平常有在跑，緊急修補時你才會確定它是通的
- **Trivy 用鎖 digest 的容器跑**，而不是 GitHub Action。理由跟[第 4 篇](/blog/2026-11-03-github-actions-hardening)一樣：少一層會自己下載東西的包裝
- **`--ignore-unfixed`**：只擋「已經有修補版」的問題，不然 CI 會被一堆上游還沒修的 CVE 卡死

### CI 守門員也會有雜訊

我用 build 好的 8.4.27 image 實際跑這個 gate，結果**還是失敗**：

```text
Total: 1 (CRITICAL: 1)
│ linux-libc-dev │ CVE-2026-99083
```

`linux-libc-dev` 是 Linux kernel 的標頭檔，只在編譯 PHP extension 時用到，容器執行時根本不會載入。Debian 已經有修補版，只是官方 php image 還沒重新 build。

這跟[第 4 篇](/blog/2026-11-03-github-actions-hardening)遇到 pnpm 政策擋下套件是同一種情況：**先調查，確認風險，再加有理由、有期限的例外**。Trivy 的 `.trivyignore` 支援到期日：

```text
# linux-libc-dev 是 kernel 標頭檔，只在編譯 PHP extension 時用到，容器執行期不載入。
# Debian 已有修補，等官方 php image 重建後拿到新版即可移除。到期日一過 Trivy 就會重新擋。
CVE-2026-99083 exp:2026-11-30
```

我實測了兩種情況：到期日在未來，gate 通過（exit 0）；把到期日改成一個已經過去的日期，同一個 CVE 又被擋下來（exit 1）。**例外會自己過期**，不會變成永遠沒人記得的漏洞。

### 讓 base image 自動更新

```yaml
# .github/dependabot.yml
version: 2
updates:
  # Dockerfile 的 FROM php:x.y.z-fpm@sha256:... 有新版時自動提 PR（tag 與 digest 一起更新）
  - package-ecosystem: docker
    directory: /
    schedule:
      interval: weekly
    # 日常更新等 7 天；PHP2Shell 這種緊急修補不等 Dependabot，直接手動改 FROM
    cooldown:
      default-days: 7
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    cooldown:
      default-days: 7
```

我一開始把 docker 的 cooldown 設成 3 天，想說「安全更新要快一點」，結果 zizmor 直接警告「insufficient cooldown（少於 7 天）」。想了一下，它是對的：**cooldown 是給日常更新用的**，避開剛發布就出事的版本。PHP2Shell 這種等級的緊急修補，本來就不該等 Dependabot 每週一次的排程，應該手動改 `FROM` 那一行、馬上發 PR。

## 暫時緩解：只能爭取時間

如果真的沒辦法馬上升級，PHP 官方列了一些措施，但開頭就寫明：**這些只能降低特定攻擊路徑的風險，不會讓安裝變安全**。

針對 CVE-2026-109618（記憶體耗盡）：

- 設定 `memory_limit=-1`，最好用應用改不掉的方式（例如 FPM pool 或 Apache 設定的 `php_admin_value`）。但底層的記憶體配置失敗，仍可能走到有漏洞的路徑
- 調低 `post_max_size`：不需要上傳的應用設 `8M`，需要上傳的設 `32M`，而且 `upload_max_filesize` 要小於 `post_max_size`
- 用容器或 cgroup 的記憶體限制當作可用性的邊界。**不要**用 `RLIMIT_AS` 或 `RLIMIT_DATA` 取代，它們反而可能觸發有漏洞的記憶體配置失敗

針對 CVE-2026-109619（殘留的全域狀態）：

- 設定 `session.upload_progress.enabled=0` 並重啟所有 worker（同樣要在 `php.ini` 或 FPM pool 設定）
- PHP 8.5 設定 `fatal_error_backtraces=0`
- 修掉攻擊者能觸發的 fatal error 和執行逾時，包括上傳、匯入處理的錯誤

另外兩個常見的做法：

- **WAF**：Cloudflare 在 10/21 對所有使用其防火牆的網站開啟了 PHP2Shell 規則，包括免費方案。但 Cloudflare 也觀察到攻擊者在調整請求繞過規則，而且如果攻擊者能直接連到你的伺服器，WAF 根本看不到流量
- **下線**：英國 NCSC 的建議很直接，如果連暫時緩解都做不到，**考慮先把系統下線**，而且在升級前要先檢查系統是否已經被入侵、有沒有被植入後門

### 被攻擊時會留下什麼痕跡

Varonis 列了幾個可以追查的訊號：

- 異常或格式錯誤的 multipart 上傳請求，接著出現記憶體用盡的錯誤，或一陣 HTTP 500
- 回應裡出現**異常大或格式怪異的 `PHPSESSID` cookie**，可能代表 worker 的記憶體正在外洩
- PHP worker 在還在解析上傳時就產生子 process，這幾乎可以確定有問題

記得前面說的：這些都發生在 Laravel 之前，所以要看的是 **PHP-FPM 和 web server 的 log**，不是 `storage/logs/laravel.log`。

## 結語：AI 時代的修補時效

回到開頭那個 93.6%。我覺得大部分團隊不是不想修，而是**修補流程本身太慢**：要找出所有跑 PHP 的地方、要重建 image、要排維護時間、要測試。

從 Amazon 在揭露前 4 天就看到攻擊，到 Cloudflare 在 2 小時內看到幾十萬次嘗試，這次的時間軸告訴我們，「揭露到被大規模攻擊」已經是以小時計算。所以我給自己訂的規則是：

1. **盤點要事先做好**，不是出事才開始找
2. **重建 image 的流程要平常就在跑**：每週排程重建，緊急時才不會卡關
3. **對外的 critical RCE，目標是當天修補**；做不到就上 WAF、甚至先下線
4. **版本檢查要在實際部署的 image 裡做**，不能只信掃描工具

[下一篇](/blog/2026-10-30-laravel-agent-skills)會換個方向，聊同一週另一個大新聞：Agent Skills 成為業界標準，以及怎麼把 Laravel 團隊的慣例寫成 AI agent 看得懂的 `SKILL.md`。

## 參考資料

- [PHP 官方新聞與安全公告](https://www.php.net/archive/2026.php)（2026-10-20、10-21、10-23）
- [PHP 8.4.27 release（php-src）](https://github.com/php/php-src/releases/tag/php-8.4.27)
- [Varonis：PHP2Shell: One Upload, Full Server](https://www.varonis.com/blog/php2shell)
- [watchTowr：PHP2Shell FAQ](https://watchtowr.com/intelligence/php-cve-2026-109618-faq/)（持續更新至 2026-10-26）
- [Hostinger：PHP2Shell: What it is and why you don't need to panic](https://www.hostinger.com/blog/what-is-php2shell/)（2026-10-27，含完整時間線）
- [The New Stack：What security researchers really think about the PHP2Shell response](https://thenewstack.io/php2shell-unpatched-php-servers/)（2026-10-27）
- [UK NCSC：Critical security issue affecting PHP](https://www.ncsc.gov.uk/news/critical-security-issue-affecting-php)
- [Laravel Forge：PHP security advisory (CVE-2026-109618, CVE-2026-109619)](https://laravel.com/forge/docs/knowledge-base/php-security-release-october-2026)
- [NVD：CVE-2026-109618](https://nvd.nist.gov/vuln/detail/CVE-2026-109618)、[CVE-2026-109619](https://nvd.nist.gov/vuln/detail/CVE-2026-109619)
