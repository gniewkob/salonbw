# Landing local fonts (#1590)

## Finding
Landing builds fetched Google Fonts over the network and could fail when the service was unavailable.

## Change
Playfair Display and Open Sans variable fonts are included from Google Fonts with their SIL OFL 1.1 licenses. `next/font/local` retains existing CSS variables, weights and Playfair italic. Removed the Google font preconnect.

## Validation
Clean frozen pnpm install on Node 22, landing lint, typecheck and 93 tests passed. Production build passed locally. CI, visual verification and hosted DEV acceptance remain pending.

## Rollout
Not deployed; exact-SHA CI and hosted DEV validation required.

## Follow-up
Run CI and deploy to DEV, verify typography on mobile and desktop, then obtain owner acceptance before merge.
