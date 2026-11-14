# Studio V18 — owner palette correction

- **Date:** 2026-11-13
- **PR:** #1704, stacked on #1699; draft.

## Finding
The prior V18 palette used blue for focus and selection instead of owner-approved violet. Synthetic browser fixtures needed alignment with current V18 behavior.

## Change
Matched dashboard and foundation tokens, active navigation and calendar status markers to the owner palette; retained monochrome actions, white cards and non-color status indicators. Updated the design contract and browser fixtures. No scheduling or public landing logic changed.

## Validation
Local panel suite: 130 suites / 658 tests passed; panel typecheck and build passed. Full panel lint failed on formatting in unrelated tests; changed unit test lint passed. Synthetic browser checks cover desktop and 390px; see PR for final results. Graph rebuilt from parent a8b355e with #1699 ancestor; AST extraction does not fully model CSS or all files, so consumer search and source inspection supplemented it.

## Rollout
No deployment. CI, isolated real-stack DnD and three simultaneous appointments, contrast review and owner visual acceptance remain required.

## Follow-up
Review exact-head CI and run isolated full-stack and visual acceptance before considering DEV.
