# Bramka audytu: body-parser, multer, wyjątek dla zod

- **Data:** 2026-10-24
- **Agent:** Claude Opus 5.5
- **Commit(y):** ten commit
- **PR:** brak (bezpośrednio na `master`, zgoda ownera)

## Finding

CI na `master` czerwone od `1baccf40` (runy `40082042637`, `40119199756`)
wyłącznie w jobie Security Audit: `pnpm audit --audit-level=high` znalazł
3 nowe advisory „high” (16 łącznie: 13 moderate, 3 high). Build, testy, lint
i Gitleaks zielone. Deploy zatrzymany na bramce CI — produkcja bez zmian.

| Pakiet | Było | Advisory | Ścieżka |
|---|---|---|---|
| body-parser | 1.20.6 | GHSA-27r3-jxmh-p828 (<1.20.9) | @nestjs/platform-express>express |
| multer | 2.3.0 | GHSA-q7qp-rjg7-q26m (<2.5.0) | backend, bezpośrednio |
| zod | 3.25.76 | GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404 (<4.6.6) | jimp>@jimp/plugin-blit |

## Change

- `pnpm-workspace.yaml` overrides: `body-parser ^1.20.9`, `multer ^2.5.0`.
- `backend/salonbw-backend/package.json` (MyDevil instaluje npm-em):
  `multer ^2.5.0`, override `body-parser ^1.20.9`.
- `auditConfig.ignoreCves`: `CVE-2023-54404` z uzasadnieniem. Linia zod 3.x
  nie ma poprawki, a najnowszy @jimp/plugin-blit wymaga `zod ^3`. jimp
  waliduje własne opcje metod, nie dane z żądań; jedyne wywołanie to
  `Jimp.read(buf).scaleToFit()` dla miniatur (`customer-media.service.ts`).
  Wymuszenie zod 4 pod jimp groziło zepsuciem miniatur. Wyjątek zatwierdzony
  przez ownera.
- `pnpm-lock.yaml` odświeżony pnpm 10.14.0 (`--lockfile-only`).

## Validation

- `pnpm audit --audit-level=high`: exit 0; 12 moderate, 1 high (ignored).
- Backend `tsc --noEmit`: 0 błędów; `pnpm lint`: 0 błędów (151 ostrzeżeń jak
  wcześniej; zmiany formatowania z lokalnego prettiera cofnięte).
- Backend testy: 453/454. Jedyny fail niezwiązany ze zmianą — patrz Follow-up.
- Lokalne `node_modules` miały jeszcze multer 2.3.0; nowe wersje weryfikuje
  CI (świeża instalacja) i produkcja po deployu.

## Rollout

Push na `master` → CI → Deploy API (zależności backendu). Po deployu:
`/healthz`, logowanie, upload zdjęcia na karcie testowej.

## Follow-up

- **Błąd zmiany czasu w slotach:** test
  `calendar.service.spec.ts › a scheduled Sunday is bookable…` failuje
  w strefie Europe/Warsaw, gdy `nextDow(0)` trafia na dzień zmiany czasu
  (2026-10-25): pierwszy slot 09:00 zamiast 10:00. W UTC (CI) przechodzi.
  Produkcja działa w CET/CEST, więc w dniach zmiany czasu sloty przesuwają się
  o godzinę. Zmiana czasu wypada zawsze w niedzielę (salon zamknięty), więc
  wpływ praktyczny znikomy; do naprawy osobno.
- Usunąć wyjątek CVE-2023-54404, gdy jimp przejdzie na zod 4.
