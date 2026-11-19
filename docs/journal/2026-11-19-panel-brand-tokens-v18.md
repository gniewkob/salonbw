# Panel V18 — wspólne tokeny i lokalne fonty marki (etap 3)

- **Data:** 2026-11-19
- **Agent:** Codex
- **Gałąź:** `design/panel-brand-tokens-v18-20261119`
- **Commit:** commit zawierający ten wpis na powyższej gałęzi
- **Baza:** `origin/integration/v18-1-calendar-crm-20261118` (`b72632e`)
- **Źródło:** `origin/design/brand-unification-20261118` (`dddd485`)
- **PR:** brak; nie łączono ani nie wdrażano gałęzi marki

## Finding

Gałąź marki oparta na `master` nie zawiera zmian V18; jej bezpośrednie
wdrożenie wycofałoby rozwój panelu. Na V18 nie było pakietu
`packages/brand-tokens`; `_document.tsx` odwoływał się do Google Fonts i
Lato, a część aliasów CSS miała lokalne wartości.

## Change

- Skopiowano pełny pakiet wraz z trzema fontami WOFF2 i eksportem `./fonts.css`.
- W panelu dodano jedną zależność, dwa importy CSS, usunięto Google Fonts,
  zachowano Font Awesome, zastąpiono Lato przez Open Sans oraz pięć aliasów
  CSS tokenami o dotychczasowych wartościach.
- W lockfile dodano wyłącznie importer pakietu i zależność panelu.
- Dodano regresję kontraktu źródłowego oraz test przeglądarkowy sieci fontów.
  Nie zmieniano logiki kalendarza, CRM, autoryzacji ani API.

## Validation

- Test kontraktu: RED **0/3** na bazie, GREEN **3/3** po zmianie.
- `node --experimental-strip-types --test packages/brand-tokens/src/tokens.test.ts`:
  **6/6 PASS**.
- `pnpm install --lockfile-only --frozen-lockfile`: **PASS**, zmiany lockfile
  ograniczone do dwóch importerów, bez zmian wersji.
- `pnpm exec tsc --noEmit` w `apps/panel`: **PASS**.
- `pnpm exec jest --runInBand` w `apps/panel`: **137/137 suites,
  753/753 tests PASS**.
- `pnpm --filter @salonbw/panel run build`: **PASS** (Next 15.5.28,
  wszystkie 115 generowanych stron); bazowy build przed przeniesieniem
  również **PASS**.
- `pnpm exec eslint` dla `_app.tsx` i `_document.tsx`: **0 błędów**;
  dwa pliki testów Playwright są ignorowane przez obecną konfigurację ESLint.
- `grep -rn 'googleapis\|gstatic\|Lato' apps/panel/src`:
  **0 wystąpień**.
- Next wyemitował `OpenSans`, `PlayfairDisplay` oraz
  `PlayfairDisplay-Italic` do `.next/static/media`; **wszystkie 3 HTTP 200**
  przez uruchomiony lokalnie `next start` i `curl`. SSR HTML kalendarza:
  **0 odwołań do Google Fonts**. Nie zastępuje to testu ruchu przeglądarki.
- Playwright 1440/390: **BLOCKED** — brak Playwright Chromium; systemowy
  `/usr/bin/chromium` kończy uruchamianie przez `socket() failed: Operation
  not permitted (1)` w sandboxie. Nie wykonano ani nie porównano screenshotów.
  Automatyczny test zasobów `/_next/static/media` i braku Google Fonts pozostaje
  do uruchomienia w środowisku z przeglądarką.
- **IMPORTANT — potencjalna różnica w kursywie:** stary link Google Fonts
  obejmował Open Sans `ital=1`; skopiowany bez modyfikacji pakiet marki
  zawiera tylko `OpenSans.woff2` w stylu normalnym. Istniejące kursywy
  Open Sans mogą być syntetyzowane przez przeglądarkę, czyli wizualnie
  różnić się także poza fragmentami Lato. Nie zmieniano fontów w pakiecie
  poza zatwierdzonym przeniesieniem. Wymaga oceny przed odbiorem wizualnym.

## Rollout

**NOT DEPLOYED.** Bez zmian w DEV i PROD. Manualny DEV wymaga nowej, jawnej
zgody ownera na konkretny immutable SHA po weryfikacji wizualnej oraz CI.

## Follow-up

Zebrać sześć screenshotów syntetycznego kalendarza, klientów i karty klientki
(1440 px / 390 px) przed i po zmianie, porównać poza fragmentami Lato;
potwierdzić, że fonty Playfair Display i Open Sans ładują się wyłącznie z
`/_next/static/media`, a następnie przedstawić ownerowi SHA do zatwierdzenia
manualnego wdrożenia DEV.
