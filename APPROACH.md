# A social intern with a human editor

I’d build an editorial system around Padel Genie’s strongest asset: specific, hard-to-find information about UK padel. Give the padel ecosystem a useful story, then make the product worth exploring. October’s court-count report and August’s planning analysis test it across two sources.

## What makes good content

Give away **the story**, supply **proof**, and hold back **a concrete useful detail**. Pair a hero number with a named place, club or scheme wherever the source supports it: numbers give scale; names make it memorable. The rise to 151 conversion applications becomes tangible beside the former Homebase on Finchley Road and Merlin Way. The hold-back is an actual product item: all 47 approvals of five courts or more, with addresses and decision details.

Avoid crowded cards, rounded-up claims, repeated angles, hype and vague “insights”. Prefer one story, plain British English and neutral business descriptions. Use ranked bars for regions and carousels for named examples. Avoid provisional hero figures; the explicitly selected comparison retains its provisional caveat.

## Tools and model choices

TypeScript covers the pipeline and React inbox. Supabase supplies reviewer auth, RLS and action history; Vercel hosts the app. HTML/CSS plus Playwright produces consistent graphics without generated imagery. The four formats are stat cards, ranked bars, comparisons and carousels.

The official OpenAI SDK returns structured JSON; `config/models.json` selects each stage’s model. This trial uses GPT-5.4 for extraction, ideation, copy and learning. A smaller extractor repeatedly missed important named evidence, so accuracy won over the initial saving. Code still checks exact quotes and numbers. Provenance is not semantic truth; human review remains essential.

## Running at scale

Template descriptors build the prompt catalogue automatically. Snapshots and model/playbook hashes make outputs traceable; layout checks reject collisions, overflow and unsafe type or margins. Emails flag drafts, reports and replays; delivery failures never break jobs.

Weekly learning and on-demand triggering run in GitHub Actions; rendering stays on a local machine or runner. Daily discovery and the complete URL-to-inbox command remain unfinished. Scaling means joining the existing stages, adding deduplication and bounded queues, and preserving the verification and review gates.

## Learning and autonomy

A human edit explains a preference immediately; early engagement mostly reflects small samples and distribution. Store the note, actor and diff. Route local wording to that post, layout feedback to template code, recurring editorial preferences to proposed playbook edits, and factual concerns to atom review.

The first report uses five real approvals and one layout rejection, with no invented edits or editorial change. Metrics are explicitly mock; performance suggestions need at least 20 posted items per format. PRs and replay comparisons support human decisions; code preserves LOCKED rules. The intern never merges.

Autonomy should be earned by format: over 90% approval without edits across 30 posts could justify limited automatic posting with spot checks. New formats and factual flags still require review. Today publishing is entirely manual.

## Next steps

Start with **Request changes**: a short mobile note produces a revised draft with its note and diff recorded for approval. Then add URL generation, daily discovery, real Instagram/LinkedIn adapters or authorised CSV imports, and a verified email domain. Extend the review model to a WhatsApp intern, introduce audience-aware playbook sections, and build council-level opportunity maps with Padel Genie’s full dataset. Paid targeting and generative imagery remain outside this trial.
