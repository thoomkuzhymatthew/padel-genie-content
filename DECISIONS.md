# Decisions

- Keep one root Node package and a separate `web/` Vite root so pipeline secrets never enter browser imports.
- Route stages through `config/models.json` and the official OpenAI SDK with structured output and bounded transport retries.
- Save raw source, canonical text, candidate atoms, rejected atoms and trace per run; only verified atoms form the downstream handoff.
- Compare whole numeric tokens, including comparisons and period years, and reject undeclared claim numbers; numeric traceability is not semantic fact checking.
- Keep run artifacts local and ignored by Git because the brief and outputs are confidential; no push or deployment in milestone 2.
- Re-extract cached raw HTML after fixing inline text boundaries rather than requesting the source again; record the verifier code hash with final results.
- Upgrade `csv-parse` to 7.0.3 or later to resolve its published prototype-replacement advisory; full dependency audit is clean.
