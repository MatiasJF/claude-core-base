# claude-core-base

[Español](README.md)

A starting point for your own Claude Code core: a plugin marketplace, global
rules, templates and an installer. Copy it to your account, personalize it once
and install it the same way on every machine you use.

The idea: whatever is common to all your machines lives in one repo; whatever
belongs to a company, a client or a project stays on its machine or in its repo.

## Getting started

```bash
# 1. Create your copy ("Use this template" on GitHub, or a fork) and clone it
git clone https://github.com/TU_USUARIO/claude-core-base.git
cd claude-core-base

# 2. Replace the placeholders with your username (and optionally rename the marketplace)
bash personalizar.sh your-github-username

# 3. Validate, commit and push
claude plugin validate .
```

On each machine:

```bash
claude plugin marketplace add https://github.com/TU_USUARIO/claude-core-base.git
bash ~/.claude/plugins/marketplaces/claude-core-base/install.sh
```

`install.sh` installs `core-tools` and `orchestrator` (or the plugins you pass
as arguments), copies the rules to `~/.claude/rules/` and, if the machine has no
`~/.claude/CLAUDE.md`, copies the template. It does not touch settings or delete
anything: if a rule already exists and differs, the old one is kept as
`.bak-<date>`.

Private repos, servers with a deploy key, Windows, and how to decide what
belongs in the core: [docs/guide.en.md](docs/guide.en.md).

## Plugins

Own (they live in this repo, MIT licensed):

| Plugin | Contents | Requirements |
|---|---|---|
| `core-tools` | `/generate-tech-docs`, `/scan-secrets` | Python 3 for the documentation generator |
| `orchestrator` | Multi-agent orchestration: planner, worker, verifier, synthesizer and four workflows | — |
| `mcp-n8n` | `n8n-mcp` MCP server | Docker |
| `webdev-toolkit`, `scraping-toolkit`, `analytics-toolkit`, `database-toolkit`, `security-toolkit`, `devops-toolkit`, `maintenance-toolkit` | One discipline skill per domain | — |

External (not copied; installed from their author's repo):

| Plugin | Source | License |
|---|---|---|
| `taste-skill` | github.com/Leonxlnx/taste-skill | MIT |
| `hyperframes` | github.com/heygen-com/hyperframes | Apache-2.0 |
| `impeccable` | github.com/pbakaus/impeccable | Apache-2.0 |

How to think about multi-agent orchestration: [guidebooks/orchestration.md](guidebooks/orchestration.md).

## Outside the plugins

A plugin cannot ship a user-level `CLAUDE.md`, rules or settings, so those
pieces live in `global/` and `install.sh` copies them:

| File | Destination |
|---|---|
| `global/CLAUDE.md` | `~/.claude/CLAUDE.md` (only if missing) |
| `global/rules/*.md` | `~/.claude/rules/` |
| `global/settings.template.json` | Merged by hand into `~/.claude/settings.json` |

The rules (way of working, code, commits, tests and documentation) are an
opinionated example, written in Spanish: edit them or replace them with your
own. `templates/CLAUDE.proyecto.md` is the skeleton for a new project's
`CLAUDE.md`. The installer's messages are in Spanish too.

## Repo rules

- No credentials, no client names, no paths from a specific machine.
- Third-party material: only with its license and source noted.
- Run `/scan-secrets` before every push.

## License

MIT. External plugins keep their author's license.
