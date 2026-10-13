---
name: analyze
description: This skill should be used when the user asks to "analyze this data", "find trends", "compare these numbers", "build a dashboard", "what does the data say", "run the stats", or hands over CSVs/JSON/database extracts for insight. Sets the pull-clean-analyze-visualize pipeline, statistical rigor rules, and honest-uncertainty reporting.
version: 0.1.0
---

# Data analysis

From raw data to defensible insight: a fixed pipeline with rigor rules at each stage.

## The pipeline

1. **Pull** — get the data + its provenance (source, extraction date, filters already applied). Analysis of data with unknown provenance gets that caveat stamped on every conclusion.
2. **Profile before analyzing** — row count, column types, null rates, duplicates, min/max sanity, and the 5 weirdest rows. Ten minutes of profiling prevents most wrong conclusions. Report anything dropped or imputed.
3. **Analyze** — pick methods that fit the data size and question (see rigor rules). Prefer simple + explainable over clever; a group-by that answers the question beats a model that impresses.
4. **Visualize** — before writing ANY chart code, read and follow the `dataviz` skill if available (it owns form, palette, and accessibility). One message: every chart answers one stated question.
5. **Report** — lead with the answer, then evidence, then caveats. Numbers in context ("up 12% vs. prior month"), never bare.

## Statistical rigor rules

1. **Effect size with every "significant"** — p-values without magnitude are noise; usually the magnitude IS the answer.
2. **State n everywhere** — a percentage without its denominator is a rumor. Flag any conclusion resting on n < 30.
3. **Correlation gets a confound check** — name at least one plausible confounder before implying causation, or say "correlational only".
4. **Time series get seasonality respect** — compare year-over-year or deseasonalize before declaring trends; never extrapolate from a partial period silently.
5. **Distributions before means** — check skew/outliers first; report medians when skewed. One whale distorts every average.
6. **Multiple comparisons compound** — testing 20 hypotheses at p<0.05 expects a false positive; say so or correct for it.

## Honest uncertainty

Every deliverable states: what the data can't answer, which conclusions are fragile (would flip with modest data changes), and what's missing that would strengthen the analysis. An analysis that reads "certain" everywhere is either trivial or wrong.

## Tooling defaults

Python + pandas for anything beyond trivial (uv/venv per project); SQL pushed down to the database when data lives there (database-toolkit governs query safety); scratch outputs to the session scratchpad, deliverables to the project.

## When NOT to use this skill

Building data *infrastructure* (pipelines, warehouses — devops/database toolkits); one bare arithmetic lookup; ML model *engineering* (this skill covers analysis, not production ML systems).
