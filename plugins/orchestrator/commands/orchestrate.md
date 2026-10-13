---
description: Decompose a big task into a coordinated tree of agents using the right fan-out pattern
argument-hint: <task description> [--pattern review|research|tournament|migrate] [--scale quick|thorough]
---

# /orchestrate

The user has explicitly opted into multi-agent orchestration for this task:

**Task:** $ARGUMENTS

Follow the `orchestrate` skill (read `${CLAUDE_PLUGIN_ROOT}/skills/orchestrate/SKILL.md` if not already loaded):

1. **Route** — if the task doesn't genuinely need decomposition (scale / confidence / coverage test), say so and do it directly instead. Don't burn agents on a one-agent job.
2. **Scout** — discover the concrete work-list inline (files, sources, sites, options) before launching anything.
3. **Pick the pattern** — honor an explicit `--pattern` flag; otherwise choose from the table in the skill. Bundled scripts are in `${CLAUDE_PLUGIN_ROOT}/workflows/`.
4. **Scale** — `--scale quick` → few finders, single-vote verify; `--scale thorough` (default for audits/research) → wide pool, multi-vote adversarial verify, synthesis stage. If the run will spawn >10 agents, state the rough count before launching.
5. **Run and relay** — launch via `Workflow({scriptPath, args})`, then relay the synthesis to the user with what was covered, what was dropped, and confidence levels.
