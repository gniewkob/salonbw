# 12 — Migration Plan

## Cel

Migracja kalendarza i wizyt z minimalnym ryzykiem operacyjnym salonu.

## Faza 1 — Discovery i dokumentacja

- Bez zmian produkcyjnych.
- Zamrożenie backlogu i acceptance criteria.

## Faza 2 — `/calendar-next`

- Budowa nowego modułu równolegle.
- Routing:
  - `/calendar` -> legacy iframe,
  - `/calendar-next` -> nowy native calendar.
- Feature flag dla staff testowych.

## Faza 3 — Beta test

- Dostęp: `admin` + wybrani `receptionist`.
- Testy operacyjne:
  - create/edit/drop/resize,
  - conflict validation,
  - status flow,
  - quick checkout handoff.
- Monitoring błędów + feedback loop.

## Faza 4 — Przełączenie

- Routing:
  - `/calendar` -> native calendar,
  - `/calendar-legacy` -> stary iframe.
- Komunikat release dla zespołu recepcji/pracowników.

## Faza 5 — Usunięcie legacy

- Warunek: parytet P0 + 2 tygodnie stabilności.
- Usunięcie embed runtime i compat endpointów nieużywanych.

## Rollback plan

Jeżeli native calendar ma błąd krytyczny, menu wraca do `/calendar-legacy`.

Rollback checklist:
1. Zmiana feature flag / route mapping.
2. Restart panel app.
3. Weryfikacja logowania i otwierania kalendarza.
4. Incident note w `docs/AGENT_STATUS.md`.
