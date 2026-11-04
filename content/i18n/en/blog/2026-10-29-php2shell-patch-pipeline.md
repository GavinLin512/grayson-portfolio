---
title: "PHP2Shell: Your Server Gets Hit Before Your Code Even Runs"
date: 2026-10-29
tags: [security, php, docker]
description: Two unauthenticated RCEs in PHP core (CVE-2026-109618/109619) fire before a single line of Laravel runs. From a plain-English breakdown, inventory, digest-pinned Docker images and a CI version gate, to why Trivy can't see it — all turned into a patch pipeline you can reuse.
---

## Ten-plus years of PHP, and I'd never seen a bug like this

Some people in the industry started calling the last week of October "Black October." For PHP developers, the heaviest blow was **PHP2Shell**: two vulnerabilities in PHP core, CVE-2026-109618 and CVE-2026-109619, both rated 9.2 under CVSS v4.0.

I've written PHP for more than ten years and seen plenty of RCEs, but almost all of them were "some package got it wrong" or "some CMS plugin didn't validate input." This one is different:

- **The attacker doesn't need an account**, just the ability to send an HTTP request to your server
- **The bug fires before your application code runs**: Laravel hasn't even started booting
- **It affects every PHP that serves web traffic**: PHP-FPM, Apache mod_php, php-cgi, FrankenPHP, LiteSpeed, all the way from PHP 5.4 to 8.5

In other words, it doesn't matter how clean your Laravel code is or how strict your middleware is. The problem is in the layer under your feet.

And the number that bothered me most: according to OX Security, **on day 5 after disclosure (10/26), 93.6% of systems were still unpatched**.

## The short version: what to do right now

If you only have 30 seconds, read this:

1. **Upgrade PHP**: 8.5.12, 8.4.27, 8.3.36 or 8.2.35, depending on your branch. In the PHP team's own words: "There are no complete mitigations, updating is the only safe choice."
2. **Restart every PHP worker after upgrading**, or the old code is still what's running in memory
3. **A third vulnerability, CVE-2026-115560, was published on 10/23**, and as I write this there's still no fixed release. Until the next bugfix release, PHP recommends setting `session.upload_progress.enabled = 0` in `php.ini` or the FPM pool
4. If an attacker could have read worker memory before you patched, **assume every password, token and API key in there has leaked**, and rotate them all

PHP 8.1 and older no longer get official releases. Some distributions and LTS vendors ship backports, but that's a stopgap — it's time to upgrade.

## Timeline: AI squeezed "disclosure to attack" down to hours

Compiled from the Varonis, watchTowr and Hostinger write-ups:

| When | What happened |
|---|---|
| 8/1 | Researchers at Calif (under OpenAI's Patch the Planet initiative) find the first bug |
| 8/11 | Calif reports it to PHP |
| 8/19–24 | Wiz Research **independently finds** the same bugs using AI-assisted tooling, and within two days has remote code execution on WordPress, Drupal and Joomla |
| 10/17 | Amazon's honeypots (MadPot) record an exploitation attempt **4 days before public disclosure** |
| 10/20 | The CVE numbers leak online early; PHP announces an emergency release for 10/21 |
| 10/21 14:00 UTC | PHP ships 8.5.12, 8.4.27, 8.3.36 and 8.2.35; watchTowr's honeypots see attacks the same day |
| 10/22 | Cloudflare reports attempts jumping from thousands to millions |
| 10/23 | PHP discloses a third related bug, CVE-2026-115560 |
| 10/26 | CISA adds CVE-2026-109618 to its Known Exploited Vulnerabilities (KEV) catalog; OX Security: 93.6% still unpatched |

Cloudflare's CEO described it vividly: thousands of attempts in the 10 hours before the announcement, tens of thousands in the 45 minutes after it, hundreds of thousands within 2 hours, and then millions.

There's a trend here that PHP engineers should take seriously. According to Varonis, the researchers say **AI compressed what used to take specialists months into days**, and bug classes that were "known for a decade but too hard to exploit" are now within reach. Attackers have the same tools as the researchers.

Put differently, "we'll upgrade during next month's maintenance window" doesn't hold up against bugs of this class anymore.

## In plain English: how "out of memory" becomes RCE

The technical details come from [Varonis's analysis](https://www.varonis.com/blog/php2shell). I'll retell it using concepts PHP developers already know.

### Two things to understand first

**One: PHP workers get reused**. PHP-FPM doesn't spawn a new process per request; a pool of workers takes turns handling requests. That's why `pm.max_requests` exists at all: the same worker handles many requests in a row.

**Two: PHP processes multipart uploads before your code runs**. By the time you call `$request->file('avatar')` in Laravel, PHP parsed the whole upload long ago. One feature in there, **session upload progress**, exists to power upload progress bars, and it kicks in while the upload is still being parsed.

### The attack flow

1. The attacker sends a carefully crafted upload that makes PHP **run out of memory** (exceed `memory_limit`) while handling upload progress
2. PHP throws a fatal error and aborts the request, but **the cleanup that's supposed to happen between requests gets skipped**
3. A few global pointers inside the PHP engine still point at memory that has already been freed (that's the use-after-free)
4. **The same worker picks up the next request**, and the attacker arranges for their own data to land in that freed memory

From there, several paths open up:

- **Memory disclosure**: PHP treats the attacker-filled memory as a session ID, encodes it, and sends it back in the `PHPSESSID` cookie. The attacker reads the cookie and reads the worker's memory
- **Remote code execution**: combining an unserializer use-after-free with the addresses leaked above, the researchers achieved RCE on the latest WordPress, Drupal and Joomla container images
- There's also a use-after-free in the fatal error backtrace, plus an OPcache type confusion that works across workers

### Three takeaways for Laravel developers

**One: your code doesn't get a say**. The whole attack happens before Laravel's `public/index.php` executes. Middleware, FormRequest validation, Laravel's logging — none of it has started. Varonis also warns that **application-level logs may capture nothing at all**.

**Two: "Laravel doesn't use native PHP sessions" won't save you**. Laravel uses its own session drivers and never calls `session_start()`, so my first reaction was "then upload progress shouldn't concern me, right?" But the researchers say explicitly that **even a Hello World PHP app can be vulnerable**. PHP starts this feature on its own while parsing uploads, regardless of how your app handles sessions.

**Three: what's sitting in worker memory**? Think about what a Laravel FPM worker holds in memory: the `DB_PASSWORD` and `APP_KEY` loaded from `.env`, third-party API keys, user data being processed. A memory-disclosure bug means all of that can be read.

So if your server was exposed to the internet before you patched, rotating keys isn't an optional nicety. Since Laravel 11 there's a really handy feature for this: `APP_PREVIOUS_KEYS`. You switch to a new `APP_KEY` and put the old one in `APP_PREVIOUS_KEYS`; Laravel encrypts with the new key but can still decrypt existing data with the old one, so nobody gets logged out all at once and your encrypted data doesn't break.

## Step 1: inventory every place PHP runs

The very first item in Varonis's advice is inventory — and going "beyond the obvious web apps." I turned it into a table:

| Where | How to check | Easy to miss |
|---|---|---|
| VM / Laravel Forge | `ls /etc/php`, `php8.4 -v` | **Every** PHP version installed on the server needs upgrading, including ones no site currently uses |
| Docker image | Look at the Dockerfile's `FROM`, or run `php -v` inside the image | Images nobody has rebuilt in ages, base images someone else maintains |
| CI runner | The version set in `setup-php` | Usually not internet-facing, lower priority |
| Forgotten tools | Scan your internet-facing services | phpMyAdmin, webmail, internal admin panels, "installed it once and never looked again" |

### Forge users, pay attention

Laravel Forge's own guidance is very clear: **Forge's automatic security updates do not patch PHP**. PHP comes from Ondřej Surý's package repository, and Ubuntu's unattended upgrades only apply Ubuntu's own security updates. So you have to click "Update PHP X.X" on the PHP tab in Forge yourself, or SSH in and upgrade manually.

There's one more trap: **for the PHP 8.1-and-older backports, the version shown by `php -v` doesn't change**. Since there's no official release, the package maintainer backported the fixes onto the old version and kept the version number. To confirm you're patched, look at the package revision:

```bash
# List the 8.1 package versions (the revision must reach the number in Forge's docs, e.g. 8.1.34-9)
dpkg -l 'php8.1*' | awk '/^ii/ {print $2, $3}'

# Before upgrading, check which version apt will install
sudo apt-get update
apt-cache policy php8.4-fpm
```

## Step 2: `composer update` is not a PHP update

This is the illusion Laravel developers fall into most easily. This line in `composer.json`:

```json
"require": {
  "php": "^8.3"
}
```

is just a **declaration** that "this project needs PHP 8.3 or newer." Composer checks the PHP on "the machine installing the packages." And if you've also put a fake version in `config.platform.php` (plenty of people do, to keep package resolution consistent between CI and production), Composer doesn't even check the real PHP.

You've updated every package, `composer audit` is all green, and the PHP running in production may still be 8.4.26. **Updating packages and updating the runtime are two separate things**.

## Step 3: check inside the image you actually deploy

So I wrote a small script that checks the version and mitigation settings directly in "the PHP that will actually run":

```php
<?php
// Checks whether this PHP is patched for PHP2Shell (CVE-2026-109618 / CVE-2026-109619)
// and whether the temporary mitigation for CVE-2026-115560 is applied.
// Usage: php php2shell-check.php [--strict]
// Exit codes: 0 = pass; 1 = vulnerable (or warnings with --strict)
declare(strict_types=1);

$fixed = ['8.2' => '8.2.35', '8.3' => '8.3.36', '8.4' => '8.4.27', '8.5' => '8.5.12'];
$branch = PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;
$errors = [];
$warnings = [];

if (isset($fixed[$branch])) {
    if (version_compare(PHP_VERSION, $fixed[$branch], '<')) {
        $errors[] = sprintf('PHP %s is not patched, upgrade to %s or later', PHP_VERSION, $fixed[$branch]);
    }
} elseif (version_compare($branch, '8.5', '<')) {
    // 8.1 and older get no official releases; distribution backports keep the version number, so we can't tell here
    $errors[] = sprintf('PHP %s is end of life: no official fix exists, check your distribution backport package version or upgrade to a supported branch', PHP_VERSION);
}

// CVE-2026-115560: PHP recommends turning off upload progress until the next bugfix release
// Note: it must be set in php.ini or the FPM pool; ini_set() and .user.ini are both too late
if (filter_var(ini_get('session.upload_progress.enabled'), FILTER_VALIDATE_BOOLEAN)) {
    $warnings[] = 'session.upload_progress.enabled is still on (turn it off for CVE-2026-115560)';
}
// PHP 8.5: another risk-reducing setting from the official list
if ($branch === '8.5' && filter_var(ini_get('fatal_error_backtraces'), FILTER_VALIDATE_BOOLEAN)) {
    $warnings[] = 'fatal_error_backtraces is still on (recommended off on 8.5)';
}

printf("PHP %s (%s)\n", PHP_VERSION, PHP_SAPI);
foreach ($errors as $e) {
    echo "  [FAIL] {$e}\n";
}
foreach ($warnings as $w) {
    echo "  [WARN] {$w}\n";
}
if (!$errors && !$warnings) {
    echo "  [OK] patched, and the mitigation settings are applied\n";
}

$strict = in_array('--strict', $argv, true);
exit($errors || ($strict && $warnings) ? 1 : 0);
```

Running it for real against the official `php` Docker images:

```bash
docker run --rm -v "$PWD:/app:ro" -w /app php:8.4.26-cli php php2shell-check.php
# PHP 8.4.26 (cli)
#   [FAIL] PHP 8.4.26 is not patched, upgrade to 8.4.27 or later
#   [WARN] session.upload_progress.enabled is still on (turn it off for CVE-2026-115560)
# exit=1

docker run --rm -v "$PWD:/app:ro" -w /app php:8.4.27-cli php php2shell-check.php
# PHP 8.4.27 (cli)
#   [WARN] session.upload_progress.enabled is still on (turn it off for CVE-2026-115560)
# exit=0

# with --strict, warnings count as failures too
docker run --rm -v "$PWD:/app:ro" -w /app php:8.4.27-cli php php2shell-check.php --strict
# exit=1
```

Look at the second result: **after upgrading to 8.4.27, upload progress is still on by default**. The 10/21 releases fix the two PHP2Shell CVEs; for the third one, CVE-2026-115560, turning it off is on you.

### Why not just turn it off with `ini_set()`?

The official advisory specifically says **not to rely on `ini_set()` or FPM's `.user.ini`**. The reason goes back to the plain-English breakdown: the attack happens while PHP is parsing the upload, before your code has run at all, so `ini_set()` comes too late; `.user.ini` is also only read during request processing. It has to go in `php.ini`, `conf.d`, or the FPM pool configuration.

## Step 4: pin the Docker image by digest, and add the mitigation

```ini
; docker/php/zz-php2shell.ini
; Temporary mitigation for CVE-2026-115560: turn off upload progress until PHP ships a fix
; Must be set in php.ini / conf.d (ini_set() and .user.ini take effect too late)
session.upload_progress.enabled = 0
```

```dockerfile
# Pin the base image by digest: 8.4.27 is the PHP2Shell fix release
# (digest from docker buildx imagetools inspect php:8.4.27-fpm)
FROM php:8.4.27-fpm@sha256:3a6527017daca7917709afa08a37388ec108db093857f31d642cfff2e6f0449e

# Temporary mitigation for CVE-2026-115560; both CLI and FPM read conf.d
COPY docker/php/zz-php2shell.ini /usr/local/etc/php/conf.d/zz-php2shell.ini

# Ship the check script in the image so CI can verify "the image that actually gets deployed"
COPY php2shell-check.php /usr/local/bin/php2shell-check.php
```

Why pin the digest? When I checked, the `php:8.4-fpm` tag already pointed at 8.4.27, but tomorrow it might point at 8.4.28, or accidentally get pointed back at something else. Writing `8.4.27-fpm@sha256:...` means the tag is for humans and the digest guarantees the content. It's the same principle as the LiteLLM Docker images in [post 3](/blog/2026-11-02-litellm-unrevoked-key-supply-chain).

After the build, I specifically confirmed the setting that **FPM itself** sees, because CLI and FPM settings can differ (an FPM pool can override things with `php_admin_value`):

```bash
docker build -t pulse-api:test .

docker run --rm pulse-api:test php /usr/local/bin/php2shell-check.php --strict
# PHP 8.4.27 (cli)
#   [OK] patched, and the mitigation settings are applied

docker run --rm pulse-api:test php-fpm -i | grep -E "^(Server API|session.upload_progress.enabled)"
# Server API => FPM/FastCGI
# session.upload_progress.enabled => Off => Off
```

## Step 5: why Trivy can't see PHP2Shell

My original plan was "just add a Trivy scan to CI." Actually running it revealed a big trap.

Scanning the vulnerable `php:8.4.26-cli` with Trivy 0.76.1:

```text
Total: 132 (HIGH: 129, CRITICAL: 3)
```

132 HIGH/CRITICAL findings — looks very thorough. But when I searched the results for CVE-2026-109618 and CVE-2026-109619: **zero hits**.

The reason: the PHP inside the official `php` image **is compiled from source**, not installed with `apt-get install php`. Trivy scans the Debian package database (the log says `Detected OS family="debian"`, `pkg_num=172`). It sees system packages like `libxml2` and `libbrotli1`, but it **can't see PHP itself at all**.

So if Trivy is all you have in CI, it will diligently report 132 problems while the one that actually matters slips right past it. That's why the check script above is necessary: **a scanner's blind spots have to be covered by an explicit runtime check**.

As a side note, the one finding that differs between the 8.4.26 and 8.4.27 images is CVE-2026-111497 in `libbrotli1` — the same Brotli decoder bug behind Node.js's "Node2Shell" that week. The newer PHP image brought in the fixed system package along the way.

## Step 6: a CI gatekeeper

Here's all of the above strung together into one workflow. It passes actionlint and zizmor, and it follows every hardening principle from [post 4](/blog/2026-11-03-github-actions-hardening):

```yaml
name: PHP Image

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "17 3 * * 1" # rebuild every Monday to pick up base image and Debian package security updates

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

      # Check the PHP version and mitigation settings inside "the image that actually gets deployed"
      - name: PHP2Shell gate
        run: docker run --rm app:ci php /usr/local/bin/php2shell-check.php --strict

      # Trivy only knows OS packages: the official php image compiles PHP from source, so PHP2Shell itself won't show up here
      - name: Trivy (OS packages)
        run: |
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v "$PWD/.trivyignore:/.trivyignore:ro" \
            aquasec/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c \
            image --scanners vuln --severity CRITICAL --ignore-unfixed \
            --ignorefile /.trivyignore --exit-code 1 app:ci
```

A few design choices:

- **Scheduled weekly rebuilds**: the price of pinning a digest is that you don't get updates automatically, so the image is rebuilt once a week. Because this path runs regularly, you know it works when an emergency patch comes along
- **Trivy runs as a digest-pinned container**, not a GitHub Action. Same reasoning as [post 4](/blog/2026-11-03-github-actions-hardening): one less wrapper that downloads things on its own
- **`--ignore-unfixed`**: only block on problems that already have a fix, or CI gets stuck on a pile of CVEs upstream hasn't fixed yet

### The gatekeeper has noise too

I ran this gate for real against the 8.4.27 image I'd built, and it **still failed**:

```text
Total: 1 (CRITICAL: 1)
│ linux-libc-dev │ CVE-2026-99083
```

`linux-libc-dev` is the Linux kernel headers package. It's only used when compiling PHP extensions and is never loaded while the container runs. Debian already has a fixed version; the official php image just hasn't been rebuilt yet.

It's the same situation as the pnpm policy blocking packages in [post 4](/blog/2026-11-03-github-actions-hardening): **investigate first, confirm the risk, then add an exception with a reason and an expiry date**. Trivy's `.trivyignore` supports expiry dates:

```text
# linux-libc-dev is the kernel headers package, only used to compile PHP extensions; it isn't loaded at container runtime.
# Debian already has a fix; remove this once the official php image is rebuilt with it. Trivy blocks again after the expiry date.
CVE-2026-99083 exp:2026-11-30
```

I tested both cases: with the expiry date in the future, the gate passes (exit 0); with the expiry changed to a date that has already passed, the same CVE gets blocked again (exit 1). **The exception expires on its own**, instead of turning into a hole nobody remembers.

### Keep the base image updated automatically

```yaml
# .github/dependabot.yml
version: 2
updates:
  # Opens a PR when the Dockerfile's FROM php:x.y.z-fpm@sha256:... has a new version (tag and digest updated together)
  - package-ecosystem: docker
    directory: /
    schedule:
      interval: weekly
    # Routine updates wait 7 days; emergency patches like PHP2Shell don't wait for Dependabot, just edit FROM by hand
    cooldown:
      default-days: 7
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    cooldown:
      default-days: 7
```

At first I set the docker cooldown to 3 days, thinking "security updates should be a bit faster," and zizmor immediately warned "insufficient cooldown (less than 7)." After thinking about it, zizmor was right: **cooldown is for routine updates**, to avoid versions that go wrong right after release. An emergency patch at PHP2Shell's level should never wait for Dependabot's weekly schedule in the first place — you edit the `FROM` line by hand and open a PR immediately.

## Temporary mitigations: they only buy time

If you truly can't upgrade right away, PHP lists some measures, but the first thing it says is: **these only reduce exposure to specific attack paths and do not make an installation safe**.

For CVE-2026-109618 (memory exhaustion):

- Set `memory_limit=-1`, ideally in a way applications can't override (for example `php_admin_value` in the FPM pool or Apache configuration). An underlying allocation failure can still reach the vulnerable path, though
- Lower `post_max_size`: `8M` for apps that don't need uploads, `32M` for apps that do, and keep `upload_max_filesize` below `post_max_size`
- Use a container or cgroup memory limit as an availability boundary. **Don't** substitute `RLIMIT_AS` or `RLIMIT_DATA`, as they can actually trigger the vulnerable allocation failure

For CVE-2026-109619 (stale global state):

- Set `session.upload_progress.enabled=0` and restart every worker (again, in `php.ini` or the FPM pool)
- On PHP 8.5, set `fatal_error_backtraces=0`
- Fix attacker-reachable fatal errors and execution timeouts, including failures in upload and import processing

Two other common approaches:

- **WAF**: on 10/21 Cloudflare turned on PHP2Shell rules for every site using its firewall, including the free plan. But Cloudflare also saw attackers tweaking their requests to slip past the rules, and if an attacker can reach your server directly, the WAF never sees the traffic
- **Take it offline**: the UK NCSC's advice is blunt — if you can't even apply the temporary mitigations, **consider taking the system offline**, and before upgrading, check whether the system has already been compromised and whether a backdoor was planted

### What an attack leaves behind

Varonis lists a few signals to hunt for:

- Unusual or malformed multipart upload requests, followed by memory-exhaustion errors or a burst of HTTP 500s
- **Oversized or oddly formatted `PHPSESSID` cookies** in responses, which may mean worker memory is leaking out
- A PHP worker spawning a child process while it's still parsing an upload — that's almost certainly a problem

Remember what I said earlier: all of this happens before Laravel, so the logs to look at are **PHP-FPM's and the web server's**, not `storage/logs/laravel.log`.

## Wrapping up: patch timelines in the AI era

Back to that 93.6% from the start. I don't think most teams don't want to patch; it's that **the patching process itself is too slow**: finding every place PHP runs, rebuilding images, scheduling a maintenance window, testing.

From Amazon seeing attacks 4 days before disclosure to Cloudflare seeing hundreds of thousands of attempts within 2 hours, this timeline says "disclosure to mass exploitation" is now measured in hours. So these are the rules I've set for myself:

1. **Do the inventory ahead of time**, not after something breaks
2. **Keep the image rebuild path running all the time**: scheduled weekly rebuilds, so it doesn't jam in an emergency
3. **For internet-facing critical RCEs, aim to patch the same day**; if you can't, put up a WAF or even take it offline first
4. **Check the version inside the image you actually deploy**, don't just trust a scanner

The [next post](/blog/2026-10-30-laravel-agent-skills) changes direction to the other big news of the same week: Agent Skills becoming an industry standard, and how to write a Laravel team's conventions as a `SKILL.md` that AI agents can follow.

## References

- [PHP official news and security advisories](https://www.php.net/archive/2026.php) (2026-10-20, 10-21, 10-23)
- [PHP 8.4.27 release (php-src)](https://github.com/php/php-src/releases/tag/php-8.4.27)
- [Varonis: PHP2Shell: One Upload, Full Server](https://www.varonis.com/blog/php2shell)
- [watchTowr: PHP2Shell FAQ](https://watchtowr.com/intelligence/php-cve-2026-109618-faq/) (updated through 2026-10-26)
- [Hostinger: PHP2Shell: What it is and why you don't need to panic](https://www.hostinger.com/blog/what-is-php2shell/) (2026-10-27, with a full timeline)
- [The New Stack: What security researchers really think about the PHP2Shell response](https://thenewstack.io/php2shell-unpatched-php-servers/) (2026-10-27)
- [UK NCSC: Critical security issue affecting PHP](https://www.ncsc.gov.uk/news/critical-security-issue-affecting-php)
- [Laravel Forge: PHP security advisory (CVE-2026-109618, CVE-2026-109619)](https://laravel.com/forge/docs/knowledge-base/php-security-release-october-2026)
- [NVD: CVE-2026-109618](https://nvd.nist.gov/vuln/detail/CVE-2026-109618), [CVE-2026-109619](https://nvd.nist.gov/vuln/detail/CVE-2026-109619)
