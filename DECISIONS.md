# Decisions

- Keep one root Node package and a separate `web/` Vite root so pipeline secrets never enter browser imports.
- Route stages through `config/models.json` and the official OpenAI SDK with structured output and bounded transport retries.
- Save raw source, canonical text, candidate atoms, rejected atoms and trace per run; only verified atoms form the downstream handoff.
- Compare whole numeric tokens, including comparisons and period years, and reject undeclared claim numbers; numeric traceability is not semantic fact checking.
- Keep run artifacts local and ignored by Git because the brief and outputs are confidential; no push or deployment in milestone 2.
- Re-extract cached raw HTML after fixing inline text boundaries rather than requesting the source again; record the verifier code hash with final results.
- Upgrade `csv-parse` to 7.0.3 or later to resolve its published prototype-replacement advisory; full dependency audit is clean.
- Metadata-backed periods must exactly equal the source publication date and carry `period_source: "metadata"`; all statistic values and comparisons still require quote evidence.
- Keep metadata-only dates out of claim prose so publication context cannot masquerade as a quote-verified statistic or event date.
- Use section 7's playbook verbatim, including its locked block; baseline learnings explicitly say no merged feedback exists.
- Discover descriptor-only template folders before rendering exists; catalogue-constrained JSON enums prevent invented template/format labels.
- Reverify atom handoffs before prompt assembly and check idea numbers against selected atom values, comparisons and verified periods.
- Preserve first ideation attempts locally; save final review bundles in the private repository so the requested atom references and traces are reviewable on GitHub.

## First human steer — playbook v2

- Human editorial feedback: pair a hero number with a source-supported named example because scale earns credibility and names make it memorable and shareable.
- Human editorial feedback: hold-backs must name a concrete product item, with supporting evidence; generic promises such as “records behind the total” are insufficient.
- Human editorial feedback: merge near-duplicate ideas and use ranked-bars for multi-region comparisons so the batch contains distinct stories.
- Human editorial feedback: force unique ranks and distinct scores with at least a 2.5-point spread for four or more ideas; include a specific improvement line to make the ranking useful.
- Human editorial feedback: provisional, projected and forecast figures cannot lead a post; confirmed historical revisions can be discussed as reported, without invented finality.
- Extract narrative atoms with exact named-entity evidence and unchanged numeric checks; neutral factual business descriptions take priority over copying a source's criticism.
- Preserve SVG text boundaries during ingestion so published chart labels and values can be verified without reading hidden JavaScript or guessing ranks.
- Record native-format previews in section 9 for milestone 5 only; select an extensible viewer from post.format and display it in a social frame with caption beneath.
- Promote extraction from gpt-5.4-mini to gpt-5.4 via model config after repeated mini runs dropped the exact quotes for Homebase, the 47-approval list and regional chart evidence; completeness of verified narrative examples outweighs the small prototype cost saving.
- Retain raw model shortlists and record assistant merges/tightenings in ideas.curation.json; assistant editorial work is never logged as a human approval or reviewer event.
- For this replay, merge council/region density variants into one ranked-bars idea and combine Homebase reuse/covered-scheme variants into one carousel; return three distinct ideas per source rather than pad the batch.
- Narrative count words require lexical quote evidence; do not convert a written “two” or “ten” into an unquoted digit value.

## Second human steer — breadth and milestone 4 selection

- Human editorial feedback: “Merge true duplicates, but always return 6–8 distinct ideas”; v2 over-pruned strong distinct angles, so the current playbook is v3 and the shorter historical v2 shortlist remains an audit artifact.
- The selected milestone 4 batch is two October stat cards, all-region ranked bars with the GB average, the August year-on-year pipeline comparison, and a Homebase/Merlin Way reuse carousel; July's revision is reserve.
- Render only the 3,061-court stat card first, then wait for visual-style approval before implementing the other templates or posts, as requested.
- The August comparison is explicitly selected by the user despite the earlier rule against provisional hero figures; retain its provisional-August caveat when it is built.

## Milestone 4 — approved style extended

- The user approved the first stat card; carry its typography, forest/cream blocks and terracotta accents through the remaining formats. Its original PNG remains pixel-identical.
- The ranked chart includes all 11 published regions/nations, retaining the source's Midlands grouping and a separate GB-average line; do not invent a different geographic split or round the published values.
- Bind regional labels to their quoted values and comparison rows to their units and before/after atom pairs; numeric presence alone would not catch swapped labels or years.
- Use a five-slide reuse carousel: conversion trend, change-of-use share, Homebase, Merlin Way, and the concrete 47-approval hold-back; describe schemes as approvals rather than open courts.
- Keep the user-selected August comparison's provisional caveat on the graphic and in its caption. Its selection is explicit and does not silently change the general playbook rule.
- Add the optional July-revision reserve through the configured copy model; retain fixed factual fields and trace the actual generation input separately from the evidence-context input.
- Primary example copy is assistant-curated and explicitly tagged that way; do not fabricate configured-model calls or publication approvals.

## Milestone 5 — authenticated review

- User explicitly selected the content project in this repo's `.env` and CLI-only operations; the Part 1 MCP/project is never a migration or queue target.
- Only `REVIEWER_TEST_EMAIL` / `REVIEWER_TEST_PASSWORD` are used for login testing; existing reviewer passwords are never reset.
- Queue all six selected/rendered posts as proposed with idempotent slugs, complete evidence/render/model traces and the originating playbook hash/version.
- All review writes use a transactional RPC with the authenticated actor, optimistic version check and server-computed before/after diff; direct client writes are revoked.
- Editing artwork marks it stale and blocks approval/posting; caption-only edits retain current images. Editing an approved/rejected draft returns it to proposed for review.
- Per the user's approval, Playwright re-rendering runs locally with `npm run render -- --post <id>`, never on Vercel.
- A re-render stays stale until its versioned image files are deployed and `npm run render:confirm -- --post <id>` verifies their hashes at `INBOX_URL`; this prevents old or missing images masquerading as updated artwork.
- Only the public Supabase URL and anon key are configured for Vercel's browser build. Queue/admin/test credentials stay local and are never shipped.
- Use HTTP 409 for optimistic review conflicts rather than a database serialization error, so an expected stale-edit conflict is not retried as a transient database fault.
- Test live actions on a temporary verification post using the configured test account, then remove that fixture and its events; the six real drafts remain proposed without synthetic feedback polluting the learning history.
- Keep verified numeric fields fixed during inbox edits; reviewers can change wording, while factual figure changes require the evidence pipeline.
