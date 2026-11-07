# Assumptions

- Use the root `.env` for local server-side configuration, as requested; deployment is driven from GitHub.
- The August 2026 UK padel market recap linked from the official blog is the missing August Court Report; record its actual title/date on ingestion.
- Milestone 2 ends at verified atoms; ideation, rendering, database writes and inbox actions require their own milestone approval.
- Date-less local files retain a null publication date; visible author bylines may supply dates, but ordinary dates in body copy may not.
- The latest user message authorises completing milestone 3 and pushing to GitHub; stop after presenting ideas, before writing copy or template HTML.
- `period_source` belongs alongside each value's `period`, allowing different period provenance within one atom; legacy atoms without the field remain quote-based.
- Metadata periods label the article's publication snapshot and never infer an observation window or override an explicit historical/provisional period.
