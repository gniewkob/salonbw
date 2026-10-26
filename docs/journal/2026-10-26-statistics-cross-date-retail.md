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

- PR #1525, zależność #1521. CI 40406207899 SUCCESS dla
  `4cc6faf37cd8d53db16be05e166b1c8a7c497885`: 535 PASS +1 opt-in skip;
  importer PostgreSQL zaliczony lokalnie w pełnym 536/536 bez skipów.
  PG business flows w CI 12/12 PASS. Security Audit/Gitleaks PASS;
  automatyczny Claude review nie ukończył przeglądu.
- Deploy development API 40406251723 SUCCESS. Header X-SalonBW-Release
  dokładnie 4cc6faf3, health 200/database ok. API produkcji nadal 328d362f,
  health 200/database ok. Frontendy nie wdrażane (panel 1e030056).
- Hostowany panel, odbiór bez zapisów biznesowych: 26.10 towary 40,
  27.10 usługi 185, tydzień 225; napiwek 15. Suma dni = tydzień.
  Screenshoty prywatnie visualizations/2026/10/26/salonbw-statistics-cross-date.
  Brak page errors i poziomego overflow na 390 px.
- Niezależny READ ONLY post-deploy: dev nadal 2 wizyty, 0 import_source_links,
  produkt 7, stara wizyta confirmed, własna fixture completed, paid240/tip15/
  discount5 bez zmian. APP_ENV=development, własna DB, outbound/SMS off.
- Brak migracji i nowej finalizacji/importu. Rollback API dev do 8aa1c7b8
  możliwy bez odtwarzania danych. Przy kolejnym wspólnym release zachować
  poprawki #1521/#1522/#1523/#1525 i osobno zwalidować rozwijany #1524.

## Follow-up

Defekty ceny i addytywności raportów zamknięte technicznie na dev. Pozostaje
biznesowy UAT właścicielki pozostałych modułów i osobna akceptacja realnego
odbioru powiadomień. Ręczne utrzymywanie obu systemów trwa; finalny eksport
oraz kolejny import wymagają osobnego planu/GO. Bez produkcyjnego merge/deploy.
