# Dane strukturalne po stronie serwera, polska liczba mnoga i dotykalne CTA cennika

- **Data:** 2026-09-11
- **Agent:** Claude Opus 5
- **Commit(y):** bieżący commit
- **PR:** nowy PR dla `claude/development-status-1xv0z4`

## Finding

Ponowny przegląd landingu (po `fb138b1c`) dał trzy znaleziska z dowodami:

1. **JSON-LD nie istniał w kodzie źródłowym stron.** Siedem stron wstrzykiwało
   schemat przez `<Script strategy="afterInteractive">` umieszczony poza
   `<Head>`. Pomiar: `curl` po ośmiu adresach `dev.salon-bw.pl` znajdował
   **0 wystąpień** `application/ld+json`, a DOM po hydracji — 1. Schemat
   `HairSalon` z adresem, godzinami otwarcia i oceną 5.0 widziały więc tylko
   roboty wykonujące JavaScript; crawler Meta, Bing czy walidatory nie
   dostawały nic.
2. **Błędna polska liczba mnoga na cenniku.** `serviceCount1` /
   `serviceCountMany` to dwie formy, a polski ma trzy. Wyrenderowane wartości:
   `15 usługi`, `7 usługi` (źle), `3 usługi`, `2 usługi` (dobrze).
3. **Przycisk „Umów" w wierszu cennika miał 64x26 px i powtarza się 27 razy.**
   To główne CTA konwersyjne `/services` na telefonie, poniżej progu 44 px
   z reguł marki i WCAG 2.5.5.

Przy okazji zmierzono wagę strony głównej na 390 px: 2,41 MB obrazów, z czego
`DSC_9584.jpg` to **1737 kB** przy wymiarach 2572x3838 — renderowany jako tło
karty „Fryzjerstwo" z `opacity: 0.35` pod gradientem. Prawie dwa megabajty
transferu na obraz, którego praktycznie nie widać.

## Change

- Schemat przeniesiony do `<Head>` jako zwykły `<script type="application/ld+json">`
  z `dangerouslySetInnerHTML` w siedmiu plikach (`index`, `services`, `contact`,
  `gallery`, `services/coloring|balayage|highlights`); nieużywane importy
  `next/script` usunięte. `Script` zostaje tylko w `_app.tsx` dla GA4, gdzie
  `afterInteractive` jest właściwe.
- `jsonLd()` escapuje teraz `<`, `>` i `&` do sekwencji `\uXXXX` — skoro treść
  trafia do znacznika po stronie serwera, żaden ciąg w danych nie może go
  zamknąć.
- Nowy `src/utils/plural.ts` (`selectPluralForm`, `pluralize`) z regułą
  słowiańską, w tym pułapką 12–14. Słownik dostał `serviceCountFew`;
  `serviceCountMany` w `pl` to teraz dopełniacz `usług`, a w `en`/`de` ta sama
  forma co `few`, więc reguła degeneruje się do dwóch form.
- `.svcs-row__book`: `min-height: 44px`, `min-width: 72px`, `inline-flex` i
  wyśrodkowanie — etykieta pozostaje mała, powiększa się obszar dotyku.
- `DSC_9584-card.jpg`: wariant 1100 px, jakość 72 (mozjpeg) wygenerowany
  `sharp` z oryginału; `ServicesTeaser` wskazuje na niego, a `sizes` poprawione
  na `(max-width: 768px) 100vw, 50vw`, bo na telefonie karta zajmuje pełną
  szerokość. Oryginał zostaje w repo — używa go jeszcze `HERO_SLIDES`.

## Validation

- Przed zmianą: `curl` po pięciu trasach zwracał 0 wystąpień JSON-LD.
  Po zmianie: **1 na każdej** (`/`, `/services`, `/contact`, `/gallery`,
  `/services/coloring`), a treść parsuje się jako poprawny JSON —
  `@type: HairSalon`, `name: Salon Black & White` (escapowany `&` wraca
  poprawnie), `ratingValue 5.0`, trzy wpisy `openingHoursSpecification`.
- Liczniki po zmianie: `15 usług`, `3 usługi`, `2 usługi`, `7 usług`.
- Przycisk „Umów": **72x44 px, 0 z 27 poniżej progu**; brak przewijania w
  poziomie na 390 i 1366 px, wiersze cennika bez rozjechania.
- Waga obrazów strony głównej na 390 px: **2,41 MB → 0,84 MB**
  (`DSC_9584-card.jpg` 123 kB zamiast 1737 kB). Hero bez zmian wizualnych.
- Landing: 22 zestawy / **70 testów PASS** (w tym 6 nowych dla pluralizera),
  `tsc --noEmit`, `eslint src` i build produkcyjny PASS.
- Jedyne błędy konsoli w teście lokalnym to `ERR_CONNECTION_RESET` z wywołań
  API zablokowanych w piaskownicy, nie ze zmiany.

## Rollout

Wchodzi zwykłym deployem landingu. Po wdrożeniu sprawdzić na żywo:
`curl https://dev.salon-bw.pl/ | grep -c 'application/ld+json'` musi zwrócić 1,
a nagłówek kategorii na `/services` — `15 usług`.

## Follow-up

Z przeglądu zostają nieruszone: `images.unoptimized: true` (najpierw trzeba
sprawdzić, czy `sharp` ładuje się na FreeBSD u MyDevil), Sentry w bundlu
współdzielonym, osiem martwych komponentów, i18n bez URL-i i `hreflang`,
pozostałe małe cele dotykowe (stopka 31x19, ikony społecznościowe 20x20,
chipy kategorii 124x36) oraz zbędny `preconnect` do `fonts.gstatic.com`.
