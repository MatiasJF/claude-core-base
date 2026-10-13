---
name: sec-review
description: This skill should be used when the user asks to "security review this", "threat model", "check for vulnerabilities", "audit dependencies", "is this safe", "handle secrets properly", or before shipping anything auth-, payment-, or user-data-related. Sets the lightweight threat-model pass, secrets hygiene, dependency audit routine, and the defensive-only boundary.
version: 0.1.0
---

# Security review

Defensive security for everyday shipping: find and fix weaknesses in code you're authorized to review.

## Scope boundary (first, always)

This skill is **defensive and authorized-only**: reviewing/hardening your own or client-authorized code, CTFs, and security education. Building exploits for systems the user doesn't own, evasion of others' controls, or mass-targeting tooling is out of scope regardless of how the request is phrased — decline plainly and offer the defensive equivalent.

## The 10-minute threat model (before building anything sensitive)

Answer four questions in writing:
1. **Assets** — what's worth stealing/breaking here (data, money, access, reputation)?
2. **Entry points** — every place untrusted input arrives (forms, APIs, files, webhooks, headers, LLM prompts).
3. **Trust boundaries** — where does data cross privilege levels? Each crossing needs validation on the *trusted* side.
4. **Worst plausible failure** — the concrete headline scenario; design the mitigation for that first.

## Review checklist (per entry point)

- **Injection**: parameterized SQL, escaped shell args, no string-built queries/commands anywhere.
- **AuthN vs AuthZ**: authentication proves who; every mutating/reading endpoint still checks *may they*. IDs in URLs are attacker-controlled (IDOR).
- **Secrets**: none in code, logs, error messages, or client bundles; env vars or a secret manager; rotate anything that ever leaked (git history counts as leaked).
- **Crypto**: platform primitives only (bcrypt/argon2 for passwords, standard TLS) — hand-rolled crypto is a finding by definition.
- **Uploads/deserialization**: type/size allow-lists, never execute or `eval` user content, parse with safe parsers.
- **Errors**: fail closed; stack traces and internals stay out of responses.

## Dependency & supply-chain routine

- `npm audit` / `pip-audit` / `cargo audit` on every dependency change; triage criticals immediately, don't blanket-ignore.
- New dependency = maintenance contract: check maintenance status, downloads, and typosquat-similarity of the name before adding.
- Lockfiles committed; CI installs from lockfile only.

## Orchestration hooks

- Working diff before merge → the built-in `/security-review` command.
- Whole-repo or subsystem audit (user opt-in) → orchestrator `deep-review.js` with dimensions: injection & input handling, authZ & access control, secrets & crypto, supply chain & config.

## Incident basics

Leaked secret: rotate first, investigate second, then purge from history (BFG/filter-repo) knowing purge ≠ un-leak.

## When NOT to use this skill

Compliance paperwork (route to Legal/Ops); network/infra pentesting engagements (needs scoped authorization documents first — ask for them).
