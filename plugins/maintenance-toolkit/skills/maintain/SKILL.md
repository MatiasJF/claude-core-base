---
name: maintain
description: This skill should be used when the user asks to "update dependencies", "bump packages", "clean up dead code", "check repo health", "why is this repo stale", "do some maintenance", or wants recurring upkeep on a codebase. Sets the dependency-bump ritual, dead-code sweep method, and the repo health checklist.
version: 0.1.0
---

# Maintenance

Recurring upkeep that keeps a codebase cheap to change: dependency bumps, dead-code sweeps, health checks.

## Dependency-bump ritual (per batch, not per package)

1. **Inventory** — outdated list with current → available, grouped: patch / minor / major.
2. **Patch+minor batch first** — bump together, install from lockfile, run the full test suite plus a real smoke of the app (`run`/`verify` skills). Green → one commit for the whole batch.
3. **Majors one at a time** — read the changelog/migration guide BEFORE bumping (breaking changes are documented; discovering them via stack trace is slower), apply code changes, test, commit individually with the breaking-change notes in the message.
4. **Security criticals jump the queue** — audit findings with known exploits get bumped immediately even mid-other-work.
5. **Never** bump and commit untested "it's only a patch version" — patch versions break things weekly somewhere.

## Dead-code sweep method

Evidence before deletion, always:
1. Candidates via tooling (`knip`, `ts-prune`, `vulture`, coverage reports) — not vibes.
2. Per candidate: grep for dynamic references (string-built imports, reflection, DI containers, templates, config-referenced entry points) that static analysis misses.
3. Delete in small reviewable commits, full test + build between each.
4. Public API / exported symbols: deprecate first, delete a cycle later — someone external may import it.

Wide mechanical cleanups across many files → orchestrator `migrate-codebase.js` with a scouted site list and a verify command (user opt-in).

## Repo health checklist (run quarterly or on adoption of a repo)

- **Docs truth**: does README setup actually work on a clean machine? CLAUDE.md still accurate?
- **CI health**: pipeline green, no permanently-skipped tests, no `continue-on-error` band-aids.
- **Dependency debt**: count of majors behind; audit findings open.
- **Dead weight**: unused deps (`depcheck`/`knip`), stale branches (merged or >6 months idle — list for deletion, don't auto-delete), TODO/FIXME census with dates.
- **Secrets hygiene**: scan history (gitleaks/trufflehog) — anything found routes to security-toolkit incident basics.
- **Size anomalies**: large files in git history, generated artifacts committed.

Output: a short report — top 5 actions ranked by risk-reduction per effort, not a 40-item shame list.

## When NOT to use this skill

Feature work wearing a "refactor" hat (scope it honestly); performance optimization driven by a real incident (that's debugging — profile first); "rewrite it in X" (that's an architecture decision, not maintenance).
