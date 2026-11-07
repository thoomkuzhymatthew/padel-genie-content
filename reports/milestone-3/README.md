# Milestone 3 — ideas for review

Built the section 7 playbook verbatim, preserved the LOCKED block, and added the
four core template descriptors with field/slide/item limits. There is no template
HTML, copy-writing stage or rendering yet. The catalogue is discovered dynamically.
No learnings have been invented: v1 is the baseline with no merged feedback.

October was re-extracted from cached raw HTML: **22 atoms verified, 2 rejected**.
The previously rejected headline is now verified as atom `a1`:

> The UK now has 3,061 padel courts open across 891 clubs.

Both values match that exact source quote. Their period is `2026-10-25`, each with
`period_source: "metadata"`, matching the source publication date. Metadata cannot
verify a statistic, comparison or claim number. Legacy quote-based periods retain
the original verification rules. August uses its milestone 2 verified handoff.

The final ideation passes produced **8 ideas per source, 0 rejected**. Earlier
attempts remain in each local run's `ideation-attempts/` directory. Final prompt
snapshots and traces are bundled here so the review does not depend on ignored
local run folders. The latest trace hashes match the current playbook, catalogue
and stage instructions. All referenced atoms were reverified before model use.

Scores are model editorial judgements, not engagement predictions. These are
proposals for human review. In particular, planning approval rates alone do not
prove planning is never a bottleneck (October idea_4), and pipeline size alone does
not settle whether a market is a bubble (October idea_1 rationale). October's
regional comparisons measure supply, not demand. August's projected figures are
historical provisional estimates, not current live counts. Preserve these limits
when deciding what should become a finished post.

Validation: 65 tests pass; TypeScript and Vite production build pass. The private
GitHub repository was confirmed before preparing the requested push. No database
writes, emails, rendered posts or HTML templates were created.

## October

Source: [The UK has passed 3,000 padel courts. Bubble? Not even close.](https://padelgenie.io/blog/uk-passes-3000-padel-courts/), published 2026-10-25. Atom IDs are scoped to this source.

| ID | Story | Atoms | Format / template | Hold-back | Score / 10 |
| --- | --- | --- | --- | --- | ---: |
| idea_1 | 3,061 courts open is the headline. The more telling number is at least 2,348 more already approved or awaiting a decision. | a1, a13 | stat / stat-card | Use Padel Genie to see which clubs are open now and which approved or pending schemes sit behind the next wave. | 9.5 |
| idea_2 | London has 3.8 courts per 100,000 people. The North West has 6.5. The gap is not about national hype. It is local supply. | a6, a23 | comparison / comparison | Open the live map to inspect borough and catchment detail behind London’s 3.8 versus the North West’s 6.5. | 9 |
| idea_3 | 38 councils with more than 100,000 residents still have no padel courts inside their boundary. | a5 | stat / stat-card | Padel Genie shows which councils these are, alongside nearby venues and planning records for local context. | 9.2 |
| idea_4 | Planning is not the brake people think it is: 85% of decided schemes were approved in the last 12 months. | a16, a17, a18, a19, a20, a21 | carousel / carousel-basic | The platform shows each planning record, scheme status and local history behind the 569 approvals, 99 refusals and 67 withdrawals. | 9.4 |
| idea_5 | Scotland has 2.1 courts per 100,000 people. Great Britain overall has 4.5. That is a very different stage of market development. | a8, a22 | comparison / comparison | Check Padel Genie for the 112 courts, 40 clubs and the local gaps behind Scotland’s lower supply. | 8.8 |
| idea_6 | Northern Ireland is level with the North West at 6.5 courts per 100,000 people. That is not where many people expect the UK leader board to land. | a7, a23 | comparison / comparison | Use the live map and planning records to see how Northern Ireland reached 6.5 and where the next schemes sit. | 8.7 |
| idea_7 | The median new padel scheme took 105 days from validation to decision. | a20, a21 | stat / stat-card | Padel Genie lets you dig into the planning records behind the 105-day median and the 64 to 164 day middle range. | 8.4 |
| idea_8 | The average UK club has 3.4 courts, the median has 3, and the largest single club has 17. | a10, a11, a1 | carousel / carousel-basic | Explore club-by-club venue detail in Padel Genie to see where operators are building small formats and where larger sites already exist. | 8.3 |

[Full ideas and editorial rationale](october/ideas.json) · [Verified atom evidence](october/atoms.verified.json) · [Prompt and model trace](october/ideate.trace.json)

### Atom reference

| Atom | Verified claim |
| --- | --- |
| a1 | The UK now has 3,061 padel courts open across 891 clubs. |
| a5 | 38 councils with more than 100,000 residents have none inside their boundary. |
| a6 | London is underserved. At 3.8 courts per 100,000 people, it is the lowest of any English region. |
| a7 | Northern Ireland is the surprise. At 6.5 courts per 100,000 people, it is level with the North West as the best-served part of the UK. |
| a8 | Scotland has 112 courts across 40 clubs, just 2.1 per 100,000 people and less than half the GB average. |
| a10 | The average UK club has 3.4 courts, and the median is 3. |
| a11 | The largest is Carbon Padel Club in Manchester with 17 courts. |
| a13 | Behind the 3,061 open courts, at least 2,348 more courts are either approved or awaiting a planning decision. |
| a16 | Approved in the last 12 months covers 569 new schemes and at least 1,266 courts. |
| a17 | Awaiting a planning decision covers 449 new schemes and at least 1,082 courts. |
| a18 | Councils approved 85% of the new padel schemes they decided in the last 12 months: 569 approvals against 99 refusals. |
| a19 | A further 67 were withdrawn. |
| a20 | The median new scheme took 105 days from validation to decision. |
| a21 | The middle half took between 64 and 164 days. |
| a22 | Across Great Britain there are 4.5 courts for every 100,000 people. |
| a23 | The North West leads Great Britain with 6.5 courts per 100,000 people. |

## August

Source: [UK padel has doubled, but there's subtlety beneath it. | The Court Report](https://padelgenie.io/blog/august-2026-uk-padel-market-recap/), published 2026-08-31. Atom IDs are scoped to this source.

| ID | Story | Atoms | Format / template | Hold-back | Score / 10 |
| --- | --- | --- | --- | --- | ---: |
| idea_1 | The shape of UK padel approvals changed: the small end rose from 88 approvals to 201. | a11 | stat / stat-card | Padel Genie shows where those approvals sit, with venue and planning records behind each one. | 9 |
| idea_2 | Covered and indoor schemes average 3.18 courts; outdoor schemes average 2.51. | a12 | comparison / comparison | Use Padel Genie to see which local approvals are covered or outdoor and how scheme shape varies by place. | 8.8 |
| idea_3 | Change of use reached 29% of new-court submissions, up from 22% in the year to August 2025. | a14 | stat / stat-card | Padel Genie lets you inspect the planning records behind those submissions and the places they are happening. | 8.7 |
| idea_4 | Conversions out of industrial, warehouse and retail stock went from 50 applications to 151. | a15 | stat / stat-card | The map and planning records show where conversion-led growth is appearing and what has been filed nearby. | 9.1 |
| idea_5 | The covered share of approvals rose from 31% to 38%. | a13 | comparison / comparison | Padel Genie helps readers trace which places are approving more covered schemes and which are not. | 8.4 |
| idea_6 | The August report says UK growth is not just more padel; it is smaller schemes, more covered courts and more conversions. | a11, a12, a13, a14, a15 | carousel / carousel-basic | The report gives the national picture; Padel Genie shows the venues, applications and catchments behind it. | 9.3 |
| idea_7 | The year to date showed 945 courts approved, up from 456. | a4 | stat / stat-card | Padel Genie shows which approvals make up that total and where they sit on the UK map. | 8.2 |
| idea_8 | In August, 48 applications were lodged, with about 110 projected for the full month. | a18 | stat / stat-card | For the August report context, Padel Genie tracks the underlying planning records rather than just the monthly headline. | 7.8 |

[Full ideas and editorial rationale](august/ideas.json) · [Verified atom evidence](august/atoms.verified.json) · [Prompt and model trace](august/ideate.trace.json)

### Atom reference

| Atom | Verified claim |
| --- | --- |
| a4 | The year to date showed 945 courts approved, up from 456. |
| a11 | The small end grew from 88 approvals to 201. |
| a12 | Covered and indoor schemes averaged 3.18 courts against 2.51 outdoor. |
| a13 | The covered share of approvals rose from 31% to 38%. |
| a14 | Change of use rose from 22% of new-court submissions in the year to August 2025 to 29% in the year since. |
| a15 | Conversions out of industrial, warehouse and retail stock went from 50 applications to 151. |
| a18 | In August, 48 applications were lodged, with about 110 projected for the full month. |
