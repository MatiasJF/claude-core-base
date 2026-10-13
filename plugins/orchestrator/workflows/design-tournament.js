// design-tournament.js — N independent design attempts, judged, then synthesized.
//
// args: {
//   problem: string,          // REQUIRED. The design/decision problem, with constraints and success criteria.
//   perspectives?: string[],  // Forced-diverse angles. Default: MVP-first, robustness-first, UX-first, performance-first.
//   judges?: number           // Judge panel size (default 3).
// }
// returns: { winner, scoreboard, synthesis, attempts, warnings: [...] }
// agent count: P designers + J judges + 1 synthesizer. Defaults ≈ 8.

export const meta = {
  name: 'design-tournament',
  description: 'Generate independent design attempts from diverse perspectives, score with a judge panel, synthesize the best',
  phases: [
    { title: 'Design', detail: 'one independent attempt per perspective' },
    { title: 'Judge', detail: 'panel scores all attempts' },
    { title: 'Synthesize', detail: 'winner + grafted runner-up ideas' },
  ],
}

const DESIGN_SCHEMA = {
  type: 'object',
  required: ['summary', 'design', 'tradeoffs', 'risks'],
  properties: {
    summary: { type: 'string', description: 'The approach in 2-3 sentences' },
    design: { type: 'string', description: 'The full design: components, flow, key decisions' },
    tradeoffs: { type: 'string', description: 'What this deliberately sacrifices and why' },
    risks: { type: 'string', description: 'Where this is most likely to fail' },
  },
}

// Judges reference attempts by NUMBER, not by echoed label — LLMs reproduce labels
// imperfectly and an exact-string match would silently zero a mistyped attempt's score.
const SCORE_SCHEMA = {
  type: 'object',
  required: ['scores', 'reasoning'],
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        required: ['attemptNumber', 'score', 'bestIdea'],
        properties: {
          attemptNumber: { type: 'integer', description: 'The attempt number exactly as shown in the dossier (1-based)' },
          score: { type: 'number', description: '0-10 against the problem success criteria' },
          bestIdea: { type: 'string', description: 'The single strongest idea in this attempt, even if it loses overall' },
        },
      },
    },
    reasoning: { type: 'string' },
  },
}

// House rule: coerce-and-validate args first (a stringified args object arrives as one string).
const input = typeof args === 'string' ? JSON.parse(args) : (args || {})
if (!input.problem || typeof input.problem !== 'string') {
  throw new Error('args.problem is required — the design problem with constraints and success criteria.')
}

const perspectives = input.perspectives || [
  'MVP-first: simplest thing that fully works, optimize for shipping speed and low surface area',
  'robustness-first: failure modes, security, and operability drive every decision',
  'user-first: developer/user experience and ergonomics drive every decision',
  'performance-first: efficiency, scale, and resource cost drive every decision',
]
const judgeCount = input.judges || 3
const warnings = []

// Design: independent attempts, blind to each other
const attempts = (await parallel(perspectives.map((p) => () =>
  agent(
    `Design a solution to this problem from ONE forced perspective: "${p}".\n` +
    `Problem: ${input.problem}\n` +
    `Commit fully to the perspective even where you'd personally balance differently — the tournament needs genuine diversity, not four hedged averages. Be concrete: name components, data flows, and the decisions that follow from your perspective.`,
    { label: `design:${p.split(':')[0]}`, phase: 'Design', schema: DESIGN_SCHEMA }
  ).then((d) => (d ? { perspective: p.split(':')[0], ...d } : null))
))).filter(Boolean)

if (attempts.length < 2) {
  log(`only ${attempts.length} attempt(s) survived — tournament degenerate, returning what exists unjudged`)
  warnings.push('tournament degenerate: fewer than 2 attempts survived; result is unjudged')
  return { winner: attempts[0] || null, scoreboard: [], synthesis: attempts[0] ? attempts[0].design : null, attempts, warnings }
}

// Judge: full panel sees ALL attempts (barrier justified — cross-item comparison is the whole point)
const dossier = attempts.map((a, i) => `## ATTEMPT ${i + 1} — ${a.perspective}\n${a.summary}\n${a.design}\nTradeoffs: ${a.tradeoffs}\nRisks: ${a.risks}`).join('\n\n')
const votes = (await parallel(Array.from({ length: judgeCount }, (_, j) => () =>
  agent(
    `You are judge ${j + 1} of ${judgeCount} on an independent panel. Score each design attempt 0-10 against the problem's success criteria, referencing attempts by their ATTEMPT NUMBER. Judge the DESIGN, not the writing. For each attempt also name its single best idea — even losing designs usually contain one worth stealing.\n` +
    `Problem: ${input.problem}\n\nAttempts:\n${dossier}`,
    { label: `judge-${j + 1}`, phase: 'Judge', schema: SCORE_SCHEMA }
  )
))).filter(Boolean)

// An unjudged tournament has no winner — never pick one arbitrarily.
if (!votes.length) {
  log('WARNING: entire judge panel failed — no scores exist, returning all attempts unranked')
  warnings.push('entire judge panel failed: no winner was selected; attempts returned unranked')
  return { winner: null, scoreboard: [], synthesis: null, attempts, warnings }
}
if (votes.length < judgeCount) warnings.push(`${judgeCount - votes.length} of ${judgeCount} judges failed — scores rest on a smaller panel`)

const scoreboard = attempts.map((a, i) => {
  const mine = votes.flatMap((v) => v.scores.filter((s) => s.attemptNumber === i + 1))
  if (mine.length < votes.length) warnings.push(`attempt ${i + 1} (${a.perspective}) was scored by only ${mine.length}/${votes.length} judges`)
  return {
    attemptNumber: i + 1,
    perspective: a.perspective,
    avg: mine.length ? mine.reduce((x, y) => x + y.score, 0) / mine.length : null,
    votesReceived: mine.length,
    bestIdeas: mine.map((s) => s.bestIdea),
  }
}).sort((x, y) => (y.avg ?? -1) - (x.avg ?? -1))
log(`scoreboard: ${scoreboard.map((s) => `#${s.attemptNumber} ${s.perspective}=${s.avg === null ? 'unscored' : s.avg.toFixed(1)}`).join(', ')}`)

const winner = attempts[scoreboard[0].attemptNumber - 1]

// Synthesize: winner as the spine, graft the strongest runner-up ideas
const synthesis = await agent(
  `Produce the final design for: ${input.problem}\n` +
  `Use this winning attempt as the spine:\n## ${winner.perspective}\n${winner.design}\nTradeoffs: ${winner.tradeoffs}\n\n` +
  `Judges flagged these ideas from OTHER attempts as worth grafting in:\n${scoreboard.slice(1).map((s) => `- from ${s.perspective}: ${s.bestIdeas.join('; ')}`).join('\n')}\n` +
  `Integrate a grafted idea only where it strengthens the spine without breaking its coherence — reject grafts that fight the winning perspective, and say which you rejected and why. Output the complete, final design.`,
  { label: 'synthesize-design', phase: 'Synthesize' }
)
if (!synthesis) {
  warnings.push('synthesizer failed — winner design returned raw, without grafted ideas')
  log('WARNING: synthesizer failed; returning the raw winning design')
}

return {
  winner: { perspective: winner.perspective, summary: winner.summary },
  scoreboard,
  synthesis: synthesis || winner.design,
  attempts,
  warnings,
}
