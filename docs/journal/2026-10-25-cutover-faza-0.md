# Przepięcie domeny — plan i Faza 0 (kod)

- **Data:** 2026-10-25
- **Agent:** Claude Opus 5.5
- **Commit(y):** `0471e718` (plan), ten commit
- **PR:** brak

## Finding

- `www.salon-bw.pl` serwuje starą stronę PHP (kanoniczna, 54 adresy
  w sitemapie); `salon-bw.pl` → 301 na `www.`. Nowy landing działa tylko na
  `dev.` i jest zbudowany pod kanoniczny `https://salon-bw.pl` (bez `www`).
- Wszystkie hosty → 212.91.26.153 (MyDevil), DNS i MX w MyDevil — przepięcie
  bez zmian DNS.
- Panel linkował na sztywno do `https://dev.salon-bw.pl/privacy` i `/policy`
  (rejestracja) i miał fallback wylogowania na `dev.`.
- Panel używa `NEXT_PUBLIC_SITE_URL` w `absUrl()` (galeria zdjęć), więc nie
  może służyć za adres landingu.

## Change

- `docs/DOMAIN_CUTOVER_PLAN.md`: plan przepięcia; decyzja ownera
  2026-10-25 — `salon-bw.pl` = produkcja, `dev.salon-bw.pl` = development
  (§2a), z zachowaniem obecnego automatu deployu.
- Landing: `utils/legacyRedirects.ts` + middleware — `www.salon-bw.pl` → 301
  na `https://salon-bw.pl`, stare adresy PHP → 301 na najbliższą stronę
  (jeden skok także z `www.`), stary modal rezerwacji → panel `/booking`.
  Adres docelowy z nagłówka `Host` po HTTPS (Passenger proxy).
- Panel: `utils/landingUrl.ts` (`NEXT_PUBLIC_LANDING_URL`, fallback
  `https://salon-bw.pl`) dla linków prawnych w rejestracji i wylogowania.
- `deploy.yml`: build panelu dostaje `NEXT_PUBLIC_LANDING_URL` =
  `vars.LANDING_PUBLIC_URL || 'https://dev.salon-bw.pl'` — do przepięcia bez
  zmiany zachowania.

## Validation

- Landing: nowe testy 16/16 (53 adresy sitemapy mają cel istniejący
  w serwisie; nowe trasy nie są przekierowywane; `www` po wielkości liter
  i porcie); cały zestaw 78/78; tsc i eslint czyste.
- Panel: test `landingUrl` (env, pusty, niepoprawny URL); cały zestaw
  408/408; tsc i eslint czyste.
- `check-ops-workflows.sh`, `check-ops-workflow-docs-consistency.sh`: OK.

## Rollout

Bezpieczne przed przepięciem: przekierowania działają tylko na adresach
starej strony i hoście `www.` (dziś obsługiwanym przez PHP); panel dalej
linkuje do `dev.`.

## Follow-up

- Owner: decyzje z §3.4 planu (termin, mapa 301 — kosmetyka/paznokcie/
  solarium, zgoda na wyłączenie PHP) i wybór promocji na produkcję
  (A: przycisk, B: tag `landing-v*`).
- Owner: wartości zmiennych `MYDEVIL_PUBLIC_*` (`gh variable list`) — potem
  zmiana resolvera w `deploy.yml` wg §2a.
- Inwentaryzacja serwera i kopia starej strony (§3.3).
