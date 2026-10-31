# Landing L2 — warianty i ceny na stronie usług

- **Data:** 2026-10-31
- **Cel:** [#1580](https://github.com/gniewkob/salonbw/issues/1580), iteracja L2
- **Baza:** L1 `feature/landing-l1-offer-deeplinks-20261031`, commit `97a98597f82de999923f4e733806285b147acf8f`
- **Zmiany produkcyjne:** zero
- **Zakres:** `apps/landing` + celowany krok testowy CI

## Finding

Na `/services` pozycje z kilkoma wariantami Booksy były łączone w pojedynczą usługę i cenę „od”. Klientka nie widziała, ile kosztuje konkretny wariant i dlaczego czas oraz cena są zmienne. Podczas obliczania minimum uwzględniane były również potencjalne nieaktywne warianty osadzone w usłudze.

## Change

- Nowy `ServicePriceBreakdown` prezentuje pod wspólną usługą rozwijany, dostępny z klawiatury wykaz prawdziwych wariantów wraz z ceną i czasem trwania.
- Obsługuje zarówno osobne usługi reprezentujące długość włosów (`Strzyżenie – włosy krótkie/długie`), jak i warianty osadzone w `Service.variants`.
- Ignoruje warianty `isActive === false` zarówno w szczegółach, jak i w cenie minimalnej; brak nowych, statycznych kwot.
- Dla pojedynczej usługi bez wielu wariantów nie wyświetla zbędnego rozwijania.
- Zachowuje istniejące `BookingModal`, wybór usługi na podstawie `serviceId`, kategorie, filtrowanie, SEO oraz języki PL/EN/DE.
- Używa istniejących tokenów monochromatycznych; `<details>/<summary>` zamiast nowej biblioteki lub custom kontrolera.

## Validation

Dodano `servicePriceBreakdown.test.tsx` i test integracyjny `servicesAnalytics.test.tsx` potwierdzający, że nieaktywny wariant nie obniża ceny „od”. Kroki CI uruchamiają te testy razem z wcześniejszymi przypadkami L1 oraz rezerwacjami.

**Nie uznawać wyników testów za PASS do czasu potwierdzenia konkretnego SHA w GitHub Actions.** Workflow `ci.yml` wyzwala `pull_request` wyłącznie dla baz `master` i `main`; ten L2 PR jest *stacked* na gałęzi L1, dlatego automatyczny CI dla samego L2 nie uruchamia się na tej bazie. Po scaleniu L1 należy przestawić bazę L2 na `master`, potwierdzić dokładny HEAD i ponowić CI. Nie obchodzić tego warunku przez wyłączenie security audytu.

Code Review wykrył zbyt drobny tekst cen na mobile; poprawiono `font-size: 1rem` dla rozwiniętych wariantów i nagłówka disclosure na ≤640 px.

## Rollout i ograniczenia

Nie zmieniono backendu, bazy danych, Booksy, danych klientek, konfiguracji hostingu ani środowiska produkcyjnego. Przed wdrożeniem wymagany odbiór wizualny /services 390 i 1440 px na izolowanym DEV, ze sprawdzeniem długich nazw i klawiatury. PR L2 jest zależny od jeszcze niescalonego PR L1 (#1581).

## Follow-up

Po L2: doszlifować layout oferty i konsultacyjne CTA, mierzyć czytelność na mobile; content fotograficzny i deklaracje marketingowe wymagają zatwierdzenia salonu. Security #1578 nadal osobno.
