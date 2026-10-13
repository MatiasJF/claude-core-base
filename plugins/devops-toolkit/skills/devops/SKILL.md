---
name: devops
description: This skill should be used when the user asks to "set up CI", "deploy this", "write a Dockerfile", "add a GitHub Action", "configure infrastructure", "set up monitoring", "why did the deploy fail", or does any CI/CD, infrastructure-as-code, or deployment work. Sets pipeline conventions, deploy gates, and rollback discipline.
version: 0.1.0
---

# DevOps

CI/CD, infrastructure-as-code, and deployments — with the gates that make "deploy" a boring word.

## Deploy gates (hard rules)

1. **Dry-run first** wherever the tool offers one (`--dry-run`, `terraform plan`, `--diff`): show the delta before applying. Apply without a reviewed plan only for dev environments.
2. **Production changes get explicit confirmation** — state what, where, and the blast radius, then wait. Includes "small" config changes; config is code with worse test coverage.
3. **Rollback path stated before rollout** — how to get back (previous image tag, `terraform apply` of prior state, migration down). If rollback is impossible (data migrations), say so and gate harder.
4. **Secrets live in the platform's secret store** (Actions secrets, vault, SSM) — never in workflow files, Dockerfiles, images, or logs. Echoing a secret into CI logs = leaked (logs are readable long after).

## CI conventions

- Pipeline stages in order of cheapness: lint → typecheck → unit → build → integration/e2e — fail fast on the cheap ones.
- CI installs from lockfiles; builds are reproducible or the flakiness is a bug to fix, not retry around.
- Cache dependencies, never build outputs that embed secrets/environment.
- A red main branch is everyone's top priority — no feature work on top of a broken pipeline.

## Infrastructure-as-code

- Everything that exists in the cloud exists in code; console-clicked resources are drift (import or delete them).
- State files are sacred + contain secrets: remote backend, locked, never committed.
- Modules/environments: dev/staging/prod differ by variables, not by divergent copies.

## Containers

- Multi-stage builds; final image runs as non-root; pin base image majors.
- `.dockerignore` before debugging image size; no secrets in any layer (layers are forever, even "deleted" ones).

## Observability minimum

Every deployed service ships with: a health endpoint, structured logs (JSON, with request ids), and an alert on the one metric that means "users are hurt" (error rate or p99). Dashboards without alerts are wall art.

## When NOT to use this skill

Application code inside the containers (webdev/database toolkits); one-off local scripts with no deployment; cloud *cost optimization* studies (analytics job — data first).
