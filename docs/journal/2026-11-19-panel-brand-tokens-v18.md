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
- Po dodatkowej zgodzie ownera (`Ok kontynuuj`, 2026-11-19) uzupełniono
  pakiet o **OpenSans-Italic.woff2** oraz oficjalny `fonts/OFL.txt`.
  Źródło: [Google Fonts, Open Sans, commit `cc5661d`](https://github.com/google/fonts/tree/cc5661d43cd4f9aad5567033a8e15ca28dc35c86/ofl/opensans),
  źródłowy TTF SHA-256 `fe269381e992f32e135801740998544d6235061e37c93ec067ad2be3edd5b17b`.
  Do WOFF2 przeniesiono dokładnie 489 kodów znaków z istniejącego normal
  Open Sans (Latin/Latin Extended), przy zachowaniu `wght` 300–800 i `wdth`
  75–100 oraz identycznej wersji fontu 3.003. Wygenerowany WOFF2 SHA-256:
  `6321e7e84a7fe2a35bf26cb280ad50a73b500b8d4c9082895266c26a18481ee6`.
- W panelu dodano jedną zależność, dwa importy CSS, usunięto Google Fonts,
  zachowano Font Awesome, zastąpiono Lato przez Open Sans oraz pięć aliasów
  CSS tokenami o dotychczasowych wartościach.
- W lockfile dodano wyłącznie importer pakietu i zależność panelu.
- Dodano regresję kontraktu źródłowego oraz test przeglądarkowy sieci fontów.
  Nie zmieniano logiki kalendarza, CRM, autoryzacji ani API.

## Validation

- Test kontraktu: RED **0/3** na bazie, GREEN **3/3** po zmianie.
- Nowa regresja kursywy: RED **1/4** przed dodaniem odmiany, GREEN **4/4** po
  dodaniu rzeczywistego `@font-face` i pliku WOFF2.
- Po uzupełnieniu kursywy: Jest **753/753** PASS, `tsc --noEmit` PASS,
  Next build PASS, cztery pliki WOFF2 (`OpenSans`, `OpenSans-Italic`,
  `PlayfairDisplay`, `PlayfairDisplay-Italic`) pod `/_next/static/media`:
  **HTTP 200** w lokalnym serwerze Next; HTML kalendarza bez linków
  `fonts.googleapis.com` i `fonts.gstatic.com`.
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
- **IMPORTANT rozwiązane na poziomie źródła:** stary link Google Fonts
  obejmował Open Sans `ital=1`. Pakiet ma teraz prawdziwy `font-style: italic`
  (nie wymaga syntetycznego pochylenia). Rzeczywisty wygląd nadal wymaga
  przeglądarkowego porównania 1440/390.

## Rollout

**NOT DEPLOYED.** Bez zmian w DEV i PROD. Manualny DEV wymaga nowej, jawnej
zgody ownera na konkretny immutable SHA po weryfikacji wizualnej oraz CI.

## Follow-up

Zebrać sześć screenshotów syntetycznego kalendarza, klientów i karty klientki
(1440 px / 390 px) przed i po zmianie, porównać poza fragmentami Lato;
potwierdzić, że fonty Playfair Display i Open Sans ładują się wyłącznie z
`/_next/static/media`, a następnie przedstawić ownerowi SHA do zatwierdzenia
manualnego wdrożenia DEV.
