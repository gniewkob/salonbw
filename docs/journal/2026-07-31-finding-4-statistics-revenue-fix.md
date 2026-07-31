# Finding #4 — poprawna atrybucja przychodu w raporcie finansowym

- **Data:** 2026-07-31
- **Agent:** Claude (na wyraźne polecenie właściciela: „Fix #4")
- **Commit:** `7b38e606`
- **PR:** brak (bezpośredni push na `master`)

## Finding

Naprawa findingu #4, udokumentowanego w
`docs/journal/2026-07-30-uat-faza-b-pierwszy-przebieg.md`: raport finansowy
(`StatisticsService`) traktował `appointment.paidAmount` (PEŁNĄ kwotę
transakcji: usługa + dodatkowe usługi + sprzedaż produktów − rabat + napiwek)
jako czysty przychód usługowy — zawyżając „Sprzedaż usług brutto"/„Utarg" o
wartość produktów i napiwku sprzedanych przy tej samej wizycie.

**Przyczyna była dwuwarstwowa:**
1. `resolveAppointmentPrice()` (używane przez pulpit, wykres przychodów,
   ranking pracowników, raport prowizji) zwracało `paidAmount` bez żadnej
   korekty.
2. Osobne zapytania „przychód z produktów" (per dzień w pulpicie/wykresie,
   per pracownik w raporcie prowizji) czytały WYŁĄCZNIE starą tabelę
   `product_sales` — nigdy `warehouse_sales` — dokładnie ten sam
   dwutabelowy problem już raz naprawiony w `CustomerStatisticsService`
   (finding #2 z pierwszego przebiegu UAT). Na bazie, która przeszła na
   `warehouse_sales`, to zerowało „Sprzedaż towarów" mimo realnych sprzedaży,
   co POTĘGOWAŁO zawyżenie po stronie usług (cały przychód z produktu trafiał
   do „usług" zamiast do „towarów").

## Change

- `backend/salonbw-backend/src/statistics/statistics.service.ts`:
  - Nowa `resolveServiceRevenue(appointment, productSalesByAppointment)` —
    dla sfinalizowanej wizyty liczy `paidAmount − tipAmount − sprzedaż
    produktów powiązanych z TĄ wizytą`; dla niesfinalizowanej (estymacja z
    cennika) zwraca cenę usługi bez zmian.
  - Nowa `getProductSaleRows(from, to)` — jedno zapytanie świadome obu
    tabel (preferuje `warehouse_sales`, fallback `product_sales`), z którego
    KAŻDY wywołujący agreguje to, czego potrzebuje: per dzień, per
    pracownik, per wizyta. Zastępuje osobne, zdublowane zapytania
    `product_sales`-only w `getDashboard`, `getRevenueChart` i
    `getCommissionReport`.
  - `getServiceRanking` przepisane z surowego agregatu SQL
    (`SUM(paidAmount)`) na ten sam wzorzec fetch-encji + redukcja co reszta
    pliku — usuwa ostatnie miejsce sumujące `paidAmount` wprost, przy okazji
    ujednolica styl (koniec z ręcznym cytowaniem aliasów w `ORDER BY`, znana
    klasa błędów 500 w tym pliku).
  - Podmienione wywołania `resolveAppointmentPrice` → `resolveServiceRevenue`
    w: `getDashboard` (×4: dziś/tydzień/miesiąc/dzienny rozkład),
    `getRevenueChart`, `getEmployeeRanking`, `getCommissionReport`.
  - **Świadomie NIETKNIĘTE:** `getCashRegister` (figura „Wpływy"/saldo kasy —
    to PRAWIDŁOWO pełna kwota otrzymana, nie rozbita na usługi/produkty) oraz
    `getClientStats.topClients.totalSpent` (poprawnie „ile klient wydał
    łącznie", nie przychód usługowy).

## Validation

- Backend: `pnpm test` 338/338 (było 335, +3 nowe testy regresyjne —
  `getEmployeeRanking` z produktem powiązanym z wizytą, `getRevenueChart`,
  `getServiceRanking`), `tsc` czysty, `eslint` scoped — te same
  przedistniejące ostrzeżenia `no-unsafe-*` (surowe zapytania SQL w tym
  pliku miały je już wcześniej), `prettier --write` zastosowany do nowego
  testu.
- Fixy zweryfikowane rytuałem fail-first: `git stash` na samym
  `statistics.service.ts` → wszystkie 4 nowe/zmienione testy RED z
  dokładnymi, oczekiwanymi błędami (np. `revenue: 185` zamiast `130`,
  `TypeError: createQueryBuilder is not a function` na starym
  `getServiceRanking`) → przywrócenie → GREEN.
- CI: zielone.
- Deploy: automatyczny push-deploy (run `30640136968`) — success.
- **Live, na dokładnie tych samych danych co finding #4 (wizyta #182,
  30.07.2026):**
  - „Sprzedaż usług": **130,00 zł** (było 185,00 zł).
  - „Sprzedaż towarów": **59,60 zł** (było 0,00 zł — dual-table gap też
    naprawiony, teraz widać realną sprzedaż).
  - „Napiwki": 20,00 zł (bez zmian, było już poprawne).
  - „Utarg ze sprzedaży usług i towarów brutto": **189,60 zł** = 130 + 59,60
    (poprawnie WYKLUCZA napiwek).
  - „Rabaty dziś": −10,00 zł (zgodne z rabatem na wizycie #182).
  - Tabela „Dane w podziale na pracowników" → wiersz „Łącznie": 130,00 zł
    usług / 59,60 zł towarów / 189,60 zł utargu — w pełni spójne z sekcją
    „Salon ogółem" powyżej.
  - „Saldo gotówki w kasie" / „Wpływy: 185,00 zł" — **celowo bez zmian**
    (pełna kwota otrzymana na tej wizycie, zgodnie z projektem).

## Rollout

Na `master`, wdrożone na produkcję. Deploy code: `7b38e606`.

## Follow-up

1. **Nowa, drobna obserwacja (NIE naprawiana w tym zadaniu, poza zakresem
   findingu #4):** wiersz „Aleksandra Bodora" w tabeli „Dane w podziale na
   pracowników" pokazuje same zera, mimo że wiersz „Łącznie" poprawnie sumuje
   130,00 zł. Przyczyna: `getEmployeeRanking`/`getCommissionReport` filtrują
   listę pracowników przez `role: Role.Employee`, a Aleksandra ma
   `role: admin` (świadoma decyzja projektowa — „pracownik" poza zakresem
   GO). Przychód trafia do sumy zbiorczej, ale nie do jej imiennego wiersza.
   To ISTNIEJĄCE zachowanie sprzed tej naprawy (nie wprowadzone ani
   pogorszone przez ten fix) — do rozważenia jako osobne zadanie, jeśli
   właścicielka chce widzieć rozbicie per-pracownik dla siebie jako
   jedynej wykonawczyni.
2. UAT §1 i §2 pozostają w pełni przejrzane (patrz journale z 2026-07-30/31);
   ten fix domyka ostatni znany, udokumentowany dług z UAT. Formalne
   zamknięcie UAT i decyzja o Fazie C wciąż należy do właściciela.
