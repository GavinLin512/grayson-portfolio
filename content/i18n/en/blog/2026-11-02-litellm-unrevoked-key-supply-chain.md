---
title: How One Unrevoked Key Got LiteLLM Poisoned
date: 2026-11-02
tags: [security, devops, python]
pinned: true
description: Breaking down the LiteLLM 1.107.0 supply chain attack, from one accidental commit in May to an official release carrying an infostealer in October. Why GitHub CLI tokens are especially dangerous, why signatures didn't stop it, and the defenses I actually ran — gitleaks, hash pinning, and a .pth scanner.
---

## The punchline first: this was no fancy 0-day

On October 21, LiteLLM published `1.107.0` to PyPI, Docker Hub and GHCR. That release had an infostealer and a backdoor hidden inside.

What's LiteLLM? Put simply, it's an AI gateway: wire your app to it once and you can hit OpenAI, Anthropic and Bedrock through a single API. Lots of teams use it as their one front door to LLMs, which means the machines it runs on usually have a pile of API keys and cloud credentials lying around.

PyPI quarantined it less than two hours after it went up, but according to ClickPy data cited by Wiz, it still got downloaded roughly **49,000 times** in that window.

I've been writing Laravel for over a decade, and after reading the official root cause analysis my first reaction was:

> "Wait — isn't this just the classic 'someone committed `.env`, deleted it, and figured that was the end of it'?"

Yep, that's how mundane the starting point was. Except this time it burned all the way from a config file in an experimental project to the cloud credentials on tens of thousands of machines. In this post I want to take the whole attack chain apart and, at every link, ask: "If this were my project, would I have stopped it?" At the end are the defenses I actually ran.

## The attack chain: from one commit to a malicious release

Summarized from the [root cause analysis](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain) LiteLLM published on October 23 (all times UTC):

| When | What happened |
|---|---|
| 5/27 | `opencode.json`, containing an admin key for the Agent Platform, is committed to a public repo |
| 5/27, ~3 hours later | Another commit deletes the file, but **the key is never revoked**; the original commit stays in public history |
| 10/10 | The attacker uses that key to call the internal Agent Platform API and gets the org owner's GitHub CLI token |
| 10/10 | Pushes throwaway branches so CI workflows send repo secrets to an external endpoint, picking up tokens for two more maintainers |
| 10/21 | Uses owner rights to override branch protection and rewrites the release workflow so it can build from a fork under the lookalike org `Berri-AI` |
| 10/21 11:40 | Approves the production gate with a maintainer token; `1.107.0` ships to PyPI, Docker Hub and GHCR |
| 10/21 from 11:53 | Deletes the workflow run records and force-pushes `main` to cover the tracks |
| 10/21 12:06 | A community member opens an issue flagging the tampered release; PyPI quarantines it around 13:23 |

Notice the gap: **more than four months passed between the key leaking and the key being used.** A lot of people's attitude toward "oops, I committed a key" is "eh, probably nobody saw it." This case tells you very plainly: someone will see it, and they are patient.

Let's go link by link.

## Link one: deleting the file is not revoking the key

The official write-up is refreshingly honest: the mistake was actually spotted within 3 hours, and someone even noted "this key needs to be revoked" — but through human error, nobody followed through.

There are two common misconceptions here, and I've held both of them myself:

1. **"I deleted the file."** Deleting the file just adds another commit. The original commit is still in history, and anyone can see it with `git log -p`.
2. **"Fine, I'll force-push and rewrite history, then."** Still no good. You have no idea who's already cloned it, or whether it's been picked up by GitHub's fork network or some mirror. And secret-scanning bots usually catch new commits on public repos within minutes.

So there's only one correct mindset: **once it's pushed, treat it as leaked, and the first thing you do is kill that key.**

## Link two: why a GitHub CLI token, of all things

The attacker used that admin key to call the Agent Platform API. One `GET /api/v1/managed_agents/agents` later, there was a GitHub token sitting in the response.

The problem is where that token came from. The Agent Platform needed to open PRs, so it had to be configured with a GitHub token. It should have been given a token that could only touch specific repos with specific permissions. Instead it was configured with **the org owner's own GitHub CLI OAuth token** — the one you get on your laptop when you run `gh auth login`.

Why was that choice fatal? Here's how the three common kinds of GitHub credentials compare:

| | GitHub CLI OAuth token | Fine-grained PAT | GitHub App installation token |
|---|---|---|---|
| Scope | Follows your account — whatever you can do, it can do | Can be limited to specific repos and individual permissions | Limited to the repos the App is installed on and the permissions it declares |
| Lifetime | Long-lived until you revoke it | Can have an expiry date | Expires automatically after **1 hour** |
| 2FA re-auth for sensitive actions (sudo mode) | **Not triggered** (in the official words: post-2fa) | Depends | N/A (not a human account) |
| Fit for automation? | ❌ | Passable | ✅ First choice |

A GitHub CLI token is basically "you, having already passed 2FA." An attacker who gets it gets the owner, and GitHub won't pop up a single confirmation.

What's even wilder is the next part: the official credentials table shows that the `GH_TOKEN` repo secret on `BerriAI/litellm` **also held a maintainer's GitHub CLI token**. In other words, "stuffing a personal CLI token into a CI secret" didn't happen just once.

To put it in terms we know: it's like deploying from Forge or Envoyer with your own personal account token, and then one day that token leaks. However much power you have, the attacker now has.

## Link three: CI itself becomes the exfiltration channel

With the owner token in hand, the attacker didn't go after any servers. What they did was almost ironically simple:

1. Push a branch called `ci-tmp-a351cc` to `BerriAI/litellm`
2. The workflow on that branch POSTs 6 repo secrets to `webhook.site`
3. A little over 2 minutes later, delete that workflow run

The whole thing took under 3 minutes. Why does that work? Because **GitHub Actions trusts branches within the same repo**: if you can push a branch, that branch's workflows can read repo-level secrets.

This is the part I think Laravel devs should be most wary of. We're very used to setting `DEPLOY_KEY` and `FORGE_TOKEN` straight up as repo secrets and thinking "well, only our team can push anyway." But as soon as one person's token leaks, every repo secret has effectively leaked with it.

A better approach is to put sensitive secrets in an **Environment** instead of at the repo level:

- Environment secrets can only be read when a job declares `environment: production`
- An Environment can be restricted to "only `main` can deploy" (deployment branches), so some random `ci-tmp-xxx` branch can't get at them
- You can require reviewers — and make sure to tick **Prevent self-review**, so you can't approve a deployment you triggered yourself

## Link four: branch protection doesn't stop an owner

When the attacker went to change the release workflow, the first push was actually **rejected by branch protection** (it required a PR, two checks, and codeowner approval). Five seconds later, they switched to the owner's token and pushed straight through, overriding the rules.

That's branch protection's blind spot: by default, admins and owners can bypass it. If your repo uses Rulesets, check carefully who's on the bypass list. For release-related branches and files, the bypass list should ideally be empty — owners included, everyone goes through a PR.

One more detail: the attacker created a fork under the lookalike org `Berri-AI` (one extra hyphen), and the release was built from a commit in that fork. But that commit opens just fine at `github.com/BerriAI/litellm/commit/20535d8f`, because GitHub lets forks share git objects with the original repo. At a glance, you'd think it was a commit in the original repo.

## Link five: the release process was "temporarily" relaxed

I sighed out loud reading this part. Normally, a LiteLLM release requires "an authorized engineer to trigger it, plus approval from a special account tied to a physical device in the office." But the week it happened, to speed up releases and backports, the process had been temporarily relaxed to "any two engineers: one triggers, one approves."

The attacker happened to be holding tokens for two maintainers.

I think every engineer has lived through "we're slammed this week, let's loosen this up for now." What this case teaches is: **the window when a security control is relaxed is exactly when you're most exposed.** If you really have to relax something, at least give it an expiry date and step up monitoring for that period.

## The most counterintuitive part: the signature was real

There's one line in the official post-mortem: the pipeline **signed and published** `v1.107.0` as usual.

Meaning: this malicious release was built, signed and published through LiteLLM's own official release pipeline. If you were verifying "did this package come out of the official pipeline?", the answer was: yes.

That's also why mechanisms like pnpm's `trustPolicy` and npm provenance — which I'll get into in the [next post](/blog/2026-11-03-github-actions-hardening) — **can't stop this kind of attack**: they check whether the way a package is published has changed, and this time it didn't change at all. The pipeline itself was hijacked.

What would have stopped it is the most unglamorous thing: **don't install a version that was published two hours ago.** I'll implement that below.

## `.pth`: why a Python package gets you the moment it's installed

Now for the malicious code itself. According to [Wiz's analysis](https://www.wiz.io/blog/litellm-compromised-steals-credentials), the malicious release drops three files into the root of `site-packages`: `cook.pth`, `cook.py` and `sitecustomize.py`.

What's a `.pth`? When Python starts, the standard library's `site` module scans every `.pth` file in `site-packages`. Their original purpose is to "add import paths," but there's one rule: **any line that starts with `import` gets executed directly.**

So you never even have to `import litellm`. Start Python in that environment — any command counts, including `pip` itself — and the malicious code has already run.

Showing beats telling, so let's watch it happen with a harmless mock file:

```bash
python3 -m venv /tmp/pth-demo
SITE=$(/tmp/pth-demo/bin/python -c "import site; print(site.getsitepackages()[0])")

# Mock file: just prints one line
echo 'import sys; sys.stderr.write("[demo] cook.pth executed before your code\n")' \
  > "$SITE/cook.pth"

/tmp/pth-demo/bin/python -c 'print(1)'
# [demo] cook.pth executed before your code
# 1
```

`print(1)` has nothing whatsoever to do with LiteLLM, and the `.pth` still ran first.

`sitecustomize.py`, meanwhile, is another module Python imports automatically at startup. Using both mechanisms together makes sure the payload runs no matter what. Wiz says this is the first case they know of where both techniques were used together in the wild.

The list of what gets stolen is long:

- Saved logins and cookies from browsers (Chrome, Firefox, Edge, Safari)
- AWS credentials from `~/.aws/` and EC2/ECS metadata
- GCP service accounts, Azure CLI tokens
- SSH and GPG private keys, plus shell history
- API keys for LLM providers like OpenAI and Anthropic

It even queries LiteLLM Proxy's PostgreSQL directly — `SELECT * FROM "LiteLLM_CredentialsTable"` — and walks off with every upstream provider key stored there in one go.

Wiz also observed that about 4.5 hours after the exfiltration, the attacker started calling `sts:GetCallerIdentity` and `bedrock:ListFoundationModels` with the stolen AWS credentials. The goal is obvious: **burning through your LLM quota (LLMjacking)**.

## Translate it to PHP: same mistakes, different ecosystem

If you're thinking "that's a Python problem," compare:

| The LiteLLM incident | The equivalent risk in Laravel / PHP |
|---|---|
| Key committed to a public repo; file deleted but key not revoked | `.env`, or a key hardcoded in `config/services.php`, gets committed |
| `.pth` runs automatically when Python starts | Composer plugins run during `composer install` (which is why, since Composer 2.2, you have to explicitly allow them in `allow-plugins`) |
| Automation running on the owner's CLI token | Forge / Envoyer / CI deploying with a personal account token |
| Repo-level secrets readable from any branch | `FORGE_TOKEN` and SSH deploy keys stored as repo secrets |
| Release built from a lookalike fork | `repositories` in `composer.json` pointing at an untrusted VCS source |

Different language, identical pattern: **long-lived, over-privileged credentials, plus an install process that runs code automatically.**

## Defense one: keep keys out of the repo, and catch them if they get in

[gitleaks](https://github.com/gitleaks/gitleaks) is an open-source secret scanner. First, let's recreate the LiteLLM scenario: commit a config file containing a token, then delete it in another commit.

```bash
mkdir leak-demo && cd leak-demo && git init -q

# Generate a random "fake" GitHub token (right format, not real)
printf '{\n  "github_token": "ghp_%s"\n}\n' "$(openssl rand -hex 18)" > opencode.json
git add . && git commit -qm "add harness config"
git rm -q opencode.json && git commit -qm "remove config (oops)"

gitleaks dir .              # Scan only the current files
# INF no leaks found

gitleaks git . --redact -v  # Scan the entire git history
# RuleID:      github-pat
# File:        opencode.json
# Commit:      21ea758...
# WRN leaks found: 1
```

See that? Look only at the current files: clean. Scan the history: caught. That's the most direct proof that deleting the file is not the same as revoking the key.

Then add a pre-commit hook so the key can't even get committed in the first place:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.30.1
    hooks:
      - id: gitleaks
```

```bash
pip install pre-commit && pre-commit install

printf 'GITHUB_TOKEN=ghp_%s\n' "$(openssl rand -hex 18)" > .env.local
git add .env.local && git commit -m "add env"
# RuleID: github-pat  File: .env.local
# WRN leaks found: 1
# → the commit is blocked and never gets created
```

But I want to stress this: **the tools are just helpers — what really matters is the runbook.** The moment you find a leak, the order has to be:

1. **Revoke or rotate the key first** (go into the provider's dashboard and kill it)
2. Check the access logs from before the revocation to see whether it was used
3. Only then clean up git history — and assume someone has already cloned it

LiteLLM did part of step 3 and skipped step 1.

## Defense two: pin versions — and pin the contents too

### Python: `--require-hashes`

Writing just `litellm==1.106.2` pins the version number; adding a hash is what pins the file contents too. Here's a demo with the tiny package `six`:

```bash
pip download --no-deps six==1.16.0 -d dl
pip hash dl/six-1.16.0-py2.py3-none-any.whl
# --hash=sha256:8abb2f1d86890a2dfb989f9a77cfcfd3e47c2a354b01111771326f8aa26e0254
```

```text
# requirements.txt
six==1.16.0 --hash=sha256:8abb2f1d86890a2dfb989f9a77cfcfd3e47c2a354b01111771326f8aa26e0254
```

```bash
pip install --require-hashes -r requirements.txt
```

If the downloaded file doesn't match the hash, pip flat-out refuses:

```text
ERROR: THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE.
    Expected sha256 0000000000000000000000000000000000000000000000000000000000000000
         Got        8abb2f1d86890a2dfb989f9a77cfcfd3e47c2a354b01111771326f8aa26e0254
```

If even one package in the requirements file is missing a hash, `--require-hashes` mode refuses the whole thing, so nothing slips through. In practice you don't compute these by hand — `pip-compile --generate-hashes` or `uv pip compile --generate-hashes` will generate them for you. PHP is actually worse off here: `composer.lock` does have a `dist.shasum` field, but for packages downloaded from GitHub it's often empty, so Composer has no true equivalent of content pinning. You can only shore it up with `composer audit` and the discipline of "don't rush to upgrade."

But to be honest about what hash pinning **can't** protect against: if you deliberately upgrade to 1.107.0 and regenerate the hashes, it'll install just fine. What it protects against is "same version number, swapped contents," and "automatic upgrades nobody noticed."

### What would actually have stopped this attack: a minimum release age

This malicious release only lived for two hours. If your install process only accepts versions "published more than a few days ago," you'd almost certainly never get it. Newer versions of pip have this built in (I tested with pip 26.2):

```bash
pip install --uploaded-prior-to P7D litellm
# Only consider versions uploaded at least 7 days ago
```

When I tested it, the latest on PyPI was 1.106.6; with `P7D`, pip picked 1.106.5. The uv equivalent is `--exclude-newer`.

The cost is that urgent security fixes reach you a few days late, so when you genuinely need to upgrade right away, you need a way to let a single package through. It's a trade-off, but I think it's well worth it for most teams.

### Docker: use digests, not tags

The poisoned tags this time included `v1.107.0`, `latest`, `main-latest` and `main-stable`. A tag is just a label that can be repointed, and `latest` changes practically every day. To lock down the contents, use a digest:

```bash
docker buildx imagetools inspect ghcr.io/berriai/litellm:v1.106.2
# Digest: sha256:7294b90f868c5c38c99b83021c7ba46f9b439e95f8e32964c925c7d2563a03f7
```

```yaml
# docker-compose.yml
services:
  litellm:
    image: ghcr.io/berriai/litellm:v1.106.2@sha256:7294b90f868c5c38c99b83021c7ba46f9b439e95f8e32964c925c7d2563a03f7
```

When you write both a tag and a digest, Docker goes by the digest; the tag is just there for humans.

## Defense three: scan Python startup hooks in CI

Finally, a small script that lists everything that runs automatically when Python starts.

I stepped on a landmine here that's worth sharing: **the scanner is itself Python, so it also triggers `.pth` files when it starts.** I ran my first version straight up, and the scanner itself executed the mock `cook.pth` before doing anything else.

The fix is to run it with `python -S`: `-S` means don't load the `site` module, so `.pth` files never get processed. But that creates a second landmine: without `site`, Python also doesn't read the venv's `pyvenv.cfg`, so `sys.prefix` points at the system Python and you end up scanning the wrong place. So you have to work your way back to the venv root from the executable's location yourself:

```python
#!/usr/bin/env python3
"""List code that runs automatically when Python starts: import lines in .pth files, sitecustomize / usercustomize.

Usage: python3 -S -I scan_startup_hooks.py [--allow FILENAME ...]
  Always pass -S: don't load site, so the scan never executes a suspicious .pth first.
Exit code: 1 if anything not on the allowlist is found (drop it straight into CI).
"""
import argparse
import site
import sys
from pathlib import Path

# Common, expected .pth files (setuptools, virtualenv, editable installs)
DEFAULT_ALLOW = {"distutils-precedence.pth", "zz-distutils-precedence.pth", "_virtualenv.pth"}
HOOK_MODULES = ("sitecustomize.py", "usercustomize.py")


def site_dirs() -> list[Path]:
    # Under -S, site doesn't process pyvenv.cfg and sys.prefix still points at the system Python,
    # so find the venv root from the executable's location ourselves
    prefixes = [sys.prefix]
    venv_root = Path(sys.executable).parent.parent
    if (venv_root / "pyvenv.cfg").exists():
        prefixes.insert(0, str(venv_root))
    dirs = set(site.getsitepackages(prefixes))
    if site.ENABLE_USER_SITE:
        dirs.add(site.getusersitepackages())
    return sorted(Path(d) for d in dirs if Path(d).is_dir())


def scan(allow: set[str]) -> list[str]:
    findings = []
    for d in site_dirs():
        for pth in sorted(d.glob("*.pth")):
            if pth.name in allow or pth.name.startswith("__editable__"):
                continue
            for no, line in enumerate(pth.read_text(errors="replace").splitlines(), 1):
                # site.py only "executes" lines starting with import; everything else is treated as a path
                if line.lstrip().startswith(("import ", "import\t")):
                    findings.append(f"[pth]  {pth}:{no}: {line.strip()[:120]}")
        for name in HOOK_MODULES:
            if (d / name).exists():
                findings.append(f"[hook] {d / name}")
    return findings


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--allow", nargs="*", default=[], help="additional .pth filenames to allow")
    args = p.parse_args()
    findings = scan(DEFAULT_ALLOW | set(args.allow))
    print(f"python: {sys.executable}")
    for f in findings:
        print(f)
    print(f"{len(findings)} startup hook(s) need manual review")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
```

Running it in the venv where we planted the mock `cook.pth` and `sitecustomize.py` earlier:

```bash
/tmp/pth-demo/bin/python -S -I scan_startup_hooks.py
# [pth]  .../site-packages/cook.pth:1: import sys; sys.stderr.write(...)
# [hook] .../site-packages/sitecustomize.py
# 2 startup hook(s) need manual review
# (exit code 1)
```

There's **no** `[demo] cook.pth executed` in the output, which means this scan didn't trigger it.

Wiring it into CI is simple: add a step after `pip install` that runs this script and fails the job on a non-zero exit code; once you've confirmed a `.pth` is fine, add it to `--allow`.

## If you're a maintainer: protect your own release process

The three defenses above are from the "consumer" point of view. If you publish packages or Docker images yourself, LiteLLM's lessons boil down to a checklist:

- [ ] Automation always uses a **GitHub App** or a fine-grained PAT — never a personal `gh` CLI token, and definitely never stored as a secret
- [ ] Publishing secrets live in an **Environment**, usable only from `main` or release tags
- [ ] The Environment requires reviewers, with **Prevent self-review** turned on
- [ ] Rulesets on release branches have **no bypass** — owners go through PRs too
- [ ] If a security control has to be temporarily relaxed, write down an expiry date and step up monitoring
- [ ] Regularly review "bypass branch protection" and "workflow run deleted" events in the organization audit log — this attack had both

## If you installed 1.107.0

Following LiteLLM's official [incident post](https://docs.litellm.ai/blog/security-incident-oct-21-2026) and Wiz's recommendations:

- [ ] Check `site-packages` for `cook.pth`, `cook.py`, `sitecustomize.py`, or a `/tmp/.pc_once_*` marker file
- [ ] Check network logs for any connections to `litellm[.]dev` (a lookalike domain; the official one is `litellm.ai`)
- [ ] **Assume every credential this machine could reach has leaked**: cloud keys, LLM API keys, database connection strings, SSH keys — rotate all of them
- [ ] If LiteLLM Proxy was connected to PostgreSQL, rotate the upstream provider keys stored there too
- [ ] Check AWS CloudTrail for unusual `sts:GetCallerIdentity` and `bedrock:ListFoundationModels` calls
- [ ] Rebuild affected environments rather than just upgrading the package, because the malicious code may have already run

## Wrapping up

Looking back over the whole chain, every link on its own is pretty ordinary: a key committed by mistake, automation running on an over-privileged token, CI that can read every secret, owners who can bypass branch protection, release review temporarily relaxed to hit a deadline. The scary part is that they all happened to line up.

As a developer making the move from Laravel to DevOps, here are the four things I'm taking away from this incident:

1. **The order for a leaked key is revoke → investigate → clean up**, and never the other way around
2. **Automation credentials should be least-privilege and expire**: GitHub Apps first; personal CLI tokens are a non-starter
3. **Pin the contents along with the version**: hashes, digests and a minimum release age, stacked together
4. **Signatures and provenance prove "where it came from," not "that it's safe"**

The [next post](/blog/2026-11-03-github-actions-hardening) spins up a brand-new Vite + React project, sets up CI the way I usually do, and then actually runs zizmor to see how many holes a "normal" CI has.

## References

- [LiteLLM: The attack chain behind the v1.107.0 LiteLLM release](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain) (2026-10-23)
- [Wiz: LiteLLM Compromised, Steals Credentials](https://www.wiz.io/blog/litellm-compromised-steals-credentials) (2026-10-21)
- [The Register: LiteLLM supply chain attack started with an exposed master key](https://www.theregister.com/security/2026/10/26/litellm-supply-chain-attack-started-with-an-exposed-master-key/5305544) (2026-10-26)
- [Python docs: site — Site-specific configuration hook](https://docs.python.org/3/library/site.html)
- [GitHub docs: Sudo mode](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/sudo-mode)
- [gitleaks](https://github.com/gitleaks/gitleaks)
