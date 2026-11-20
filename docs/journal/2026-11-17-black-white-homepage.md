# Strona główna Black & White (kierunek wybrany przez właścicielkę)

- **Data:** 2026-11-17
- **Agent:** Claude Opus 5.5
- **Commit(y):** `90452f3` (+ ten wpis)
- **PR:** brak (gałąź `design/black-white-homepage-20261117`)

## Finding
Właścicielka wybrała z design-lab kierunki Atelier + Cinematic (wariant 09
„Black & White"). Owner: usunąć pozostałe propozycje, zbudować wersję finalną
i wyczyścić kod landingu na dev. Design-lab istniał tylko na gałęziach
`design/wdi-*`; `master` miał starą stronę (SplitHero/ServicesTeaser/
AboutSpread/BookingCta). `globals.css` deklaruje niezaładowany 'Open Sans'.

## Change
- `apps/landing/src/components/home/BlackWhiteHome.tsx` + `.module.css`:
  hero (Cinematic), pasek faktów (dziś w Europe/Warsaw, telefon, adres,
  specjalność), rozdział Atelier, założycielka (dane z CMS), indeks usług,
  ciemny kontakt z godzinami `useOpeningHours` i `MapFacade`. Copy PL/EN/DE.
  Tekst używa załadowanej czcionki `--font-open-sans`.
- `pages/index.tsx`: nowe sekcje; SEO head, JSON-LD i `getStaticProps`
  bez zmian; `SalonGallery` i `Testimonials` zostają (Testimonials
  uzasadniają `aggregateRating`). `BookingModal` bez zmiany zachowania.
- Usunięte nieużywane `SplitHero`, `ServicesTeaser`, `AboutSpread`,
  `BookingCta`. Klasy `split-hero__cta-*` w `globals.css` zostają (używa ich
  404 i podstrony usług).
- `SalonGallery`: `grid-auto-flow: dense` + salon8 szeroki → siatka 4×3 bez dziur.
- Jest: mapowanie `*.module.css` na proxy tożsamości.
- Design-lab i propozycje 01–08 nie są przenoszone na `master`.

## Validation
`tsc --noEmit` 0 błędów; eslint czysto; jest **28/28 suites, 93/93 testów**;
`next build` OK. Playwright na buildzie produkcyjnym (`next start`):
1440/390/320 px — overflow-x 0, jeden h1, kontrast 0 błędów w 81 węzłach
tekstu, 28 widocznych stopów fokusu, przycisk „Umów wizytę" w hero otwiera
dialog, brak błędów JS. Status dnia: „Zamknięte · otwieramy w czwartek 12:00"
(wtorek po 19:00, środa zamknięta — poprawnie).

## Rollout
**Zablokowane.** CI `workflow_dispatch`
[44165964482](https://github.com/gniewkob/salonbw/actions/runs/44165964482):
„The job was not started because your account is locked due to a billing
issue." Wszystkie runy CI od 2026-11-15 padają tak samo. `deploy.yml`
czeka na exact-SHA CI, więc wdrożenie na dev (landing staging) nie ruszyło.
Dev nadal serwuje design-lab z `58610f7c`.

## Follow-up
Owner: odblokować billing GitHub Actions. Potem: `gh workflow run ci.yml
--ref design/black-white-homepage-20261117`, a po zielonym CI
`gh workflow run deploy.yml -f ref=<SHA> -f target=landing -f environment=staging`
i live-verify dev.salon-bw.pl. Decyzja ownera: zachowanie „Umów wizytę"
(dziś BookingModal z logowaniem).
