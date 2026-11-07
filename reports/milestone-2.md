# Milestone 2 validation — 7 November 2026

Implemented URL and local HTML/Markdown/CSV ingestion, structured fact extraction,
and a deterministic verifier. Both demo sources completed live extraction using
`gpt-5.4-mini`; returned model IDs and usage are recorded in each run's trace.

| Source | Published | Candidates | Verified | Rejected | Local run |
| --- | --- | ---: | ---: | ---: | --- |
| October court report | 25 October 2026 | 20 | 17 | 3 | `runs/2026-11-07T23-07-59-458Z-17be4129/` |
| August market recap | 31 August 2026 | 22 | 18 | 4 | `runs/2026-11-07T23-08-00-501Z-62198051/` |

Source URLs and provenance: [October](https://padelgenie.io/blog/uk-passes-3000-padel-courts/)
and [August](https://padelgenie.io/blog/august-2026-uk-padel-market-recap/).
Each page was fetched once. The initial runs exposed adjacent inline HTML labels;
the final runs re-extracted from the original cached raw HTML after fixing text
boundaries. August's visible byline supplied its publication date. No inferred
date was assigned from an ordinary body-text date.

Reviewed accepted atoms against their saved quotes: October includes planning
pipeline, regional density, indoor mix and tracked-club occupancy; August includes
historical approvals, conversions, scheme size and provisional monthly figures.
Examples of intended rejections include a date added to a claim but absent from
its quote, a value of 1 attributed to a quoted 1,150, and converting spelled-out
numbers into unsupported digit tokens. Candidates remain intact in the run folders.
The headline October court count was rejected because its claim included a date
absent from its selected quote; it must be re-extracted with complete evidence
before that atom can be used. No rejected atom has been silently repaired.

Validation:

- 47 tests passed across ingestion and verification.
- `npm run build` passed: strict TypeScript and the minimal Vite/React shell.
- `npm audit` reported zero vulnerabilities after upgrading `csv-parse`.
- `.env` and run artifacts are ignored by Git; no credentials are imported by web code.
- Final verification files record the canonical source hash and verifier code hash.

Limits: this gate proves numeric traceability, not semantic interpretation. It
cannot guarantee qualifiers, units or comparison direction; human review is still
required. Text-only evidence omits JavaScript-only chart values. Exact quote
requirements deliberately reject numeric word conversions. No database writes,
ideation, rendered graphics, emails, pushes or deployment were performed.
