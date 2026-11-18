# Ujednolicenie marki — etap 1, 1b i początek 2 (landing)

- **Data:** 2026-11-18
- **Agent:** Claude Opus 5.5
- **Commit(y):** `271e7e1`, `8d81cd4` (gałąź `design/brand-unification-20261118`, od `design/black-white-homepage-20261117`)
- **PR:** brak

## Finding
1. Tokeny marki żyły osobno w landingu (`globals.css`) i panelu
   (`salon-shell.css`/`salon-theme.css`) — brak jednego źródła.
2. `body` i nagłówki miały `font-family: 'Open Sans'` / `'Playfair Display'`,
   a `next/font` rejestruje generowane nazwy (`openSans`, `playfair`) i zmienne
   tylko na wrapperze w `_app`. Stopka i wszystko bez jawnego stylu
   renderowało się czcionką zastępczą (Arial/Georgia).
3. Moduł strony głównej: 28 kolorów na sztywno, w tym ciepłe szarości
   (`#f7f6f4`, `#c8c6c3`, `#c2c1bf`) zakazane przez skill marki; tracking
   etykiet w 5 wartościach zamiast 3.
4. Dwa style nagłówków sekcji (rozdziały vs `SectionHeader`) i trzy ciemne
   bloki pod rząd (galeria, opinie, kontakt).

## Change
- `packages/brand-tokens` (CSS + TS + test), landing importuje tokeny przed
  `globals.css`; klasa `.brand-fonts` na wrapperze `_app`.
- Moduł strony głównej na tokenach; ciepłe szarości → biel / srebro na ciemnym.
- `SectionHeader` w stylu rozdziałów (cały landing); opinie na jasnym tle.

## Validation
Tokeny 4/4; tsc; eslint; jest 28/28 suites (93 testy); `next build`;
Playwright 1440/390/320: overflow 0, jeden h1, kontrast 0 błędów (81 węzłów),
okno rezerwacji działa; czcionki obliczone = `playfair`/`openSans` (także
stopka). Galeria i kontakt obejrzane na zrzutach.

## Rollout
2026-11-18 18:4x, po zgodzie ownera: `dev.salon-bw.pl` przełączony kanałem
ręcznym (`ops/dev-landing-manual-20261118` @ `b1bb457`, packager usuwa
zależności `workspace:` poza `@salonbw/api`) z `09611f5e` na `f29721a0`.
Stage, smoke `app.cjs` i `app.js`, plan i aktywacja PASS za pierwszym razem.
Live-verify (Basic Auth): `__release.json` sha `f29721a0`, BUILD_ID
`ewrG3_8YdwZnybif8oICa`; `/`, `/services`, `/contact`, `/gallery`,
`/policy`, `/privacy`, `/data-deletion` = 200; `/design-lab` = 404;
anonimowo 401; HTML ma `brand-fonts`, oba arkusze CSS zawierają tokeny.
Poprzednia wersja w `previous-landing/09611f5e…-before-f29721a0…`.
Produkcja nietknięta.

## Follow-up
Etap 2 dalej: przyciski i fokus jako wspólne klasy; etap 3 (panel V18) ze
strumieniem V18.

## Etap 2 — przyciski i fokus (2026-11-18 wieczór)

**Finding:** fokus globalny i 22 pierścienie Tailwind były srebrne
(`#b4b8be`) — 1,99:1 na białej nawigacji (próg dla wskaźnika fokusu 3:1);
kilka reguł miało `outline: none` z samą zmianą koloru (stopka, lista usług,
pola formularza). Pięć wariantów przycisków o różnych rozmiarach;
`.contact-form__submit` miał biały tekst na srebrze (antywzorzec ze skilla).

**Change:** `@salonbw/brand-tokens/elements.css`: dwutonowy fokus (czarny
obrys + biała otoczka, `:where`, niska specyficzność) i przyciski `bw-btn`
(`--primary`, `--on-dark`, `--on-light`, `--dark`, `--compact`, ≥44 px).
Landing: 22 miejsca w 15 plikach na `bw-btn`, usunięte stare klasy
przycisków, lokalne srebrne obrysy i `outline: none`, klasy fokusu Tailwind
(poza `focus:not-sr-only`).

**Validation:** tokeny 5/5; tsc; eslint; jest 28/28 (93); build; audyt 4
stron (/, /contact, /services, 404): 21 przycisków — wysokość 44 px, kontrast
≥9,76:1; 178 zatrzymań fokusu — każde ≥3:1 względem tła, 0 słabych.

**Rollout:** po zgodzie ownera `dev.salon-bw.pl` przełączony kanałem ręcznym
z `f29721a0` na `1a7fcbb4` (stage, smoke `app.cjs`/`app.js`, plan, aktywacja
PASS za pierwszym razem). Live-verify: `__release.json` sha `1a7fcbb4`,
BUILD_ID `SeBuiIKZEanqgwNhp2GoU`; 7 podstron 200, `/design-lab` 404,
anonimowo 401; strona główna ma 6× `bw-btn--primary`, 0× `btn-silver`; CSS
zawiera dwutonowy fokus. Poprzednia wersja w
`previous-landing/f29721a0…-before-1a7fcbb4…`. Produkcja nietknięta.

## Tryb ciemny i scalenie (2026-11-18, 19:xx)

- Usunięty automatyczny tryb ciemny landingu; etykiety `SectionHeader` na
  jasnym tle → `--brand-warm-label` (silver-ink dawał 4,48:1 na pasie opinii —
  przeoczone przez wcześniejszy audyt tylko rozdziałów strony głównej).
  Audyt pełnych stron (7 tras × tryb jasny/ciemny): 0 błędów. Commit
  `e41d801`, **nie wdrożony na dev**.
- PR #1722 do `master`: `mergeable: true`, ale `blocked` przez ruleset
  (8 wymaganych kontroli CI, bez obejścia). Nie scalony.
