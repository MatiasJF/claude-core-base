---
name: scrape
description: This skill should be used when the user asks to "scrape a site", "extract data from this page", "crawl these URLs", "get all the listings/prices/posts from", "monitor a page for changes", or wants structured data pulled from the web. Sets the legality/robots gate, the tool ladder, anti-brittleness rules, and schema-first extraction.
version: 0.1.0
---

# Scraping & structured extraction

Get web data reliably, respectfully, and in a shape code can use.

## Step 0 — The gate (before any fetch)

- **Check robots.txt and terms** for the target. Respect disallows for bulk crawling; a single manual-equivalent page fetch for the user's own research is normal use.
- **Personal data**: scraping personal data at scale triggers GDPR-class concerns — ask what it's for and where it's stored before proceeding.
- **Auth walls**: never bypass logins, paywalls, or anti-bot measures. If the user has legitimate API access, use the API instead — always prefer an official API over scraping the HTML.
- **Rate**: default to ≤1 request/second per host with jitter; identify honestly via User-Agent for bulk work.

## The tool ladder (start at the top, escalate only when needed)

1. **Official API / existing MCP** — check configured MCPs first; one may already cover the target.
2. **WebFetch / curl** — static HTML and JSON endpoints. Look for the site's own JSON (API calls in page source, `__NEXT_DATA__`, JSON-LD) before parsing HTML.
3. **Headless browser** (playwright/puppeteer) — only when content is genuinely client-rendered. Costs 10× the resources; confirm level 2 truly fails first.

## Schema-first extraction

Define the output shape BEFORE extracting: field names, types, required vs optional, and a `sourceUrl` on every record. Extraction without a schema produces a soup that gets re-parsed forever. Validate records against the schema as they're produced; log and quarantine failures rather than silently dropping them.

## Anti-brittleness rules

1. **Prefer semantic anchors over positional selectors** — `[data-testid]`, ARIA roles, ids, stable classes; never `div:nth-child(4) > span`.
2. **Every selector gets a fallback and a loud failure** — when a selector matches 0 nodes, report it as breakage, don't return an empty dataset that looks like "no results".
3. **Snapshot a sample** — save one raw page per run alongside extracted data; when the site changes, the diff explains what broke.
4. **Idempotent re-runs** — key records naturally (URL, id) so re-crawls upsert instead of duplicating.

## Scale via orchestration

For many URLs, use the bundled workflow (user opt-in required for multi-agent):
`Workflow({ scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/crawl-extract.js", args: { urls: [...], schema: {...}, goal: "..." } })` — pipeline: fetch+extract per URL against the schema, validate, merge with per-URL failure reporting.

## When NOT to use this skill

The data has an official export/API you can just use; one-off reading of a page (just fetch it); anything requiring credential/paywall circumvention — decline that plainly.
