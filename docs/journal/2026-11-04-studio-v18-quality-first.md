# Studio V18 quality-first design study — 2026-11-04

Scope: admin-only **DEV** /studio-v18; based on exact previous DEV access fix `78f6680`.
No changes to authentication, middleware, backend, statistics APIs, booking, canonical /dashboard or production.

## Problem and approach
V18 is a reference-faithful dashboard but its pastel presentation is detached from SalonBW's monochrome identity. We keep its actual information architecture and introduce an **optional B&W Atelier finish**, not a forced redesign. Existing V18 Lavender remains the default control.

The finish switch is keyboard-accessible, preserves current dashboard/module state and uses actual data. Both variants are shareable as `/studio-v18?finish=atelier` and `?finish=lavender`; the selected finish starts on the server. Links still point to their existing real routes. Text, labels and information remain identical across finishes.

Replaced misleading 'Zapisane na później' (nothing is actually saved) with 'Moduły salonu', and 'Kolekcje' with 'Obszary pracy'. Existing faux ARIA tab semantics replaced with an honest accessible two-button switch using `aria-pressed`.

Typography and links were adjusted for readability without adding an animation library.

## Acceptance
- Exact SHA CI lint/typecheck/build/tests/security.
- Browser screenshots and authenticated admin smoke on DEV, 390px and desktop.
- Compare both finishes, verify tab switching, module links, real metrics, no fake numbers.
- Confirm screen reader names, keyboard controls, mobile safe-area navigation.
- Owner selects a finish before any integration with normal /dashboard.
- No production merge or deployment.
