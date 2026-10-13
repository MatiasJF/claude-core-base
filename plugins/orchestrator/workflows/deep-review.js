// deep-review.js — fan-out review with adversarial verification.
//
// args: {
//   target: string,              // REQUIRED. What to review: paths, a diff ref, or a scoped description.
//                                //   Scout first — be concrete ("src/auth/*.ts", "the diff between main and HEAD").
//   dimensions?: string[],       // Review dimensions. Default: bugs, security, performance, error-handling.
//   scale?: 'quick'|'thorough',  // quick: 1 verifier/finding. thorough (default): 3 lenses, 2-of-3 vote.
//   context?: string,            // Optional extra context for finders (project conventions, known issues).
//   maxFindingsPerDimension?: number  // Verifier fan-out cap per dimension (default 12; excess reported unverified).
// }
// returns: { confirmed: [...], unverified: [...], rejectedCount, duplicatesSkipped, dimensionsRun, scale }
// agent count: ~D finders + ~F×(1|3) verifiers. quick+4 dims ≈ 4-15 agents; thorough ≈ 4-40 (capped by maxFindingsPerDimension).

export const meta = {
  name: 'deep-review',
  description: 'Review a target across dimensions in parallel, adversarially verify every finding',
  phases: [
    { title: 'Review', detail: 'one finder per dimension' },
    { title: 'Verify', detail: 'adversarial verification per finding' },
  ],
}

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'file', 'evidence', 'severity'],
        properties: {
          title: { type: 'string', description: 'One-sentence statement of the issue' },
          file: { type: 'string', description: 'file:line anchor' },
          evidence: { type: 'string', description: 'The concrete failure scenario: inputs/state -> wrong behavior' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        },
      },
    },
    coverageNotes: { type: 'string', description: 'What was NOT examined in this dimension' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['refuted', 'confidence', 'evidence'],
  properties: {
    refuted: { type: 'boolean' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    evidence: { type: 'string', description: 'What was independently checked' },
  },
}

// House rule: coerce-and-validate args first. A stringified args object reaches the
// script as one string (the engine passes it verbatim) — parse it rather than fan out on undefined.
const input = typeof args === 'string' ? JSON.parse(args) : (args || {})
if (!input.target || typeof input.target !== 'string') {
  throw new Error('args.target is required — a concrete review scope (paths, diff ref, or scoped description). Scout the work-list before launching.')
}

const dimensions = input.dimensions || ['bugs & logic errors', 'security', 'performance', 'error handling & edge cases']
const scale = input.scale || 'thorough'
const maxPerDim = input.maxFindingsPerDimension || 12
const extra = input.context ? `\nProject context: ${input.context}` : ''
const LENSES = ['correctness (is the claimed behavior actually wrong?)', 'reproducibility (construct the concrete triggering input/state)', 'impact (would existing checks/tests/guards catch this anyway?)']

const finderPrompt = (dim) =>
  `You are a review worker. Review ONLY this dimension: "${dim}".\n` +
  `Target: ${input.target}${extra}\n` +
  `Read the actual code — every finding needs a file:line anchor and a concrete failure scenario. ` +
  `Report real defects, not style preferences. If the dimension yields nothing, return an empty findings list — do not pad. ` +
  `Note in coverageNotes anything in scope you could not examine.`

const verifyPrompt = (f, lens) =>
  `You are an adversarial verifier. Try to REFUTE this review finding through the lens of ${lens}.\n` +
  `Finding: ${f.title}\nLocation: ${f.file}\nClaimed evidence: ${f.evidence}\n` +
  `Independently re-read the actual code — do not trust the quoted evidence. Default to refuted=true if you cannot confirm it yourself.`

// Cross-dimension dedup: two finders often report the same defect. Key on the last two
// path segments + line so absolute and repo-relative anchors collide; the first dimension
// to claim an anchor verifies it, later duplicates are skipped. A shared Set is safe —
// stage callbacks interleave on one event loop and the check-and-add is synchronous.
const claimed = new Set()
const anchorKey = (f) => f.file.split('/').slice(-2).join('/').trim().toLowerCase()
let duplicatesSkipped = 0

const results = await pipeline(
  dimensions,
  (dim) => agent(finderPrompt(dim), { label: `find:${dim.split(' ')[0]}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
  async (review, dim) => {
    const empty = { dim, confirmed: [], unverified: [], rejected: 0 }
    if (!review) return { ...empty, coverageNotes: 'finder failed' }
    const fresh = review.findings.filter((f) => {
      if (claimed.has(anchorKey(f))) { duplicatesSkipped++; return false }
      claimed.add(anchorKey(f))
      return true
    })
    const toVerify = fresh.slice(0, maxPerDim)
    const overflow = fresh.slice(maxPerDim).map((f) => ({ ...f, dimension: dim, why: 'over cap' }))
    if (overflow.length) log(`"${dim}": ${overflow.length} finding(s) over the ${maxPerDim} cap — reported unverified, not dropped`)
    if (!toVerify.length) return { ...empty, unverified: overflow, coverageNotes: review.coverageNotes }

    const judged = await parallel(toVerify.map((f) => () => {
      const lenses = scale === 'quick' ? [LENSES[0]] : LENSES
      return parallel(lenses.map((lens) => () =>
        agent(verifyPrompt(f, lens), { label: `verify:${f.file}`, phase: 'Verify', schema: VERDICT_SCHEMA })
      )).then((votes) => {
        const valid = votes.filter(Boolean)
        // Zero surviving verifiers means we know NOTHING — that is 'unverified', never 'refuted'.
        if (!valid.length) return { ...f, dimension: dim, status: 'unverified', why: 'all verifiers failed', votes: [] }
        const surviving = valid.filter((v) => !v.refuted).length
        const needed = Math.min(scale === 'quick' ? 1 : 2, valid.length)
        return { ...f, dimension: dim, status: surviving >= needed ? 'confirmed' : 'refuted', votes: valid }
      })
    }))
    const ok = judged.filter(Boolean)
    return {
      dim,
      confirmed: ok.filter((j) => j.status === 'confirmed'),
      unverified: ok.filter((j) => j.status === 'unverified').concat(overflow),
      rejected: ok.filter((j) => j.status === 'refuted').length,
      coverageNotes: review.coverageNotes,
    }
  }
)

const clean = results.filter(Boolean)
const confirmed = clean.flatMap((r) => r.confirmed)
const unverified = clean.flatMap((r) => r.unverified)
const rejectedCount = clean.reduce((n, r) => n + r.rejected, 0)
log(`deep-review: ${confirmed.length} confirmed, ${rejectedCount} refuted, ${unverified.length} unverified, ${duplicatesSkipped} cross-dimension duplicates skipped (${clean.length}/${dimensions.length} dimensions)`)
const failedDims = dimensions.length - clean.length
if (failedDims > 0) log(`WARNING: ${failedDims} dimension finder(s) failed — coverage is incomplete`)
if (unverified.length) log(`WARNING: ${unverified.length} finding(s) could not be verified — treat as leads, not conclusions`)

const order = { critical: 0, high: 1, medium: 2, low: 3 }
confirmed.sort((a, b) => order[a.severity] - order[b.severity])

return {
  confirmed,
  unverified,
  rejectedCount,
  duplicatesSkipped,
  dimensionsRun: clean.map((r) => ({ dimension: r.dim, coverageNotes: r.coverageNotes })),
  scale,
}
