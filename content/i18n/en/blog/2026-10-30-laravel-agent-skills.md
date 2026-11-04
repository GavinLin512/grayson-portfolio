---
title: "An Artisan Manual for AI: Writing a SKILL.md for a Laravel Project"
date: 2026-10-30
tags: [ai, php, laravel]
description: Agent Skills was donated to the AAIF under the Linux Foundation and is now an official cross-vendor standard. First a look at what the AGENTS.md shipped in the Laravel 13 skeleton tells your agent to do, then a laravel-conventions skill written to the spec — Pint, Larastan and tests in one run — and finally the security of third-party skills.
---

## Skills just became an industry standard

On October 22, Anthropic announced it was donating **Agent Skills** to the Agentic AI Foundation (AAIF) under the Linux Foundation — the same foundation that took over MCP. A few numbers:

- Since it was published as a standard in December 2025, **more than 70 agent platforms** have adopted it, including ChatGPT, Cursor, GitHub Copilot and VS Code
- **1 million skills** have been published, with nearly **280 million** installs
- Going forward, engineers from Anthropic, Google, OpenAI and other companies will maintain it as individuals

The definition of a skill is almost comically simple: **a folder with a `SKILL.md` in it**, plus some scripts and reference docs if you need them. That's it.

My first reaction was: isn't this just an Artisan command manual written for AI? So in this post I'll actually write one for a Laravel project.

## Skills, AGENTS.md, MCP — what's the difference?

I kept mixing these up at first, so I made a table:

| | When it gets read | What it's good for | Laravel analogy |
|---|---|---|---|
| `AGENTS.md` | **The whole file is read** as soon as the agent starts | Background knowledge that applies to the whole project | `README.md` / `CONTRIBUTING.md` |
| Skill | Only the **name and description** at startup; the full text when needed | Workflows, rules and scripts for specific tasks | An Artisan command: `php artisan list` only shows the signature and description, and `handle()` only runs when you invoke it |
| MCP server | When the agent calls a tool | Connecting to external systems (databases, APIs, browsers) | A driver for an external service |

The cleverest part of skills is **progressive disclosure**, which the spec spells out precisely:

1. **Metadata (~100 tokens)**: the `name` and `description` of every skill, loaded when the agent starts
2. **Instructions (< 5000 tokens recommended)**: the `SKILL.md` body, loaded only when the agent decides to use that skill
3. **Resources (as needed)**: files in `scripts/`, `references/` and `assets/`, read only when they're used

So you can install dozens of skills and they normally cost only a few dozen lines of descriptions in context. That's very different from `AGENTS.md`, which "gets stuffed in whole whether it's needed or not."

## First, what does Laravel 13 ship with?

Before writing anything, I spun up a new project with `composer create-project laravel/laravel` and discovered that **the Laravel 13 skeleton already ships with `AGENTS.md` and `CLAUDE.md`** (identical content, 47 lines, wrapped in a `<laravel-boost-guidelines>` tag).

Roughly, they say:

1. First check whether `php` and `composer` are available
2. If not, **detect the user's operating system and run the install command yourself**:

```sh
# macOS / Linux
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

```powershell
# Windows PowerShell
... iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

3. Then install Laravel Boost: `composer require laravel/boost --dev`, `php artisan boost:install`
4. Boost **replaces this `AGENTS.md` with guidelines generated for this project**, then tells the agent to read `AGENTS.md` again

`php.new` is Laravel's official installer script, and for beginners this design is genuinely thoughtful: clone the repo, open an agent, and the environment sets itself up.

But from a security point of view, reading this made me a little uneasy. The file does three things:

- Tells the agent to run scripts downloaded from the internet (`bash -c "$(curl ...)"`, `iex(...)`)
- Tells the agent to install new packages
- Tells the agent to rewrite its own instruction file and then follow the new contents

**In form, that's identical to how malicious instruction files attack**. The only difference is whether you trust the person who wrote the file. [Post 5](/blog/2026-11-04-agents-md-hijack-defense) goes into a real attack in detail, and you'll see just how similar the two are.

My advice: for personal or learning projects, it's handy to keep; for **team projects**, replace it with content your team has reviewed. In a team where everyone already has PHP installed, an instruction telling the agent to go install PHP is just one more risk.

### A side note: Composer has no "minimum release age"

While setting up the project, I glanced at the release times in `composer.lock`: `laravel/framework` itself, plus `larastan/larastan` and `phpstan/phpstan` that I installed later, **were all versions released less than two days earlier**.

Composer dutifully grabbed the latest versions, but it has no setting like pnpm's `minimumReleaseAge` that says "only install versions released more than N days ago." [Post 4](/blog/2026-11-03-github-actions-hardening) covers why that mechanism matters. On the PHP side, for now, all you have is `composer.lock` plus the discipline of "check the release date when you upgrade."

## Building it: the `laravel-conventions` skill

### Where it goes

The spec itself doesn't say where skills live, only what goes inside the folder. But the official guide for agent developers notes that **`.agents/skills/`** has become a widely adopted convention for sharing across tools, and some tools also read their own native directory (for example `.claude/skills/`). I put it in `.agents/skills/`; if your tool doesn't read that, follow its docs.

```text
.agents/skills/laravel-conventions/
├── SKILL.md                  # required: metadata + instructions
├── references/
│   └── conventions.md        # naming rules, read only when needed
└── scripts/
    └── check.sh              # Pint + Larastan + tests
```

### `SKILL.md`

````markdown
---
name: laravel-conventions
description: Team conventions for this Laravel app — naming for migrations, models, controllers and tests, plus the checks every change must pass (Pint, Larastan, tests). Use when creating or changing PHP code, migrations or tests in this repository, or before saying a task is done.
license: MIT
metadata:
  owner: pulse-team
  version: "1.0"
---

# Laravel conventions

## When to use

Use this skill whenever you add or change PHP code, migrations, or tests in this repository.

## Workflow

1. Read [references/conventions.md](references/conventions.md) before creating new files.
2. Make the change.
3. Run the checks from the repository root:

   ```bash
   bash .agents/skills/laravel-conventions/scripts/check.sh
   ```

4. If a check fails, fix the cause and run the script again. Do not edit `phpstan.neon` or `pint.json`, and do not skip or delete tests, to make a check pass. If you believe a rule is wrong, stop and ask the user.

## Available scripts

- **`scripts/check.sh`** — Runs Pint (`--test`), Larastan and the test suite. Prints one JSON summary line to stdout, tool output to stderr. Run with `--help` for options and exit codes.

## Rules that are easy to miss

- Ask the user before running `composer update` or adding a package. Use `composer install` only.
- Never call `env()` outside `config/`. Read settings through `config()`.
- Migrations are append-only: add a new migration instead of editing one that may already have run.
````

A few things I thought through while writing it:

**`description` is written for matching, not for humans**. At startup the agent only sees the name and description, and it relies on this paragraph to decide "should I use this skill for the current task?" So it has to say clearly **what it does** and **when to use it**, with keywords (PHP code, migrations, tests, before saying a task is done). The spec's bad example is `description: Helps with PDFs.` — so vague the agent has no idea when to call it.

**`name` has strict rules**: only lowercase letters, digits and hyphens, no leading or trailing hyphen, no consecutive `--`, and it **must match the folder name**.

**The most important rule: "don't change config or delete tests to make a check pass"**. Anyone who's used a coding agent has probably seen this: PHPStan reports an error and the agent's "fix" is lowering the level or adding an `ignoreErrors` line to `phpstan.neon`; a test fails, so it marks the test as skipped. This rule is there to block that kind of "turn the indicator green while the problem's still there" behavior.

**Write rules in a positive voice**. I originally wrote "Never run composer update ... without asking," then changed it to "Ask the user before running composer update." The reason is in post 5: the scanner I built flags "without asking" as a suspicious phrase, because malicious instruction files love that kind of sentence. The positive phrasing means the same thing and doesn't look like attack text.

**Put long rules in `references/`**. The naming rules are a table the agent only needs when creating new files, so they live in `references/conventions.md` and load on demand:

```markdown
# Naming and structure

| What | Convention | Example |
|------|------------|---------|
| Migration | `create_<table>_table` / `add_<column>_to_<table>_table` | `add_archived_at_to_projects_table` |
| Model | Singular StudlyCase | `Project`, `DeployLog` |
| Controller | Singular + `Controller`, resource methods only | `ProjectController@store` |
| Form request | `<Action><Model>Request` | `StoreProjectRequest` |
| Test | Mirrors the class under test | `tests/Feature/ProjectControllerTest.php` |

- Validation lives in Form Requests, not controllers.
- Every new route needs a feature test that covers the happy path and one failure.
```

### `scripts/check.sh`: a script written for an agent to run

The official "Using scripts in skills" guide has some very practical advice, and I followed all of it:

- **Never be interactive**: agents run in non-interactive shells, and any "press y to continue" will hang them
- **Document the interface with `--help`**: that's the main way an agent learns how to use your script
- **Use different exit codes for different failures**, and list them in `--help`
- **Structured data on stdout, diagnostics on stderr**: the agent can read the result cleanly and look at the details only when it needs to

```bash
#!/usr/bin/env bash
# Runs Pint, Larastan and the tests in order. Built for agents: non-interactive, --help documents the interface,
# stdout prints a single JSON summary line, and all tool output goes to stderr.
set -uo pipefail

usage() {
  cat <<'USAGE'
Usage: check.sh [--only pint|phpstan|tests]

Runs the repository checks from the project root:
  pint     vendor/bin/pint --test        (code style, no changes made)
  phpstan  vendor/bin/phpstan analyse    (Larastan, config in phpstan.neon)
  tests    php artisan test

stdout: one JSON line, e.g. {"pint":"pass","phpstan":"fail","tests":"pass"}
stderr: full tool output

Exit codes:
  0  all checks passed
  1  at least one check failed
  2  invalid arguments
  3  not run from a Laravel project root (artisan or vendor/ missing)
USAGE
}

only=""
case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  --only) only="${2:-}"
          [[ "$only" =~ ^(pint|phpstan|tests)$ ]] || { usage >&2; exit 2; } ;;
  "") ;;
  *) usage >&2; exit 2 ;;
esac

if [[ ! -f artisan || ! -d vendor ]]; then
  echo "check.sh: run from the Laravel project root after composer install" >&2
  exit 3
fi

declare -A result
failed=0
run() {  # run <name> <command...>
  local name=$1; shift
  [[ -n "$only" && "$only" != "$name" ]] && return
  echo "== $name: $*" >&2
  if "$@" >&2; then result[$name]=pass; else result[$name]=fail; failed=1; fi
}

run pint    vendor/bin/pint --test
run phpstan vendor/bin/phpstan analyse --no-progress --memory-limit=512M
run tests   php artisan test

json="{"; sep=""
for name in pint phpstan tests; do
  [[ -n "${result[$name]:-}" ]] || continue
  json+="${sep}\"$name\":\"${result[$name]}\""; sep=","
done
echo "$json}"
exit "$failed"
```

`pint --test` only checks and never modifies, so the agent doesn't "just run the checks" and quietly reformat a pile of files. Tests run through `php artisan test`, which works whether your project uses PHPUnit or Pest (the Laravel 13 skeleton defaults to PHPUnit, but `composer.json` already allows Pest's Composer plugin).

Larastan has to be installed separately, plus a minimal `phpstan.neon`:

```bash
composer require --dev larastan/larastan
```

```yaml
# phpstan.neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    paths:
        - app/
    level: 5
```

### Running it for real

I ran it inside a `php:8.4.27-cli` container (which happens to be the PHP2Shell fix release from [post 1](/blog/2026-10-29-php2shell-patch-pipeline)). On the fresh project, everything passes:

```bash
bash .agents/skills/laravel-conventions/scripts/check.sh 2>/dev/null
# {"pint":"pass","phpstan":"pass","tests":"pass"}
# exit=0
```

Then I deliberately added a class with three problems — bad formatting, a call to a method that doesn't exist — plus a test with the wrong expected value:

```php
<?php

namespace App\Support;

class DeployWindow
{
    public function minutesLeft(int $closesAt): int
    {
        $now=time();
        return max(0, (int) round(($closesAt - $now) / 60));
    }

    public function label(int $closesAt): string
    {
        return $this->minutesLeft($closesAt) . ' min left' . $this->unknownSuffix();
    }
}
```

stdout is a single line, so the agent can see at a glance what broke:

```text
{"pint":"fail","phpstan":"fail","tests":"fail"}
exit=1
```

stderr has the full details (excerpt):

```text
== pint: vendor/bin/pint --test
    FAIL   ........................................... 28 files, 1 style issue
  ⨯ app/Support/DeployWindow.php concat_space, blank_line_before_statement, b…
== phpstan: vendor/bin/phpstan analyse --no-progress --memory-limit=512M
  15     Call to an undefined method
         App\Support\DeployWindow::unknownSuffix().
 [ERROR] Found 1 error
== tests: php artisan test
  ⨯ open window counts minutes
  Failed asserting that 15 is identical to 10.
  Tests:    1 failed, 3 passed (4 assertions)
```

Look at the test result: `time() + 900` is 15 minutes, so **the test's expected value is wrong, not the code**. That's exactly what the skill's rule is for: the agent should fix the expected value and explain why, not delete or skip the test.

Invalid arguments also return exit code 2, as documented in `--help`:

```bash
bash .agents/skills/laravel-conventions/scripts/check.sh --only lint
# exit=2
```

### Validating SKILL.md with the official tool

The spec says you can validate the format with `skills-ref`. The package is called `skills-ref` on PyPI, but **the command it installs is `agentskills`** — that took me a minute to figure out:

```bash
pip install skills-ref==0.1.1
agentskills validate .agents/skills/laravel-conventions
# Valid skill: .agents/skills/laravel-conventions
```

Trying a skill with a deliberately bad name:

```bash
agentskills validate badskill/Laravel_Conventions
# Validation failed for badskill/Laravel_Conventions:
#   - Skill name 'Laravel_Conventions' must be lowercase
#   - Skill name 'Laravel_Conventions' contains invalid characters. Only letters, digits, and hyphens are allowed.
```

Another very instructive command is `to-prompt`, which prints **what the agent actually sees at startup**:

```bash
agentskills to-prompt .agents/skills/laravel-conventions
```

```xml
<available_skills>
<skill>
<name>
laravel-conventions
</name>
<description>
Team conventions for this Laravel app — naming for migrations, models, controllers and tests, plus the checks every change must pass (Pint, Larastan, tests). Use when creating or changing PHP code, migrations or tests in this repository, or before saying a task is done.
</description>
<location>
.../.agents/skills/laravel-conventions/SKILL.md
</location>
</skill>
</available_skills>
```

Just the name, the description and the location. That's the first layer of progressive disclosure, and it shows once more **why the `description` has to be good**: when the agent decides whether to use your skill, these few lines are all it has.

## Using third-party skills safely

Writing your own skill is safe, because you've read all of it. But with a million skills out there, someday you'll want to install someone else's.

When you do, remember: **a skill isn't just documentation — it can ship scripts**, and the agent will run them. Installing a third-party skill is essentially installing a package that gets executed, except it also tells the agent "this is how you should work."

A few points from the spec and the official guides are worth noting:

- **`allowed-tools` is still experimental**: it can list "pre-approved tools," but the spec says support varies between implementations, so don't treat it as a security boundary
- **Project-level skills may come from an untrusted repo**: the official advice to agent developers is to load project-level skills only when the user has marked the project as trusted, to avoid "clone a repo and get instructions slipped in silently"
- The roadmap after the AAIF handover explicitly includes **security guidance for people who write and install skills**, which tells you the maintainers also see this as an open problem

My own checklist:

- [ ] **Read the whole `SKILL.md` and every script**, the same way you'd review a PR
- [ ] Watch especially for: downloading remote scripts (`curl | sh`, `bash -c "$(curl ...)"`), installing packages, rewriting agent config files, and sentences like "don't tell the user"
- [ ] **Pin the version**: a git submodule pointing at a specific commit, or copy the skill straight into the repo and review the diff on updates
- [ ] The principles from the other posts apply to third-party skill scripts too: anything that downloads stuff should pin versions and hashes
- [ ] For an untrusted repo, check which skills and instruction files it contains before opening an agent

[Post 5](/blog/2026-11-04-agents-md-hijack-defense) builds a scanner specifically for checking these files before you start an agent (it supports `SKILL.md` too), and covers a real attack that hijacked agents with an `AGENTS.md`.

## Wrapping up

My biggest takeaway from writing this skill: **it's really just writing down your team's unwritten rules**. The naming rules new hires have to learn, the checks to run before a PR, the "don't touch old migrations" lessons you only learn by getting burned — they used to live on a Confluence page nobody read. Written as a skill, at least the AI follows them diligently.

And because it's an open standard, a skill you write today still works tomorrow when you switch agent tools. For a team, that's a better investment than "which AI tool should we pick."

The [next post](/blog/2026-11-02-litellm-unrevoked-key-supply-chain) returns to the supply chain: LiteLLM got poisoned for the second time this week, and it all started with one key someone forgot to revoke.

## References

- [Anthropic: Donating Agent Skills to the Agentic AI Foundation](https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation) (2026-10-22)
- [Simon Willison: Donating Agent Skills to the Agentic AI Foundation](https://simonwillison.net/2026/Oct/22/donating-agent-skills/)
- [Agent Skills specification](https://agentskills.io/specification)
- [Agent Skills: Using scripts in skills](https://agentskills.io/skill-creation/using-scripts)
- [Agent Skills: How to add skills support to your agent](https://agentskills.io/client-implementation/adding-skills-support)
- [Larastan](https://github.com/larastan/larastan)
- [Laravel Pint](https://laravel.com/docs/pint)
