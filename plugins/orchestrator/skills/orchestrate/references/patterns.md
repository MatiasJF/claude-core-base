# Orchestration pattern catalog

Reference for authoring and adapting Workflow scripts. The bundled scripts in `../../workflows/` implement the first four; compose new ones from the same primitives.

## Primitives (what the Workflow engine gives you)

- `agent(prompt, opts)` — spawn one subagent. `opts.schema` (JSON Schema) forces structured output — **always use a schema** when the result feeds another stage. `opts.agentType` summons a named agent archetype. `opts.phase` groups progress display. `opts.effort` tunes reasoning ('low' for mechanical stages, high tiers for judging).
- `pipeline(items, ...stages)` — each item flows through all stages independently, **no barrier**. The default for multi-stage work; wall-clock = slowest single chain.
- `parallel(thunks)` — a **barrier**: all complete before returning. Failed thunks resolve to `null` — always `.filter(Boolean)`.
- `phase(title)` / `log(msg)` — progress narration.
- `args` — the input contract. `budget` — token ceiling helpers for loop-until-budget.

### When a barrier is justified
Only when stage N needs cross-item context from ALL of stage N−1: dedup/merge across the full set, early-exit on zero total, or prompts that reference "the other findings". A flatten/map/filter between stages is NOT a reason — do it inside a pipeline stage.

## Patterns

### 1. Fan-out review (deep-review.js)
Dimensions (bugs, security, perf, correctness…) → one finder each → adversarial verify per finding. Pipeline so dimension A verifies while B still reviews. Kill findings the verifiers refute.

### 2. Multi-modal research sweep (parallel-research.js)
Angles (by-source-type, by-entity, by-time, by-counterargument) → each blind to the others → deep-read the best sources → synthesize with citations → completeness critic ("what's missing?") whose output seeds round 2 if substantial.

### 3. Judge tournament (design-tournament.js)
N independent attempts from forced-diverse angles (MVP-first, risk-first, user-first, perf-first) → parallel judges score all → synthesize from the winner, grafting runner-up ideas. Beats one-attempt-iterated when the solution space is wide.

### 4. Migration pipeline (migrate-codebase.js)
Scout the site list inline first → pipeline(sites, transform, verify). Use `isolation: 'worktree'` ONLY when transforms mutate files concurrently and would conflict — it costs ~200-500ms + disk per agent.

### 5. Loop-until-dry (compose ad hoc)
For unknown-size discovery: keep spawning finder rounds until K consecutive rounds surface nothing new. Dedup fresh findings against **everything seen** (a `Set` of keys), not against confirmed — else rejected findings resurface forever.

```js
const seen = new Set(); let dry = 0
while (dry < 2) {
  const found = /* finder round */
  const fresh = found.filter(f => !seen.has(key(f)))
  if (!fresh.length) { dry++; continue }
  dry = 0; fresh.forEach(f => seen.add(key(f)))
  /* verify + collect */
}
```

### 6. Adversarial verify (building block, used everywhere)
N independent skeptics per claim, each prompted to REFUTE, defaulting to refuted when uncertain. Majority refute → kill. Use perspective-diverse lenses (correctness / security / does-it-reproduce) instead of N identical refuters when a claim can fail in more than one way.

### 7. Completeness critic (building block)
Final agent asks "what's missing — angle not searched, claim unverified, source unread?" Its answer becomes the next round's work-list. Cheap insurance against silent gaps.

## Script-authoring conventions (house rules)

1. **Header contract comment** — every script starts with a comment block documenting `args` shape, return shape, and rough agent count.
2. **Coerce-and-validate args first** — top of every script: `const input = typeof args === 'string' ? JSON.parse(args) : (args || {})`, then `throw` on any missing required field. A stringified args object arrives as one string and every field silently reads `undefined` — validation turns a 73-agent misfire into a one-line error.
3. **Pure-literal `meta`** — `export const meta = {name, description, phases}`; phase titles must match `phase()` calls exactly.
4. **No model pins** — never set `opts.model`; inherit the session model. (`opts.effort` is fine — it's model-relative.)
5. **No wall-clock APIs** — `Date.now()` / `Math.random()` / argless `new Date()` throw inside scripts (they break resume). Pass timestamps via `args`.
6. **Schemas at every seam** — any agent whose output feeds code gets a JSON Schema. Prose is for the final synthesis only.
7. **Null-hygiene with correct semantics** — `.filter(Boolean)` after every `parallel()`, but classify what the null MEANS: a dead verifier makes its finding *unverified* (a lead), never *refuted*; a dead judge shrinks the panel (warn), an entirely-dead panel means *no winner*; a dead synthesizer falls back to raw results, never to a silent null.
8. **Reference by index, not by echoed label** — when one agent must score/select among items produced elsewhere, number the items and have it answer with the number. Exact-string matching on an LLM-reproduced label silently zeroes mismatches.
9. **Cap unbounded fan-out** — any stage whose width is decided by an agent's output (findings, sources, follow-ups) gets a numeric cap; overflow is logged and reported, not dropped.
10. **Plain JS** — no TypeScript syntax; scripts fail to parse with type annotations.
11. **Log dropped coverage** — any top-N / sampling bound gets a `log()` line saying what was cut.

## Failure modes seen in the wild

- **Stringified args** (happened on this plugin's own first run): `args` passed as a JSON string → every field `undefined` → defaults everywhere → a "quick" review launched 73 agents at `Target: undefined`. Convention 2 exists because of this.
- **Crash counted as verdict**: verifier agents died (session limit) and their findings were reported as "refuted". A missing opinion is not a negative opinion.
- **Label-match zeroing**: judges echoed attempt labels imperfectly; exact-string matching scored those attempts 0. Reference by index.
- **Barrier tax**: `parallel → transform → parallel` where the transform has no cross-item dependency. Rewrite as one pipeline.
- **Recursing leaves**: expecting workers to spawn their own subtrees. Nesting is one level — design flat-and-wide; the *script* is the tree.
- **Unverified plausibility**: finder output shipped without an adversarial pass; plausible-but-wrong survives.
- **Convergence bug**: deduping against confirmed instead of seen (see pattern 5).
- **Guessy inputs**: launching a workflow without scouting the work-list first; agents waste their context rediscovering it N times.
- **Duplicate work across lanes**: two dimensions/angles surfacing the same defect/URL, each independently verified/read. Share a claimed-set across lanes (safe: stage callbacks interleave on one event loop, so a synchronous check-and-add can't race).
