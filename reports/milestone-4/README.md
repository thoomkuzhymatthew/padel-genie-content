# First style checkpoint

Only the stat-card template is implemented. The first preview is a source-verified
1080×1350 PNG using Padel Genie forest, terracotta, cream and ink tokens, Bricolage
Grotesque headings and Inter body text. It includes the source/date footer.

Run:

```sh
npm run render -- --draft reports/milestone-4/first-stat.draft.json
```

Output: `web/public/outputs/style-preview/uk-court-count.png`. The adjacent trace
records source/atom, playbook, template and content hashes, with font and overflow
checks. A fixed assistant-authored style draft is used for this checkpoint. The
renderer re-verifies the source handoff, validates descriptor field limits, requires
an exact publication-month source line, checks every rendered numeric value and
escapes text before HTML insertion.

Awaiting the user's style approval before the remaining templates and posts in
`reports/milestone-4-plan.md`. No inbox previews, database writes or publishing
were implemented. August's selected comparison will retain the source caveat.
