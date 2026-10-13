# Orchestration guidebook

The human-readable companion to the `orchestrator` plugin: how to think about multi-agent work, when to reach for it, and how to get frontier-quality results from it on any model.

## The mental model

An orchestrated run is a **tree, but the script is the trunk**. One deterministic script (a Workflow) fans out to agents, collects their structured results, and decides what happens next. Agents don't recursively grow their own subtrees — engine nesting is one level deep. This is a feature: the tree's shape is decided by code you can read, resume, and debug, not by N models improvising middle management.

Four roles cover almost every tree:

```
        planner            (turns a goal into a work-list)
       /   |   \
  worker worker worker     (each executes exactly one item, in parallel)
      |     |     |
  verifier verifier ...    (each adversarially attacks one result)
        \   |   /
       synthesizer         (merges, dedups, ranks, reports coverage)
```

## When to orchestrate (and when not to)

Orchestrate when at least one holds:
- **Scale** — more files/sources/items than one context holds comfortably.
- **Confidence** — the answer matters enough to buy independent perspectives and adversarial checks.
- **Coverage** — a single pass will miss the tail (audits, discovery, research).

Do NOT orchestrate because a task is "important" or "conceptually parallel". A one-agent job orchestrated is slower, costlier, and no better. The router question is: *would a second, independent context actually change the output?*

## The five laws

1. **Scout before you launch.** Workflows consume a work-list; discovering that list is cheap inline work (glob, grep, a few searches). An orchestration launched on a guessed work-list wastes every agent's context rediscovering it.
2. **Structure at every seam.** Any output that feeds another stage gets a JSON Schema. Prose is only for the final, human-facing synthesis. And the input seam counts too: pass `args` as a real JSON object and validate it at the top of the script — a stringified args object reads as `undefined` everywhere and the run silently falls back to defaults.
3. **Verify before trusting.** Finder agents optimize for plausibility. Every finding that will drive action gets an adversarial pass whose verifiers *default to refuted*. But a verifier that **dies** is not a verifier that refuted: crashed checks make a finding *unverified* (a lead to re-check), never rejected. It feels wasteful; it's the single biggest quality lever.
4. **Never pin a model.** Scripts and agent definitions inherit the session model. The same tree runs on whatever the best available model is — today, next month, on someone else's machine.
5. **Report coverage honestly.** Every bound (top-N, sampling, failed agent) gets logged and lands in the final report. "Everything checked" when it wasn't is the worst failure mode an orchestrator has.

## Pattern selection cheat-sheet

| You're saying… | Pattern | Bundled script |
|---|---|---|
| "go over all of this carefully" | fan-out review + adversarial verify | `deep-review.js` |
| "find out everything about X" | multi-angle sweep + completeness critic | `parallel-research.js` |
| "what's the best way to build X?" | independent attempts + judge panel | `design-tournament.js` |
| "change this everywhere" | scout → transform each → verify each | `migrate-codebase.js` |
| "keep looking until there's nothing left" | loop-until-dry (compose ad hoc) | — see patterns.md |

Full catalog with code sketches: `plugins/orchestrator/skills/orchestrate/references/patterns.md`.

## Cost intuition

- Concurrency is capped (~10-16 live agents); a 100-item pipeline completes, it just queues.
- `pipeline()` over `parallel()` barriers unless a stage genuinely needs ALL prior results — barrier latency is the fast agents idling while the slowest finishes.
- Verification multiplies cost by ~2-4×. Scale it to stakes: quick check → 1 verifier; shipping decision → 3 lenses, 2-of-3 vote.
- Any stage whose width an agent decides (findings, sources) needs a cap, or one verbose finder can multiply the run far past its estimate.
- Worktree isolation costs setup + disk per agent. Only for concurrent *mutations* that would conflict.

## Debugging runs

- Empty/thin result? Read the run's `journal.jsonl` in the transcript dir before re-running — it records each agent's actual return.
- Prompts containing the literal word `undefined`, or a "quick" run behaving like "thorough"? Your `args` arrived as a JSON-encoded **string** — every field read `undefined` and the defaults took over. Pass a real JSON object. (This plugin's own first run failed exactly this way and spawned 73 agents.)
- Edited the script? Resume with `resumeFromRunId` — unchanged agent calls replay from cache; only the edited stage re-runs.
- An agent returning `null` means it was skipped or died — the scripts here `.filter(Boolean)` and log the loss, so check the logs for silent coverage holes. Mid-run session limits show up this way: a wave of dead verifiers, findings downgraded to `unverified`.

## Multi-phase work

For understand → design → implement → review, run **one workflow per phase** and read each result before launching the next. The human (or the main loop) stays between phases — that's where judgment lives. A single mega-workflow that does all four phases unsupervised trades away exactly the oversight that makes the output trustworthy.
