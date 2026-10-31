# Landing L3 — czytelność cennika i wariantów na mobile/desktop

- **Data:** 2026-10-31
- **Branch:** `feature/landing-l3-offer-ux-20261031`
- **Stack:** L1 [#1581](https://github.com/gniewkob/salonbw/pull/1581) → L2 [#1582](https://github.com/gniewkob/salonbw/pull/1582) → L3
- **Zakres:** `apps/landing` — bez API/DB/panelu/Booksy i bez publikacji DEV/PROD.

## Finding

Przed L3 na `/services`:
- mobilne filtry kategorii miały za mały hit target (36px zamiast minimum 44px); ich zawijanie mogło wypychać katalog poniżej pierwszego ekranu;
- ceny, czas i „Umów” zajmowały ciasny wiersz obok długich nazw usług; układ po rozwinięciu wariantów nie miał stabilnej hierarchii;
- opisy usług i czas trwania były mniej czytelne niż docelowe 16px na mobile;
- wariant osadzony w usłudze nie otrzymywał bezpośredniej rezerwacji (poprawnie, bo `variantId` ≠ `serviceId`), ale brakowało klientce informacji o wyborze w kreatorze.

## Change

- Responsywne wiersze usług w dwóch kolumnach na desktopie oraz w jednej na mobile; panel ceny i czasu z przyciskiem obok (CSS grid).
- Warianty w przewidywalnej siatce z zawijaniem długich nazw i przyciskiem rezerwacji mającym min. 44px; mobile content + akcja na dwóch rzędach.
- Filtry kategorii na mobile jako poziomo przewijana lista z naturalnymi `button` i obszarem dotykowym min. 44px (z zachowaniem stanu `aria-pressed`).
- Mocniejsza hierarchia cennika, bez nowych odcieni i bez dekoracyjnych sekcji; typografia treści mobile min. 16px, respektowanie `prefers-reduced-motion`.
- Opcjonalny, lokalizowany PL/EN/DE tekst przy aktywnych wariantach nested: „Wariant usługi wybierzesz podczas rezerwacji.” Pozostawia `BookingModal` i przekazywanie `serviceId` bez zmian.
- Test komponentu weryfikuje wskazówkę i brak bezpośredniej rezerwacji z `variantId`.

## Validation

- GitHub Actions exact SHA: **PENDING**, do dopisania przy zakończeniu; nie przypisywać PASS bez odczytu runów.
- UI 390 / 1440 px oraz Lighthouse accessibility: **PENDING** — wymagają renderowania z rzeczywistym katalogiem i odbioru screenshotów, bez deklaracji wykonania.
- Nie zmieniono routing SSR, ścieżek rezerwacji ani katalogu cen API.

## Rollout

Brak deploymentu. L3 to osobny stacked PR oparty na HEAD L2. CI dla PR ustawionego na bazie L2 nie uruchamia się automatycznie: workflow `ci.yml` akceptuje `pull_request` tylko dla `main`/`master`. Ewentualny tymczasowy retarget L3 do `master` weryfikuje łączony kandydat L1+L2+L3; następnie baza wraca na L2. Niezależny Security Audit HIGH (`follow-redirects`, `joi`) jest w PR [#1576](https://github.com/gniewkob/salonbw/pull/1576), bez obchodzenia kontroli.

## Follow-up

Odbiór 390/1440 px, realne usługi z DEV, dostępność klawiaturą, kontrast i brak poziomego overflow całej strony; dopiero potem merge w kolejności L1 → L2 → L3 oraz decyzja o publikacji.
