// parallel-research.js — multi-angle research sweep with completeness check.
//
// args: {
//   question: string,           // REQUIRED. The refined research question (clarify BEFORE launching).
//   angles?: string[],          // Search angles. Default: 4 complementary angles incl. counterargument.
//   depth?: 'quick'|'thorough'  // thorough (default) adds a completeness-critic round 2.
// }
// returns: { report: string, sources: [...], gaps: string, roundsRun, warnings: [...] }
// agent count: ~A sweepers + ~A readers + 1 synthesizer + (thorough: 1 critic + up to A round-2 agents). ≈ 8-20.

export const meta = {
  name: 'parallel-research',
  description: 'Fan out research angles, deep-read best sources, synthesize with citations, check completeness',
  phases: [
    { title: 'Sweep', detail: 'one searcher per angle, blind to each other' },
    { title: 'Deep-read', detail: 'read the best sources fully' },
    { title: 'Synthesize', detail: 'merge into cited report + completeness critic' },
  ],
}

const SWEEP_SCHEMA = {
  type: 'object',
  required: ['sources'],
  properties: {
    sources: {
      type: 'array',
      items: {
        type: 'object',
        required: ['url', 'title', 'relevance', 'keyClaim'],
        properties: {
          url: { type: 'string' },
          title: { type: 'string' },
          relevance: { type: 'string', enum: ['high', 'medium', 'low'] },
          keyClaim: { type: 'string', description: 'The main claim this source contributes' },
        },
      },
    },
    angleSummary: { type: 'string', description: '2-3 sentence summary of what this angle found' },
  },
}

const READ_SCHEMA = {
  type: 'object',
  required: ['url', 'facts', 'reliability'],
  properties: {
    url: { type: 'string' },
    facts: { type: 'array', items: { type: 'string' }, description: 'Concrete facts/claims with enough context to cite' },
    reliability: { type: 'string', enum: ['primary', 'reputable-secondary', 'weak'] },
    contradicts: { type: 'string', description: 'Anything here that contradicts common framing of the question' },
  },
}

const CRITIC_SCHEMA = {
  type: 'object',
  required: ['gaps', 'followUpAngles'],
  properties: {
    gaps: { type: 'string', description: 'What is missing: unexamined angles, unverified claims, unread source types' },
    followUpAngles: { type: 'array', items: { type: 'string' }, description: 'Concrete new angles worth a round 2 (empty if coverage is adequate)' },
  },
}

// House rule: coerce-and-validate args first (a stringified args object arrives as one string).
const input = typeof args === 'string' ? JSON.parse(args) : (args || {})
if (!input.question || typeof input.question !== 'string') {
  throw new Error('args.question is required — the refined research question. Clarify scope before launching.')
}

const depth = input.depth || 'thorough'
const defaultAngles = [
  'primary/official sources (docs, specs, announcements, papers)',
  'practitioner experience (forums, issue trackers, blog post-mortems)',
  'quantitative data (benchmarks, statistics, market data)',
  'counterarguments and failure cases (critics, rebuttals, negative results)',
]
const angles = input.angles || defaultAngles
const warnings = []

const sweepPrompt = (angle) =>
  `Research this question through ONE angle only: "${angle}".\n` +
  `Question: ${input.question}\n` +
  `Web-search from this angle, collect the best sources with their key claims. Other agents cover other angles — do not stray. Prefer fewer high-relevance sources over volume.`

// URL dedup across angles AND rounds: one deep-read per URL, ever. Shared Set is safe —
// the synchronous claim below runs between awaits on a single event loop.
const readUrls = new Set()
const normUrl = (u) => u.replace(/[#?].*$/, '').replace(/\/+$/, '').toLowerCase()

const runRound = async (roundAngles, phasePrefix) => {
  const readsPerAngle = await pipeline(
    roundAngles,
    (angle) => agent(sweepPrompt(angle), { label: `sweep:${angle.slice(0, 25)}`, phase: 'Sweep', schema: SWEEP_SCHEMA }),
    async (sweep) => {
      if (!sweep) return []
      const relevant = sweep.sources.filter((s) => s.relevance !== 'low')
      const fresh = relevant.filter((s) => {
        if (readUrls.has(normUrl(s.url))) return false
        readUrls.add(normUrl(s.url))
        return true
      })
      const best = fresh.slice(0, 4)
      const dropped = sweep.sources.length - best.length
      if (dropped > 0) log(`${phasePrefix}: skipped ${dropped} source(s) (low-relevance, duplicate URL, or over per-angle cap of 4)`)
      const reads = await parallel(best.map((s) => () =>
        agent(
          `Fetch and fully read this source: ${s.url} ("${s.title}").\n` +
          `Extract every fact relevant to: ${input.question}\n` +
          `Assess reliability. Note anything that contradicts the source's own framing or common wisdom.`,
          { label: `read:${s.title.slice(0, 30)}`, phase: 'Deep-read', schema: READ_SCHEMA }
        )
      ))
      return reads.filter(Boolean)
    }
  )
  return readsPerAngle.filter(Boolean).flat()
}

let reads = await runRound(angles, 'round1')
let roundsRun = 1

let gaps = 'not assessed (quick mode)'
if (depth === 'thorough') {
  const critic = await agent(
    `You are a completeness critic for a research run on: ${input.question}\n` +
    `Angles searched: ${angles.join('; ')}\n` +
    `Facts gathered so far:\n${JSON.stringify(reads.map((r) => ({ url: r.url, facts: r.facts })), null, 1).slice(0, 20000)}\n` +
    `What is MISSING? Which claims are single-sourced? Which obvious angle went unsearched? Propose follow-up angles only if they would materially change the answer.`,
    { label: 'completeness-critic', phase: 'Synthesize', schema: CRITIC_SCHEMA }
  )
  gaps = critic ? critic.gaps : 'critic failed'
  if (!critic) warnings.push('completeness critic failed — coverage gaps were not assessed')
  if (critic && critic.followUpAngles.length) {
    log(`round 2: ${critic.followUpAngles.length} follow-up angle(s)`)
    const round2 = await runRound(critic.followUpAngles.slice(0, 3), 'round2')
    reads = reads.concat(round2)
    roundsRun = 2
  }
}

let report = await agent(
  `Synthesize a research report answering: ${input.question}\n` +
  `Source material (facts with URLs and reliability ratings):\n${JSON.stringify(reads, null, 1).slice(0, 60000)}\n` +
  `Rules: every claim cites its source URL inline; weigh primary > reputable-secondary > weak; surface contradictions between sources explicitly instead of resolving them silently; ` +
  `lead with a direct answer, then evidence, then caveats. Known coverage gaps to disclose: ${gaps}`,
  { label: 'synthesize-report', phase: 'Synthesize' }
)

// Never discard a whole run because the last agent died: fall back to the raw facts.
if (!report) {
  warnings.push('synthesizer failed — report is a raw fact dump, not a synthesis')
  log('WARNING: synthesizer failed; returning raw facts instead of a synthesized report')
  report = 'SYNTHESIS FAILED — raw collected facts follow:\n\n' +
    reads.map((r) => `## ${r.url} [${r.reliability}]\n${r.facts.map((x) => `- ${x}`).join('\n')}`).join('\n\n')
}

return {
  report,
  sources: reads.map((r) => ({ url: r.url, reliability: r.reliability })),
  gaps,
  roundsRun,
  warnings,
}
