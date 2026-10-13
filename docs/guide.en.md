# User guide

[Español](guia.md)

How to turn this base into your own core, install it on several machines and
decide what goes into it.

## 1. How the pieces fit

| Piece | What it is | How it reaches the machine |
|---|---|---|
| `.claude-plugin/marketplace.json` | Catalog: the list of own and external plugins | `claude plugin marketplace add` |
| `plugins/<name>/` | A plugin: skills, commands, agents, workflows or MCP servers | `claude plugin install <name>@<marketplace>` |
| `global/` | User-level `CLAUDE.md`, rules and settings | `install.sh` copies them to `~/.claude/` |
| `templates/` | Skeletons you copy by hand into new projects | By hand |
| `guidebooks/` | Reading material for people | Not installed |

Plugins cannot ship a user-level `CLAUDE.md`, rules or settings. That is why
`global/` and `install.sh` exist: they cover what the plugin system does not.

## 2. Create your repo

1. Create your copy with "Use this template" (fresh history) or a fork, and
   clone it. Decide whether it will be public or private: a private core can
   hold internal conventions; a public one must hold nothing you would not show.
2. Personalize:

   ```bash
   bash personalizar.sh your-username               # owner only
   bash personalizar.sh your-username my-core       # and rename the marketplace
   ```

   It replaces the `TU_USUARIO` placeholder (marketplace owner, plugin author
   and URLs) and, with the second argument, the name `claude-core-base`. If you
   rename, rename the GitHub repo too so the URLs match.
3. Edit `global/CLAUDE.md` and `global/rules/` to taste. They are an example,
   written in Spanish.
4. Validate and push:

   ```bash
   claude plugin validate .
   git add -A && git commit -m "chore: personalize core" && git push
   ```

## 3. Install on a machine

```bash
claude plugin marketplace add https://github.com/TU_USUARIO/claude-core-base.git
bash ~/.claude/plugins/marketplaces/claude-core-base/install.sh
```

With arguments, `install.sh` installs those plugins instead of the two
defaults:

```bash
bash ~/.claude/plugins/marketplaces/claude-core-base/install.sh core-tools orchestrator webdev-toolkit
```

Afterwards, merge `global/settings.template.json` into
`~/.claude/settings.json` by hand if you want the marketplace and plugins
declared in settings. Changes only show up in new Claude Code sessions: close
and reopen.

To update a machine, run `install.sh` again: it updates the marketplace,
installs whatever is missing and re-copies the rules.

## 4. By type of access

| Situation | How to register the marketplace |
|---|---|
| Public repo | HTTPS URL; no key needed |
| Private repo, personal machine | SSH URL with your usual key: `git@github.com:TU_USUARIO/claude-core-base.git` |
| Private repo, server | Read-only deploy key and a dedicated SSH alias (below) |

The `user/repo` shorthand clones over SSH. On a machine with no GitHub key it
fails even for a public repo: use the HTTPS URL. For the same reason, the
external plugins in the manifest use `{"source": "url"}` with HTTPS rather than
`{"source": "github"}`.

### Server with a deploy key

A deploy key grants access to a single repo. Read-only, a compromised server
cannot modify your core.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/claude_core_deploy -N "" -C "claude-core@$(hostname)"
cat ~/.ssh/claude_core_deploy.pub
```

Paste the public key into GitHub: repo → Settings → Deploy keys → Add deploy
key, leaving "Allow write access" unchecked. Then, in the server's
`~/.ssh/config`:

```
Host github-claude-core
  HostName github.com
  User git
  IdentityFile ~/.ssh/claude_core_deploy
  IdentitiesOnly yes
```

And register the marketplace through the alias:

```bash
claude plugin marketplace add git@github-claude-core:TU_USUARIO/claude-core-base.git
```

The alias keeps this key from clashing with other GitHub keys on the same
machine.

### Windows

- Git Bash runs `install.sh` unchanged.
- If the network blocks port 22, use SSH over 443 in `~/.ssh/config`:

  ```
  Host github-claude-core
    HostName ssh.github.com
    Port 443
    User git
    IdentityFile ~/.ssh/claude_core_deploy
    IdentitiesOnly yes
  ```

- If Git does not see the alias (it uses its own SSH and does not read the
  Windows OpenSSH configuration), point it at the Windows one:

  ```bash
  git config --global core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe"
  ```

## 5. What goes in the core and what stays local

| Question | If the answer is yes |
|---|---|
| Would you use it the same way on all your machines and projects? | Core |
| Does it name a company, client, machine, path or account? | Local: on the machine or in the project's repo |
| Does it depend on a folder layout that exists in only one place? | Local |
| Does it carry a credential, or an example value that looks real? | No repo at all |
| Is it someone else's work? | External reference by URL, with license and source; do not copy it |
| Is it a rule for one specific project? | That project's `CLAUDE.md` |

When in doubt, keep it local. Promoting something to the core later is easy;
removing it from the history of a published repo is not.

## 6. Adding plugins

Own plugin:

```
plugins/my-plugin/
  .claude-plugin/plugin.json     name, description, version, author
  skills/<skill>/SKILL.md        skills (frontmatter with name and description)
  commands/<command>.md          /my-plugin:<command> commands
  agents/<agent>.md              agents
  .mcp.json                      MCP servers
```

Add its entry to `marketplace.json` with `"source": "./plugins/my-plugin"` and
validate with `claude plugin validate .`.

External plugin: do not copy it. Add an entry with the HTTPS URL of its
author's repo, its license and its homepage:

```json
{
  "name": "name",
  "source": { "source": "url", "url": "https://github.com/author/repo.git" },
  "description": "External (license, author): what it does.",
  "license": "MIT",
  "homepage": "https://github.com/author/repo"
}
```

A plugin's skills and commands are namespaced (`plugin:skill`). If you used to
keep the same skills as loose copies in `~/.claude/skills/`, they now go by a
different name: delete the loose copies to avoid duplicates.

## 7. Before every push

- `/scan-secrets` on the repo.
- Search for your username, personal paths (`/Users/`, `/home/`, `C:\Users\`)
  and machine names.
- `claude plugin validate .`

## 8. Common problems

| Symptom | Cause and fix |
|---|---|
| `Permission denied (publickey)` when adding the marketplace or an external plugin | It is cloning over SSH without a key. Use the HTTPS URL, or set up the key |
| `install.sh` says the marketplace is not registered | `claude plugin marketplace add <URL>` is missing on that machine |
| Installed, but the skills do not show up | Changes only show up in new sessions |
| A skill shows up twice or under another name | Old loose copy in `~/.claude/skills/`; delete it |
| One of your rules changed after installing | `install.sh` overwrote it; the previous one sits next to it as `.bak-<date>` |
| SSH timeout on Windows or corporate networks | Port 22 blocked: `ssh.github.com:443` |
