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
