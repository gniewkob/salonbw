# Landing L2 — spójność ceny „od” dla wariantów zagnieżdżonych

- **Data:** 2026-10-31
- **Zakres:** PR [#1582](https://github.com/gniewkob/salonbw/pull/1582) (zależny od L1 [#1581](https://github.com/gniewkob/salonbw/pull/1581)).
- **Zmiany produkcyjne:** zero.

## Finding

Na stronie `/services` zwinięty wiersz usługi obliczał oznaczenie `od` na podstawie zakresu kwot i `Service.priceType`, pomijając `ServiceVariant.priceType`. Jeżeli aktywny wariant miał `priceType: 'from'`, a wszystkie aktywne warianty tę samą liczbową cenę, zwinięty wiersz prezentował kwotę jak stałą. Szczegóły rozwijane prawidłowo podawały `od` — niespójność wprowadzała klientkę w błąd.

## Change

- `apps/landing/src/pages/services.tsx`: obliczenie `hasFromPrice` obejmuje flagę `from` na usłudze oraz we wszystkich **aktywnych** wariantach, z zachowaniem aktualnych grup, minimalnych cen i czasów.
- `apps/landing/src/__tests__/servicesAnalytics.test.tsx`: regresja dwóch kategorii: aktywny wariant `from` przy identycznych kwotach daje `od`; wariant wycofany z ceną `from` nie zmienia kwoty ani typu ceny.

## Validation

- Poprzedni workflow na `dfadcfd83cfe0c77b771ed408d1c6a1717258796`: Frontend (public) PASS (lint, typecheck/build, landing booking tests), Backend API PASS, Secret Scan PASS. Cały CI FAIL przez istniejące HIGH w transitive `follow-redirects` i `joi` (Security Audit). Zależności są rozwiązywane niezależnie w PR [#1576](https://github.com/gniewkob/salonbw/pull/1576).
- **Nowe poprawki wymagają osobnego exact-head CI.** Wpis nie deklaruje żadnego PASS testów nowego SHA bez wyniku GitHub Actions.
- Wizualne UAT mobile 390 px i desktop 1440 px pozostaje otwarte; nie utożsamiać z testami komponentu.

## Scope / follow-up

Brak zmian w backendzie, schemacie danych, Booksy, danych klientek i deploymencie. Nie scalać L2 przed zakończeniem zależności L1 oraz poprawieniem czerwonego Security Audit; bez publikacji produkcyjnej.
