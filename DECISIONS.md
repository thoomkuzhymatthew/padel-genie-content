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
