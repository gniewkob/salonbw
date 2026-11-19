# 2026-11-19 — landing: szybkość + strona upięć; panel: tokeny i czcionki marki

**Decyzja ownera:** „A, B, C — Ola zaakceptowała”.

## A — szybkość landingu (`e4c7c22`)
- Czcionki zinstancjonowane do używanych wag (wght 400–700, Open Sans
  szerokość 100): 250 KB → 166 KB (Open Sans 119 → 41 KB).
- Słowniki EN/DE ładowane dopiero po wyborze języka (`translations.en.ts`,
  `translations.de.ts`, `LanguageContext.loadDictionary`); `_app` 30.9 → 23.6 KB,
  First Load 134 → 127 KB. Typ `Translations` nie zamienia już liczb na stringi.
- Jedno zapytanie o godziny otwarcia na stronę (wspólna obietnica w
  `useOpeningHours`), zdjęcie założycielki w WebP.
- Lighthouse mobile, 3 przebiegi przed/po na tym samym buildzie lokalnym:
  `/` 80–86 → 86–90 (LCP ~4.0 → ~3.2 s), `/services/coloring` 83–87 → 91–93
  (LCP ~4.0 → ~3.0 s). Obserwowany LCP bez dławienia ~0.2–0.5 s (oba).

## C — upięcia ślubne i wieczorowe (`33c6718`)
- Nowa strona `/services/bridal` (PL/EN/DE) w szablonie stron zabiegów, 3
  zdjęcia upięć z @salon_bw w B&W; pozycje z katalogu (fryzura ślubna, próbna,
  wieczorowe wg długości). Cennik linkuje „Fryzura ślubna/wieczorowa” do
  strony; sitemap; stare adresy `/pakiety-slubne`,
  `/uslugi-fryzjerskie/fryzury-slubne`, `/uslugi-fryzjerskie/upiecia-koki` →
  `/services/bridal`. Lighthouse: a11y 100, perf 94.

## B — panel na tokenach marki (`dddd485`)
- `@salonbw/brand-tokens` jako zależność panelu; `tokens.css` + nowe
  `fonts.css` (pełne zmienne fonty w pakiecie, nazwy rodzin bez zmian, więc
  istniejące reguły CSS działają). Usunięte ładowanie Google Fonts (prywatność,
  brak zapytania do Google). 4 reguły Lato → Open Sans (skill marki). Zmienne
  `--salon-*`, `--bs-primary` wskazują tokeny o tych samych wartościach.
- Walidacja: panel `tsc`, jest 130/650, `next build`; strona logowania: czcionki
  z własnego serwera, brak zapytań do Google.
- **Nie wdrożone na dev-panel** — tam działa gałąź V18
  (`integration/v18-1-calendar-crm-20261118`, 362 commity ponad master).

## Validation (landing)
eslint, `tsc --noEmit`, jest 110/110, `pnpm build`; 1440/390/320 bez
poziomego przewijania; przełączanie PL/EN/DE działa (także po przeładowaniu).

## Rollout
Landing: dev — czeka na zgodę ownera. Panel: decyzja ownera co do gałęzi V18.
Produkcja nietknięta.
