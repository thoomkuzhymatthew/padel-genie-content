# Milestone 6 verification

Live inbox: https://padel-genie-content.vercel.app/#learning

Real inbox-triggered run: [GitHub Actions](https://github.com/thoomkuzhymatthew/padel-genie-content/actions/runs/42474065258) — **success**.
Proposal: [PR #1](https://github.com/thoomkuzhymatthew/padel-genie-content/pull/1).
Report: [learning report](learning-ba139e8b-2d33-4e83-9e15-1f5fb90d5907.md).

## Evidence and proposal

The snapshot contains exactly six real events: five approvals and one layout
rejection. There are no genuine edits or posted items. No verification fixtures
or synthetic human feedback enter the report. The mock metrics adapter consequently
produces zero posted-item rows; every format says “not enough data yet”.

The divider rejection is classified as template/layout, resolved in stat-card CSS,
and displayed on the original note. The report proposes no editorial change.
The proposal branch changes only its report file. A Git comparison confirms the
entire playbook, including the LOCKED section, is byte-identical to main.

Both sources were re-ideated, rewritten and rendered against verified evidence.
With an unchanged playbook, the comparison deliberately reuses the same generated
control in both columns; it does not manufacture differences. Replay PNG hashes
were checked against the production deployment before the run became done.

## Live UI checks

- learning trigger rejects anonymous access.
- test account reaches live Learning and Settings navigation.
- Settings add and per-type toggle persist.
- Settings removes notification recipients.
- real Update intern click dispatches GitHub Actions.
- active workflow disables duplicate trigger.
- real inbox-triggered workflow completed.
- original rejection displays template/layout classification.
- corrected reserve image is live in its original rejected post.
- Learning tab links to actual proposal PR.
- both sources have current/proposed replay drafts.
- live replay PNG loads at full resolution.
- latest report is the persisted workflow report.
- Learning view has no mobile horizontal overflow.
- no browser runtime errors.

## Additional checks

- Settings add/remove and per-email-type toggles persist across reload.
- 103 automated tests pass; TypeScript and the production build pass.
- All six new tables reject anonymous reads; reviewer sessions cannot forge metrics or completed reports.
- A factual edit note immediately flags linked atoms and blocks approval.
- Render checks reject overflow, element collisions, unsafe margins and undersized text.
- All six existing posts render successfully; all affected inbox assets and example exports were refreshed.
- Private environment values are absent from tracked files and the browser distribution.
- Vercel runtime error query returned zero records within available retention.

## Notifications

The new-draft notification was accepted by Resend for the provider-confirmed
Resend account address. The Actions run finished successfully despite two failed
email attempts: its RESEND_API_KEY resolved empty. The independent, idempotent
notification retry workflow is ready; Actions email verification is pending the
repository secret correction. No recipient-open or inbox-delivery claim is made.

“Request changes” for mobile and URL-to-drafts remain documented next steps.
