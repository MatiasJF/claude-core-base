// crawl-extract.js — schema-first extraction over a URL list, validated per record.
//
// args: {
//   urls: string[],        // REQUIRED. Concrete URL work-list (scout/discover it BEFORE launching).
//   goal: string,          // REQUIRED. What to extract, in plain words ("all product listings with price").
//   schema?: object,       // JSON Schema for ONE record. Default: generic {fields, sourceUrl} record.
//   maxUrls?: number       // Cap (default 40). Overflow logged and returned unprocessed.
// }
// returns: { records: [...], failures: [...], unprocessed: [...], coverage: string }
// agent count: 1 per processed URL (fetch+extract combined; validation is code, not agents).

export const meta = {
  name: 'crawl-extract',
  description: 'Fetch and schema-extract each URL in a pipeline, validate records, merge with honest failure reporting',
  phases: [
    { title: 'Extract', detail: 'one fetch+extract worker per URL' },
  ],
}

// House rule: coerce-and-validate args first.
const input = typeof args === 'string' ? JSON.parse(args) : (args || {})
if (!Array.isArray(input.urls) || !input.urls.length) throw new Error('args.urls must be a non-empty array — discover the URL list before launching')
if (!input.goal || typeof input.goal !== 'string') throw new Error('args.goal is required — what to extract, in plain words')

const recordSchema = input.schema || {
  type: 'object',
  required: ['sourceUrl', 'fields'],
  properties: {
    sourceUrl: { type: 'string' },
    fields: { type: 'object', description: 'The extracted key-value data for one record' },
  },
}

const EXTRACT_SCHEMA = {
  type: 'object',
  required: ['status', 'records'],
  properties: {
    status: { type: 'string', enum: ['ok', 'fetch-failed', 'no-matches', 'blocked'] },
    records: { type: 'array', items: recordSchema },
    note: { type: 'string', description: 'For non-ok statuses: exactly what happened (selector mismatch, robots disallow, auth wall...)' },
  },
}

const maxUrls = input.maxUrls || 40
const urls = [...new Set(input.urls)]
const dupes = input.urls.length - urls.length
if (dupes) log(`deduped ${dupes} duplicate URL(s)`)
const work = urls.slice(0, maxUrls)
const unprocessed = urls.slice(maxUrls)
if (unprocessed.length) log(`URL cap ${maxUrls}: ${unprocessed.length} URL(s) NOT processed — returned in 'unprocessed'`)

const results = await pipeline(
  work,
  (url) => agent(
    `You are a scraping worker. Extract data from ONE url: ${url}\n` +
    `Goal: ${input.goal}\n` +
    `Rules: respect robots.txt (status=blocked if disallowed); fetch with WebFetch or curl; prefer the page's own JSON (__NEXT_DATA__, JSON-LD, inline API payloads) over HTML parsing; ` +
    `set sourceUrl=${url} on every record; if nothing matches the goal return status=no-matches with a note explaining what the page actually contains (this distinguishes breakage from genuinely empty). ` +
    `Never bypass auth walls or anti-bot measures — report status=blocked instead.`,
    { label: `extract:${url.slice(-40)}`, phase: 'Extract', schema: EXTRACT_SCHEMA }
  ).then((r) => ({ url, r }))
)

const clean = results.filter(Boolean)
const records = clean.filter((x) => x.r && x.r.status === 'ok').flatMap((x) => x.r.records)
const failures = clean
  .filter((x) => !x.r || x.r.status !== 'ok')
  .map((x) => ({ url: x.url, status: x.r ? x.r.status : 'worker-died', note: x.r ? x.r.note : undefined }))
const lost = work.length - clean.length
if (lost) failures.push(...Array.from({ length: lost }, () => ({ url: 'unknown (agent died before reporting)', status: 'worker-died' })))

const coverage = `${records.length} record(s) from ${clean.filter((x) => x.r && x.r.status === 'ok').length}/${work.length} URL(s); ${failures.length} failure(s); ${unprocessed.length} over cap`
log(`crawl-extract: ${coverage}`)

return { records, failures, unprocessed, coverage }
