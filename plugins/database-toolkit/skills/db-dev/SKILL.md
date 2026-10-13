---
name: db-dev
description: This skill should be used when the user asks to "design a schema", "write a migration", "optimize this query", "add an index", "fix this slow query", "set up the database", or does any database work - schema, migrations, queries, or ops. Sets migration discipline, query review rules, and destructive-operation gates.
version: 0.1.0
---

# Database development

Schema, migrations, queries, and the gates that keep data alive.

## Hard gates (before anything else)

1. **Destructive SQL requires the ritual**: before any DROP/DELETE/TRUNCATE/UPDATE-without-WHERE-review or destructive migration — (a) state what will be irreversibly lost, (b) confirm a backup/snapshot exists (ask, don't assume), (c) get explicit confirmation. On production: all three, every time, no familiarity exception.
2. **Know which environment you're in.** Echo the target (host/db name) before running anything mutating. "I thought it was staging" is the classic postmortem sentence.
3. **Migrations never edit history** — fix a bad migration with a new forward migration, not by editing an applied one.

## Schema design rules

- **Model the queries, not just the entities** — list the top 5 access patterns first; they decide indexes and denormalization, not diagram aesthetics.
- Every table: primary key, `created_at`/`updated_at`, and explicit FK constraints (application-enforced integrity is a promise, DB-enforced is a fact).
- Types tell the truth: money in integer minor-units or DECIMAL (never float), timestamps with timezone, enums/CHECKs for closed sets.
- NULL means "unknown", not "false" or "empty" — pick defaults deliberately.

## Migration discipline

- **Reversible by default** — every migration ships its down path, or an explicit "irreversible because X" note.
- **Expand → migrate → contract** for anything touching live traffic: add the new shape, backfill, switch readers, only then drop the old. Never rename-in-place on a hot table.
- Backfills batched (thousands per iteration, with progress) — a single UPDATE on millions of rows is an outage.

## Query review checklist

- EXPLAIN anything for a hot path; know whether it scans or seeks.
- Index the WHERE/JOIN/ORDER BY columns of frequent queries; composite index order matches selectivity.
- N+1s: loops issuing per-row queries get a JOIN or batch fetch.
- Unbounded queries (`SELECT *`, no LIMIT on user-facing lists) don't ship.
- Parameterize everything — string-built SQL is an injection (this rule has no exceptions, including "internal" tools).

## Orchestration hooks

Wide mechanical changes (rename a column across a codebase, swap an ORM call pattern) → the orchestrator's `migrate-codebase.js` with a scouted site list.

## When NOT to use this skill

Analysis SQL on data extracts (analytics-toolkit); choosing a database *product* for a new system (that's an architecture decision — consider a design-tournament).
