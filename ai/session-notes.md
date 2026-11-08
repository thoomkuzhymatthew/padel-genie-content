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

## Playbook v2 follow-up — first human steer

- User requested hero-number/named-example pairings, concrete hold-backs, merged duplicates, ranked geographic bars, meaningful score/rank separation, improvement lines and no provisional/projected hero stories.
- Applied feedback above the unchanged LOCKED playbook block and saved v2 history; this is human editorial feedback, not performance learning.
- Added kind/entities/certainty to extraction, exact entity and narrative-word checks, and a bounded traceable correction pass. Rejected negative named-business claims while preserving source quotes.
- Mini extraction missed key named evidence repeatedly; switched the config to gpt-5.4 and documented the reason.
- Re-extracted cached October/August sources with 37/46 verified atoms. Added readable SVG text boundaries for chart evidence.
- Original model shortlists contained overlapping angles. Assistant merged/tightened them to three proposals per source and recorded those changes separately without claiming human approval.
- Added native-format preview requirements to section 9 for milestone 5 only. No preview components or milestone 4 assets were built.

## Milestone 4 — first visual checkpoint

- User supplied the second steer: merge true duplicates but always return 6–8 distinct ideas. Added playbook v3, logged the steer and updated ideation's prompt/schema/count gate.
- User selected five posts and A2 as reserve, with an explicit PNG style checkpoint before other templates.
- Implemented only stat-card HTML/CSS and the source-verified Playwright renderer, using local Bricolage Grotesque/Inter fonts with licenses.
- First preview: 3,061 courts / 891 clubs, 1080×1350, source/date line, cream/forest/terracotta tokens. Inspected the actual PNG and checked font readiness, bounds and numerical provenance.
- The August comparison is an explicit user selection; retain the article's provisional-August caveat when built.
- Stop after showing the first PNG. Other templates and selected posts remain queued for style approval.
