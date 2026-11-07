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
