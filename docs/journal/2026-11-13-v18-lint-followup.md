# Studio V18 — scoped lint follow-up

- Date: 2026-11-13; PR #1704, stacked on #1699.

## Finding and change
The panel lint had eight Prettier errors in two tests inherited from #1699. Formatted those tests and the modified real-stack drag spec. Inspected local commit 7ad39db1; its older brand test was not applied. No booking behavior changed.

## Validation and limitations
Panel lint: zero errors, eight existing warnings. Scoped Prettier: pass. Panel Jest: 130 suites / 658 tests passed. Backend targeted Jest: two suites / 59 tests passed. Panel build: pass. Further results and the exact commit are recorded in the PR comment.

The local graph was rebuilt from the candidate source and queried; AST extraction omitted symbols in 205 files and SQL support was unavailable. Source inspection remains necessary. Docker is available, but existing real-stack fixtures require a genuine isolated CI runner and the integration workflow pins a different branch and source hashes. Those guards were not bypassed. The existing three-up fixture creates visits sequentially, so it does not establish concurrent request safety. Exact-SHA hosted CI, independent accessibility review, real-stack coverage and Ola's visual acceptance remain release gates.

## Rollout and next action
No merge or deployment. Resolve GitHub runner provisioning, run exact-head CI and isolated real-stack coverage, complete independent WCAG and owner visual review before considering DEV.
