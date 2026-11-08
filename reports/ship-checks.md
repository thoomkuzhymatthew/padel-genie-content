# Ship checks — 8 November 2026

Target: [production inbox](https://padel-genie-content.vercel.app).
Browser verification used only the configured test account. Temporary posts/events
were removed and the five real approvals plus rejected reserve were preserved.

## Section 18: definition of done

| Criterion | Result and evidence |
| --- | --- |
| One URL command produces rendered drafts in the inbox | **Open.** `pipeline/cli.ts` ends after atomisation/verification. Ideation, seed selection, writing, rendering and the demo queue remain explicit stages. The URL box and daily ingest are deferred; this is not claimed complete. |
| No unverified number reaches a graphic | **Pass for the implemented path.** Exact source-quote, whole-number, comparison/unit/region binding and render checks; unsupported edit numbers and unsafe copy are rejected. Human review still checks meaning. |
| Login required; public key alone cannot read tables | **Pass.** Signed-out feed hidden; sign-ups disabled; anonymous reads denied for posts and all six learning/settings tables; reviewer writes use guarded RPCs. |
| Approve, edit and reject work on a phone, preserving diff/reason | **Pass live.** 390px touch viewport; inline edit, note, server diff, attribution, required reason, resubmission, approval and mark-as-posted. [Browser checks](ship-live.json). |
| A new pipeline run emails new drafts | **Partial.** Queue notification hook exists and new-draft email was confirmed delivered by Matthew. The ingest-only `pipeline` command does not reach the queue or send this notification; the one-command gap above remains. |
| Real feedback produces a report/PR and replay, preserving LOCKED | **Pass.** [Successful inbox-triggered run](https://github.com/thoomkuzhymatthew/padel-genie-content/actions/runs/42474065258), [report](../ai/learning-report.md), [PR #1](https://github.com/thoomkuzhymatthew/padel-genie-content/pull/1). Five approvals and one layout rejection support no editorial change, so the PR is report-only. Entire playbook unchanged. Both source replays load live. |
| At least three publishable examples | **Pass.** Five approved posts / nine 1080×1350 PNGs and captions; refreshed graphics re-approved. Export hashes match live assets. [Manifest](../examples/manifest.json). |

## Release verification

- 103 automated tests pass across 12 files; TypeScript and production build pass.
- Factual feedback immediately flags linked atoms and blocks approval.
- Learning report, PR link, both source replays and corrected reserve image work live with no browser runtime errors or mobile overflow.
- Matthew confirmed receipt of **all three email types**. Resend acceptances and the successful notification-only retry are documented in [milestone 6](milestone-6.md).
- The local Part 2 transcript spans milestones 2–6 and ship work. Credentials, email addresses, private reasoning and binary payloads are excluded. No earlier Part 2 transcript was identified as missing; the export has a documented snapshot cutoff.
- Secret checks cover tracked/candidate files, browser assets and Git history; environment files remain ignored. Raw session logs and browser auth state are not shipped.

Known incompletions: the one-command pipeline and its automatic notification,
daily discovery, URL generation and the next steps listed in APPROACH.md. These
are not represented as completed definition-of-done items.
