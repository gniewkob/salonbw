# SalonBW Landing DEV-first workflow

Approved 2026-11-02: tested Landing iterations go to DEV for owner review. PROD always needs separate explicit approval.

- DEV landing: https://dev.salon-bw.pl ; catalog: https://dev.salon-bw.pl/services ; design-lab (if present): https://dev.salon-bw.pl/design-lab.
- Integration branch: `dev/landing-preview`. Fast-forward or create an ordinary merge commit onto it; never force-push.
- A push triggers full CI plus actual Next.js Cypress browser QA. After both complete successfully for the exact SHA, only `deploy.yml` is dispatched with `environment=staging`, `target=landing` and immutable source SHA.
- The existing guarded deployment enforces its own exact-SHA CI gate, MyDevil snapshot and staging rollback on failure. CI failure means no deploy.
- GitHub staging environment approval rules, if configured, remain in force. Production, master, backend, panel, DB and booking records are not modified by this automation.
- Automatic dispatch is not proof of deployment. Report source SHA, CI results, deployment run status and working DEV link after verifying the runtime.
- Owner reviews real catalog, booking and 390px/1440px layout on DEV and requests further changes.
