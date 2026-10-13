---
name: orchestrate
description: This skill should be used when the user asks to "orchestrate", "fan out agents", "use a workflow", "run a deep review", "parallel research", "design tournament", "migrate at scale", or hands over any task big enough that one context can't hold it (multi-file audits, broad research, wide migrations, competing design options). Routes the task to the right multi-agent pattern and drives the bundled Workflow scripts.
version: 0.2.0
---

# Orchestrate

Turn one big task into a coordinated tree of agents, deterministically. This skill is the router: it decides **whether** to decompose, **which pattern** fits, and **how** to run it.

## Step 0 — Should this be orchestrated at all?

Decompose only when at least one is true:
- **Scale**: the work spans more files/sources/items than one context comfortably holds.
- **Confidence**: the answer matters enough to want independent perspectives or adversarial verification.
- **Coverage**: completeness matters and a single pass will miss the tail (audits, discovery, research).

Otherwise, do the task directly. Orchestration has real cost — never fan out for a task one agent does well.

**Opt-in rule**: the Workflow tool requires explicit user opt-in to multi-agent orchestration. Invoking this skill (or the `/orchestrator:orchestrate` command — plugin commands are namespaced) *is* that opt-in. Still, before launching anything that will spawn >10 agents, state the rough scale ("this will run ~N agents") so the user can veto.

## Step 1 — Scout before you orchestrate

Workflows need a **work-list** (files, questions, sites, findings). Discover it inline first with cheap searches — list the files, scope the diff, enumerate the sources. Then hand the concrete list to the workflow via `args`. Never make the workflow guess its own inputs.

## Step 2 — Pick the pattern

| Task shape | Pattern | Script |
|---|---|---|
| "Review/audit this code thoroughly" | dimensions → find → adversarially verify | `deep-review.js` |
| "Research X across many sources" | multi-angle sweep → deep-read → synthesize → completeness critic | `parallel-research.js` |
| "Design/decide between approaches" | N independent attempts → judge panel → synthesis | `design-tournament.js` |
| "Apply this change across N sites" | discover → transform each → verify each | `migrate-codebase.js` |
| Anything else | compose a bespoke script from the same primitives | write inline |

The scripts live in this plugin's `workflows/` directory. Run one with:

```
Workflow({ scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/deep-review.js", args: {...} })
```

**`args` must be an actual JSON object in the tool call — NEVER a JSON-encoded string.** A stringified args reaches the script as one string, every field reads as `undefined`, and the run silently falls back to defaults (this exact failure launched a 73-agent "quick" review once). The scripts now throw on missing required args, but pass real JSON anyway.

Each script's header comment documents its `args` contract. Read the script before running it the first time in a session.

## Step 3 — Run, relay, iterate

- Workflows run in the background; relay progress and the final synthesis to the user — the raw agent outputs are not shown to them.
- If a run comes back thin or empty, read the run's `journal.jsonl` before re-running — diagnose, don't shotgun.
- Check the result's `warnings`/`unverified` fields and relay them honestly — an unverified finding is a lead, not a conclusion; a dead verifier is never a refutation.
- For multi-phase work (understand → design → implement → review), run **one workflow per phase** and read each result before launching the next. Stay in the loop between phases.

## Agent archetypes

The plugin ships four agent roles (in `agents/`) that scripts and ad-hoc `agent()` calls can summon by `agentType` (namespaced when installed, e.g. `orchestrator:planner`):

- **planner** — decomposes a goal into a concrete work-list with acceptance criteria per item.
- **worker** — executes one well-scoped item; returns raw structured results, not prose.
- **verifier** — adversarially attacks one claim/finding/change; defaults to *refuted* when uncertain.
- **synthesizer** — merges many raw results into one coherent, deduplicated, prioritized output.

The canonical tree: planner → workers (parallel) → verifiers (per result) → synthesizer. Workflow nesting is **one level** — trees come from the script fanning out, not from leaves recursing. Design scripts flat-and-wide, not deep.

## Hard rules

1. **Never hardcode a model.** No `model:` option in scripts or agent defs unless the user explicitly asks. Everything inherits the session model, so the toolkit works identically on any Claude model.
2. **Verify before trusting.** Any finding that will drive action gets an adversarial pass (≥2-of-3 refuter vote for important claims; single verifier for quick checks).
3. **Failed ≠ refuted.** A finding whose verifiers all died is *unverified* — report it as a lead, never silently drop it or count it as rejected.
4. **No silent caps.** If a run bounds coverage (top-N, sampling), `log()` what was dropped.
5. **Dedup against everything seen, not just confirmed** — otherwise judge-rejected findings resurface every round and loops never converge.
6. **Pass `args` as a real JSON object** — and validate required args at the top of every script (coerce with `typeof args === 'string' ? JSON.parse(args) : args` first).
7. **Scale to the ask.** "find bugs" → few finders, single-vote verify. "thoroughly audit" → large pool, 3–5 vote adversarial pass, synthesis stage.

## Deeper guidance

For the full pattern catalog, failure modes, and script-authoring conventions, read `references/patterns.md` in this skill directory.
