# Milestone 5 verification

Production: https://padel-genie-content.vercel.app

Verified 8 November 2026 against the content project selected by `.env`, through
CLI operations only. Public sign-ups are disabled; email/password auth is enabled.
James and Matthew have reviewer profiles. Only the configured test account was
used for sign-in. No existing account credentials were changed.

## Live browser evidence

- login has noindex metadata.
- live response has noindex header.
- signed-out browser cannot see inbox posts.
- test-account login reaches live inbox.
- six queued original posts present.
- single image uses 4:5 aspect ratio.
- carousel next control and counter work.
- carousel dots navigate to chosen slide.
- touch swipe changes carousel slide.
- caption edit saves and shows reviewer attribution.
- artwork edit hides old PNG and blocks approval.
- mobile page has no horizontal overflow.
- artwork before/after diff and test actor persisted.
- render confirmation refuses undeployed artwork.
- deployed re-render replaces stale placeholder.
- new live PNG loads at full resolution.
- reject submit disabled without a reason.
- reject saves reason and moves draft to Rejected.
- edit resubmits a rejected draft to Proposed.
- approve moves draft to Approved with actor.
- mark-as-posted moves draft to Posted with actor.
- posted status persists across reload.
- all live action types and test-account attribution persisted.
- sign-out removes the feed.

Zero browser runtime errors. Temporary post and all its events were removed;
the six real drafts remain proposed. No fabricated feedback enters learning history.
The local render command produced the edited 1080×1350 PNG, GitHub deployed it,
and hash confirmation marked the new artwork current before approval was tested.

## Data and build checks

- Anonymous reads and direct reviewer writes are denied.
- Authenticated reviewer RPC records the actual actor and nested before/after diff.
- Missing review versions, stale concurrent versions, unsupported numbers and edits
  to verified hero figures are rejected.
- Reviewers cannot invoke the admin render-confirmation RPC.
- Rejection requires a reason; stale artwork cannot be approved; posted content is read only.
- Caption-only edits preserve artwork; artwork wording edits mark it stale.
- 93 automated tests pass; TypeScript and production build pass.
- Browser distribution checked for private environment values and test credentials.

The 9:16 video viewer is implemented with looping, mute and playback controls;
its markup is tested, but there is no video asset in this six-post batch.
Learning, Settings and emails remain milestone 6.
