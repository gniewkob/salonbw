# Nowe alerty zależności wykryte przez CI

- **Data:** 2026-09-09
- **Agent:** Codex
- **Commit(y):** bieżący commit
- **PR:** brak; master

## Finding

CI `34327643732` dla funkcji powiadomień zakończyło się failure wyłącznie na
bramce Security Audit. Rejestr zawierał nowsze alerty niż ostatni audyt:
2 critical i 7 high dla Next.js, Sharp, Nodemailer, Multer oraz `js-yaml`.
Po aktualizacji zależności bezpośrednich ponowny audyt ujawnił dodatkowe świeże
alerty przechodnie, w tym `tar`, PostCSS i Multer dostarczany przez NestJS.

Deploy `34327643747` zakończył się wcześniej sukcesem, ponieważ workflow
wdrożenia jest niezależny od wyniku Security Audit. Nie wyłączono ani nie
osłabiono bramki CI.

## Change

- Next.js zaktualizowano do `15.5.24`, Sharp do `0.35.4`, Multer do `2.3.x`,
  a Nodemailer do `9.1.x`.
- Centralna konfiguracja workspace i lockfile wymuszają załatane wersje
  przechodnie `js-yaml`, Multer, Picomatch, PostCSS, `tar` i `ws`.
- Manifesty panelu i landingu wymuszają PostCSS `8.5.24` także podczas zdalnej
  instalacji npm na MyDevil.
- Manifest API wymusza Multer `2.3.x`, `js-yaml` `5.2.2` i `tar` `7.5.21`
  także w zdalnym drzewie npm.

## Validation

- `pnpm audit --audit-level high`: 0 high, 0 critical; 6 moderate, 2 low.
- Pełny panel: 96 zestawów / 390 testów PASS; lint, typecheck i build PASS.
- Pełny backend: 49 zestawów / 385 testów PASS; typecheck i build PASS.
  Repozytoryjny lint zakończył się bez błędów po własnym autoformatowaniu;
  68 historycznych różnic formatowania pominięto w tym changesecie. Izolowany
  PostgreSQL 16: 2 zestawy / 8 testów PASS.
- Landing: lint, typecheck i build PASS na Next.js `15.5.24`.
- Czyste instalacje npm odwzorowujące MyDevil: landing i panel 0 podatności;
  backend
  0 high/critical i 5 low. Potwierdzone wersje: PostCSS `8.5.24`, Multer
  `2.3.0` także pod NestJS, `js-yaml` `5.2.2`, Nodemailer `9.1.1` i `tar`
  `7.5.21`.

## Rollout

Oczekuje na commit, push, powtórne CI i Deploy.

Rollback: przywrócić poprzednie manifesty i `pnpm-lock.yaml`. Bramka CI wtedy
ponownie zablokuje high/critical; nie ma migracji ani operacji na danych.

## Follow-up

Po zielonym rolloutcie wrócić do spójnego syntetycznego testu całego cyklu
wizyty opisanego w `PROJECT_STATE.md`.
