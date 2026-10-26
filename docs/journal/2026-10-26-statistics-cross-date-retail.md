# Raport usług nie zawiera ponownie sprzedaży produktów z innego dnia

- **Data:** 2026-10-26
- **Agent:** Codex
- **Baza:** #1521, 5f45469b; osobny worktree salonbw-statistics-cross-date-fix.

## Finding

Hostowany UAT: należność wizyty 225 (40 usługa +150 dodatek +40 towary −5
rabat), wpłata 240, tip 15. Wizyta 27.10, sprzedaż 26.10. Raport 26.10:
40 towarów; 27.10: 225 usług; tydzień: 225 razem. Suma dni 265 ≠ 225.
Mapa potrąceń była budowana tylko ze sprzedaży w wybranym zakresie soldAt.
Produkt spoza zakresu nie był odjęty od paidAmount wizyty w zakresie.

## Change

- Osobne filtrowanie w getProductSaleRows: daty sprzedaży dla bucketów retail
  albo identyfikatory wybranych wizyt dla pełnych potrąceń. Parametry SQL,
  brak skanowania cudzych wizyt w mapie potrąceń; pusty zbiór bez zapytania.
- Dashboard, chart, ranking pracowników/usług i raport prowizji używają
  pełnych powiązań wizyty. Daty wizyt, daty sprzedaży i gotówki bez zmian.
- Zachowane pierwszeństwo warehouse_sales nad starszym product_sales.
- CI ma osobną jednorazową statistics_synthetic, niezależną od testów
  cleanup/import. Testy PostgreSQL wymagają loopback i dokładnej nazwy DB.
- Brak migracji, zmian danych, endpointów, ról, cookies lub zgód.

## Validation

- 6 FAIL przed poprawką dla warehouse/legacy; po poprawce 14 unit PASS,
  w tym sprzedaż przed/po dacie wizyty, addytywność, rankingi i prowizje.
- Dwa testy rzeczywistego PostgreSQL (warehouse i legacy), z niepowiązanym
  obcym rekordem spoza zakresu. Wynik dni [40,185], razem 225. 16/16 PASS.
- Pełny backend z importerem, cleanupem i nowym SQL: 65 suites, 536/536 PASS,
  bez skipów. Wyłącznie wygenerowane fixture w czterech osobnych bazach
  jednorazowego lokalnego PostgreSQL; brak eksportu produkcyjnego.
- PostgreSQL calendar/reminder/retail business flows: 12/12 PASS.
- Build/typecheck PASS. Source ESLint exit 0 (46 zastanych warnings).
  Specs wyłączone z type-aware tsconfig; format Prettier i wykonanie Jest PASS.
- Ops workflow tests 20/20 PASS, git diff --check PASS.
- Pierwsze CI 40405398889 FAIL: nowe asercje zakładały pierwszy bucket dnia
  w Europe/Warsaw; runner UTC dodawał pusty dzień na granicy. Poprawiono tylko
  testy: wybór po dacie i sumy, bez zmiany obliczeń. Testy SQL 16/16 w obu
  strefach; pełny backend UTC 536/536 PASS bez skipów. Deploy 40405428651
  zatrzymał się na bramce CI przed zmianą API. Wymagana nowa próba CI/deploy.

## Rollout

PR zależny od #1521, baza master dla standardowego CI. Tylko API development
po zielonym CI dokładnego SHA. Frontendy nie będą wdrażane w tym zadaniu.
Wyniki CI/deploy i odczytu tych samych fixture po poprawce zostaną zapisane.
Rollback: poprzedni zaakceptowany SHA API dev 8aa1c7b8; brak migracji danych.

## Follow-up

Na hostowanym dev odczytać ponownie raporty 26/27 i tydzień, bez nowych wizyt
lub ponownej finalizacji. Oczekiwane 40 towarów +185 usług =225. Potwierdzić
niezmienione statusy, płatność 240, tip15, rabat5, produkt7 i linki importu.
Biznesowy UAT całości nie jest zakończony. Booksy i SalonBW utrzymywane ręcznie.
