# Playbook v2 — first human steer and revised shortlist

The user's editorial feedback is recorded in `DECISIONS.md` as the first human
steer and applied above the unchanged LOCKED block in `playbook/playbook.md`.
It is explicit feedback, not an engagement-derived learning. Playbook v1 and its
review bundle remain available as history.

Re-extracted both cached official sources with numeric and narrative atoms.
October: **37 verified, 3 rejected**. August: **46 verified, 3 rejected**.
Extraction was promoted from the mini model to `gpt-5.4` after repeated omissions
of the critical named/CTA evidence. The model change is config-only and logged.
Both extraction and ideation retain their initial candidates, bounded correction
attempts and rejections. Model outputs never bypass verification.

Narrative atoms can have no numbers or mixed numeric content. Entities must occur
verbatim in their exact source quote; values, comparisons and numeric claim dates
still pass the existing verifier. Narrative count words must appear as words in
the quote: `two` does not become unquoted numeric `2`. Negative descriptions of
named businesses are rejected from claims; original source quotes remain exact.

Examples now available: former Homebase's numeric court count and separate
all-weather canopy/temporary-consent narrative, July's revision from 63 to 93,
the 47-approval list with addresses, and Club X-Ray's actual data fields. Source
SVG text is separated during ingestion so chart labels and values remain auditable.

The final shortlist contains **three ideas per source**, not eight padded slots.
Assistant editorial review merged council/region density variants and the overlapping
Homebase/covered-scheme angles, tightened concrete CTAs and retained original model
outputs. These assistant changes are logged separately from the user's steer and
are NOT marked human-approved. Merged angles retain the higher contributing score;
final ranks are consecutive in descending score order.

August's provisional totals, projections and explicitly qualified annual volume
headlines are omitted as main stories. The July revision is described as reported
in August, without claiming the month had reached a final number. The club story
uses the source's literal written count “Two”; it does not invent revenue amounts.

Scores are editorial readiness judgements. Proposed improvements name missing
evidence or a stronger treatment; they are not claims that extra assets already exist.

Section 9 now specifies milestone 5's format-selected viewers: 4:5 single images,
swipeable 4:5 carousels with dots and counter, and looping 9:16 video with play/pause
and mute, each in a mock social post frame with caption beneath. No viewer or other
milestone 4/5 feature was implemented in this follow-up.

Validation: **81 tests pass**, strict TypeScript and the Vite build pass, and the
full dependency audit is clean. Source, verified atom, catalogue, playbook and prompt
hashes are retained in each source bundle. Awaiting user selection for milestone 4.

## October

Source: [The UK has passed 3,000 padel courts. Bubble? Not even close.](https://padelgenie.io/blog/uk-passes-3000-padel-courts/); published 2026-10-25. Atom IDs are scoped to this source.

| Rank / ID | Story | Atoms | Format | Concrete hold-back | Score / 10 | What would improve it |
| --- | --- | --- | --- | --- | ---: | --- |
| 1 / idea_2 | Northern Ireland has 6.52 courts per 100,000 people; London has 3.80 and Scotland 2.06. The national headline hides a wide local spread. | a7, a29, a30, a31, a40, a5, a6, a35 | ranked-bars | Open the free court map and planning-pipeline preview for Northern Ireland, London and Scotland. | 9.2 | Label these as selected regions, not the top five, and show the verified GB average as a reference line. |
| 2 / idea_3 | Carbon Padel Club in Manchester has 17 courts. The average UK club has 3.4 and the median is 3, so the biggest sites are still outliers rather than the norm. | a14, a15, a16, a40 | stat | Find Carbon Padel Club’s 17 courts on the free live court map, alongside the other open venues. | 7.1 | Keep 17 as the hero and 3.4 as context; a verified image of the named club would make the scale more tangible. |
| 3 / idea_4 | Sheffield already has 51 open padel courts and approved 10 new schemes in the last year. | a26, a28, a40 | comparison | Explore Sheffield’s open courts on the live map, then inspect the planning-pipeline preview. | 6.2 | Add a verified named Sheffield approval and its decision date to connect the city totals to a real site. |

[Verified evidence](october/atoms.verified.json) · [Original model shortlist](october/ideas.model.json) · [Assistant merge/tightening log](october/ideas.curation.json) · [Prompt/model trace](october/ideate.trace.json)

### Referenced facts

| Atom | Kind | Verified claim |
| --- | --- | --- |
| a5 | numeric | Hertsmere has 26 courts per 100,000 people. |
| a6 | numeric | 38 councils with more than 100,000 residents have no open padel court inside their boundary. |
| a7 | numeric | London has 3.8 courts per 100,000 people and is the lowest of any English region. |
| a14 | numeric | The average UK club has 3.4 courts, and the median is 3. |
| a15 | numeric | Carbon Padel Club in Manchester is the largest club with 17 courts. |
| a16 | numeric | Rocket Padel Bristol and Padel Bonito in Sheffield have 14 courts each. |
| a26 | numeric | East Riding of Yorkshire approved 12 new schemes in the last year and Sheffield approved 10. |
| a29 | numeric | Across Great Britain there are 4.5 courts for every 100,000 people. |
| a30 | numeric | The North West has 6.48 courts per 100,000 people, versus the GB average of 4.5 and London's 3.80. |
| a31 | numeric | Northern Ireland has 6.52 courts per 100,000 people, South West 5.07, North East 5.02, Yorkshire and the Humber 5.02, East of England 4.86, South East 4.61, Midlands 4.31, Wales 3.54, and Scotland 2.06. |
| a28 | numeric | Sheffield already has 51 open courts and ranks third among councils by open-court total. |
| a35 | numeric | The chart shows Hertsmere at 26.0, Preston at 20.3, Mid Sussex at 18.3, Welwyn Hatfield at 15.0 and Broadland at 14.4 courts per 100,000 people, against a GB average of 4.5. |
| a40 | numeric | The article says you can filter any catchment for warehouses, sports clubs, schools, car parks and brownfield land, and paid plans start from £200 a month or £160 when paid annually. |

## August

Source: [UK padel has doubled, but there's subtlety beneath it. | The Court Report](https://padelgenie.io/blog/august-2026-uk-padel-market-recap/); published 2026-08-31. Atom IDs are scoped to this source.

| Rank / ID | Story | Atoms | Format | Concrete hold-back | Score / 10 | What would improve it |
| --- | --- | --- | --- | --- | ---: | --- |
| 1 / idea_1 | Change of use is taking a bigger share of padel growth: 29% of new-court submissions were change of use, and the former Homebase on Finchley Road reached 10 courts. | a20, a21, a25, a50, a51, a26, a49, a18 | carousel | See all 47 approvals of five courts or more from the last twelve months, with addresses, decision dates, court counts and former building type in Padel Genie. | 9.1 | Use the verified Merlin Way example alongside Homebase to show reuse across more than one place. |
| 2 / idea_2 | July was revised from 63 lodged applications to 93 as reported in August, a reminder that council planning data arrives late rather than all at once. | a27, a29, a30, a49 | stat | Use Padel Genie’s daily-updated planning application map to track new applications as councils publish. | 8.2 | It would be better with a named council example showing the lag in practice, if a verified atom for one is available. |
| 3 / idea_4 | Two of August’s highest-revenue padel clubs: Carbon Padel Club and Rocks Lane Chiswick. | a46, a48, a52 | stat | Inspect Carbon Padel Club and Rocks Lane Chiswick in Club X-Ray: occupancy, price and estimated revenue. | 6.3 | Obtain verified revenue figures before making a quantitative revenue comparison; the source currently supports the reported ranking. |

[Verified evidence](august/atoms.verified.json) · [Original model shortlist](august/ideas.model.json) · [Assistant merge/tightening log](august/ideas.curation.json) · [Prompt/model trace](august/ideate.trace.json)

### Referenced facts

| Atom | Kind | Verified claim |
| --- | --- | --- |
| a18 | numeric | Covered and indoor schemes average 3.18 courts against 2.51 outdoor. |
| a21 | numeric | Conversions out of industrial, warehouse and retail stock went from 50 applications to 151. |
| a25 | numeric | The Former Homebase, 255 Finchley Road Camden scheme had 10 courts and was a DIY superstore. |
| a27 | numeric | Last month's issue reported 63 applications lodged in July, and the confirmed figure is 93. |
| a30 | numeric | On average, councils publish to their planning portals about 16 days late. |
| a46 | narrative | The article says Carbon Padel Club and Rocks Lane Chiswick were the two highest revenue-generating padel clubs in the country in August. |
| a48 | narrative | Club X-Ray covers every bookable club in the country, with occupancy, price and estimated revenue. |
| a49 | narrative | Padel Genie maps every UK padel venue and every padel planning application, updated daily as councils publish. |
| a20 | numeric | Change of use went from 22% of new-court submissions in the year to August 2025 to 29% in the year since. |
| a26 | numeric | The product lists 47 approvals of five courts or more from the last twelve months, with addresses, decision dates, court counts and what the building used to be. |
| a29 | numeric | The count filled in from 63 on 1 August to 79 by the 20th and 93 today, and it is still not finished. |
| a50 | numeric | A scheme at Former Homebase, 255 Finchley Road Camden had 10 courts and the building was a DIY superstore. |
| a51 | narrative | The Homebase scheme was under an all-weather canopy on a temporary consent. |
| a52 | narrative | Club X-Ray covers every bookable club in the country, with occupancy, price and estimated revenue. |
