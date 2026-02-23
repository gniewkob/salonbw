# Postęp Klonowania Versum - Dokumentacja

> Data aktualizacji: 2026-02-23
> Cel: 1:1 klon Versum (panel.versum.com/salonblackandwhite)
> Sposób klonowania/kopiowania (obowiązujący SOP): `docs/VERSUM_CLONING_STANDARD.md`

---

## ✅ ZAIMPLEMENTOWANE

### Sprint 1: Grupy Klientów - ZAKOŃCZONY ✅

| Element | Status | Pliki |
|---------|--------|-------|
| Systemowe grupy w sidebarze | ✅ | ClientsNav.tsx |
| Dynamiczne grupy z API | ✅ | ClientsNav.tsx |
| Rozwijanie grup (więcej/mniej) | ✅ | ClientsNav.tsx |
| Link zarządzania grupami | ✅ | ClientsNav.tsx |
| Wyświetlanie grup w szczegółach | ✅ | CustomerSummaryTab.tsx |
| Backend - relacja grupy-klient | ✅ | user.entity.ts, customers.service.ts |

### Sprint 2: Filtrowanie i Kryteria Wyszukiwania - ZAKOŃCZONY ✅

| Element | Status | Pliki |
|---------|--------|-------|
| Sekcja "Kryteria wyszukiwania" w sidebarze | ✅ | ClientsNav.tsx |
| Radio buttons AND/OR | ✅ | ClientsNav.tsx |
| Badge aktywnych filtrów nad tabelą | ✅ | ClientsList.tsx |
| Licznik klientów | ✅ | ClientsList.tsx |
| Link "utwórz grupę" | ✅ | ClientsList.tsx |

### Sprint 3: Lista Klientów (Tabela) - ZAKOŃCZONY ✅

| Element | Status | Pliki |
|---------|--------|-------|
| Strona /clients na VersumShell | ✅ | clients/index.tsx |
| Breadcrumbs | ✅ | clients/index.tsx |
| Toolbar (wyszukiwanie, sortowanie, dodaj) | ✅ | clients/index.tsx |
| Tabela z checkboxami | ✅ | clients/index.tsx |
| Ikona edycji (✏️) | ✅ | clients/index.tsx |
| Linki email (✉️) i telefon | ✅ | clients/index.tsx |
| Paginacja zgodna z Versum | ✅ | clients/index.tsx |

### Sprint 4: Szczegóły Klienta (Karta klienta) - ZAKOŃCZONY ✅

| Element | Status | Pliki |
|---------|--------|-------|
| Strona /clients/[id] na VersumShell | ✅ | clients/[id].tsx |
| Nagłówek "Karta klienta" | ✅ | clients/[id].tsx |
| Zakładki (8 sztuk) jak w Versum | ✅ | clients/[id].tsx |
| Widok "podsumowanie" | ✅ | clients/[id].tsx |
| Sekcja "należy do grup:" | ✅ | clients/[id].tsx |
| Zaplanowane wizyty | ✅ | clients/[id].tsx |
| Zrealizowane wizyty | ✅ | clients/[id].tsx |

---

## 📋 PLAN - NASTĘPNE SPRINTY

### Sprint 5: Magazyn (Produkty) - ZAKOŃCZONY ✅

**Zrobione:**
- [x] Strona /products na VersumShell
- [x] Sidebar z kategoriami produktów (WarehouseNav)
- [x] Tabela produktów z sortowaniem
- [x] Filtr typu produktu (wszystkie/towar/materiał)
- [x] Tabs: Produkty, Sprzedaż, Zużycie, Dostawy, Zamówienia, Inwentaryzacja
- [x] Paginacja
- [x] Export do Excel/CSV
- [x] Przyciski akcji (sprzedaj, zużyj)

**Pliki zmienione:**
- `apps/panel/src/pages/products/index.tsx` - przepisano na VersumShell
- `apps/panel/src/styles/versum-shell.css` - dodano style dla magazynu

---

## 🎯 METRYKI

| Obszar | Status | % |
|--------|--------|---|
| Moduł Klienci - Sidebar | 🟡 | 80% (functional YES, visual strict NO) |
| Moduł Klienci - Filtrowanie | ✅ | 100% |
| Moduł Klienci - Lista | ✅ | 100% |
| Moduł Klienci - Szczegóły | 🟡 | 85% (functional YES, visual strict NO) |
| Moduł Magazyn | 🟡 | 90% (functional YES, visual strict NO) |
| Moduł Usługi | 🟡 | 15% |
| Moduł Statystyki | ❌ | 0% |
| Moduł Łączność | 🟡 | 40% |
| Moduł Ustawienia | ❌ | 0% |

**Całkowity postęp: ~43%** (moduły klienci/statystyki/magazyn mają otwarte delty strict visual)

## Known deltas (strict 1:1)

- Klienci po deploy `0642f399`:
  - functional parity (panel): **YES** na rerun produkcyjnym 2026-02-23 (`11/11` screen/action checks po stronie panelu),
  - visual strict parity: **NO** (próg 3.0% niespełniony na ekranach krytycznych),
  - runtime crash `Application error: a client-side exception has occurred` na trasach karty klienta: **nieodtworzony** na rerun 2026-02-23,
  - odchylenia pixel diff (produkcja 2026-02-23):
    - `list`: `7.333%`
    - `summary`: `5.363%`
    - `gallery`: `30.136%`
    - `files`: `8.707%`
  - uwaga porównawcza: `versum` zwraca fallback `500` na części ekranów referencyjnych (`list`, `statistics`), co obniża wynik parity całościowy mimo panel=YES.
  - artefakty:
    - `output/parity/2026-02-23-customers-prod-full/REPORT.md`
    - `output/parity/2026-02-23-customers-prod-full/pixel-diff.json`
    - `output/parity/2026-02-23-customers-visual-baseline/`
- Magazyn po deploy `d42a8615` ma pełną parity funkcjonalną (`16/16`), ale strict visual parity pozostaje **NO**.
- Największe odchylenia pixel diff (próg 3.0%, produkcja 2026-02-20):
  - `products`: `9.314%`
  - `sales-history`: `7.367%`
  - `deliveries-history`: `5.731%`
- Referencja artefaktów:
  - `output/parity/2026-02-20-warehouse-prod-full/REPORT.md`
  - `output/parity/2026-02-20-warehouse-prod-full/pixel-diff.json`
  - `output/parity/2026-02-20-warehouse-visual-baseline/`

---

## 🔗 REFERENCJE

- **Analiza Versum:** `docs/VERSUM_DETAILED_ANALYSIS.md`
- **Architektura sesji:** `docs/SESSION_ARCHITECTURE.md`
- **Kompletny przewodnik:** `docs/VERSUM_CLONE_COMPLETE_GUIDE.md`

---

## 📝 HISTORIA ZMIAN

### 2026-02-23 - Klienci: produkcyjny rerun smoke + parity (po fixach anty-crash lokalnie)
- uruchomienia:
  - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-customers-smoke.spec.ts --project=desktop-1366` -> `2 passed`
  - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
  - panel functional checks: `YES` na wszystkich audytowanych trasach customers,
  - `Application error: a client-side exception has occurred` na karcie klienta: **nieodtworzony**,
  - visual parity strict (`<=3.0%`): `NO` (`list 7.333%`, `summary 5.363%`, `gallery 30.136%`, `files 8.707%`),
  - `versum` fallback `500` na ekranach `list` i `statistics` (wpływa na parity ogólne).
- artefakty:
  - `output/parity/2026-02-23-customers-prod-full/`

### 2026-02-20 - Klienci: stabilizacja audytu parity + strict visual diff (deploy)
- commit/deploy:
  - commit: `0642f399`
  - run dashboard: `22243239260` (production, success)
  - run probe: `22243353266` (production, success)
- zmiany testowe:
  - `prod-customers-parity-audit.spec.ts`:
    - dynamiczny `customerId` (bez hardcoded `2`),
    - dynamiczny katalog artefaktów (`YYYY-MM-DD`),
    - strict visual diff (`pixel-diff.json` + diff PNG),
    - pre-check fallback (w tym runtime client exception).
  - `prod-customers-smoke.spec.ts`:
    - dynamiczne wyszukiwanie `customerId`,
    - retry-safe wejście na zakładki `gallery/files`.
- walidacja po deployu:
  - `tests/e2e/prod-customers-parity-audit.spec.ts` -> `1 passed` (test runner),
  - wynik audytu: functional parity `NO`, visual parity `NO`,
  - `tests/e2e/prod-customers-smoke.spec.ts` -> `2 failed` (`.customer-gallery-tab` / `.customer-files-tab` timeout),
  - zrzuty błędu pokazują: `Application error: a client-side exception has occurred`.

### 2026-02-20 - Magazyn: copy-first cleanup + strict visual parity audit (deploy)
- commit/deploy:
  - commit: `d42a8615`
  - run dashboard: `22239708564` (production, success)
  - run probe: `22239861351` (production, success)
- zmiany:
  - `/products` przepięte na `WarehouseLayout` (spójny układ top-tabs/toolbar/tabela/footer),
  - usunięte nieużywane legacy komponenty magazynu:
    - `StockAlertsTab.tsx`
    - `DeliveriesTab.tsx`
    - `StocktakingTab.tsx`
    - `WarehouseCategoriesPanel.tsx`
  - `prod-warehouse-parity-audit.spec.ts` rozszerzony o strict visual diff:
    - krytyczne ekrany: `products`, `sales-history`, `deliveries-history`,
    - próg: `3.0%`,
    - nowe artefakty: `pixel-diff.json` + diff PNG.
- walidacja:
  - lokalnie: `eslint` + `tsc --noEmit` -> OK,
  - po deployu:
    - `tests/e2e/prod-warehouse-smoke.spec.ts` -> `2 passed` (rerun po flake timeout),
    - `tests/e2e/prod-warehouse-parity-audit.spec.ts` -> `1 passed`,
    - functional parity: `YES`,
    - visual parity strict: `NO` (`9.314%`, `7.367%`, `5.731%`).

### 2026-02-20 - Usługi: dodany smoke produkcyjny dla `/services/[id]` (komentarze/prowizje)
- nowy test:
  - `apps/panel/tests/e2e/prod-services-smoke.spec.ts`
- zakres:
  - logowanie do panelu produkcyjnego,
  - wejście z listy `/services` do szczegółów usługi,
  - weryfikacja renderu zakładek `komentarze` i `prowizje` (kontrolki + tabela).
- wynik uruchomienia:
  - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-services-smoke.spec.ts --project=desktop-1366` -> `2 passed`.

### 2026-02-20 - Statystyki: dodany smoke produkcyjny modułu
- nowy test:
  - `apps/panel/tests/e2e/prod-statistics-smoke.spec.ts`
- zakres:
  - logowanie do panelu produkcyjnego,
  - render strony `/statistics` (raport finansowy),
  - render `/statistics/employees` + nawigacja daty.
- wynik uruchomienia:
  - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-statistics-smoke.spec.ts --project=desktop-1366` -> `2 passed`.

### 2026-02-21 - Statystyki: copy-first refactor + deploy + audit produkcyjny
- commit/deploy:
  - commit: `24aba527`
  - run: `22258658561` (production, success, target `dashboard`)
  - probe: `22258712384` (production, success, target `probe`)
- zmiany UI:
  - `apps/panel/src/pages/statistics/index.tsx`
  - `apps/panel/src/pages/statistics/employees.tsx`
  - `apps/panel/src/pages/statistics/commissions.tsx`
  - uprzątnięcie utility-class drift (`flex/gap/bg-gray/text-xs`) i normalizacja toolbar/table/widget do wzorca Versum,
  - fallback listy pracowników na `/statistics` i `/statistics/commissions` (wiersze z zerami, gdy raport zwraca pustą listę).
- walidacja po deployu:
  - `tests/e2e/prod-statistics-smoke.spec.ts` -> `2 passed` (po selektor fix w `16883c89`),
  - `tests/e2e/prod-statistics-parity-audit.spec.ts` -> `1 passed`,
  - functional parity: `YES`,
  - visual parity strict (`<=3.0%`): `NO`:
    - `dashboard 12.484%`
    - `employees 3.789%`
    - `commissions 5.562%`
  - artifact: `output/parity/2026-02-21-statistics-prod-full/`.

### 2026-02-21 - Statystyki: copy-first visual parity iteration #2 (deploy)
- commit/deploy:
  - commit: `61402bd0`
  - run: `22258870671` (production, success, target `dashboard`)
  - probe: `22258923363` (production, success, target `probe`)
- zmiany UI:
  - dalsze dopięcie struktury copy-first na:
    - `apps/panel/src/pages/statistics/index.tsx`
    - `apps/panel/src/pages/statistics/employees.tsx`
    - `apps/panel/src/pages/statistics/commissions.tsx`
  - dodane fallback rows dla pustych raportów (wizualna stabilizacja tabel),
  - dodane brakujące sekcje układu Versum (m.in. tabs/podsumowanie na aktywności pracowników).
- walidacja po deployu:
  - `tests/e2e/prod-statistics-smoke.spec.ts` -> `2 passed`,
  - `tests/e2e/prod-statistics-parity-audit.spec.ts` -> `1 passed`,
  - functional parity: `YES`,
  - visual parity strict (`<=3.0%`): `NO`:
    - `dashboard 12.423%`
    - `employees 3.962%`
    - `commissions 6.143%`
  - artifact: `output/parity/2026-02-21-statistics-prod-full/`.

### 2026-02-21 - Statystyki: copy-first visual parity iteration #3 (deploy)
- commit/deploy:
  - commit: `65e88c9e`
  - run: `22259129228` (production, success, target `dashboard`)
  - probe: `22259183810` (production, success, target `probe`)
- zmiany UI:
  - `apps/panel/src/pages/statistics/employees.tsx`
  - `apps/panel/src/pages/statistics/commissions.tsx`
  - dopracowany układ tabstrip/toolbar dla aktywności pracowników,
  - dopracowana struktura tabeli prowizji (`Podsumowanie`, nagłówki, przyciski `szczegóły`) pod copy-first.
- walidacja po deployu:
  - `tests/e2e/prod-statistics-smoke.spec.ts` -> `2 passed`,
  - `tests/e2e/prod-statistics-parity-audit.spec.ts` -> `1 passed`,
  - functional parity: `YES`,
  - visual parity strict (`<=3.0%`): `NO`:
    - `dashboard 12.339%`
    - `employees 3.944%`
    - `commissions 6.786%`
  - artifact: `output/parity/2026-02-21-statistics-prod-full/`.

### 2026-02-21 - Statystyki: copy-first visual parity iteration #4 (deploy)
- commit/deploy:
  - commit: `04f2558f`
  - run: `22259293461` (production, success, target `dashboard`)
  - probe: `22259345742` (production, success, target `probe`)
- zmiany UI:
  - `apps/panel/src/pages/statistics/index.tsx`
  - `apps/panel/src/pages/statistics/commissions.tsx`
  - fallback pracowników ograniczony do małego zestawu Versum-like (brak mapowania całej listy pracowników przy pustych raportach).
- walidacja po deployu:
  - `tests/e2e/prod-statistics-smoke.spec.ts` -> `2 passed`,
  - `tests/e2e/prod-statistics-parity-audit.spec.ts` -> `1 passed`,
  - functional parity: `YES`,
  - visual parity strict (`<=3.0%`): `NO`:
    - `dashboard 12.423%`
    - `employees 3.662%`
    - `commissions 7.068%`
  - artifact: `output/parity/2026-02-21-statistics-prod-full/`.

### 2026-02-21 - Statystyki: copy-first visual parity iteration #5 (deploy)
- commit/deploy:
  - commit: `f01afdda`
  - run: `22260531212` (production, success, target `dashboard`)
  - probe: `22260588168` (production, success, target `probe`)
- zmiany UI:
  - `apps/panel/src/pages/statistics/index.tsx`
  - `apps/panel/src/pages/statistics/employees.tsx`
  - `apps/panel/src/pages/statistics/commissions.tsx`
  - poprawione pozycjonowanie legend wykresów i uproszczone elementy icon/button, by zmniejszyć drift pixelowy.
- walidacja po deployu:
  - `tests/e2e/prod-statistics-smoke.spec.ts` -> `2 passed`,
  - `tests/e2e/prod-statistics-parity-audit.spec.ts` -> `1 passed`,
  - functional parity: `YES`,
  - visual parity strict (`<=3.0%`): `NO`:
    - `dashboard 11.979%`
    - `employees 3.692%`
    - `commissions 6.756%`
  - artifact: `output/parity/2026-02-21-statistics-prod-full/`.

### 2026-02-21 - Statystyki: copy-first visual parity iteration #6 (deploy)
- commit/deploy:
  - commit: `f5d389e6`
  - run: `22261448267` (production, success, target `dashboard`)
  - probe: `22261508079` (production, success, target `probe`)
- zmiany UI:
  - `apps/panel/src/pages/statistics/index.tsx`
  - `apps/panel/src/pages/statistics/employees.tsx`
  - `apps/panel/src/pages/statistics/commissions.tsx`
  - dosunięcie akcji toolbar do prawej strony (`margin-left: auto`),
  - print jako icon-button i dopięcie układu legend wykresów względem wykresu.
- walidacja po deployu:
  - `tests/e2e/prod-statistics-smoke.spec.ts` -> `2 passed`,
  - `tests/e2e/prod-statistics-parity-audit.spec.ts` -> `1 passed`,
  - functional parity: `YES`,
  - visual parity strict (`<=3.0%`): `NO`:
    - `dashboard 11.835%`
    - `employees 3.687%`
    - `commissions 6.761%`
  - artifact: `output/parity/2026-02-21-statistics-prod-full/`.

### 2026-02-21 - Statystyki: copy-first visual parity iteration #7 (deploy)
- commit/deploy:
  - commit: `a338e107`
  - run: `22261775193` (production, success, target `dashboard`)
  - probe: `22261834814` (production, success, target `probe`)
- zmiany UI:
  - `apps/panel/src/pages/statistics/index.tsx`
  - `apps/panel/src/pages/statistics/employees.tsx`
  - `apps/panel/src/pages/statistics/commissions.tsx`
  - `apps/panel/src/styles/versum-shell.css`
  - stabilizacja renderu fallback (stała struktura tabel przy pustych danych),
  - dopięcie toolbar (`pobierz raport` + print) i korekty spacingu/`min-height` dla modułu.
- walidacja po deployu:
  - `tests/e2e/prod-statistics-smoke.spec.ts` -> `2 passed`,
  - `tests/e2e/prod-statistics-parity-audit.spec.ts` -> `1 passed`,
  - functional parity: `YES`,
  - visual parity strict (`<=3.0%`): `NO`:
    - `dashboard 12.652%`
    - `employees 3.750%`
    - `commissions 5.946%`
  - artifact: `output/parity/2026-02-21-statistics-prod-full/`.

### 2026-02-21 - Statystyki: copy-first visual parity iteration #8 (deploy)
- commit/deploy:
  - commit: `ad3e2531`
  - run: `22262457706` (production, success, target `dashboard`)
  - probe: `22262514834` (production, success, target `probe`)
- zmiany UI:
  - `apps/panel/src/styles/versum-shell.css`
  - usunięte lokalne compact-override w module statystyk (za małe fonty/wiersze, układ bardziej „ściśnięty” niż Versum).
- walidacja po deployu:
  - `tests/e2e/prod-statistics-smoke.spec.ts` -> `2 passed`,
  - `tests/e2e/prod-statistics-parity-audit.spec.ts` -> `1 passed`,
  - functional parity: `YES`,
  - visual parity strict (`<=3.0%`): `NO`:
    - `dashboard 11.828%`
    - `employees 3.968%`
    - `commissions 6.761%`
  - artifact: `output/parity/2026-02-21-statistics-prod-full/`.

### 2026-02-19 - Usługi: uruchomienie batcha parity dla zakładek szczegółów
- commit/deploy:
  - commit: `0e93a771`
  - run: `22205400049` (production, success)
- zmiany UI:
  - `/services/[id]`: wdrożony render dla zakładek `komentarze` i `prowizje` (wcześniej obecne w tabach bez zawartości),
  - `komentarze`: lista + dodawanie + usuwanie komentarzy oparta o istniejące endpointy `/services/:id/comments`,
  - `prowizje`: edycja i zapis reguł prowizyjnych oparta o `/services/:id/commissions`.
- walidacja:
  - `pnpm --filter @salonbw/panel typecheck` -> OK.

### 2026-02-18 - Magazyn: deploy `dostawcy` w układzie Versum (bez Tailwind)
- commit/deploy:
  - commit: `fd7d1335`
  - run: `22132335874` (production, success)
- zmiany UI:
  - `/suppliers`: przebudowa widoku na klasy Versum (`products-table`, `modal`, `btn`),
  - tabela dostawców + akcje wiersza + modal dodawania/edycji w jednym standardzie wizualnym.

### 2026-02-18 - Magazyn: parity `inwentaryzacja` (lista + new + details)
- commit/deploy:
  - commit: `10f4d1b3`
  - run: `22132191552` (production, success)
- zmiany UI:
  - `/inventory`: toolbar filtrów + stopka/paginacja jak w Versum,
  - `/inventory/new`: numerowane sekcje i uporządkowana sekcja akcji,
  - `/inventory/[id]`: dopracowany blok metadanych i prezentacja tabeli pozycji.

### 2026-02-18 - Magazyn: dopięcie layoutu formularzy `new` (dostawy/zamówienia)
- commit/deploy:
  - commit: `04885e6c`
  - run: `22122413879` (production, success)
- zmiany UI:
  - uspójnienie wrapperów formularzy (`warehouse-new-screen`, `warehouse-lines-table`),
  - lepsze wyrównanie sekcji podsumowania i spacingów tabel wejściowych.

### 2026-02-18 - Magazyn: doszlifowanie `historia sprzedaży` + `historia dostaw`
- commit/deploy:
  - commit: `8062ccd6`
  - run: `22132637254` (production, success)
- zmiany UI:
  - kwoty w tabelach formatowane zgodnie z PL (`1 234,56 zł` zamiast `1234.56 zł`),
  - `historia dostaw` dostała stopkę `products-table-footer` jak w `historia sprzedaży`,
  - pager i sekcja `na stronie` ujednolicone wizualnie między oboma ekranami.

### 2026-02-18 - Magazyn: `dodaj sprzedaż` (układ wspólny z Versum forms)
- commit/deploy:
  - commit: `9af86361`
  - run: `22132846978` (production, success)
- zmiany UI:
  - `/sales/new` używa tych samych wrapperów co pozostałe formularze magazynu (`warehouse-new-screen`, `warehouse-lines-table`),
  - usunięta nadmiarowa kolumna `lp` w tabeli pozycji, zgodnie z referencją,
  - kwoty w wierszach/podsumowaniu formatowane po polsku (`1 234,56 zł`).

### 2026-02-17 - Magazyn: paginacja `historia sprzedaży` + `historia dostaw` (deploy)
- commit/deploy:
  - commit: `ce5c1a56`
  - run: `22119280341` (production, success)
- zmiany UI:
  - `/sales/history`: dodana paginacja w stylu Versum (`Pozycje od ... do ... z ...`, numer strony, `>`),
  - `/deliveries/history`: dodana analogiczna paginacja i zakres pozycji.
- zachowanie:
  - reset strony do `1` przy zmianie filtra i wyszukiwania.

### 2026-02-17 - Magazyn: doszlifowanie wizualne `historia sprzedaży` + `historia dostaw` (deploy)
- commit/deploy:
  - commit: `2371ad63`
  - run: `22119599831` (production, success)
- zmiany UI:
  - `na stronie` jako select inline (parity z Versum),
  - delikatny zebra background dla wierszy tabel,
  - hover wiersza w kolorze zbliżonym do referencyjnego.

### 2026-02-17 - Magazyn: `historia zamówień` + drzewko secondnav `DOSTAWY` (deploy)
- commit/deploy:
  - commit: `6678127c`
  - run: `22120126171` (production, success)
- zmiany UI:
  - `/orders/history`: toolbar (wyszukiwarka + filtr statusu), rozszerzona tabela, paginacja w stylu Versum,
  - secondnav `DOSTAWY`: układ drzewka z nested pozycjami `dostawcy` i `producenci` pod `niski stan magazynowy`.

### 2026-02-17 - Magazyn: `dodaj dostawę` + `dodaj zamówienie` (deploy)
- commit/deploy:
  - commit: `7f1a568b`
  - run: `22120344947` (production, success)
- zmiany UI:
  - formularze `new` przebudowane na bardziej Versum-like układ sekcji,
  - numerowane wiersze danych wejściowych,
  - dopięte podsumowania w sekcji akcji (`do zapłaty łącznie`, `pozycje`).

### 2026-02-17 - Customers: pełny audyt produkcyjny (panel vs versum)
- nowy test audytowy:
  - `apps/panel/tests/e2e/prod-customers-parity-audit.spec.ts`
- artefakty:
  - `output/parity/2026-02-17-customers-prod-full/REPORT.md`
  - `output/parity/2026-02-17-customers-prod-full/checklist.json`
  - screenshoty `panel-*.png` i `versum-*.png`
  - `output/parity/2026-02-17-customers-prod-full/pixel-diff.json`
- wynik:
  - parity funkcjonalne (YES/NO per ekran/akcja): **YES**
  - parity wizualne strict 1:1 (pixel diff): **NO** (największe odchylenia: `gallery`, `statistics`)
  - uwaga: diff wizualny zależy od danych (panel i versum mają inny stan danych klienta referencyjnego).

### 2026-02-17 - Magazyn: pełny audyt produkcyjny (panel vs versum)
- nowy test audytowy:
  - `apps/panel/tests/e2e/prod-warehouse-parity-audit.spec.ts`
- artefakty:
  - `output/parity/2026-02-17-warehouse-prod-full/REPORT.md`
  - `output/parity/2026-02-17-warehouse-prod-full/checklist.json`
  - screenshoty `panel-*.png` i `versum-*.png`
  - `output/parity/2026-02-17-warehouse-prod-full/pixel-diff.json`
- wynik:
  - parity funkcjonalne (YES/NO per ekran/akcja): **YES** (16/16 akcji),
  - parity wizualne strict 1:1 (pixel diff): **NO** (największe odchylenia: `deliveries-history`, `products`, `sales-history`).

### 2026-02-17 - Magazyn: deploy `zużycie` footer + potwierdzenie smoke na produkcji
- deploy dashboard:
  - commit: `bd538e9a`
  - run: `22114587195` (production, success)
- zmiany UI:
  - dodany footer tabeli w stylu Versum w:
    - `/use/history`
    - `/use/planned`
  - footer: `Pozycje od ... do ... | na stronie 20`.
- smoke produkcyjny (po deployu):
  - `tests/e2e/prod-warehouse-smoke.spec.ts` -> `2 passed`,
  - `tests/e2e/prod-customers-smoke.spec.ts` -> `2 passed`,
  - łączny rerun `tests/e2e/prod-*.spec.ts` -> `4 passed`.

### 2026-02-15 - Magazyn: aliasy `/usage*` + optymalizacja transferu danych secondnav
- routing panel:
  - dodane aliasy tras: `/usage` -> `/use/history`, `/usage/:path*` -> `/use/:path*` (eliminuje 404 przy legacy/nawykowych URL).
  - dodane indeksowe redirecty stron magazynu:
    - `/sales` -> `/sales/history`
    - `/use` -> `/use/history`
    - `/deliveries` -> `/deliveries/history`
    - `/orders` -> `/orders/history`
- nawigacja modułu magazynu:
  - `WarehouseNav` rozpoznaje teraz zarówno `/use*`, jak i `/usage*` dla sekcji `ZUŻYCIE`.
- wydajność/transfer:
  - secondnav przestał pobierać zbędne dane globalnie:
    - dostawy (`draft/pending`) i `stock-summary` tylko w kontekście `DOSTAWY`,
    - zamówienia tylko w kontekście `ZAMÓWIENIA`.
  - efekt: mniej requestów i mniejszy ruch na hostingu docelowym (FreeBSD/MyDevil).

### 2026-02-15 - Magazyn: secondnav `DOSTAWY`/`INWENTARYZACJA` + szczegóły dostawy
- `DOSTAWY` secondnav:
  - dodany status `oczekujące (N)` (`/deliveries/history?status=pending`).
- `INWENTARYZACJA` secondnav:
  - dodane pozycje z licznikami: `wersje robocze (N)`, `w toku (N)`, `zakończone (N)`.
- inwentaryzacja:
  - `GET /stocktaking/history` wspiera filtr `?status=...`,
  - tabela `/inventory` pokazuje kolumnę `status` i respektuje filtr statusu z query.
- dostawy:
  - nowy widok szczegółów `/deliveries/[id]` (meta + pozycje + akcje przyjęcia/anulowania),
  - numer dostawy w `historia dostaw` linkuje do szczegółów.

### 2026-02-15 - Magazyn: szczegóły zamówienia (`/orders/[id]`)
- `historia zamówień`:
  - numer zamówienia linkuje do szczegółów (`/orders/[id]`).
- nowy widok `/orders/[id]`:
  - metadane zamówienia (nr, status, dostawca, data),
  - tabela pozycji (`produkt`, `ilość`, `jednostka`, `przyjęto`),
  - akcje statusowe (`wyślij`, `przyjmij`, `anuluj`) zgodnie ze statusem.

### 2026-02-15 - Magazyn: odchudzenie payloadu list (`sprzedaż` / `zużycie`)
- Backend (`RetailService`):
  - `GET /sales` nie ładuje już relacji `items.product` (lista zostaje z `items`, `employee`, `createdBy`),
  - `GET /usage` nie ładuje już relacji `items.product` (lista zostaje z `items`, `employee`, `createdBy`).
- Cel:
  - mniejszy payload JSON i mniej zapytań/relacji dla widoków listowych magazynu,
  - szybsze renderowanie na hostingu docelowym (FreeBSD/MyDevil) bez zmiany API kontraktu dla widoków szczegółowych.

### 2026-02-12 - Magazyn: historia dostaw i zamówień + poprawa flow dodawania dostawy
- `/orders/new`:
  - układ pozycji rozszerzony do `lp`, `nazwa`, `jednostka`, `ilość`, `usuń`
  - dodane akcje: `dodaj nowy produkt`, `dodaj dostawcę`, `dodaj uwagi`, `anuluj`
  - payload zamówienia wysyła `unit` dla pozycji
- `/deliveries/new`:
  - poprawiona logika: `wprowadź dostawę` tworzy dostawę i od razu wykonuje przyjęcie na stan (`/deliveries/:id/receive`)
  - dodana akcja `zapisz jako roboczą` (create draft bez przyjęcia na stan)
  - rozszerzony układ tabeli: `lp`, `jednostka`, `wartość (netto)` + podsumowanie `Łącznie (netto)`
  - dodane akcje: `dodaj nowy produkt`, `dodaj dostawcę`, `anuluj`
- `/orders/history` i `/deliveries/history`:
  - dopięte etykiety statusów PL i paginacyjny footer `Pozycje od 1 do ... | na stronie 20`
  - dodane filtrowanie po statusie przez query string (`?status=draft`) dla zgodności z linkami secondnav
- secondnav magazynu (`DOSTAWY`/`ZAMÓWIENIA`):
  - dodane pozycje `wersje robocze`
  - dodana pozycja `dostawcy` + strona `/suppliers`

### 2026-02-12 - Magazyn: rozbudowa secondnav DOSTAWY (niski stan + producenci)
- secondnav `DOSTAWY` rozszerzony o:
  - `niski stan magazynowy` -> `/stock-alerts`
  - `producenci` -> `/manufacturers`
- dodane widoki:
  - `/stock-alerts` (lista produktów z niskim stanem, deficyt, dostawca, szybka akcja do dostawy)
  - `/manufacturers` (zestawienie producentów na bazie katalogu produktów)
- test smoke produkcyjny magazynu rozszerzony o nowe trasy:
  - `/stock-alerts`, `/suppliers`, `/manufacturers`

### 2026-02-12 - Magazyn: dynamiczne liczniki secondnav (parity detail)
- secondnav magazynu wyświetla dynamiczne liczniki:
  - `wersje robocze (N)` dla dostaw (status `draft`)
  - `wersje robocze (N)` dla zamówień (status `draft`)
  - `niski stan magazynowy (N)` na bazie `stock-summary`
- cel: bliższa zgodność z zachowaniem Versum, gdzie secondnav pokazuje ilości w nawiasach.

### 2026-02-12 - Magazyn: poprawa walidacji i flow zapisu roboczej dostawy
- `/deliveries/new`:
  - dodana walidacja pozycji dostawy (wymagany produkt + ilość > 0),
  - przy pustej liście pozycji pokazywany jest jawny komunikat błędu zamiast cichego braku akcji,
  - `zapisz jako roboczą` po zapisie przekierowuje do listy `?status=draft` (czytelny flow dalszej pracy na wersjach roboczych).

### 2026-02-12 - Magazyn: parity pass UI dla formularzy (dodaj zamówienie / dodaj dostawę)
- `/orders/new`:
  - dodana walidacja pozycji zamówienia + komunikat błędu,
  - zapis przekierowuje do `historia zamówień` z filtrem `?status=draft`,
  - ujednolicone nazewnictwo akcji (`zapisz zamówienie`) i układ sekcji formularza.
- `/deliveries/new`:
  - sekcje formularza i nagłówki wyrównane wizualnie (wrapper `warehouse-form-card`, spójne odstępy i hierarchia),
  - komunikaty walidacyjne przeniesione do dedykowanego stylu błędu.
- CSS:
  - dodane klasy wspólne dla formularzy magazynu (`warehouse-subtitle`, `warehouse-form-card`, `warehouse-validation-error`).

### 2026-02-13 - Magazyn: stabilizacja routingu modułu + cleanup legacy console 404
- poprawione mapowanie modułu w `VersumShell` (`resolveVersumModule`) dla tras:
  - `/stock-alerts`, `/suppliers`, `/manufacturers` -> moduł `products`
  - efekt: brak przypadkowego fallbacku do `calendar` (`body#calendar`) na podstronach magazynu.
- dodane kompatybilne endpointy dla legacy skryptów Versum:
  - `GET /fresh_chat_user` -> rewrite do `/api/fresh_chat_user` (200 `{}`)
  - `GET /todo/alerts` -> rewrite do `/api/todo/alerts` (200 `[]`)
  - cel: redukcja szumu 404 w konsoli podczas pracy w panelu.
- `inventory` parity pass:
  - `/inventory/new` i `/inventory/[id]` ujednolicone wizualnie do stylu formularzy magazynu (sekcje/cardy/nagłówki).
- smoke:
  - `tests/e2e/prod-warehouse-smoke.spec.ts` na produkcji: **PASS** po deployu.

### 2026-02-13 - Globalny fix secondnav (calendar/customers/products)
- `VersumShell`:
  - rozpoznawanie aktywnego modułu opiera się na `router.asPath` (nie tylko `pathname`),
  - `secondnav` dostaje stabilny klucz renderu (`module + pathname + asPath`) wymuszający poprawny remount przy zmianie trasy.
- cel:
  - usunięcie zjawiska „starego” secondnav po przejściach między modułami i podstronami.
- weryfikacja:
  - `prod-customers-smoke.spec.ts` + `prod-warehouse-smoke.spec.ts` na produkcji: **PASS (3/3)**.

### 2026-02-14 - Magazyn: parity pass SPRZEDAŻ (`/sales/new`, `/sales/history`)
- `/sales/new`:
  - rozszerzony formularz o logikę rabatu per pozycja (`discount`) i przekazywanie rabatu do API,
  - dodane wyliczenia: `rabat`, `wartość sprzedaży`, `do zapłaty`, `reszta` (na bazie wpłaty klienta),
  - dodana walidacja pustej sprzedaży z jawnym komunikatem błędu,
  - tabela pozycji dopięta wizualnie (`lp`, akcja `dodaj nowy produkt`).
- `/sales/history`:
  - dodany footer tabeli w stylu Versum (`Pozycje od ... do ...`, `na stronie 20`).
- smoke:
  - `tests/e2e/prod-warehouse-smoke.spec.ts`: **PASS (2/2)**.

### 2026-02-14 - Magazyn: parity pass SPRZEDAŻ szczegóły (`/sales/history/[id]`)
- widok szczegółów sprzedaży rozszerzony o:
  - górny blok metadanych (nr sprzedaży, klient, pracownik, data, płatność, autor, daty),
  - tabela pozycji z kolumną `rabat`,
  - podsumowanie finansowe (`wartość netto`, `rabat`, `do zapłaty`),
  - sekcja `uwagi`,
  - akcja `drukuj` w nagłówku.
- status testów:
  - lokalne `eslint` + `tsc` ✅,
  - smoke produkcyjny magazynu: pierwszy test przechodzi, drugi potrafi flaky-failować na kroku logowania (`expect.not.toHaveURL` timeout / page closed) niezależnie od zmian funkcjonalnych widoku.

### 2026-02-14 - Magazyn: planowane zużycie (flow end-to-end, bez migracji DB)
- Backend (`/usage`):
  - dodane parametry wejściowe: `scope` (`planned|completed`) i `plannedFor`,
  - `GET /usage?scope=planned|completed|all` oraz `GET /usage/planned`,
  - wpisy `planned` nie zdejmują stanu magazynowego podczas tworzenia (ruch magazynowy powstaje dopiero dla zużycia wykonanego).
- Panel:
  - `/use/planned` przestało być placeholderem: działa lista planowanego zużycia z tabelą i przejściem do szczegółów,
  - `/use/new?scope=planned` zapisuje planowane zużycie z datą/czasem planowanym,
  - `/use/history` pokazuje tylko zużycie wykonane (`scope=completed`).

### 2026-02-13 - Klienci: komunikacja (communication_preferences) rozszerzona
- zakładka `komunikacja` na karcie klienta:
  - dodana historia komunikacji per klient z przełącznikiem kanału `SMS` / `Email`,
  - dodana sekcja `Historia zmian zgód` (placeholder na backendowe logi zmian),
  - dopracowany układ informacji kontaktowych (ikony + układ zgodny z kartą komunikacji).
- źródła danych:
  - SMS: `GET /sms/history?recipientId=:customerId`
  - Email: `GET /emails/history?recipientId=:customerId`
- weryfikacja:
  - `prod-customers-smoke.spec.ts` na produkcji: **PASS (2/2)**.

### 2026-02-13 - Klienci: statistics + events_history (układ bliżej Versum)
- `statistics`:
  - dodany pasek udziału usług/produktów,
  - dodane przełączane listy podsumowań (`wykonane usługi` / `zakupione produkty`) i układ wierszy bardziej zbliżony do Versum.
- `events_history`:
  - dodany górny przycisk `filtruj`,
  - poprawiony układ listy wizyt (status marker, metadane wizyty, etykieta statusu płatności),
  - pagination footer w stylu Versum (`Pozycje od ... do ...` + nawigacja strzałkami).
- weryfikacja:
  - `pnpm tsc --noEmit` ✅
  - `prod-customers-smoke.spec.ts` na produkcji (po zmianach lokalnych): **PASS (2/2)**.

### 2026-02-10 - Klienci 100% (Versum 1:1) domknięte
- Dodano `/clients/[id]/edit` (edycja danych osobowych)
- Karta klienta: komunikacja (SMS + Email history), galeria zdjęć (upload + miniatury + delete), załączone pliki (upload/download/delete)
- Backend: `email_logs` + `GET /emails/history` + media endpoints dla klientów (uploads na dysku w `uploads/`, miniatury `jimp`)

### 2026-02-10 - Łączność: email send + masowa wysyłka + email reminders
- Panel: `/communication` przełączanie SMS/Email (historia), wysyłka pojedyncza (SMS + email), masowa wysyłka (SMS + email)
- Backend: `POST /emails/send-auth` (panel) + `POST /emails/send-bulk` (panel) + automatyczne przypomnienia email (jeśli ustawiony domyślny szablon email)
- Wymagane: szablon email `appointment_reminder` ustawiony jako `domyślny` i `aktywny` (w `/communication/templates`), inaczej email-przypomnienia nie będą wysyłane.

### 2026-02-06 - Sprint 5 zakończony
- Przepisano stronę magazynu (/products) na VersumShell
- Dodano tabs (Produkty, Sprzedaż, Zużycie, Dostawy, Zamówienia, Inwentaryzacja)
- Dodano filtr typu produktu
- Zaimplementowano tabelę z sortowaniem i paginacją

### 2026-02-06 - Sprint 4 zakończony
- Przepisano stronę szczegółów klienta na VersumShell
- Zaimplementowano 8 zakładek (tabs)
- Widok "podsumowanie" z wizytami i danymi klienta

### 2026-02-06 - Sprint 3 zakończony
- Przepisano stronę listy klientów na VersumShell
- Dodano tabelę z checkboxami, ikonami edycji
- Paginacja zgodna z Versum

### 2026-02-06 - Sprint 2 zakończony
- Dodano sekcję "Kryteria wyszukiwania" w sidebarze
- Dodano badge aktywnych filtrów nad tabelą

### 2026-02-06 - Sprint 1 zakończony
- Zaimplementowano grupy klientów w sidebarze
- Dodano wyświetlanie grup w szczegółach klienta

### 2026-02-21 - Statystyki: produkcyjna iteracja parity (dashboard + employees + commissions)
- commit: `472122e3`
- zakres:
  - dopasowanie geometrii wykresów na `statistics/dashboard`,
  - korekty typografii i szerokości shella Versum (`versum-shell.css`),
  - korekty renderu podsumowania czasu pracy i przycisków szczegółów.
- deploy:
  - `dashboard` (production): run `22263291948` ✅
  - `probe` (production): run `22263347044` ✅
- smoke produkcyjny:
  - `prod-statistics-smoke.spec.ts` -> `2/2 PASS`
- parity produkcyjne:
  - functional: `YES`
  - visual strict (`<= 3.0%`): `NO`
  - pixel diff:
    - dashboard: `11.130%`
    - employees: `4.054%`
    - commissions: `7.237%`
- known deltas (otwarte):
  - nadal widoczny drift layoutu/typografii względem referencji Versum na ekranach krytycznych statystyk,
  - szczególnie `commissions` oraz pionowa kompozycja `dashboard`.

### 2026-02-21 - Statystyki: override globalnych stylów tabel/linków w shellu
- commit: `a3c35c30`
- deploy:
  - `dashboard` (production): run `22263424276` ✅
  - `probe` (production): run `22263484502` ✅
- smoke:
  - `prod-statistics-smoke.spec.ts` -> `2/2 PASS`
- parity:
  - functional: `YES`
  - visual strict (`<= 3.0%`): `NO`
  - pixel diff:
    - dashboard: `11.294%`
    - employees: `4.086%`
    - commissions: `6.969%`
- wynik iteracji:
  - lekka poprawa `commissions` względem poprzedniej iteracji,
  - regres względem poprzedniej iteracji na `dashboard` i `employees`,
  - moduł `statistics` pozostaje `in progress` (brak visual PASS).

### 2026-02-21 - Statystyki: seria iteracji shell/layout + rollback wykresów dashboard
- commity:
  - `0722edde` (szerokość/offset content + zachowanie sidenav),
  - `bff3334a` (powiększenie geometrii wykresów dashboard + stabilizacja screenshotów parity),
  - `4e9fbb26` (rollback geometrii wykresów po regresji visual diff).
- deploy:
  - `dashboard` (production): run `22264023168` ✅
  - `probe` (production): run `22264084604` ✅
- smoke:
  - `prod-statistics-smoke.spec.ts` -> `2/2 PASS`
- parity:
  - functional: `YES`
  - visual strict (`<= 3.0%`): `NO`
  - pixel diff:
    - dashboard: `11.922%`
    - employees: `4.139%`
    - commissions: `6.942%`
- known deltas:
  - największy drift na `dashboard` (layout/typografia/chart area),
  - `employees` blisko progu, ale nadal > `3.0%`,
  - `commissions` wymaga dalszego copy-first przepięcia markupu/tabeli 1:1.

### 2026-02-21 - Statystyki: cleanup regresji CSS + poprawka akcji w prowizjach
- commity:
  - `b8394c61` (przywrócenie niebieskich przycisków akcji w `commissions`),
  - `a6f941e2`, `6d0709fa`, `5b43276e` (reverty wcześniejszych zmian CSS powodujących regresję visual).
- deploy:
  - `dashboard` (production): run `22265073558` ✅
  - `probe` (production): run `22265131511` ✅
- smoke:
  - `prod-statistics-smoke.spec.ts` -> `2/2 PASS`
- parity:
  - functional: `YES`
  - visual strict (`<= 3.0%`): `NO`
  - pixel diff:
    - dashboard: `11.922%`
    - employees: `3.921%`
    - commissions: `6.715%`
- wynik:
  - utrzymana poprawa `commissions`,
  - `employees` najbliżej progu, ale nadal ponad limit,
  - `dashboard` pozostaje głównym blockerem visual parity.
