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
Nie wdrożone. Do dev kanałem ręcznym po zgodzie ownera (packager musi
usuwać zależności `workspace:` inne niż `@salonbw/api`).

## Follow-up
Etap 2 dalej: przyciski i fokus jako wspólne klasy; etap 3 (panel V18) ze
strumieniem V18.
