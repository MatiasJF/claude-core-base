// migrate-codebase.js — apply one transformation across many sites, each verified.
//
// args: {
//   sites: string[],           // REQUIRED. Concrete work-list (file paths or scoped site descriptions).
//                              //   SCOUT FIRST — discover this list inline before launching; never let agents guess it.
//   instruction: string,       // REQUIRED. The transformation, precise enough for a blind worker:
//                              //   what to change, what to leave alone, what done looks like.
//   verifyCommand?: string,    // Optional shell command verifiers run per site (test/build/lint).
//   isolate?: boolean          // Worktree-per-agent. Default false. Set true ONLY if concurrent edits
//                              //   would conflict (shared files, lockfiles) — costs setup time + disk per agent.
// }
// returns: { done: [...], failed: [...], notApplicable: [...], sideNotes: [...] }
// agent count: 2 × sites.length (transform + verify each).

export const meta = {
  name: 'migrate-codebase',
  description: 'Apply a transformation across many sites in a pipeline, verify each independently',
  phases: [
    { title: 'Transform', detail: 'one worker per site' },
    { title: 'Verify', detail: 'independent check per transformed site' },
  ],
}

const TRANSFORM_SCHEMA = {
  type: 'object',
  required: ['status', 'changes'],
  properties: {
    status: { type: 'string', enum: ['done', 'blocked', 'not-applicable'] },
    changes: { type: 'array', items: { type: 'string' }, description: 'file:line summaries of each edit made' },
    blockReason: { type: 'string', description: 'If blocked/not-applicable: exactly why' },
    sideNotes: { type: 'string', description: 'Important observations OUTSIDE the instruction scope (not acted on)' },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  required: ['ok', 'evidence'],
  properties: {
    ok: { type: 'boolean' },
    evidence: { type: 'string', description: 'What was checked: diff read, command output, behavior observed' },
    problems: { type: 'array', items: { type: 'string' } },
  },
}

// House rule: coerce-and-validate args first (a stringified args object arrives as one string).
// Both required args are checked — these workers EDIT code, so never launch them half-specified.
const input = typeof args === 'string' ? JSON.parse(args) : (args || {})
if (!Array.isArray(input.sites) || !input.sites.length) {
  throw new Error('args.sites must be a non-empty array — scout the work-list before launching')
}
if (!input.instruction || typeof input.instruction !== 'string') {
  throw new Error('args.instruction is required — the precise transformation. Workers edit code; never send them a blind instruction.')
}

const isolate = !!input.isolate
log(`migrating ${input.sites.length} sites${isolate ? ' (worktree-isolated)' : ''}`)

const verifyCmd = input.verifyCommand
  ? `Then run: ${input.verifyCommand} — include its output in your evidence. A failing command means ok=false.`
  : 'No verify command provided — verify by reading the resulting code and checking it against the instruction.'

const results = await pipeline(
  input.sites,
  (site) => agent(
    `You are a migration worker. Apply this transformation to ONE site only: ${site}\n` +
    `Instruction: ${input.instruction}\n` +
    `Touch nothing outside this site and this instruction. If the site doesn't match the instruction's assumptions, return status=not-applicable or blocked with the exact reason — do not improvise.`,
    { label: `transform:${String(site).slice(-40)}`, phase: 'Transform', schema: TRANSFORM_SCHEMA, ...(isolate ? { isolation: 'worktree' } : {}) }
  ),
  async (t, site) => {
    if (!t) return { site, status: 'failed', reason: 'worker died' }
    if (t.status !== 'done') return { site, status: t.status, reason: t.blockReason, sideNotes: t.sideNotes }
    const v = await agent(
      `You are an adversarial verifier. A migration worker claims it applied this transformation to ${site}:\n` +
      `Instruction: ${input.instruction}\nClaimed changes: ${t.changes.join('; ')}\n` +
      `Independently read the actual current code at the site — check the change is complete (no missed occurrence within the site), correct, and touched nothing out of scope. ${verifyCmd}\n` +
      `Default to ok=false if you cannot positively confirm.`,
      { label: `verify:${String(site).slice(-40)}`, phase: 'Verify', schema: VERIFY_SCHEMA }
    )
    if (!v) return { site, status: 'unverified', changes: t.changes, sideNotes: t.sideNotes }
    return { site, status: v.ok ? 'done' : 'verify-failed', changes: t.changes, problems: v.problems || [], evidence: v.evidence, sideNotes: t.sideNotes }
  }
)

// Each site lands in exactly ONE bucket; sideNotes is a separate observation channel,
// so a site can contribute a note regardless of which bucket it landed in.
const clean = results.filter(Boolean)
const done = clean.filter((r) => r.status === 'done')
const failed = clean.filter((r) => ['failed', 'blocked', 'verify-failed', 'unverified'].includes(r.status))
const notApplicable = clean.filter((r) => r.status === 'not-applicable')
const sideNotes = clean.filter((r) => r.sideNotes).map((r) => ({ site: r.site, note: r.sideNotes }))

log(`migration: ${done.length}/${input.sites.length} done, ${failed.length} need attention, ${notApplicable.length} not applicable, ${sideNotes.length} side note(s)`)
if (failed.length) log(`REVIEW REQUIRED: ${failed.map((f) => f.site).join(', ')}`)

return { done, failed, notApplicable, sideNotes }
