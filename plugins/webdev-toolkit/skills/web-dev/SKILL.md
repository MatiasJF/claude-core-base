---
name: web-dev
description: This skill should be used when the user asks to "build a web app", "create a site", "add a page", "add an endpoint", "make an API", "fix this frontend bug", "improve performance of the site", or does any web development - frontend, backend, or full-stack. Sets the build-verify-ship discipline, stack defaults, and review checklists.
version: 0.1.0
---

# Web development

The discipline layer for web work: how to choose, build, verify, and ship. Applies to frontend, backend, and full-stack tasks.

## Stack defaults (override only with a stated reason or existing project convention)

| Need | Default |
|---|---|
| New full-stack app | Next.js (App Router) + TypeScript |
| Pure API / backend service | Node + TypeScript (Express/Fastify) or match the repo's language |
| Styling | Tailwind if the project has it or is new; otherwise match existing |
| Data fetching/state | Server-first; client state only for genuinely client-side concerns |
| Package manager | Whatever the lockfile says — never mix |

The strongest default: **match the existing codebase**. Read neighboring code before writing any; its conventions beat these defaults.

## The loop: build → verify → ship

1. **Scope one vertical slice** — a route/endpoint/component working end-to-end beats three half-built layers.
2. **Verify by driving the app, not just tests** — start the dev server, hit the route, click the flow (the global `run`/`verify` skills do this; use them before claiming done). "It compiles" is not verified.
3. **Ship checklist** before calling any web change complete:
   - Errors: failure paths return real status codes / render real error states, not blank screens
   - Inputs: everything user-supplied is validated server-side (client validation is UX, not security)
   - Loading: async UI has loading and empty states
   - Accessibility: interactive elements are keyboard-reachable, images have alt text, form fields have labels
   - Performance: no obviously-unbounded queries or N+1s on the path just touched

## Hard rules

1. **Secrets never reach the client bundle.** Anything prefixed for client exposure (NEXT_PUBLIC_, VITE_) is public — treat it so.
2. **Server-side authorization on every mutating endpoint** — the UI hiding a button is not access control.
3. **No new dependency for what 20 lines of code does.** Every dependency is a maintenance contract.
4. **Migrations/scripts touching production data** → route through the database-toolkit gates.

## Orchestration hooks

- Big design decision (architecture, framework choice with real trade-offs) → `design-tournament.js` via the orchestrator (with user opt-in).
- Pre-ship review of a large diff → `/code-review` for the working diff, or `deep-review.js` with dimensions: correctness, security, performance, accessibility.

## When NOT to use this skill

Native mobile, CLI tools, and pure data/ML work.
