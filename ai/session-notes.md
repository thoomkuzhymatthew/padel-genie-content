# Milestone 2 session notes

This is a work summary, not a verbatim transcript. The chat remains the source for
user approvals; a full exported transcript can be added at submission.

- Read Part 2 `agents.md` completely and checked MCP access, env variable names and build availability.
- User instructed use of `.env` and GitHub-driven Vercel deployment, then approved the proposed structure, models and milestone 2 plan.
- Implemented ingestion and deterministic verification before running extraction on both official sources.
- Used the OpenAI Docs skill and official Structured Outputs documentation for the SDK integration:
  https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses
- Kept prompts in `pipeline/prompts/extract.md` and model configuration in `config/models.json`.
- First live runs exposed adjacent HTML statistic labels; fixed text boundaries and re-extracted from cached raw HTML.
- Strengthened tests for ordinal dates, denominators, exact quote matching and malformed numeric groupings.
- No ideation, rendering, database writes, emails, pushes or deployments were performed in milestone 2.

## Milestone 3 follow-up

- User approved metadata-backed periods, asked for October's headline to be re-extracted, and authorised milestone 3 plus a GitHub push.
- October headline passed with exact counts and publication-date periods carrying `period_source: "metadata"`; final extraction accepted 22 of 24 atoms.
- Copied section 7's playbook verbatim; added the core four descriptor-only templates and fresh prompt assembly with provenance hashes.
- First ideation attempts exposed incorrect format labels and unsupported rounded numerals; preserved those attempts, constrained labels in structured output, and retained numeric validation.
- Final live ideation produced eight accepted ideas per source; review bundles include stories, atom references, formats, hold-backs, scores and full traces.
- Added one bounded repair path with offline tests; the final live runs needed no repair.
- Stop for human review before copy-writing, HTML templates or rendering.
