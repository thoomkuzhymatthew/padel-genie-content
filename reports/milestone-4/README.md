# Milestone 4 — rendered batch

The user approved the first stat-card style. All four core HTML/CSS templates now
render real content using that visual system: forest, cream, terracotta, Bricolage
Grotesque and Inter. Each PNG is 1080×1350 with a source and publication-month line.
The original approved first-card PNG is pixel-for-pixel unchanged.

## Selected posts

| Post | PNGs | Evidence |
| --- | ---: | --- |
| UK court count: 3,061 courts / 891 clubs | 1 | October a1, a40 |
| 38 councils with over 100,000 residents and no court | 1 | October a6, a40 |
| All published regions and nations, ranked; GB average 4.5 | 1 | October a29–a31, a40 |
| Year-on-year planning pipeline | 1 | August a1, a3–a5, a9, a49 |
| Reuse carousel: Homebase, Merlin Way, 47 approvals | 5 | August a20–a22, a25, a26, a49, a51 |
| July revision / A2 reserve | 1 | August a27, a29, a30, a49 |

[All selected PNGs and captions](../../examples/selected-posts.zip) ·
[Contact sheet](../../examples/selected-posts-preview.png) ·
[Full-size examples](../../examples/README.md)

## Reproduce

```sh
npm run render:examples
npm run render:examples -- --reserve
npm run render -- --draft reports/milestone-4/pipeline-year-on-year.draft.json
npm run write -- --draft reports/milestone-4/july-revision.seed.json --output /tmp/july-new-draft.json
```

The copy stage uses the configured `copy` model with the current playbook, template
catalogue, learnings and selected atoms. It preserves fixed numerical fields and
writes to a new draft. Primary example copy was assistant-curated; reserve A2 also
exercises the configured SDK copy path and retains the actual model/prompt trace.
No model call is invented for the assistant-curated examples.

Outputs are in `web/public/outputs/milestone-4/`; each post has a trace with source,
atom, playbook, template, content and renderer hashes plus layout/font checks. New
formats are discovered from template folders; template text is escaped on insertion.
Carousel counters are structural pagination, not source statistics.

Verification checks nested field types/limits, all numerical content, regional
label/value pairings, coverage of every published area, the GB average, descending
bar order, comparison metric units and before/after pair direction. August's visible
provisional caveat is required. Source scope and semantic copy were also reviewed.
Five selected posts comprise nine PNGs; the reserve adds one. All were visually
inspected. 91 tests and the production build pass; the dependency audit is clean.

This completes milestone 4. Database queueing, authenticated review actions and
native-format inbox viewers belong to milestone 5, not this batch.
