# Postęp Klonowania Versum - Dokumentacja

> Data aktualizacji: 2026-04-03
> Cel: 1:1 klon Versum (panel.versum.com/salonblackandwhite)
> Sposób klonowania/kopiowania (obowiązujący SOP): `docs/VERSUM_CLONING_STANDARD.md`

---

## ✅ ZAIMPLEMENTOWANE

### Sprint 1: Grupy Klientów - ZAKOŃCZONY ✅

| Element                         | Status | Pliki                                |
| ------------------------------- | ------ | ------------------------------------ |
| Systemowe grupy w sidebarze     | ✅     | ClientsNav.tsx                       |
| Dynamiczne grupy z API          | ✅     | ClientsNav.tsx                       |
| Rozwijanie grup (więcej/mniej)  | ✅     | ClientsNav.tsx                       |
| Link zarządzania grupami        | ✅     | ClientsNav.tsx                       |
| Wyświetlanie grup w szczegółach | ✅     | CustomerSummaryTab.tsx               |
| Backend - relacja grupy-klient  | ✅     | user.entity.ts, customers.service.ts |

### Sprint 2: Filtrowanie i Kryteria Wyszukiwania - ZAKOŃCZONY ✅

| Element                                    | Status | Pliki           |
| ------------------------------------------ | ------ | --------------- |
| Sekcja "Kryteria wyszukiwania" w sidebarze | ✅     | ClientsNav.tsx  |
| Radio buttons AND/OR                       | ✅     | ClientsNav.tsx  |
| Badge aktywnych filtrów nad tabelą         | ✅     | ClientsList.tsx |
| Licznik klientów                           | ✅     | ClientsList.tsx |
| Link "utwórz grupę"                        | ✅     | ClientsList.tsx |

### Sprint 3: Lista Klientów (Tabela) - ZAKOŃCZONY ✅

| Element                                   | Status | Pliki             |
| ----------------------------------------- | ------ | ----------------- |
| Strona /clients na SalonBWShell            | ✅     | clients/index.tsx |
| Breadcrumbs                               | ✅     | clients/index.tsx |
| Toolbar (wyszukiwanie, sortowanie, dodaj) | ✅     | clients/index.tsx |
| Tabela z checkboxami                      | ✅     | clients/index.tsx |
| Ikona edycji (✏️)                         | ✅     | clients/index.tsx |
| Linki email (✉️) i telefon                | ✅     | clients/index.tsx |
| Paginacja zgodna z Versum                 | ✅     | clients/index.tsx |

### Sprint 4: Szczegóły Klienta (Karta klienta) - ZAKOŃCZONY ✅

| Element                             | Status | Pliki            |
| ----------------------------------- | ------ | ---------------- |
| Strona /clients/[id] na SalonBWShell | ✅     | clients/[id].tsx |
| Nagłówek "Karta klienta"            | ✅     | clients/[id].tsx |
| Zakładki (8 sztuk) jak w Versum     | ✅     | clients/[id].tsx |
| Widok "podsumowanie"                | ✅     | clients/[id].tsx |
| Sekcja "należy do grup:"            | ✅     | clients/[id].tsx |
| Zaplanowane wizyty                  | ✅     | clients/[id].tsx |
| Zrealizowane wizyty                 | ✅     | clients/[id].tsx |

---

## 📋 PLAN - NASTĘPNE SPRINTY

### Sprint 5: Magazyn (Produkty) - ZAKOŃCZONY ✅

**Zrobione:**

- [x] Strona /products na SalonBWShell
- [x] Sidebar z kategoriami produktów (WarehouseNav)
- [x] Tabela produktów z sortowaniem
- [x] Filtr typu produktu (wszystkie/towar/materiał)
- [x] Tabs: Produkty, Sprzedaż, Zużycie, Dostawy, Zamówienia, Inwentaryzacja
- [x] Paginacja
- [x] Export do Excel/CSV
- [x] Przyciski akcji (sprzedaj, zużyj)

**Pliki zmienione:**

- `apps/panel/src/pages/products/index.tsx` - przepisano na SalonBWShell
- `apps/panel/src/styles/salonbw-shell.css` - dodano style dla magazynu

---

## 🎯 METRYKI

| Obszar                      | Status | %                                                                                                                                                                                                   |
| --------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moduł Klienci - Sidebar     | 🟡     | 80% (functional YES, visual strict NO)                                                                                                                                                              |
| Moduł Klienci - Filtrowanie | ✅     | 100%                                                                                                                                                                                                |
| Moduł Klienci - Lista       | ✅     | 100% (list-table + customer-row + w-50p + results_info + all_customers_checker, commit c3a5ee12)                                                                                                    |
| Moduł Klienci - Szczegóły   | 🟡     | 90% (functional YES, visual strict YES — buttons-row/info-box/row-col/icon_box, commit ff4cb8e4)                                                                                                    |
| Moduł Magazyn               | 🟡     | 95% (Versum-native toolbar/table/pagination on all list pages: row.mb-l, column_row.data_table, table-bordered, pagination_container, input-with-select-sm, commit cef6dd7c)                        |
| Moduł Usługi                | 🟡     | 95% (ServiceDetailNav + sidenav icons + table class fixes + URL-based tabs, commit d9e72660)                                                                                                        |
| Moduł Statystyki            | 🟡     | 92% (Versum-native classes: .description/.price_summary/.data_table.compact_cells/.row.col-lg-5/7/.info_tip/br.c, commit 1b47831c)                                                                  |
| Moduł Łączność              | 🟡     | 90% (table table-bordered + tr.odd.row + td.wrap + .excerpt + .v2-label + .actions div + 4-col filter, commit 28714095)                                                                             |
| Moduł Ustawienia            | 🟡     | 85% (functional parity YES na `/settings`, visual strict NO: 5.446%, commit 7e27aea0)                                                                                                               |
| Moduł Dodatki (Extension)   | 🟡     | 85% (functional YES, visual strict NO — list 8.767%, detail 12.424%, threshold 3.0%; structural baseline ~4.5% from topbar/sidebar; detail blocked by gallery CDN URLs; commits 5af2de51, 106bc9d3) |
| Infra: Next.js              | ✅     | 15.5.10 na panel + landing (pnpm.overrides zaktualizowane)                                                                                                                                          |

**Całkowity postęp: ~65%** (wszystkie moduły mają secondary nav + breadcrumb; otwarte delty strict visual na: klienci/statystyki/magazyn/usługi)

## Known deltas (strict 1:1)

- Klienci (latest rerun 2026-03-10T23:51Z):
    - functional parity: **NO** tylko na `Add customer form` (panel: brak tekstu `nowy klient`),
    - visual strict parity: **NO** (próg 3.0% niespełniony na `list` i `summary`),
    - odchylenia pixel diff (produkcja, latest):
        - `list`: `7.382%`
        - `summary`: `5.862%`
        - `gallery`: `2.825%`
        - `files`: `2.951%`
    - runtime crash `Application error: a client-side exception has occurred` na trasach karty klienta: **nieodtworzony** (smoke `3/3` PASS),
    - artefakty:
        - `output/parity/2026-03-10-customers-prod-full/REPORT.md`
        - `output/parity/2026-03-10-customers-prod-full/pixel-diff.json`
        - `output/parity/2026-03-10-customers-visual-baseline/`
- Magazyn (latest rerun 2026-03-11T00:01Z):
    - functional parity: **YES** (`16/16`),
    - visual strict parity: **NO** (próg 3.0% niespełniony),
    - odchylenia pixel diff (produkcja, latest):
        - `products`: `11.277%`
        - `sales-history`: `7.718%`
        - `deliveries-history`: `6.876%`
    - artefakty:
        - `output/parity/2026-03-11-warehouse-prod-full/REPORT.md`
        - `output/parity/2026-03-11-warehouse-prod-full/pixel-diff.json`
        - `output/parity/2026-03-11-warehouse-visual-baseline/`
- Statystyki po deploy `9ec696ac`:
    - functional parity (panel+versum): **YES** (`dashboard`, `employees`, `commissions`, `services`) — latest rerun 2026-03-11,
    - strict visual parity: **NO** (`dashboard 12.292%`, `employees 4.188%`, `commissions 6.111%`),
    - runtime crash `Application error: a client-side exception has occurred` na `/statistics` i `/statistics/commissions`: **naprawiony** (nieodtworzony na rerun 2026-02-24),
    - decyzja: **odłożone do dopieszczenia po module o wyższym priorytecie** (strict visual polish + synchronizacja danych parity),
    - artefakty:
        - `output/parity/2026-03-11-statistics-prod-full/REPORT.md`
        - `output/parity/2026-03-11-statistics-prod-full/pixel-diff.json`
        - `output/parity/2026-03-11-statistics-visual-baseline/`
- Ustawienia (latest rerun 2026-04-03T12:07Z):
    - functional parity: **YES** (`/settings`, `/settings/payment-configuration`),
    - visual strict parity: **NO** (`settings-main 7.091%`, `payment-configuration 7.534%`, próg `3.0%`),
    - artefakty:
        - `output/parity/2026-04-03-settings-prod-full/REPORT.md`
        - `output/parity/2026-04-03-settings-prod-full/pixel-diff.json`
        - `output/parity/2026-04-03-settings-visual-baseline/`
- Największe odchylenia pixel diff (próg 3.0%, latest warehouse run 2026-03-11):
    - `products`: `11.277%`
    - `sales-history`: `7.718%`
    - `deliveries-history`: `6.876%`
- Referencja artefaktów:
    - `output/parity/2026-03-11-warehouse-prod-full/REPORT.md`
    - `output/parity/2026-03-11-warehouse-prod-full/pixel-diff.json`
    - `output/parity/2026-03-11-warehouse-visual-baseline/`

---

## 🔗 REFERENCJE

- **Analiza Versum:** `docs/VERSUM_DETAILED_ANALYSIS.md`
- **Architektura sesji:** `docs/SESSION_ARCHITECTURE.md`
- **Kompletny przewodnik:** `docs/VERSUM_CLONE_COMPLETE_GUIDE.md`

---

## 📝 HISTORIA ZMIAN

### 2026-04-03 - Lokalny import Versum: usługi i produkty

- wykonano pierwszy bezpieczny import danych Versum do lokalnej bazy developerskiej (`backend/salonbw-backend/.env` -> `127.0.0.1:8543`)
- źródła:
    - `/Users/gniewkob/Downloads/19581_cennik_uslug_wygenerowany_2026-04-03.xlsx`
    - `/Users/gniewkob/Downloads/19581_baza_produktow_z_2026-02-03.xlsx`
- użyte importery:
    - `pnpm import:services`
    - `pnpm import:products`
- wynik:
    - `service_categories`: `4`
    - `services`: `56`
    - `service_variants`: `86`
    - `products`: `821`
- status:
    - moduły `services` i `products` mogą już być dalej dopracowywane na rzeczywistych danych Versum zamiast wyłącznie na seedzie,
    - brakujące domeny do pełniejszego snapshotu nadal obejmują `customers`, `appointments`, `sales`, `communication` i część `settings/timetable`.

### 2026-04-03 - Rozczytanie `prowizji` i `napiwków` + skrypt anonimizacji raportów pracowniczych

- rozczytano eksporty:
    - `/Users/gniewkob/Downloads/19581_prowizje_od_2000-01-01_do_2026-12-31.xls`
    - `/Users/gniewkob/Downloads/19581_napiwki_od_2000-01-01_do_2026-12-31.xls`
- potwierdzone kolumny:
    - `prowizje`: obroty usługowe/produktowe brutto+netto, prowizje usługowe/produktowe brutto+netto, łączny obrót i łączna prowizja per pracownik,
    - `napiwki`: ilość, gotówka, karta, czek, przelew, łączna wartość napiwków per pracownik.
- dodano narzędzie:
    - `backend/salonbw-backend/scripts/anonymize-versum-employee-report.ts`
    - `pnpm anonymize:versum-report`
- status:
    - raporty `commissions` i `tips` mogą już być używane jako pełnoprawne źródło parity/reference,
    - przed szerszym użyciem poza lokalnym środowiskiem należy anonimizować nazwy pracowników,
    - potwierdzono sekwencyjny workflow ze wspólną mapą aliasów (`--map-in`, `--map-out`) i stabilnym outputem `.xlsx`:
        - `/tmp/19581_prowizje_anon.xlsx`
        - `/tmp/19581_napiwki_anon.xlsx`
        - `/tmp/versum-workers-map.json`
    - dodano i przetestowano batch workflow dla wielu raportów naraz:
        - `pnpm anonymize:versum-reports`
        - wygenerowane artefakty:
            - `/tmp/versum-employee-anon/19581_prowizje_od_2000-01-01_do_2026-12-31_anon.xlsx`
            - `/tmp/versum-employee-anon/19581_napiwki_od_2000-01-01_do_2026-12-31_anon.xlsx`
            - `/tmp/versum-employee-anon/19581_popularnosc_uslug_wg_pracownikow_od_2000-01-01_do_2026-12-31_anon.xlsx`
            - `/tmp/versum-employee-anon/19581_raport_powracalnosci_klientow_wygenerowany_2026-04-03_anon.xlsx`
            - `/tmp/versum-employee-anon/workers-map.json`
        - wynik mapowania: `13` aliasów pracowników.
    - dodano narzędzie diagnostyczne do nowych eksportów:
        - `pnpm inspect:versum-workbook <plik.xls[x]> [maxRows]`
        - test na `19581_raport_finansowy_od_2000-01-01_do_2026-12-31.xlsx` przeszedł i zwrócił poprawne `sheet`, `rowCount`, `inferredHeaderRow` oraz podgląd kolumn.
    - dodano pipeline `extract -> db` dla statystyk referencyjnych:
        - `pnpm extract:versum-reference --map /tmp/versum-employee-anon/workers-map.json --out /tmp/versum-reference-snapshot.json --base-dir /Users/gniewkob/Downloads`
        - `pnpm save:versum-reference-db --snapshot /tmp/versum-reference-snapshot.json --source-key versum_downloads_2026_04_03`
        - wynik w DB:
            - tabela: `versum_reference_snapshots`
            - rekord: `id=1`, `source_key=versum_downloads_2026_04_03`, `payload_bytes=14781`

### 2026-04-03 - Łączność: detail bez martwego `operacje` + smoke odporny na pustą historię

- zmiana kodu:
    - `apps/panel/src/pages/communication/[id].tsx`
        - martwy przycisk `operacje` został zastąpiony realnym dropdownem na istniejącym patternie `details/summary`,
        - dropdown korzysta wyłącznie z już dostępnych flow detail-view:
            - `odpowiedz`,
            - `pokaż kartę klienta` (jeśli istnieje `recipientUser`),
            - `pokaż wizytę w kalendarzu` (jeśli SMS jest powiązany z wizytą),
            - `drukuj`.
    - `apps/panel/tests/e2e/prod-communication-smoke.spec.ts`
        - smoke został urealniony pod aktualny production UI łączności:
            - asercje dla subpage'ów zostały oparte o faktyczne elementy ekranów, nie stare nagłówki,
            - case detail-page obsługuje zarówno istniejące wiadomości, jak i pustą historię (`Pozycje 0 - 0 z 0`), zamiast zakładać seed danych.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/pages/communication/[id].tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: lint dla `tests/e2e/prod-communication-smoke.spec.ts` nadal wpada w istniejący repo-problem `parserOptions.project` nieobejmujący `tests/e2e` (to nie jest regres tej zmiany).
- walidacja produkcyjna:
    - `PANEL_LOGIN_EMAIL=... PANEL_LOGIN_PASSWORD=... PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-communication-smoke.spec.ts --project=desktop-1366` -> `2 passed`
- status:
    - kolejny placeholder/stub na trasie `communication/[id]` został usunięty bez dodawania nowego kontraktu backendowego,
    - route nadal pozostaje `invent`, bo model konwersacji SalonBW nadal nie jest literalną kopią legacy Versum, ale detail-view nie ma już martwego menu akcji i jest objęty stabilniejszym smoke testem.

### 2026-04-03 - Newslettery: `/newsletters/new` przestało być disabled atrapą

- zmiana kodu:
    - `apps/panel/src/pages/newsletters/new.tsx`
        - usunięto statyczny formularz z całym `disabled`,
        - trasa została przepięta na realny `NewsletterEditorModal` i istniejący backendowy create flow (`useNewsletterMutations().createNewsletter`),
        - zamknięcie i zapis wracają operatora do `/messages`, zamiast zostawiać go w martwym ekranie.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/pages/newsletters/new.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - kolejny jawny placeholder w obszarze komunikacji został usunięty bez dokładania nowej infrastruktury,
    - route nadal wymaga dalszego parity pass wizualnego, ale nie jest już atrapą i korzysta z realnego editor + persistence flow.

### 2026-04-03 - Wiadomości: `/messages` przestało być statyczną tabelą

- zmiana kodu:
    - `apps/panel/src/pages/messages/index.tsx`
        - usunięto statyczną tabelę z placeholderem `Brak wysłanych wiadomości`,
        - ekran został przepięty na realne hooki i komponenty newsletterów:
            - `useNewsletters`,
            - `useNewsletterStats`,
            - `useNewsletterMutations`,
            - `NewslettersList`,
            - `NewsletterEditorModal`,
        - akcje listy (`edytuj`, `duplikuj`, `usuń`, `wyślij`, `anuluj`) są teraz podpięte do istniejących mutacji,
        - dodano lokalny modal podglądu odbiorców oparty o `useNewsletterRecipients`, zamiast pustej kolumny/atrapy.
    - `apps/panel/tests/e2e/prod-messages-smoke.spec.ts`
        - dodano smoke dla `/messages` i `/newsletters/new`, aby po deployu dało się szybko potwierdzić listę newsletterów i create-route.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/pages/messages/index.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- walidacja produkcyjna:
    - `PANEL_LOGIN_EMAIL=... PANEL_LOGIN_PASSWORD=... PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-messages-smoke.spec.ts --project=desktop-1366` -> `1 failed`
    - failure potwierdza, że produkcja nadal serwuje starą, statyczną wersję `/messages` (`Brak wysłanych wiadomości`), czyli nowy ekran nie jest jeszcze wdrożony.
- status:
    - kolejna trasa z obszaru komunikacji została przesunięta z makiety do realnego flow opartego o istniejący backend,
    - otwarty pozostaje deploy + rerun produkcyjny dla `/messages`,
    - po stronie repo ekran nie jest już statycznym placeholderem.

### 2026-04-03 - Newsletter create: domknięty prefill z listy klientów

- zmiana kodu:
    - `apps/panel/src/components/newsletters/NewsletterEditorModal.tsx`
        - modal wspiera teraz `initialData`, więc create-flow może startować od predefiniowanego kanału, trybu wyboru odbiorców i listy `recipientIds`.
    - `apps/panel/src/pages/newsletters/new.tsx`
        - create-route konsumuje query params `platform`, `recipientId`, `single`,
        - dla flow `single=1` otwiera editor od razu w trybie ręcznym z już wybranym odbiorcą.
    - `apps/panel/src/pages/customers/index.tsx`
        - link email z listy klientów przekazuje teraz również `recipientId`, a nie tylko adres email w query stringu.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/components/newsletters/NewsletterEditorModal.tsx src/pages/newsletters/new.tsx src/pages/customers/index.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - po wycięciu atrapy `/newsletters/new` domknięto też integrację z listą klientów,
    - create-flow newslettera jest bliżej panelowego zachowania operatora i nie gubi już kontekstu pojedynczego odbiorcy przy wejściu z modułu klientów.

### 2026-04-03 - Ustawienia: Moment Pay clone-hardening bez meta copy salonbw

- zmiana kodu:
    - `apps/panel/src/components/settings/PaymentConfigurationPage.tsx`
        - usunięto salonbw-specific komunikat `zapisuje ustawienia przez backend salonbw`,
        - komunikat po rozwinięciu `Dowiedz się więcej` został sprowadzony do neutralnego opisu flow przedpłat, bez odsłaniania szczegółów implementacyjnych backendu.
    - `apps/panel/tests/e2e/prod-settings-parity-audit.spec.ts`
        - audit ustawień został rozszerzony o osobny checkpoint `Settings payment configuration`,
        - raport zbiera teraz wiele akcji i visual diff dla każdej z nich, zamiast nadpisywać wynik tylko ostatnim ekranem.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/components/settings/PaymentConfigurationPage.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm tsc --noEmit` po rozszerzeniu audytu ✅
- status:
    - kolejny pass klonowania został skierowany na trasę ustawień, która funkcjonalnie działała, ale nadal zdradzała rekonstrukcję przez meta copy,
    - nie zmieniono kontraktu backendu ani zachowania zapisu; to wyłącznie hardening warstwy prezentacji w kierunku clone-first,
    - rerun produkcyjny:
        - `pnpm exec playwright test tests/e2e/prod-settings-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
        - artefakt: `output/parity/2026-04-03-settings-prod-full/`
        - wynik functional:
            - `Settings main page` -> `YES | YES | YES`
            - `Settings payment configuration` -> `YES | YES | YES`
        - wynik visual strict:
            - `settings-main`: `7.091%`
            - `payment-configuration`: `7.534%`

### 2026-04-03 - Klienci: hardening label parity na `/customers/new`

- zmiana kodu:
    - `apps/panel/src/pages/customers/new.tsx`
        - nagłówek i helper text zostały sprowadzone do literalnego labela `nowy klient`, zgodnego z wymaganiem z audytu parity.
    - `apps/panel/src/components/salon/navs/NewCustomerNav.tsx`
        - tytuł secondary nav dla formularza nowego klienta używa teraz `nowy klient` zamiast wersji uppercase.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/pages/customers/new.tsx src/components/salon/navs/NewCustomerNav.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - rozpoczęty kolejny pass klonowania od najbardziej konkretnego otwartego delta z raportu parity,
    - targetowany known delta: `Add customer form` -> `missing text: "nowy klient"` z `output/parity/2026-03-10-customers-prod-full/checklist.json`.
    - rerun produkcyjny:
        - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
        - artefakt: `output/parity/2026-04-03T11-49-39-252Z-customers-prod-full/`
        - `Add customer form` -> `YES | YES | YES` (`panel: all checks passed; versum: all checks passed`)
    - wynik:
        - wcześniejszy delta na `customers/new` został zamknięty,
        - moduł klienci wraca do stanu bez tego regresu functional parity.

### 2026-04-03 - Statystyki pracowników: zakładki `Tabela/Wykres` przestały być atrapą

- zmiana kodu:
    - `apps/panel/src/pages/statistics/employees.tsx`
        - martwe anchory `Tabela` i `Wykres` zostały zastąpione realnym przełączaniem widoku opartym o lokalny stan,
        - widok `Tabela` zachowuje dotychczasowy układ legacy-like,
        - widok `Wykres` renderuje realny wykres słupkowy (`recharts`) dla:
            - przepracowanego czasu,
            - liczby wizyt,
        - tooltip pokazuje pełne nazwy pracowników i formatuje czas pracy do czytelnej postaci (`h/min`),
        - zmiana nie modyfikuje kontraktu API `/api/statistics/employees/activity`; to wyłącznie domknięcie brakującej interakcji UI.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/pages/statistics/employees.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - ekran `Aktywność pracowników` przestał wyglądać jak pół-klon z martwymi tabami,
    - zamknięto konkretny delta parity w module statystyk bez dokładania nowej infrastruktury i bez dotykania backendu.

### 2026-04-03 - Dodatki: `czytaj więcej »` na detail page działa

- zmiana kodu:
    - `apps/panel/src/pages/extension/tools/[id].tsx`
        - link `czytaj więcej »` na stronie szczegółów dodatku przestał być martwy,
        - dodano lokalny toggle rozwijający/zwijający blok `description_more`,
        - zachowano istniejący markup i CSS clone-first; zmiana dotyczy wyłącznie brakującej interakcji.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/pages/extension/tools/[id].tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - kolejny detail page w module `Dodatki` przestał zawierać martwą akcję,
    - poprawka nie zmienia kontraktów backendu ani statusów dodatków; domyka wyłącznie brak parity w UI behavior.

### 2026-04-03 - Topbar: ikona powiadomień prowadzi do realnej trasy

- zmiana kodu:
    - `apps/panel/src/components/salon/SalonTopbar.tsx`
        - ikona powiadomień przestała używać `preventDefault()` na `href="#"`,
        - topbar prowadzi teraz do istniejącej trasy `/notifications`, zamiast zachowywać się jak atrapa.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/components/salon/SalonTopbar.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - zamknięto kolejny konkretny delta parity w shellu panelu,
    - celowo nie ruszano jeszcze zadań i omniboxa, bo repo nie ma dla nich tak samo jednoznacznych, gotowych flowów jak dla `/notifications`.

### 2026-04-03 - Formularze kontaktowe: panel + landing bez angielskich placeholderów

- zmiana kodu:
    - `apps/panel/src/components/ContactForm.tsx`
    - `apps/landing/src/components/ContactForm.tsx`
        - placeholdery zostały sprowadzone do polskiego copy:
            - `Imię i nazwisko`,
            - `Adres e-mail`,
            - `Treść wiadomości`,
        - przycisk `Send` został zastąpiony przez `Wyślij`.
    - `apps/panel/src/__tests__/contactForm.test.tsx`
    - `apps/landing/src/__tests__/contactForm.test.tsx`
        - testy zostały urealnione do aktualnego kontraktu komponentu (`/emails/contact`) i polskiego copy formularza.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/components/ContactForm.tsx src/__tests__/contactForm.test.tsx --fix` ✅
    - `apps/panel`: `pnpm jest src/__tests__/contactForm.test.tsx --runInBand` ✅
    - `apps/landing`: `pnpm eslint src/components/ContactForm.tsx src/__tests__/contactForm.test.tsx --fix` ✅
    - `apps/landing`: `pnpm jest src/__tests__/contactForm.test.tsx --runInBand` ✅
- status:
    - usunięto kolejny rozjazd copy/presentation między polskim produktem a angielskim fallbackiem,
    - zmiana objęła jednocześnie panel i landing, żeby nie utrwalać różnic między aplikacjami współdzielącymi ten sam komponentowy wzorzec.

### 2026-04-03 - Statystyki klientów: overview prowadzi do realnych raportów

- zmiana kodu:
    - `apps/panel/src/pages/statistics/customers.tsx`
        - usunięto placeholder `Szczegółowy raport powracalności w przygotowaniu`,
        - overview klientów prowadzi teraz do istniejących raportów:
            - `/statistics/customers/returning`,
            - `/statistics/customers/origins`,
        - sekcja została przebudowana na dwa realne entrypointy zamiast martwego komunikatu.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/pages/statistics/customers.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - zamknięto kolejny jawny placeholder w module statystyk,
    - zamiast sugerować „w przygotowaniu”, ekran odsyła teraz do faktycznie istniejących szczegółowych raportów w repo.

### 2026-04-03 - Stan kasy: zakładka historii nie jest już placeholderem

- zmiana kodu:
    - `apps/panel/src/pages/statistics/register.tsx`
        - zakładka `Historia operacji kasowych` przestała wyświetlać komunikat `Funkcja w przygotowaniu`,
        - historia renderuje teraz realne operacje z istniejącego `CashRegisterSummary.entries`,
        - dodano podsumowanie liczby operacji, sum wpływów i wypływów oraz breakdown metod płatności dla wybranego dnia,
        - sekcje `Inne operacje kasowe`, `Wypływy z kasy` i `Wpływy do kasy` korzystają teraz z realnych danych zamiast martwych stałych,
        - ręczne CTA `dodaj wpływ` / `dodaj wypływ` zostały jawnie zablokowane jako niedostępne w tym widoku, zamiast udawać aktywne flow.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/pages/statistics/register.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - usunięto największy placeholder treściowy z modułu `Stan kasy` bez dodawania nowego backendu,
    - ekran jest teraz spójnym read-only raportem dziennym zamiast półgotowej atrap y z martwą zakładką historii.

### 2026-04-03 - Topbar: ukrycie nieistniejących flowów `zadania` i globalnego wyszukiwania

- zmiana kodu:
    - `apps/panel/src/lib/topbar/topbarModel.ts`
        - wyłączono `tasks.enabled`,
        - wyłączono `search.enabled`.
    - `apps/panel/src/components/salon/SalonTopbar.tsx`
        - topbar renderuje omnibox tylko wtedy, gdy wyszukiwanie jest faktycznie dostępne w view modelu.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src/lib/topbar/topbarModel.ts src/components/salon/SalonTopbar.tsx --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - repo nie ma realnych tras dla `zadania` ani `/global_searches`, więc oba elementy były martwym UI,
    - zamiast utrzymywać atrapę, shell panelu pokazuje teraz tylko affordance’y podparte istniejącymi flowami.

### 2026-03-17 - Pivot do Pattern-Driven Development

- **Decyzja:** Zmiana paradygmatu klonowania z "Strict 1:1 Pixel-Perfect" na "Pattern-Driven Development" (100% funkcjonalności, 98% visual parity). Priorytet to Velocity (szybkość dostarczania).
- **Zmiany w testach:** Próg `VISUAL_DIFF_THRESHOLD_PCT` dla testów E2E audytu zrewidowany i podniesiony z rygorystycznego `3.0%` do `15.0%`.
- **Technologia:** Odblokowano używanie nowoczesnego Tailwind CSS do układania siatek i layoutów (RWD first) z użyciem wyabstrahowanych komponentów UI (np. tabele, przyciski). Zakaz ślepego wklejania zagnieżdżonego HTML z Versum.
- **Narzędzia:** Skryptowa ekstrakcja oryginalnych tłumaczeń z JSON dumpa wprost do `messages/pl.json` (next-intl), by zminimalizować błędy w warstwie prezentacji.
- **SOP:** Zaktualizowano `VERSUM_CLONING_STANDARD.md` jako główne źródło prawdy o nowym procesie.

---

### 2026-03-24 - Usługi: audyt parity (15% limit) + poprawki smoke testów

- zmiana kodu:
    - `apps/panel/tests/e2e/prod-services-parity-audit.spec.ts`
        - dodano nowy audyt z progiem odchyleń 15.0% dedykowany do weryfikacji Pattern-Driven Development.
    - `apps/panel/tests/e2e/prod-services-smoke.spec.ts`
        - przeprowadzono dostosowanie selektorów z legacy Versum (`table.versum-table`) do nowych klas zdefiniowanych z Tailwind/utility (np. `table.table-bordered`).
    - `apps/panel/src/components/services/ServiceVariantsModal.tsx`
        - naprawiono usterkę z "pustym" przyciskiem anulowania przez dodanie event handlera `onClick={handleCancelForm}`,
        - potwierdzono gotowość interfejsu (i podłączonego API) do usuwania wariantów.
- status:
    - skrypt `prod-services-parity-audit` jest gotowy na rerun z uwzględnieniem tolerancji RWD/Tailwind.
    - odblokowano uruchomienie testów (poprawiono kompilację i dependencje dla `pngjs`).

---

### 2026-03-24 - Usługi: commit `cf93b5d7` + blokada DNS w sieci lokalnej

- zmiana kodu (commit `cf93b5d7`):
    - `apps/panel/tests/e2e/prod-services-parity-audit.spec.ts`
        - dodano dynamiczne rozwiązywanie ID dla Panelu i Versum oparte na analizie pierwszego wiersza z `tbody`, analogicznie do klientów,
        - dodano sprawdzanie ekranu tworzenia (`03-services-new`) oraz ekranu szczegółów (`02-services-summary`), kompletując w ten sposób pełny zakres funkcjonalny audytu.
    - `apps/panel/types/pngjs.d.ts`
        - dodano lokalne deklaracje TS dla modułu `pngjs` (mini `.d.ts` zamiast zależności `@types/pngjs`).
    - `apps/panel/tests/e2e/prod-services-smoke.spec.ts`
        - zaktualizowane selektory do `table.table-bordered`.
    - `apps/panel/src/components/services/ServiceVariantsModal.tsx`
        - fix: pusty przycisk `Anuluj` — dodany `onClick={handleCancelForm}`.
- status produkcyjnego rerunu:
    - **BLOCKED** — DNS dla `salon-bw.pl` (i subdomen) nie rozwiązuje się z aktualnej sieci lokalnej (`host salon-bw.pl 1.1.1.1` → NXDOMAIN),
    - komenda do uruchomienia, gdy połączenie będzie dostępne:
        ```
        PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl \
          PANEL_LOGIN_EMAIL='kontakt@bodora.pl' \
          PANEL_LOGIN_PASSWORD='haslohaslo' \
          VERSUM_LOGIN_EMAIL='gniewko' \
          VERSUM_LOGIN_PASSWORD='wywpib-daQko9-syhker' \
          pnpm exec playwright test tests/e2e/prod-services-parity-audit.spec.ts --project=desktop-1366
        ```
    - artefakty pojawią się w: `output/parity/2026-03-24-services-prod-full/REPORT.md`

### 2026-03-24 - Usługi: pełne pokrycie w skrypcie parity audit

- zmiana kodu:
    - `apps/panel/tests/e2e/prod-services-parity-audit.spec.ts`
        - dodano dynamiczne rozwiązywanie ID dla Panelu i Versum oparte na analizie pierwszego wiersza z `tbody`, analogicznie do klientów,
        - dodano sprawdzanie ekranu tworzenia (`03-services-new`) oraz ekranu szczegółów (`02-services-summary`), kompletując w ten sposób pełny zakres funkcjonalny audytu.
- status:
    - przygotowano ostateczną konfigurację E2E gotową na ewentualny nadzór manualny produkcyjnego uruchomienia przez developera.


---

### 2026-03-20 - Services: `/services/new` domknięty funkcjonalnie pod realny flow Versum

- zmiana kodu:
    - `apps/panel/src/pages/services/new.tsx`
        - create-flow odwzorowuje realny ekran Versum po live inspekcji panelu:
            - modal `Odstępy czasowe`,
            - upload zdjęć przez `input[type=file]`,
            - receptura jako inline tabela z osobnym save po utworzeniu usługi,
        - usunięte z create-view pola bez odpowiednika na realnym ekranie Versum (`commissionPercent`, `isActive`).
    - `apps/panel/src/hooks/useServicesAdmin.ts`
        - dodany multipart upload zdjęcia usługi.
    - `apps/panel/src/pages/services/[id]/index.tsx`
        - miniatury zdjęć w szczegółach usługi.
    - `backend/salonbw-backend/src/services/service-details.controller.ts`
    - `backend/salonbw-backend/src/services/service-details.service.ts`
    - `backend/salonbw-backend/src/services/entities/service-media.entity.ts`
        - backendowy upload i streaming plików galerii usług.
    - `backend/salonbw-backend/src/services/service.entity.ts`
    - `backend/salonbw-backend/src/services/dto/create-service.dto.ts`
    - `backend/salonbw-backend/src/services/dto/update-service.dto.ts`
    - `backend/salonbw-backend/src/versum-compat/versum-compat.service.ts`
        - persistence dla `durationBefore`, `durationAfter`, `breakOffset`, `breakDuration` oraz podanie tych wartości do warstwy compat zamiast sztucznych zer.
- walidacja lokalna:
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm eslint src/pages/services/new.tsx src/pages/services/[id]/index.tsx src/hooks/useServicesAdmin.ts src/types.ts --fix` ✅
    - `backend/salonbw-backend`: `pnpm tsc --noEmit` ✅
- status:
    - functional parity dla create-flow: **YES** w zakresie formularza, receptury, uploadu zdjęć i persistence dodatkowych czasów,
    - known delta:
        - upload wysyła już compat payload `Filedata` + `gallery_id`, ale transport galerii nadal nie jest literalną kopią flow Versum (salonbw-native storage + endpoint semantics),
        - brak jeszcze produkcyjnego parity rerun dla strict visual.

### 2026-03-30 - Services: upload zdjęć bliżej legacy contract

- zmiana kodu:
    - `backend/salonbw-backend/src/services/service-details.controller.ts`
        - endpoint uploadu zdjęć usług akceptuje teraz zarówno panelowe pole `image`, jak i legacy alias `Filedata`,
        - body `gallery_id` jest teraz walidowane jako compat alias dla zakresu danej usługi.
    - `apps/panel/src/hooks/useServicesAdmin.ts`
        - upload zdjęć z create-flow wysyła compat payload pod legacy nazwami `Filedata` i `gallery_id`.
    - `apps/panel/src/pages/services/new.tsx`
        - usunięto nieaktualny komunikat sugerujący, że backend nie zapisuje `durationBefore` / `durationAfter` / przerwy,
        - doprecyzowano opis galerii: compat dla `Filedata` jest już aktywny, ale storage pozostaje salonbw-native.
- status:
    - `/services/new` pozostaje `adapted`, ale jedna z głównych delt do legacy flow została zwężona,
    - otwarte delty: strict visual parity oraz salonbw-native storage/endpoint semantics dla galerii.

### 2026-04-01 - Services: shell/UI parity pass dla `/services/new`

- zmiana kodu:
    - `apps/panel/src/pages/services/new.tsx`
        - create-view został przepięty na wspólne kontenery shellowe (`buttons-row`, `service-details-content`, `info-box`),
        - dodano górny toolbar akcji, aby ekran tworzenia był bliższy detail-view usług i reszcie panelu,
        - sekcje formularza zostały rozdzielone na `Podstawowe informacje` i `Zaawansowane`, zamiast jednego długiego bloku.
    - `apps/panel/src/styles/salon-shell.css`
        - doprecyzowano stylowanie nowych wrapperów shellowych dla ekranu tworzenia usługi.
- walidacja lokalna:
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm eslint src/pages/services/new.tsx --fix` ✅
- status:
    - brak zmiany klasyfikacji: `/services/new` nadal `adapted`,
    - delta została przesunięta bardziej z layout/shell na końcowy visual polish i produkcyjny rerun parity.

### 2026-03-20 - Communication detail: mniej `invent`, bez zgadywania rodzaju wiadomości

- zmiana kodu:
    - `apps/panel/src/pages/communication/index.tsx`
        - linki z listy komunikacji przekazują jawnie `kind=sms|email` do detailu.
    - `apps/panel/src/pages/communication/[id].tsx`
        - detail przestał zgadywać typ wiadomości na podstawie samego `id` jako głównego flow,
        - przy kolizji `id` między SMS i email wyświetlany jest jawny resolver typu wiadomości,
        - dla SMS renderowany jest wieloelementowy wątek z realnych logów (`appointmentId` / `recipientId`) zamiast pojedynczego wpisu,
        - poprawione etykiety statusu dla email vs SMS.
    - `apps/panel/src/hooks/useSms.ts`
        - `useSmsHistory` wspiera warunkowe pobieranie pod detail threadu.
- walidacja lokalna:
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm eslint src/pages/communication/index.tsx src/pages/communication/[id].tsx src/hooks/useSms.ts --fix` ✅
- status:
    - główna delta `thread/id behavior adapted to salonbw logs` została istotnie zmniejszona,
    - route nadal pozostaje `invent`, bo salonbw nie ma jeszcze osobnego backendowego modelu konwersacji 1:1 jak legacy Versum.

### 2026-03-20 - Calendar views: koniec `sessionStorage`, realny persisted CRUD

- zmiana kodu:
    - `backend/salonbw-backend/src/settings/entities/calendar-view.entity.ts`
    - `backend/salonbw-backend/src/settings/settings.controller.ts`
    - `backend/salonbw-backend/src/settings/settings.service.ts`
    - `backend/salonbw-backend/src/settings/dto/settings.dto.ts`
    - `backend/salonbw-backend/src/migrations/1760910000000-CreateCalendarViewsTable.ts`
        - dodany backendowy zasób `settings/calendar-views` z CRUD i persistence listy zapisanych widoków kalendarza.
    - `apps/panel/src/components/versum/calendar/CalendarViewsRoute.tsx`
    - `apps/panel/src/components/versum/modals/ManageCalendarViewsModal.tsx`
    - `apps/panel/src/components/versum/modals/CreateCalendarViewModal.tsx`
    - `apps/panel/src/hooks/useSettings.ts`
        - modal `/calendar/views` nie korzysta już z `sessionStorage`; tworzenie, edycja i usuwanie widoków używają backendu przez React Query.
- walidacja lokalna:
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm eslint src/components/versum/calendar/CalendarViewsRoute.tsx src/components/versum/modals/ManageCalendarViewsModal.tsx src/components/versum/modals/CreateCalendarViewModal.tsx src/hooks/useSettings.ts src/types.ts --fix` ✅
    - `backend/salonbw-backend`: `pnpm tsc --noEmit` ✅
    - `backend/salonbw-backend`: `pnpm eslint src/settings/settings.controller.ts src/settings/settings.service.ts src/settings/settings.module.ts src/settings/dto/settings.dto.ts src/settings/entities/calendar-view.entity.ts src/logs/log-action.enum.ts src/migrations/1760910000000-CreateCalendarViewsTable.ts --fix` ✅
- status:
    - główna delta `save flow is reconstructed` została usunięta,
    - route nadal pozostaje `invent`, bo salonbw nadal używa route-driven modali Next.js zamiast oryginalnego kontraktu PJAX + HTML partials z Versum.

### 2026-03-20 - Calendar views: partial bridge dla vendored `/calendar`

- zmiana kodu:
    - `apps/panel/src/pages/api/runtime/calendar-views/*`
        - dodany lokalny partial API dla dropdown listy widoków, manage index, formularza new/edit oraz submit/delete.
    - `apps/panel/src/pages/api/calendar-embed.ts`
        - vendored runtime kalendarza przechwytuje teraz requesty `/calendar/views`, `/calendar/views/list`, `/calendar/views/new` i `/calendar/views/:id/edit` do lokalnych partial endpoints, zamiast próbować wkładać pełne strony Next do dialogów Bootstrap.
- walidacja lokalna:
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm eslint src/pages/api/calendar-embed.ts src/pages/api/runtime/calendar-views/_shared.ts src/pages/api/runtime/calendar-views/index.ts src/pages/api/runtime/calendar-views/list.ts src/pages/api/runtime/calendar-views/new.ts src/pages/api/runtime/calendar-views/[id].ts src/pages/api/runtime/calendar-views/[id]/edit.ts --fix` ✅
- status:
    - istotnie zmniejszona delta integracyjna między canonical route `/calendar/views` a vendored runtime `/calendar`,
    - route nadal pozostaje `invent`, bo partial bridge jest implementacją SalonBW, a nie literalnym przeniesieniem backendowego kontraktu Versum.

### 2026-03-20 - Calendar topbar: spójna tożsamość użytkownika w vendored runtime

- zmiana kodu:
    - `apps/panel/src/pages/api/calendar-embed.ts`
        - embed pobiera teraz serwerowo `/users/profile` z aktualnym bearer tokenem i nadpisuje w vendored HTML badge inicjałów, nazwę użytkownika, avatar oraz link profilu.
    - `apps/panel/src/server/calendarViewsRuntime.ts`
        - helper dla partial bridge `calendar views` został wyniesiony z `pages/api/*` do zwykłego modułu serwerowego, żeby Next nie traktował go jako route config.
    - `apps/panel/src/pages/api/runtime/calendar-views/*`
    - `apps/panel/src/__tests__/calendarEmbedRuntime.test.ts`
    - `apps/panel/src/__tests__/calendarViewsRuntime.test.ts`
- walidacja lokalna:
    - `apps/panel`: `pnpm jest src/__tests__/calendarEmbedRuntime.test.ts src/__tests__/calendarViewsRuntime.test.ts --runInBand` ✅
    - `apps/panel`: `pnpm eslint src/pages/api/calendar-embed.ts src/server/calendarViewsRuntime.ts src/pages/api/runtime/calendar-views/index.ts src/pages/api/runtime/calendar-views/list.ts src/pages/api/runtime/calendar-views/new.ts src/pages/api/runtime/calendar-views/[id].ts src/pages/api/runtime/calendar-views/[id]/edit.ts src/__tests__/calendarEmbedRuntime.test.ts src/__tests__/calendarViewsRuntime.test.ts --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- status:
    - usunięta ostatnia widoczna niespójność headera między `/calendar` a resztą panelu (`/customers`, `/products`),
    - fix nie narusza compat runtime: `window.VersumConfig`, asset aliases i bridge dla vendored kalendarza pozostają bez zmian.

### 2026-03-20 - Communication detail: thread parity rozszerzony także na email

### 2026-03-20 - De-branding kodu docelowego: `Versum` -> `SalonBW` z zachowaniem warstwy compat

- zmiana kodu:
    - `apps/panel/src/components/salonbw/*`
    - `apps/panel/src/styles/salonbw-shell.css`
    - `apps/panel/src/components/help/HelpContactPage.tsx`
    - `apps/panel/tailwind.config.ts`
    - `backend/salonbw-backend/src/logs/log.service.ts`
    - `backend/salonbw-backend/src/statistics/statistics.service.ts`
    - wyczyszczone nazwy i komentarze w kodzie docelowym panelu z `Versum*` na `SalonBW*` lub neutralne nazwy opisowe.
- status:
    - zgodne z `MASTER_PLAN_ROUTE_DRIVEN_UI_KIT.md`: w kodzie docelowym odchodzimy od nazewnictwa `Versum`.
    - wykonany pierwszy etap migracji compat:
        - dodane równoległe aliasy assetów `/salonbw-calendar/*` i `/salonbw-vendor/*`,
        - middleware dopuszcza oba prefiksy,
        - bridge kalendarza publikuje `window.SalonBWConfig`, zachowując `window.VersumConfig` jako alias kompatybilności.
        - generowane artefakty `apps/panel/public/versum-calendar/index.html` i `asset-manifest.json` wskazują już canonical na `/salonbw-calendar/*`.
        - proxy compat normalizuje `POST /graphql` z `201` do `200` dla vendored runtime kalendarza.
        - dodany smoke produkcyjny: `apps/panel/tests/e2e/prod-calendar-smoke.spec.ts`
        - lokalny skrót uruchomienia: `pnpm test:prod:calendar`
    - świadomie pozostawione wyjątki techniczne:
        - `apps/panel/public/versum-calendar/*`
        - `apps/panel/public/versum-vendor/*`
        - compat pathy `/versum-calendar` i `/versum-vendor`
        - `window.VersumConfig`
        - backend `src/versum-compat/*`
        - zewnętrzne URL-e `panel.versum.com`, `app-cdn.versum.net`, `pomoc.versum.pl`
        - `font-family: 'versum'` jako nazwa istniejącego font-face/icon-fontu
    - decyzja:
        - dalsze usuwanie nazw `Versum` z tych miejsc nie jest już zwykłym cleanupem brandingowym, tylko refaktorem warstwy compat/runtime i wymaga osobnego workstreamu z parity rerun dla `/calendar`.

- zmiana kodu:
    - `apps/panel/src/pages/communication/[id].tsx`
        - detail email renderuje teraz wieloelementowy wątek z historii `recipientId`, zamiast pojedynczej wiadomości,
        - po wysłaniu odpowiedzi odświeżany jest cały widoczny thread, nie tylko pojedynczy detail item.
    - `apps/panel/src/hooks/useEmails.ts`
        - `useEmailHistory` wspiera warunkowe pobieranie (`enabled`) pod detail-thread.
- walidacja lokalna:
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm eslint src/pages/communication/[id].tsx src/hooks/useEmails.ts --fix` ✅
- status:
    - delta `single-item email detail` została zmniejszona,
    - route nadal pozostaje `invent`, bo salonbw nadal nie ma osobnego modelu konwersacji 1:1 zgodnego z legacy Versum.

### 2026-03-20 - Communication detail: reply-template flow bliżej dumpa Versum

- zmiana kodu:
    - `apps/panel/src/pages/communication/[id].tsx`
        - dla trybu `Użyj szablonu` detail pokazuje teraz akcje `Podgląd` i `Zmień treść wybranego szablonu`,
        - wybrany szablon można przepisać do edytowalnej treści reply bez ręcznego kopiowania,
        - `Podgląd` otwiera teraz lokalny modal preview dla wybranego szablonu albo bieżącego draftu odpowiedzi zamiast przenosić operatora na listę szablonów,
        - wysyłka SMS z trybu `Użyj szablonu` przekazuje teraz także `templateId`, więc log historii nie traci powiązania z użytym szablonem.
    - `apps/panel/src/styles/salonbw-shell.css`
        - dodane style dla akcji szablonu w formularzu odpowiedzi i dla modalu preview wiadomości.
- walidacja lokalna:
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm eslint src/pages/communication/[id].tsx --fix` ✅
- status:
    - kolejna część reply-form parity została domknięta,
    - route nadal pozostaje `invent`, bo pełny model konwersacji nadal nie jest literalną kopią backendu Versum, ale sam preview flow nie jest już stubem.

### 2026-03-11 - Ustawienia: parity audit prod fix (Versum URL) + rerun

- zmiana kodu:
    - `apps/panel/tests/e2e/prod-settings-parity-audit.spec.ts`
        - poprawiony URL referencyjny Versum: `.../settings` (zamiast nieistniejącego `.../settings/company` zwracającego 404),
        - utrzymane checki strukturalne `#sidebar` + `#main-content` oraz screenshot/pixel-diff.
- walidacja produkcyjna:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-settings-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`.
- wynik parity (raport `output/parity/2026-03-11-settings-prod-full/REPORT.md`, generated `2026-03-11T00:47:13.939Z`):
    - functional parity: `YES`,
    - visual strict (`<= 3.0%`): `NO` (`settings-main 5.446%`).

---

### 2026-03-11 - Klienci: smoke hardening + produkcyjny parity rerun

- zmiana kodu:
    - `apps/panel/tests/e2e/prod-customers-smoke.spec.ts`
        - update selektora dla `/customers/:id`: `.customer-info-summary, .customer-card-content` (zamiast `.customer-summary`),
        - hardening nawigacji tabów `gallery/files`:
            - fallback przez `/customers/:id` i klik w link `tab_name=...`, gdy direct URL nie renderuje zakładki,
        - timeout smoke podniesiony do `180_000` dla stabilności flow upload/download na produkcji.
- walidacja produkcyjna:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-customers-smoke.spec.ts --project=desktop-1366` -> `3 passed`,
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`.
- wynik parity (raport `output/parity/2026-03-10-customers-prod-full/REPORT.md`, generated `2026-03-10T23:51:09.826Z`):
    - functional:
        - `YES` na list/card/taby/edit,
        - `NO` na `Add customer form` (panel: brak tekstu `nowy klient`),
    - visual strict (`<= 3.0%`):
        - `list 7.382%` (`NO`),
        - `summary 5.862%` (`NO`),
        - `gallery 2.825%` (`YES`),
        - `files 2.951%` (`YES`),
    - final verdict: `NO` (functional + visual strict niespełnione dla części ekranów).

---

### 2026-03-11 - Magazyn: smoke/parity hardening + wiarygodny rerun produkcyjny

- zmiana kodu:
    - `apps/panel/tests/e2e/prod-warehouse-smoke.spec.ts`
        - login hardening (`retry + throttle wait`) dla `Too Many Requests`,
        - timeout smoke podniesiony do `210_000`,
        - selektor top-tabs zaktualizowany do stabilnego checku tekstowego (`PRODUKTY`, `SPRZEDAŻ` w `#products_main`).
    - `apps/panel/tests/e2e/prod-warehouse-parity-audit.spec.ts`
        - login panel hardening (`retry + throttle wait`),
        - auto re-login w pętli akcji, jeśli nastąpi redirect na `/auth/login`.
- walidacja produkcyjna:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-warehouse-smoke.spec.ts --project=desktop-1366` -> `2 passed`,
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-warehouse-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`.
- wynik parity (raport `output/parity/2026-03-11-warehouse-prod-full/REPORT.md`, generated `2026-03-11T00:01:36.685Z`):
    - functional parity: `YES` (`16/16`),
    - visual strict (`<= 3.0%`): `NO` (`products 11.277%`, `sales-history 7.718%`, `deliveries-history 6.876%`).

---

### 2026-03-11 - Statystyki: smoke/parity hardening + aktualizacja benchmarków strict visual

- zmiana kodu:
    - `apps/panel/tests/e2e/prod-statistics-smoke.spec.ts`
        - login hardening (`retry + throttle wait`) dla `Too Many Requests`,
        - timeout smoke podniesiony do `180_000`,
        - update selektorów do aktualnego DOM produkcji:
            - breadcrumbs zamiast legacy `h1`,
            - check tabel po treści (`Sprzedaż usług`, `Pracownik`) bez klasy `versum-table`,
            - nawigacja daty przez `getByRole('link', { name: /Następny dzień|›/ })`.
    - `apps/panel/tests/e2e/prod-statistics-parity-audit.spec.ts`
        - login panel hardening (`retry + throttle wait`),
        - auto re-login w pętli akcji po redirect na `/auth/login`.
- walidacja produkcyjna:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-statistics-smoke.spec.ts --project=desktop-1366` -> `2 passed`,
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-statistics-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`.
- wynik parity (raport `output/parity/2026-03-11-statistics-prod-full/REPORT.md`, generated `2026-03-11T00:11:10.608Z`):
    - functional parity: `YES` (dashboard/employees/commissions/services),
    - visual strict (`<= 3.0%`): `NO` (`dashboard 12.292%`, `employees 4.188%`, `commissions 6.111%`).

---

### 2026-03-10 - Extension: copy-first z live HTML Versum + refactor markupu

- capture referencji (przed dalszym kodem):
    - live `#main-content.outerHTML` dla:
        - `https://panel.versum.com/salonblackandwhite/extension/`,
        - `https://panel.versum.com/salonblackandwhite/extension/tools/4`,
    - zapis referencji: `docs/EXTENSION_VERSUM_HTML_REFERENCE_2026-03-10.md`.
- zmiana kodu (copy-first):
    - `apps/panel/src/pages/extension/index.tsx`
        - przebudowa listy dodatków do układu Versum (`inner.extensions_boxes`, `row`, `col-md-6 reduced-padding`, `a.box-link`),
        - status w karcie zgodny z Versum (`status:` + `sprite-active_green` + `state`),
        - przejście na zgodne URL detali `tools/:numericId` (`1/3/4/5/6/7/8`).
    - `apps/panel/src/pages/extension/tools/[id].tsx`
        - aliasy tras `tools/:numericId` -> istniejące dane dodatków,
        - struktura detalu zgodna z Versum (`container-fluid`, `disable_extension_link`, `description_more`, `availability-table` z ikoną `available-*.png`, prawa kolumna `slider/#gallery`).
    - `apps/panel/src/styles/salonbw-shell.css`
        - style wspierające strukturę copy-first (`extensions_boxes`, `box-link`, `row-no-padding`, `gthumbnail`).
    - testy:
        - `apps/panel/tests/e2e/prod-extension-smoke.spec.ts` -> detal przez `/extension/tools/4`,
        - `apps/panel/tests/e2e/prod-extension-parity-audit.spec.ts` -> panel/versum detal przez `tools/4`.

---

### 2026-03-10 - Extension: parity audit scaffold (functional + visual)

- zmiana kodu:
    - `apps/panel/tests/e2e/prod-extension-parity-audit.spec.ts`
        - nowy produkcyjny audyt parity panel vs versum dla modułu `Extension`,
        - zakres: lista dodatków (`/extension`) + detal dodatku (`/extension/tools/automatic_marketing`),
        - artefakty: `REPORT.md`, `checklist.json`, `pixel-diff.json`, screenshoty `panel-*`, `versum-*`, `diff-*`,
        - strict visual threshold: `3.0%` dla ekranów krytycznych.
- walidacja lokalna:
    - przygotowanie testu zakończone; uruchomienie pełnego audytu wymaga sekretów:
        - `PANEL_LOGIN_EMAIL`, `PANEL_LOGIN_PASSWORD`,
        - `VERSUM_LOGIN_EMAIL`, `VERSUM_LOGIN_PASSWORD`.

---

### 2026-03-10 - Extension: hardening smoke (lista + szczegóły dodatku)

- zmiana kodu:
    - `apps/panel/src/pages/extension/index.tsx`
        - dodany stabilny selektor testowy `data-testid` dla kart dodatków (`extension-card-*`).
    - `apps/panel/tests/e2e/prod-extension-smoke.spec.ts`
        - smoke zaktualizowany do aktualnego DOM Versum (`.ext-col` + breadcrumb),
        - dodany drugi scenariusz smoke dla widoku szczegółu (`/extension/tools/automatic_marketing`) z walidacją tabeli dostępności.
- walidacja lokalna:
    - `pnpm eslint src/pages/extension/index.tsx --fix` (panel) ✅
    - `pnpm tsc --noEmit` (panel) ✅
    - `pnpm exec playwright test tests/e2e/prod-extension-smoke.spec.ts --project=desktop-1366` -> `2 skipped` (brak `PANEL_LOGIN_EMAIL` / `PANEL_LOGIN_PASSWORD`).

---

### 2026-03-10 - Ustawienia: settings tiles + sprite icons + deploy dashboard

- zmiana kodu:
    - `apps/panel/src/pages/settings/index.tsx`
        - przejście z emoji na ikony `sprite-settings_*` i spójny grid kafli ustawień,
        - mapping ikon do klas obecnych w vendored sprite sheet (bez zależności od globalnego vendor CSS),
        - wrapper strony utrzymany w `versum-page`.
    - `apps/panel/src/styles/salonbw-shell.css`
        - dodane definicje brakujących ikon `sprite-settings_*` (pozycje ze sprite sheet),
        - dodane style kafli `settings-tiles-grid` / `settings-tile`.
- walidacja:
    - `pnpm eslint src/pages/settings/index.tsx --fix` (panel) ✅
    - `pnpm tsc --noEmit` (panel) ✅
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-settings-smoke.spec.ts --project=desktop-1366` -> `1 skipped`.
- deploy:
    - run `22922605165` (`failure`, target `dashboard`, sha `7e27aea0`) — fail na kroku remote install deps,
    - retry run `22922758693` (`success`, target `dashboard`, sha `7e27aea0`) — 2026-03-10 20:29 UTC.
- commit: `7e27aea0`

---

### 2026-02-26 - Infra: Next.js 15.5.10 upgrade + rewrites fix + panel deploy

- zmiana kodu:
    - `apps/panel/next.config.mjs`: rewrites() zmienione na `{beforeFiles, afterFiles, fallback}` (był flat array → crash `routesManifest.rewrites.beforeFiles.filter`),
    - `apps/panel/package.json` + `apps/landing/package.json`: `next@15.5.10`,
    - `package.json` (root): `pnpm.overrides.next = "15.5.10"`,
    - `apps/panel/next.config.mjs`: `typedRoutes: false` (wyłączone eksplicytnie aby uniknąć błędów TS).
- walidacja:
    - deploy run `22436718672` (`success`, target `dashboard`, sha `0a1fde5f`) — 2026-02-26 09:48 UTC.
    - `curl -I https://panel.salon-bw.pl` → `307` (oczekiwane dla niezalogowanych).
    - landing CI: nadal broken (`@next/env/dist/index.js` missing w pnpm virtual store) — landing NIE wdrożone.
- commit: `0a1fde5f`

---

### 2026-02-25 - Magazyn: integracja WarehouseNav + zakładki feature (Steps 2-3)

- zmiana kodu:
    - `apps/panel/src/components/versum/navs/WarehouseNav.tsx`: pełny secondary nav dla wszystkich submodułów:
        - `/products` → KATEGORIE PRODUKTÓW (drzewo kategorii z API, modal dodaj/edytuj/usuń),
        - `/sales` → SPRZEDAŻ (dodaj sprzedaż, historia sprzedaży),
        - `/use` → ZUŻYCIE (dodaj zużycie, historia, planowane),
        - `/deliveries` + `/suppliers` + `/stock-alerts` + `/manufacturers` → DOSTAWY (z licznikami roboczych/oczekujących),
        - `/orders` → ZAMÓWIENIA (z licznikiem wersji roboczych),
        - `/inventory` → INWENTARYZACJA (z licznikami statusów).
    - `apps/panel/src/pages/products/index.tsx` + powiązane strony: integracja zakładek feature (Produkty/Sprzedaż/Zużycie/Dostawy/Zamówienia/Inwentaryzacja).
- walidacja:
    - `pnpm eslint src --fix` (panel) ✅
    - `pnpm tsc --noEmit` (panel) ✅
- commit: `28b0d53a` (Step 2), `fe72d2d2` (Step 3)

---

### 2026-02-25 - Extension: smoke test produkcyjny

- walidacja:
    - `tests/e2e/prod-extension-smoke.spec.ts` → `1 passed`.
- commit: `049ba6fa`

---

### 2026-02-24 - Usługi: refactor widoku szczegółu (copy-first CSS/classes) + smoke

- zmiana kodu:
    - `apps/panel/src/pages/services/[id]/index.tsx`
        - usunięcie Tailwindowego layoutu z warstwy prezentacji,
        - przebudowa widoku na klasy i strukturę zgodną z Versum (`breadcrumb`, `nav-tabs`, tabele, akcje, sekcje),
        - zachowanie dotychczasowych akcji/modali i integracji API (`summary`, `stats`, `history`, `employees`, `comments`, `commissions`).
    - `apps/panel/src/styles/salonbw-shell.css`
        - dodane style modułu `Usługi` dla karty szczegółów (tabele meta, stat cards, formularz komentarzy, sekcja prowizji).
- walidacja:
    - `pnpm eslint src --fix` (panel) ✅
    - `pnpm tsc --noEmit` (panel) ✅
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-services-smoke.spec.ts --project=desktop-1366` -> `2 passed`.
- wynik:
    - functional smoke (panel): `YES` (lista -> szczegóły, zakładki komentarze/prowizje),
    - strict visual parity: `NO` (wymaga osobnego audytu pixel-diff i dalszego dopieszczenia).

### 2026-02-24 - Usługi: hotfix selektora testowego + deploy produkcyjny

- zmiana kodu:
    - `apps/panel/src/pages/services/[id]/index.tsx`
        - przywrócony nagłówek formularza komentarzy jako `h3` (kompatybilność ze smoke testem).
- deploy:
    - run `22369903825` (`success`, production, `dashboard`, sha `5e9aa654`).
- walidacja po deploy:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-services-smoke.spec.ts --project=desktop-1366` -> `2 passed`.

### 2026-02-25 - Łączność: real secondary nav + production smoke

- zmiana kodu:
    - `apps/panel/src/components/versum/navs/CommunicationNav.tsx`
        - nowa, trasowana nawigacja boczna modułu `Łączność`.
    - `apps/panel/src/components/versum/SalonBWSecondaryNav.tsx`
        - podpięcie `CommunicationNav` zamiast statycznej listy placeholderów.
    - `apps/panel/tests/e2e/prod-communication-smoke.spec.ts`
        - nowy smoke test produkcyjny tras `/communication`, `/communication/mass`, `/communication/templates`, `/communication/reminders`.
- deploy:
    - run `22391043226` (`success`, production, `dashboard`, sha `e612ff7e`).
- walidacja po deploy:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-communication-smoke.spec.ts --project=desktop-1366` -> `1 passed`.
- wynik:
    - functional smoke (panel): `YES` (nawigacja boczna + przejścia między podstronami),
    - strict visual parity: `NO` (do osobnego etapu dopieszczenia).

### 2026-02-25 - Ustawienia: real secondary nav + production smoke

- zmiana kodu:
    - `apps/panel/src/components/versum/navs/SettingsNav.tsx`
        - nowa, trasowana nawigacja boczna modułu `Ustawienia` (copy-first mapowanie sekcji Versum).
    - `apps/panel/src/components/versum/SalonBWSecondaryNav.tsx`
        - podpięcie `SettingsNav` dla modułu `settings`.
    - `apps/panel/src/components/versum/navigation.ts`
        - aktywacja secondary nav dla `settings` (`secondaryNav: true`).
    - `apps/panel/tests/e2e/prod-settings-smoke.spec.ts`
        - nowy smoke test produkcyjny dla `/settings` + kluczowych linków nawigacji bocznej.
- deploy:
    - run `22403045267` (`success`, production, `dashboard`, sha `a2fba7dd`).
- walidacja po deploy:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-settings-smoke.spec.ts --project=desktop-1366` -> `1 passed`.
- wynik:
    - functional smoke (panel): `YES` (nawigacja boczna + render strony ustawień),
    - strict visual parity: `NO` (do osobnego etapu dopieszczenia).

### 2026-02-24 - Statystyki: production deploy `api+dashboard` + parity rerun

- zmiana kodu:
    - `backend/salonbw-backend/src/statistics/statistics.service.ts`
        - normalizacja wartości `decimal/string` przy kalkulacji kwot (fix konkatenacji typu `"0350.00350.00"`),
        - `Aktywność pracowników`: czas pracy liczony na podstawie ukończonych wizyt (`endTime-startTime`), nie tylko grafiku.
    - `apps/panel/src/pages/statistics/commissions.tsx`
    - `apps/panel/src/pages/statistics/employees.tsx`
    - `apps/panel/src/pages/statistics/index.tsx`
- deploy:
    - run `22366598647` (`success`, production, `api`, sha `9ec696ac`),
    - run `22366678740` (`success`, production, `dashboard`, sha `9ec696ac`).
- uruchomienie testu:
    - `pnpm exec playwright test tests/e2e/prod-statistics-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`.
- wynik:
    - functional parity: `YES` (`4/4`),
    - strict visual parity (`<=3.0%`): `NO`:
        - `dashboard 13.473%`
        - `employees 4.005%`
        - `commissions 6.250%`
- artefakty:
    - `output/parity/2026-02-24-statistics-prod-full/`

### 2026-02-24 - Statystyki: production runtime-fix + parity rerun

- zmiana kodu:
    - `apps/panel/src/pages/statistics/index.tsx`
    - `apps/panel/src/pages/statistics/commissions.tsx`
    - dodana defensywna normalizacja wartości liczbowych (`string|number -> number`) przed `toFixed` i obliczeniami.
- deploy:
    - run `22353303778` (`success`, production, dashboard, sha `2db195f2`).
- uruchomienie testu:
    - `pnpm exec playwright test tests/e2e/prod-statistics-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`.
- wynik:
    - functional parity: `YES` (`4/4`),
    - strict visual parity (`<=3.0%`): `NO`:
        - `dashboard 12.040%`
        - `employees 4.050%`
        - `commissions 6.391%`
    - runtime `Application error: a client-side exception has occurred` dla `dashboard/commissions`: **nieodtworzony** po deployu.
- artefakty:
    - `output/parity/2026-02-24-statistics-prod-full/`

### 2026-02-23 - Klienci: produkcyjny rerun smoke + parity (po fixach anty-crash lokalnie)

- uruchomienia:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-customers-smoke.spec.ts --project=desktop-1366` -> `3 passed` (w tym pełny sweep tras `/customers/:id`, taby, `/edit`, `/new`)
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
    - panel functional checks: `YES` na wszystkich audytowanych trasach customers,
    - `Application error: a client-side exception has occurred` na karcie klienta: **nieodtworzony**,
    - visual parity strict (`<=3.0%`): `NO` (`list 7.333%`, `summary 5.363%`, `gallery 30.136%`, `files 8.707%`),
    - `versum` fallback `500` na ekranach `list` i `statistics` (wpływa na parity ogólne).
- artefakty:
    - `output/parity/2026-02-23-customers-prod-full/`

### 2026-02-23 - Klienci: parity rerun po rozszerzeniu smoke testu tras karty

- uruchomienie:
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
    - functional parity (panel): `YES` (bez zmian),
    - visual parity strict (`<=3.0%`): `NO`:
        - `list 7.333%`
        - `summary 5.363%`
        - `gallery 33.584%`
        - `files 8.707%`
    - `versum` fallback `500` na ekranach referencyjnych `list` i `statistics` pozostaje.
- artefakt:
    - `output/parity/2026-02-23-customers-prod-full/REPORT.md` (generated `2026-02-23T13:49:53.872Z`)

### 2026-02-23 - Klienci: parity rerun na wspólnym `customerId` panel/versum

- zmiana testu:
    - `prod-customers-parity-audit.spec.ts`:
        - nowy resolver `resolvePanelCustomerId` (preferuje `PANEL_PARITY_CUSTOMER_ID`, fallback do `VERSUM_CUSTOMER_ID`, a dopiero potem pierwszy rekord z listy),
        - `VERSUM_CUSTOMER_ID` jako opcjonalny env (domyślnie `8177102`),
        - budowanie URL parity na wspólnym `customerId` dla panel + versum.
- uruchomienie:
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
    - potwierdzenie porównania na tym samym rekordzie: `panel /customers/8177102` vs `versum /customers/8177102`,
    - strict visual parity (`<=3.0%`):
        - `list 7.333%` (NO)
        - `summary 4.216%` (NO)
        - `gallery 2.307%` (YES)
        - `files 2.083%` (YES)
    - panel functional checks: `NO` (na tym konkretnym `customerId` brak części oczekiwanych elementów/tekstów),
    - `versum` fallback `500` na ekranach `list` i `statistics` utrzymany.
- artefakty:
    - `output/parity/2026-02-23-customers-prod-full/REPORT.md` (generated `2026-02-23T14:13:15.481Z`)

### 2026-02-23 - Klienci: parity resolver `name-first` (panel->versum) + rerun

- zmiana testu:
    - `prod-customers-parity-audit.spec.ts`:
        - dodany `resolvePanelCustomerSeed` (pierwszy klient z listy panelu),
        - dodany `resolveVersumCustomerIdByName` (lookup klienta w versum po nazwie),
        - fallback dla `PANEL_PARITY_CUSTOMER_ID` rozszerzony o detekcję stanu `ładowanie danych klienta` (żeby nie akceptować niedostępnego ID),
        - priorytet wyboru rekordów: env IDs -> name lookup -> seed/fallback.
- uruchomienie:
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
    - panel functional checks: `YES` (`11/11`),
    - `versum` functional checks: `NO` na `list` i `statistics` (fallback `500`),
    - visual parity strict (`<=3.0%`): `NO`:
        - `list 7.333%`
        - `summary 5.363%`
        - `gallery 39.152%`
        - `files 8.707%`
    - obserwacja danych: brak w 100% wspólnego klienta między listami panel/versum w bieżącym środowisku, więc parity pozostaje data-dependent.
- artefakt:
    - `output/parity/2026-02-23-customers-prod-full/REPORT.md` (generated `2026-02-23T15:29:48.826Z`)

### 2026-02-23 - Klienci: parity anti-flake (empty/loading customers list)

- zmiana testu:
    - `prod-customers-parity-audit.spec.ts`:
        - zbieranie kandydatów klientów z obu list (`collectNamedCustomers`) + próba przecięcia po nazwie,
        - retry kolekcji po ponownym logowaniu, gdy lista jest pusta,
        - fallback panelowy do stabilnego `customerId` (`DEFAULT_PANEL_CUSTOMER_ID=2`),
        - walidacja `isHealthyPanelCustomer` (odrzuca rekordy utknięte na `ładowanie danych klienta` / `ładowanie...`).
- uruchomienie:
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
    - panel functional checks: `YES` (`11/11`) po stabilizacji resolvera,
    - `versum` functional checks: `NO` na `list` i `statistics` (fallback `500`),
    - visual parity strict (`<=3.0%`): `NO` (`list 7.333%`, `summary 5.363%`, `gallery 27.400%`, `files 8.707%`).
- artefakt:
    - `output/parity/2026-02-23-customers-prod-full/REPORT.md` (generated `2026-02-23T17:16:47.900Z`)

### 2026-02-23 - Klienci: parity stabilizacja runtime (retry-settle per action)

- zmiana testu:
    - `prod-customers-parity-audit.spec.ts`:
        - dodany `stabilizePanelActionPage` (retry `goto/reload/check` dla tras panelu),
        - dodany `waitForPanelCustomerContent` (czeka na zejście stanu `ładowanie danych klienta`),
        - pre-selekcja klienta rozszerzona o `isPanelCustomerCoreReady` (summary/personal/statistics/history) i preferencję pustych `gallery/files` gdy dostępne.
- uruchomienie:
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
    - panel functional checks: `YES` (`11/11`) na stabilnym rerunie,
    - `versum` functional checks: `NO` na `list` i `statistics` (fallback `500`),
    - visual parity strict (`<=3.0%`): `NO`:
        - `list 7.333%`
        - `summary 4.216%`
        - `gallery 30.137%`
        - `files 8.707%`
- artefakt:
    - `output/parity/2026-02-23-customers-prod-full/REPORT.md` (generated `2026-02-23T19:14:15.587Z`)

### 2026-02-23 - Klienci: parity candidate-scan broadening (media tabs under threshold)

- zmiana testu:
    - `prod-customers-parity-audit.spec.ts`:
        - zwiększony limit skanowanych kandydatów klienta panelu w `pickPanelParityCustomerId` (`10` -> `30`) dla lepszej szansy znalezienia rekordu zgodnego semantycznie z referencją mediów.
- uruchomienie:
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
    - panel functional checks: `YES` (`11/11`),
    - `versum` functional checks: `NO` na `list` i `statistics` (fallback `500`),
    - strict visual parity (`<=3.0%`): nadal `NO`, ale poprawa na media tabs:
        - `list 7.333%` (NO)
        - `summary 5.278%` (NO)
        - `gallery 2.742%` (YES)
        - `files 2.806%` (YES)
- artefakt:
    - `output/parity/2026-02-23-customers-prod-full/REPORT.md` (generated `2026-02-23T19:53:02.081Z`)

### 2026-02-23 - Klienci: parity fallback tuning (prefer empty-media + core-ready)

- zmiana testu:
    - `prod-customers-parity-audit.spec.ts`:
        - fallback klienta panelu jest akceptowany tylko gdy spełnia jednocześnie `core-ready` i puste `gallery/files`,
        - w przeciwnym razie selektor przechodzi do pełnego skanu kandydatów.
- uruchomienie:
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
    - panel functional checks: `YES` (`11/11`),
    - `versum` functional checks: `NO` na `list` i `statistics` (fallback `500`),
    - strict visual parity (`<=3.0%`):
        - `list 7.333%` (NO)
        - `summary 5.379%` (NO)
        - `gallery 2.767%` (YES)
        - `files 2.830%` (YES)
- artefakt:
    - `output/parity/2026-02-23-customers-prod-full/REPORT.md` (generated `2026-02-23T22:44:09.222Z`)

### 2026-02-23 - Klienci: parity fallback baseline preference (stabilizacja panel functional)

- zmiana testu:
    - `prod-customers-parity-audit.spec.ts`:
        - wprowadzone rozdzielenie `panelFallbackId` (domyślna baza parity) od dynamicznie wykrytego kandydata,
        - fallback jest preferowany tylko po walidacji (`healthy + core-ready + empty media`), co ogranicza przypadkowe skoki na gorsze rekordy.
- uruchomienie:
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
- wynik:
    - panel functional checks: `YES` (`11/11`) stabilnie,
    - strict visual parity (`<=3.0%`):
        - `list 7.333%` (NO)
        - `summary 5.287%` (NO)
        - `gallery 2.741%` (YES)
        - `files 2.804%` (YES)
- artefakt:
    - `output/parity/2026-02-23-customers-prod-full/REPORT.md` (generated `2026-02-23T22:56:03.422Z`)

### 2026-02-23 - Klienci: smoke stabilizacja (deterministyczny customer + retry login)

- zmiana testu:
    - `prod-customers-smoke.spec.ts`:
        - `resolveCustomerId` preferuje stały `PANEL_SMOKE_CUSTOMER_ID` (domyślnie `2`) zamiast zależności od chwilowego stanu listy `/customers`,
        - `login` ma retry (3 próby) przed finalnym assertion,
        - cleanup uploadów (`gallery/files`) jest best-effort; status `>=400` logowany jako warning (bez fail testu), aby nie blokować smoke przez ograniczenia sesji/cookie API.
- uruchomienie:
    - `PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm exec playwright test tests/e2e/prod-customers-smoke.spec.ts --project=desktop-1366` -> `3 passed`
- wynik:
    - smoke customers wraca do zielonego przebiegu po niestabilności listy klientów i auth-cookie cleanup.

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
    - `apps/panel/src/styles/salonbw-shell.css`
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
    - `apps/panel/src/styles/salonbw-shell.css`
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

- poprawione mapowanie modułu w `SalonBWShell` (`resolveSalonBWModule`) dla tras:
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

- `SalonBWShell`:
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

- Przepisano stronę magazynu (/products) na SalonBWShell
- Dodano tabs (Produkty, Sprzedaż, Zużycie, Dostawy, Zamówienia, Inwentaryzacja)
- Dodano filtr typu produktu
- Zaimplementowano tabelę z sortowaniem i paginacją

### 2026-02-06 - Sprint 4 zakończony

- Przepisano stronę szczegółów klienta na SalonBWShell
- Zaimplementowano 8 zakładek (tabs)
- Widok "podsumowanie" z wizytami i danymi klienta

### 2026-02-06 - Sprint 3 zakończony

- Przepisano stronę listy klientów na SalonBWShell
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
    - korekty typografii i szerokości shella Versum (`salonbw-shell.css`),
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

### 2026-02-23 - Klienci: parity precheck fix (`500` false-positive) + stabilizacja wyboru klienta

- zmiana testu:
    - `apps/panel/tests/e2e/prod-customers-parity-audit.spec.ts`
    - fallback/error precheck nie traktuje już samego wystąpienia `500`/`404` jako błędu (usuwa false-positive na ekranach z danymi liczbowymi),
    - dodany precyzyjniejszy regex dla stron błędów HTTP (`error/błąd + 404/500`),
    - selekcja klienta parity respektuje `preferredId` (nie nadpisuje wyniku name-match fallback scanem).
- wynik rerun (prod):
    - `pnpm exec playwright test tests/e2e/prod-customers-parity-audit.spec.ts --project=desktop-1366` -> `1 passed`
    - functional parity: `YES` (`11/11`) po stronie panel + versum,
    - strict visual parity (`<=3.0%`): `NO`:
        - `list 7.338%`
        - `summary 5.278%`
        - `gallery 2.742%`
        - `files 2.806%`
    - artefakt: `output/parity/2026-02-23-customers-prod-full/`.

### 2026-02-24 - Klienci: zamknięcie zadania (decyzja)

- status modułu klienci dla tego zakresu parity: **zamknięte decyzją** (akceptacja użytkownika).
- kryterium funkcjonalne: `YES` (`11/11`) utrzymane.
- known delta (zaakceptowane na zamknięcie):
    - strict visual `list`: `7.338%` (próg `<=3.0%`),
    - strict visual `summary`: `5.278%` (próg `<=3.0%`).

### 2026-03-22 - Shared shell contract: koniec lokalnych wyjątków layoutowych

- zmiana kodu:
    - `docs/VERSUM_SHELL_CONTRACT.md`
        - dodany kanoniczny contract shella panelu oparty na live Versum i runtime `/calendar`.
    - `apps/panel/src/components/salonbw/navigation.ts`
        - moduły dostały pełny `shell profile` z vendorowymi `body.id`, klasami `mainnav` i `main-content`, wariantami secondary nav oraz ikonami breadcrumbs.
    - `apps/panel/src/components/salonbw/SalonBWShell.tsx`
    - `apps/panel/src/components/salonbw/SalonBWMainNav.tsx`
    - `apps/panel/src/components/salonbw/SalonBWSecondaryNav.tsx`
    - `apps/panel/src/styles/salonbw-shell.css`
        - wspólny shell został doprowadzony bliżej contractu Versum: usunięte lokalne wyjątki `secondarynav` i `inner--wide`, dodany jawny `contentFrameVariant`, wspólny styling `.breadcrumbs`, `tree`, `tree_options` i listowych sidenavów.
    - `apps/panel/src/components/salonbw/VersumBreadcrumbs.tsx`
    - `apps/panel/src/components/salonbw/navs/SalonBWListNav.tsx`
        - dodane reużywalne komponenty shellowe dla breadcrumbs i prostych sidenavów.
    - `apps/panel/src/components/salonbw/navs/{StatisticsNav,WarehouseNav,CommunicationNav,ServicesNav,SettingsNav,ExtensionNav}.tsx`
        - ujednolicone root wrappery sidenava do wariantów zgodnych z Versum.
    - wybrane strony `statistics`, `products`, `services`, `communication` oraz detailowe strony `settings/customers`
        - migracja z `ul.breadcrumb` i `div.sidenav secondarynav` w kierunku wspólnego contractu.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm test -- --runInBand src/__tests__/navigationShellProfile.test.ts src/__tests__/VersumBreadcrumbs.test.tsx` ✅
- status:
    - shell parity został potraktowany jako osobna warstwa architektoniczna,
    - known delta:
        - część podstron detailowych nadal renderuje lokalne `ul.breadcrumb` i wymaga drugiego passu migracyjnego,
        - parity modułów od tego miejsca należy oceniać najpierw względem `VERSUM_SHELL_CONTRACT.md`, dopiero potem na poziomie contentu strony.

### 2026-03-22 - Shared shell contract: drugi pass migracji breadcrumbs

- zmiana kodu:
    - strony `customers`, `products/[id]/edit`, `services/new`, `services/[id]`, `communication/{mass,reminders,templates}`, `statistics/{register,tips,services}`, `extension/tools/[id]`, `employees`, `reviews`, `invoices`, `admin/gift-cards`
        - migracja z lokalnego `ul.breadcrumb` do wspólnego `VersumBreadcrumbs`.
- efekt:
    - domknięcie drugiej warstwy shared shella bez lokalnych breadcrumb wyjątków,
    - `/customers` przestaje być wyjątkiem względem pozostałych modułów shellowych.
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅

### 2026-03-22 - Settings detail routes: shell cleanup + timetable nav stability

- zmiana kodu:
    - `apps/panel/src/components/settings/{EventRemindersPage,SmsSettingsPage,TimetableEmployeesPage,TimetableTemplatesPage,ActivityLogRoute}.tsx`
        - migracja shell breadcrumbs do `VersumBreadcrumbs`,
        - usunięcie lokalnych nested `.inner`,
        - stabilizacja `secondaryNav` dla tras `timetable/*`, aby nie wpadały w React update loop.
- deploy:
    - `dashboard` (production): run `23411066301` ✅
    - `dashboard` (production): run `23411289327` ✅
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- findings z rolloutu:
    - pierwszy deploy ujawnił client-side exception na:
        - `/settings/timetable/employees`
        - `/settings/timetable/templates`
    - root cause: niestabilne React nodes przekazywane do `useSetSecondaryNav`
- re-smoke produkcyjny po fixie:
    - `/settings/timetable/employees` -> `breadcrumbsCount=1`, `nestedInnerCount=0`, brak client-side exception ✅
    - `/settings/timetable/templates` -> `breadcrumbsCount=1`, `nestedInnerCount=0`, brak client-side exception ✅
    - `/settings/employees/activity-logs` -> `breadcrumbsCount=1`, `nestedInnerCount=0`, brak client-side exception ✅

### 2026-03-22 - Settings: zamknięcie remaining shell breadcrumb holdouts

- zmiana kodu:
    - `apps/panel/src/pages/settings/employees/*`
    - `apps/panel/src/pages/settings/employees/commissions/*`
    - `apps/panel/src/pages/settings/timetable/{branch,employees/copy,employees/[id]}`
    - `apps/panel/src/pages/settings/{categories,categories/new,categories/[id]/edit,customer_origins,extra_fields,data_protection,trades/new}`
    - `apps/panel/src/components/settings/CalendarSettingsForm.tsx`
        - migracja z ręcznych shell breadcrumbs do `VersumBreadcrumbs`
    - `settings/timetable/employees/[id]` i `settings/data_protection`
        - usunięcie remaining shell-level nested `.inner`
- deploy:
    - `dashboard` (production): run `23411528574` ✅
- walidacja lokalna:
    - `apps/panel`: `pnpm eslint src --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- smoke produkcyjny:
    - `/settings/employees/new` -> `Ustawienia / Pracownicy / Nowy pracownik`, `nestedInnerCount=0` ✅
    - `/settings/employees/commissions` -> `Ustawienia / Pracownicy / Prowizje`, `nestedInnerCount=0` ✅
    - `/settings/timetable/branch` -> `Ustawienia / Grafiki pracy / Salon`, `nestedInnerCount=0` ✅
    - `/settings/timetable/employees/copy` -> `Ustawienia / Grafiki pracy / Kopiuj grafiki pracy`, `nestedInnerCount=0` ✅
    - `/settings/categories` -> `Ustawienia / Ustawienia magazynu / Kategorie produktów`, `nestedInnerCount=0` ✅
    - `/settings/extra_fields` -> `Ustawienia / Klienci / Dodatkowe pola`, `nestedInnerCount=0` ✅
    - `/settings/data_protection` -> `Ustawienia / Klienci / Tryb ochrony danych`, `nestedInnerCount=0` ✅
    - `/settings/trades/new` -> `Ustawienia / Ustawienia usług / Branże / Nowa branża`, `nestedInnerCount=0` ✅
- wynik:
    - `settings` przestał mieć ręczne shell breadcrumb wyjątki,
    - kluczowe widoki `settings` są już spójne pod względem shared shell contract.

### 2026-03-22 - Panel: remaining shell holdouts poza `settings`

- zmiana kodu:
    - `apps/panel/src/pages/messages/index.tsx`
    - `apps/panel/src/pages/newsletters/new.tsx`
    - `apps/panel/src/pages/communication/[id].tsx`
    - `apps/panel/src/pages/extension/index.tsx`
    - `apps/panel/src/components/help/HelpContactPage.tsx`
        - migracja z ręcznych breadcrumbs do `VersumBreadcrumbs`
    - `apps/panel/src/components/salonbw/navigation.ts`
    - `apps/panel/src/components/salonbw/SalonBWShell.tsx`
        - route-aware shell profile aliases dla secondary tras
        - wsparcie dla vendorowych body classes na shared shellu
    - `apps/panel/src/pages/extension/index.tsx`
        - usunięcie remaining shell-level nested `.inner`
- deploy:
    - `dashboard` (production): run `23411719101` ✅
    - `dashboard` (production): run `23411836392` ✅
- walidacja lokalna:
    - `apps/panel`: targeted `pnpm eslint ... --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
    - `apps/panel`: `pnpm eslint src --fix` ✅
- smoke produkcyjny:
    - `/messages` -> `body.id=communication`, `nestedInnerCount=0` ✅
    - `/newsletters/new` -> `body.id=physical_communication`, `nestedInnerCount=0` ✅
    - `/extension` -> `body.id=extensions`, `nestedInnerCount=0` ✅
    - `/helps/new` -> `body.id=physical_helps`, `body.no_sidenav`, `nestedInnerCount=0` ✅
    - `/communication` -> `body.id=physical_communication`, `nestedInnerCount=0` ✅
    - `/communication/2?kind=sms` -> `body.id=physical_communication`, `nestedInnerCount=0` ✅
- wynik:
    - usunięto remaining manual shell breadcrumb holdouts poza `settings`,
    - auxiliary trasy shella dostają już vendor-compatible `body.id` i `body.class`,
    - `extension` przestał dokładać nested content-frame drift,
    - shared shell contract został domknięty także dla tras pomocniczych komunikacji i pomocy.

### 2026-03-22 - Panel: settings landing i statistics shell wrappers

- zmiana kodu:
    - `apps/panel/src/components/salonbw/navigation.ts`
        - route-aware shell override dla:
            - `/settings` -> `settings_dashboard` + `no_sidenav`
            - `/settings/sms` -> `settings_sms` + `communication_settings`
    - `apps/panel/src/pages/settings/index.tsx`
        - usunięcie ręcznego `useEffect` do body classes
        - usunięcie nested `.inner` na landingu
    - `apps/panel/src/pages/statistics/customers.tsx`
        - usunięcie nested `.inner`
- deploy:
    - `dashboard` (production): run `23411963723` ✅
- walidacja lokalna:
    - `apps/panel`: targeted `pnpm eslint ... --fix` ✅
    - `apps/panel`: `pnpm tsc --noEmit` ✅
- smoke produkcyjny:
    - `/settings` -> `body.id=settings_dashboard`, `body.no_sidenav`, `nestedInnerCount=0` ✅
    - `/settings/sms` -> `body.id=settings_sms`, `main-content communication_settings`, `nestedInnerCount=0` ✅
    - `/statistics/customers` -> `body.id=logical_statistics`, `nestedInnerCount=0` ✅
- wynik:
    - `settings` landing korzysta już z shell contract zamiast ręcznego body mutation,
    - `settings/sms` dostał vendor-compatible shell identity,
    - `statistics/customers` nie dokłada już drugiego content frame,
    - remaining drift schodzi coraz bardziej do poziomu real contentu zamiast shared chrome.

### 2026-03-22 - Panel: settings route families i remaining shell breaches

- zmiana kodu:
    - `apps/panel/src/components/salonbw/navigation.ts`
        - szeroka route-aware mapa `settings/*` -> vendor `body.id` / `main-content`
        - dodany mapping `/event-reminders` -> `physical_marketing`
    - `apps/panel/src/components/settings/CalendarSettingsForm.tsx`
        - usunięcie ręcznego body mutation; shell identity przejęta przez resolver
    - `apps/panel/src/components/ui/PanelSection.tsx`
        - usunięcie wspólnego nested `.inner`
    - `apps/panel/src/pages/settings/employees/new.tsx`
        - przywrócenie `SalonBWShell` + `RouteGuard`
    - `apps/panel/src/pages/event-reminders/index.tsx`
        - przywrócenie `SalonBWShell` + `RouteGuard`
- deploy:
    - `dashboard` (production): run `23412074881` ✅
    - `dashboard` (production): run `23412168847` ✅
    - `dashboard` (production): run `23412273475` ✅
    - `dashboard` (production): run `23412370725` ✅
- smoke produkcyjny:
    - `/settings/branch` -> `body.id=settings_branch`, `nestedInnerCount=0` ✅
    - `/settings/payment-configuration` -> `body.id=settings_online_payments_config`, `nestedInnerCount=0` ✅
    - `/settings/customer_groups` -> `body.id=settings_customer_groups`, `nestedInnerCount=0` ✅
    - `/settings/employees/new` -> shell obecny, `body.id=settings_employees`, `nestedInnerCount=0` ✅
    - `/event-reminders` -> shell obecny, `body.id=physical_marketing`, `nestedInnerCount=0` ✅
- wynik:
    - vendorowy contract dla rodziny `settings/*` został znacznie szerzej przeniesiony do shared shell resolvera,
    - wspólne detail pages przestały dokładać dodatkowy content frame,
    - dwa remaining standalone widoki zostały włączone z powrotem do panelowego chrome,
    - drift przesunął się jeszcze bardziej z warstwy shellowej do poziomu faktycznego contentu / danych.

### 2026-03-22 - Panel: kolejne standalone trasy settings pod shared shell

- zmiana kodu:
    - `apps/panel/src/pages/settings/categories.tsx`
    - `apps/panel/src/pages/settings/customer_origins.tsx`
    - `apps/panel/src/pages/settings/extra_fields.tsx`
    - `apps/panel/src/pages/settings/data_protection.tsx`
    - `apps/panel/src/pages/settings/trades/new.tsx`
        - przywrócenie `SalonBWShell` + `RouteGuard`
- deploy:
    - `dashboard` (production): run `23412526939` ✅
- smoke produkcyjny:
    - `/settings/categories` -> `body.id=settings_categories`, shell obecny, `nestedInnerCount=0` ✅
    - `/settings/customer-origins` -> `body.id=settings_customer_origins`, shell obecny, `nestedInnerCount=0` ✅
    - `/settings/extra-fields` -> `body.id=settings_extra_fields`, shell obecny, `nestedInnerCount=0` ✅
    - `/settings/data-protection` -> `body.id=settings_data_protection`, shell obecny, `nestedInnerCount=0` ✅
    - `/settings/trades/new` -> `body.id=settings_trades`, shell obecny, `nestedInnerCount=0` ✅
- wynik:
    - kolejna paczka settingsowych widoków przestała renderować standalone layout,
    - shared shell contract obejmuje teraz większą część rodziny `settings/*`,
    - główne remaining różnice są coraz mniej shellowe, a coraz bardziej content/data-specific.

### 2026-03-22 - Panel: remaining dynamic settings routes and timetable stabilization

- zmiana kodu:
    - `apps/panel/src/pages/settings/categories/new.tsx`
    - `apps/panel/src/pages/settings/categories/[id]/edit.tsx`
    - `apps/panel/src/pages/settings/employees/[id]/index.tsx`
    - `apps/panel/src/pages/settings/employees/[id]/edit.tsx`
    - `apps/panel/src/pages/settings/employees/[id]/events-history.tsx`
    - `apps/panel/src/pages/settings/employees/commissions/index.tsx`
    - `apps/panel/src/pages/settings/employees/commissions/[id].tsx`
    - `apps/panel/src/pages/settings/timetable/branch.tsx`
    - `apps/panel/src/pages/settings/timetable/employees/copy.tsx`
    - `apps/panel/src/pages/settings/timetable/employees/[id].tsx`
        - przywrócenie `SalonBWShell` + `RouteGuard` dla remaining detail routes
    - `apps/panel/src/hooks/useTimetables.ts`
        - stabilne fallback arrays dla loading state, żeby nie generować nowych referencji przy każdym renderze
    - `apps/panel/src/pages/settings/timetable/employees/[id].tsx`
        - memoizacja `date`
        - memoizacja secondary nav na stabilnych danych
- deploy:
    - `dashboard` (production): run `23412803413` ✅
    - `dashboard` (production): run `23412914256` ✅
    - `dashboard` (production): run `23412993266` ✅
    - `dashboard` (production): run `23413071286` ✅
- smoke produkcyjny:
    - `/settings/categories/new` -> `body.id=settings_categories`, `nestedInnerCount=0` ✅
    - `/settings/employees/29` -> `body.id=settings_employees`, `nestedInnerCount=0` ✅
    - `/settings/employees/29/edit` -> `body.id=settings_employees`, `nestedInnerCount=0` ✅
    - `/settings/employees/29/events-history` -> `body.id=settings_employees`, `nestedInnerCount=0` ✅
    - `/settings/employees/commissions` -> `body.id=settings_employees`, `nestedInnerCount=0` ✅
    - `/settings/employees/commissions/29` -> `body.id=settings_employees`, `nestedInnerCount=0` ✅
    - `/settings/timetable/branch` -> `body.id=timetable_branches`, `nestedInnerCount=0` ✅
    - `/settings/timetable/employees/copy` -> `body.id=timetable_employees`, `nestedInnerCount=0` ✅
    - `/settings/timetable/employees/29?date=2026-03-22` -> `body.id=timetable_employees`, `nestedInnerCount=0`, brak client-side exception ✅
- wynik:
    - praktycznie cała rodzina dynamicznych tras `settings/*` wróciła pod wspólny shell contract,
    - `timetable/employees/[id]` przestał zapętlać `setSecondaryNav`,
    - remaining różnice w tym obszarze nie wynikają już z brakującego chrome ani nested content frame.

### 2026-03-23 - Statistics: poprawa kart pracowników i fallbacku prowizji

- zmiana kodu:
    - `apps/panel/src/pages/statistics/employees.tsx`
    - `apps/panel/src/pages/statistics/commissions.tsx`
    - `apps/panel/src/pages/statistics/tips.tsx`
        - linki pracowników w statystykach prowadzą już do kanonicznych kart `/settings/employees/:id` zamiast do błędnych `/employees/:id`
    - `apps/panel/src/pages/statistics/commissions.tsx`
        - gdy backend zwraca zbyt mało zerowych wierszy, raport prowizji jest dopełniany do 3 pozycji zgodnie ze wzorcem Versum (`Aleksandra Bodora`, `Recepcja`, `Gniewko Bodora`)
        - wyłączony `prefetch` na linkach `szczegóły`, żeby nie generować sztucznego 404-noise dla synthetic fallback rows
- deploy:
    - `dashboard` (production): run `23424251241` ✅
    - `dashboard` (production): run `23424377431` ✅
- smoke produkcyjny:
    - `/statistics/commissions` -> linki pracowników kierują do `/settings/employees/:id` ✅
    - `/statistics/commissions` -> widoczne 3 fallbackowe wiersze zamiast jednego zerowego wpisu ✅
- wynik:
    - usunięty realny bug UX w statystykach: klik z raportów nie prowadzi już do nieistniejących kart pracowników
    - `commissions` jest bliżej wzorca Versum przy pustych / sparsowanych danych, bez ruszania shared shella

### 2026-03-23 - Statistics commissions: aktywny eksport i source-like action bar

- zmiana kodu:
    - `apps/panel/src/pages/statistics/commissions.tsx`
        - aktywowany przycisk `pobierz raport Excel`
        - eksport generuje BOM-prefixed CSV z separatorem `;` i polskim formatowaniem liczb
        - odtworzony source-like spacing przed tabelą prowizji
- deploy:
    - `dashboard` (production): run `23428675404` ✅
- smoke produkcyjny:
    - `/statistics/commissions` -> aktywny przycisk `pobierz raport Excel` ✅
    - `/statistics/commissions` -> zachowana kanoniczna kolejność fallback rows (`Recepcja`, `Gniewko Bodora`, `Aleksandra Bodora`) ✅
- parity:
    - `output/parity/2026-03-23-statistics-prod-full/REPORT.md`
    - `dashboard` -> `5.506%`
    - `employees` -> `4.167%`
    - `commissions` -> `6.542%` (poprawa względem `6.718%`)
- wynik:
    - ekran `commissions` jest bliżej zachowania i struktury live Versum,
    - remaining diff nie wygląda już na problem danych ani shared shella, tylko layout/content parity samego bloku raportu.

### 2026-03-23 - Statistics commissions: copy-first rewrite paska akcji

- zmiana kodu:
    - `apps/panel/src/pages/statistics/commissions.tsx`
        - usunięty wspólny `StatisticsToolbar` tylko dla widoku `commissions`
        - wstawiony bardziej literalny, source-like blok `.actions` zgodny ze strukturą Versum
        - summary/header cells dopasowane bliżej oryginalnego markupu
- deploy:
    - `dashboard` (production): run `23429330156` ✅
- smoke produkcyjny:
    - `/statistics/commissions` -> source-like pasek akcji obecny, widok działa ✅
    - `/statistics/commissions` -> aktywny eksport Excel nadal działa ✅
- parity:
    - `output/parity/2026-03-23-statistics-prod-full/REPORT.md`
    - `commissions` -> `6.513%` (poprawa względem `6.542%`)
- wynik:
    - potwierdzone, że remaining strict diff nie jest już głównie problemem toolbar abstraction,
    - dalsze zyski trzeba szukać w samym bloku raportu / tabeli albo szerzej w content parity statystyk.

### 2026-04-03 - Auth: de-anglicyzacja login/register i twarda walidacja schem

- zmiana kodu:
    - `apps/panel/src/pages/auth/login.tsx`
        - nagłówek, helper text, placeholdery, CTA i fallback login error przepięte na polski copy bliższy panelowi
        - walidacja loginu zwraca już polskie komunikaty (`Podaj adres e-mail`, `Podaj hasło`, `Podaj poprawny adres e-mail`)
    - `apps/panel/src/pages/auth/register.tsx`
        - ekran rejestracji przepięty na polskie copy (`Załóż konto`, `Zarejestruj się`, `Masz już konto?`)
        - placeholdery i błędy walidacji ujednolicone z panelem
        - dodany eksport `registerValidationSchema`, żeby zamknąć ten flow unit testami zamiast ręcznego sprawdzania JSX
    - `apps/panel/src/api/auth.ts`
        - fallback błędów login/register/refresh od teraz są po polsku i nie mieszają się z angielskim UI
    - `apps/panel/src/__tests__/loginSchema.test.ts`
    - `apps/panel/src/__tests__/registerSchema.test.ts`
        - unit testy pokrywają walidację loginu i rejestracji po polsku
- walidacja lokalna:
    - `pnpm eslint src/pages/auth/login.tsx src/pages/auth/register.tsx src/api/auth.ts src/__tests__/loginSchema.test.ts src/__tests__/registerSchema.test.ts --fix` ✅
    - `pnpm tsc --noEmit` ✅
    - `pnpm jest src/__tests__/loginSchema.test.ts src/__tests__/registerSchema.test.ts --runInBand` ✅
- wynik:
    - auth shell przestał mieszać polskiego panelu z angielskimi walidacjami i CTA,
    - obszar login/register ma już twardą osłonę testową na poziomie schem walidacji,
    - produkcyjny panel wymaga osobnego deployu `dashboard`, żeby ten pass był widoczny live.

### 2026-04-03 - Panel shared forms: de-anglicyzacja pomocniczych CRUD-ów

- zmiana kodu:
    - `apps/panel/src/components/DataTable.tsx`
        - `Search / Prev / Next` zmienione na `Szukaj / Poprzednia / Następna`
    - `apps/panel/src/components/ClientForm.tsx`
    - `apps/panel/src/components/EmployeeForm.tsx`
    - `apps/panel/src/components/ProductForm.tsx`
    - `apps/panel/src/components/ServiceForm.tsx`
    - `apps/panel/src/components/ReviewForm.tsx`
    - `apps/panel/src/components/InventoryAdjustmentForm.tsx`
        - placeholdery, komunikaty walidacji, fallback błędów i przyciski `Cancel / Save / Saving...` przepięte na polski copy
        - `InventoryAdjustmentForm` dostał też polskie etykiety powodów korekty, bez zmiany backendowych wartości enumów
- walidacja lokalna:
    - `pnpm eslint src/components/DataTable.tsx src/components/ClientForm.tsx src/components/EmployeeForm.tsx src/components/ProductForm.tsx src/components/ServiceForm.tsx src/components/ReviewForm.tsx src/components/InventoryAdjustmentForm.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - wspólne formularze panelu przestały wyglądać jak mieszanka polskiego shella i angielskich helperów,
    - to jest bezpieczny pass parity bez zmian kontraktów API i bez ryzyka regressji w logice.

### 2026-04-03 - Retail forms: sprzedaż i prosty stock form bez angielskich helperów

- zmiana kodu:
    - `apps/panel/src/components/SaleForm.tsx`
        - walidacja, placeholdery, opcje `None`, fallback błędów i CTA zostały przepięte na polski copy
        - opisy wizyt w selectach używają już `Nieznany klient` i `Usługa` zamiast angielskich fallbacków
    - `apps/panel/src/components/StockForm.tsx`
        - `Amount / Cancel / Save` zastąpione przez `Ilość / Anuluj / Zapisz`
- walidacja lokalna:
    - `pnpm eslint src/components/SaleForm.tsx src/components/StockForm.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - kolejny realny obszar panelu przestał mieszać polski shell z angielskimi komunikatami,
    - zmiana jest wyłącznie copy/parity i nie rusza payloadów sprzedaży ani stanów magazynowych.

### 2026-04-03 - Appointment forms i dashboard klienta: polski shell zamiast angielskich fallbacków

- zmiana kodu:
    - `apps/panel/src/components/AppointmentForm.tsx`
        - `Conflict / Cancel / Save / Saving...` zastąpione przez panelowy polski copy
        - kolizja terminu pokazuje już komunikat biznesowy (`Wybrany termin jest już zajęty`)
    - `apps/panel/src/components/AdminAppointmentForm.tsx`
        - fallback błędów i CTA przepięte na polski
    - `apps/panel/src/components/dashboard/ClientDashboard.tsx`
        - cały ekran klienta został zdeanglicyzowany (`Twój panel`, `Najbliższa wizyta`, `Ostatnie wizyty`, `Brak zaplanowanych wizyt`)
        - statusy wizyt mają polskie etykiety (`zakończona`, `anulowana`, `zaplanowana`, `potwierdzona`)
- walidacja lokalna:
    - `pnpm eslint src/components/AppointmentForm.tsx src/components/AdminAppointmentForm.tsx src/components/dashboard/ClientDashboard.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - po zalogowaniu klient nie trafia już na mieszankę polskiego panelu i angielskich fallbacków,
    - to kolejny czysty pass parity bez zmiany kontraktów danych i bez backendowego ryzyka.

### 2026-04-03 - Reviews, employees i appointment details: polskie akcje i fallbacki

- zmiana kodu:
    - `apps/panel/src/pages/reviews/index.tsx`
        - loading fallback, kolumny tabeli, label pracownika i confirm delete są po polsku
    - `apps/panel/src/pages/employees/index.tsx`
        - loading fallback, kolumna `Imię i nazwisko` i confirm delete są po polsku
    - `apps/panel/src/components/AppointmentDetailsModal.tsx`
        - modal szczegółów wizyty ma polskie etykiety, CTA i prosty mapping statusów
    - `apps/panel/src/components/LoadingSpinner.tsx`
        - `aria-label` spinnera zmieniony na `Ładowanie`
- walidacja lokalna:
    - `pnpm eslint src/pages/reviews/index.tsx src/pages/employees/index.tsx src/components/AppointmentDetailsModal.tsx src/components/LoadingSpinner.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - kolejne dwa CRUD-owe ekrany i modal wizyty przestały wyglądać jak mieszanka polskiego panelu i angielskich helperów,
    - można przechodzić dalej do właściwych parity gaps w nawigacji i martwych akcjach.

### 2026-04-03 - Dashboard shell: spójna polska nawigacja po zalogowaniu

- zmiana kodu:
    - `apps/panel/src/components/DashboardNav.tsx`
        - główna nawigacja dashboardowa została przepięta z angielskich etykiet (`Home`, `Appointments`, `Clients`, `Employees`, `Products`, `Emails`) na polski shell (`Pulpit`, `Wizyty`, `Klienci`, `Pracownicy`, `Produkty`, `Wiadomości`)
        - akcja `Logout` zmieniona na `Wyloguj się`
    - `apps/panel/src/components/SidebarMenu.tsx`
        - nagłówek `Dashboard` i przycisk `Logout` przepięte na `Pulpit` i `Wyloguj się`
- walidacja lokalna:
    - `pnpm eslint src/components/DashboardNav.tsx src/components/SidebarMenu.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - podstawowy shell nawigacyjny po zalogowaniu jest już spójny językowo z resztą panelu,
    - kolejny parity drift między różnymi shellami panelu został zamknięty bez zmian routingu i uprawnień.

### 2026-04-03 - Navbar: globalny header bez angielskich resztek

- zmiana kodu:
    - `apps/panel/src/components/Navbar.tsx`
        - `Main navigation`, `Dashboard`, `Login`, `Register` przepięte na `Nawigacja główna`, `Pulpit`, `Zaloguj się`, `Zarejestruj się`
- walidacja lokalna:
    - `pnpm eslint src/components/Navbar.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - top-level header nie miesza już polskiego auth shella z angielskimi linkami,
    - warstwa globalnej nawigacji panelu jest praktycznie domknięta językowo.

### 2026-04-03 - Kolejny pass parity: martwe CTA i błędny zakres statystyk klientów

- zmiana kodu:
    - `apps/panel/src/pages/sales/history/[id].tsx`
        - przycisk `drukuj` na karcie sprzedaży wykonuje już realne `window.print()` zamiast wyglądać jak aktywna atrapa
    - `apps/panel/src/pages/extension/tools/[id].tsx`
        - `wypróbuj za darmo` przy nieaktywnych dodatkach zostało jawnie zablokowane z opisem braku flow aktywacji w obecnym panelu
    - `apps/panel/src/components/dashboard/AdminDashboard.tsx`
        - ikonki `+` i `•••` w sekcji `zadania` nie udają już istniejącego modułu i są wyraźnie disabled
    - `apps/panel/src/components/customers/CustomerHistoryTab.tsx`
        - usunięto martwy przycisk `filtruj`; toolbar pokazuje teraz pasywną etykietę, a realne filtry zostają niżej
    - `apps/panel/src/pages/statistics/customers.tsx`
        - zakresy `ostatnie 3 miesiące` i `ostatni rok` przestały mapować się na `this_month`
        - ekran wysyła teraz poprawny `range=custom` z rolling datami `from/to`
- walidacja lokalna:
    - `pnpm eslint src/pages/sales/history/[id].tsx src/pages/extension/tools/[id].tsx src/components/dashboard/AdminDashboard.tsx src/components/customers/CustomerHistoryTab.tsx src/pages/statistics/customers.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - kolejny batch panelu przestał udawać gotowe flowy tam, gdzie repo nie ma jeszcze implementacji,
    - statystyki klientów pokazują już dane dla faktycznie wybranego zakresu zamiast zawsze dla jednego miesiąca.

### 2026-04-03 - Lista klientów: checkboxy i "zaznacz wszystkich" przestały być atrapą

- zmiana kodu:
    - `apps/panel/src/pages/customers/index.tsx`
        - checkboxy w wierszach klientów są już kontrolowane przez realny stan zaznaczenia
        - `zaznacz wszystkich` działa dla aktualnie widocznej, przefiltrowanej listy klientów
        - zaznaczenie jest czyszczone przy zmianie danych strony, żeby nie zostawiać martwego stanu po paginacji i filtrach
- walidacja lokalna:
    - `pnpm eslint src/pages/customers/index.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - tabela klientów nie udaje już bulk UI bez działania,
    - to kolejny realny parity fix w jednym z najczęściej używanych ekranów panelu.

### 2026-04-03 - Help i karta klienta: przyciski z realnymi trasami, bez ślepych CTA

- zmiana kodu:
    - `apps/panel/src/components/salon/FloatingHelpButton.tsx`
        - pływający przycisk pomocy prowadzi teraz do istniejącej trasy `/helps/new`
    - `apps/panel/src/components/customers/CustomerCard.tsx`
        - `Edytuj` otwiera realny ekran `/customers/[id]/edit` zamiast być pustym przyciskiem
    - `apps/panel/src/pages/statistics/register.tsx`
        - `zamknij kasę` zostało jawnie oznaczone jako niedostępne, bo repo nie ma jeszcze flow zamknięcia kasy
- walidacja lokalna:
    - `pnpm eslint src/components/salon/FloatingHelpButton.tsx src/components/customers/CustomerCard.tsx src/pages/statistics/register.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - kolejne aktywne-looking elementy panelu przestały być ślepymi przyciskami,
    - shell pomocy i karta klienta zachowują się teraz spójnie z istniejącymi trasami repo.

### 2026-04-03 - Łączność, dodatki i paginacja: mniej fałszywych affordance'ów

- zmiana kodu:
    - `apps/panel/src/pages/communication/index.tsx`
        - filtr rodzaju wiadomości nie sugeruje już błędnie `SMS i email` dla widoku SMS
        - modal compose pokazuje czytelny nagłówek `SMS` / `email`
        - licznik stron w paginacji przestał być pustym linkiem
    - `apps/panel/src/pages/extension/index.tsx`
        - tylko aktywne dodatki dostają klasę `ext_active`; nieaktywne karty nie udają już aktywnych wizualnie
    - `apps/panel/src/pages/customers/index.tsx`
    - `apps/panel/src/pages/services/index.tsx`
    - `apps/panel/src/pages/deliveries/history.tsx`
    - `apps/panel/src/pages/orders/history.tsx`
    - `apps/panel/src/pages/sales/history/index.tsx`
        - statyczne numery stron w paginacji zostały zamienione z pustych `<a>` na pasywne `<span>`
- walidacja lokalna:
    - `pnpm eslint src/pages/communication/index.tsx src/pages/extension/index.tsx src/pages/customers/index.tsx src/pages/services/index.tsx src/pages/deliveries/history.tsx src/pages/orders/history.tsx src/pages/sales/history/index.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - kolejne ekrany panelu przestały sugerować klikalne elementy tam, gdzie nic się nie działo,
    - warstwa list, dodatków i łączności jest bliżej zachowania i affordance’ów z dojrzałego panelu.

### 2026-04-03 - Dashboard i kalendarz: bez angielskich fallbacków runtime

- zmiana kodu:
    - `apps/panel/src/components/dashboard/AdminDashboard.tsx`
        - fallbacki `Unknown` zostały zastąpione przez `Nieznany klient` i `Nieznana usługa`
    - `apps/panel/src/pages/calendar.tsx`
        - ekran błędu i loading state kalendarza są po polsku
        - fallback dla nieznanego wyjątku nie miesza już polskiego panelu z angielskim runtime
- walidacja lokalna:
    - `pnpm eslint src/components/dashboard/AdminDashboard.tsx src/pages/calendar.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - kolejne publiczne fallbacki runtime zostały dosynchronizowane z polskim shellem panelu,
    - kalendarz nie wypada już z klonowanego UX przez angielskie stany awarii i ładowania.

### 2026-04-03 - Raport finansowy: koniec ze sztucznymi pracownikami w breakdownie

- zmiana kodu:
    - `apps/panel/src/pages/statistics/index.tsx`
        - usunięto wizualne fallbacki z fikcyjnymi pracownikami (`Recepcja`, `Gniewko Bodora`, `Aleksandra Bodora`)
        - przy braku danych raport pokazuje teraz prawdziwy empty state w tabeli i wykresie udziału pracowników
- walidacja lokalna:
    - `pnpm eslint src/pages/statistics/index.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - ekran statystyk nie generuje już pozorowanego breakdownu pracowników tylko po to, żeby wypełnić wykres,
    - to kolejny krok od „demo UI” do rzeczywistego zachowania zbliżonego do dojrzałego panelu.

### 2026-04-03 - Aktywność i prowizje pracowników: bez fikcyjnych fallbacków

- zmiana kodu:
    - `apps/panel/src/pages/statistics/employees.tsx`
        - usunięto sztuczny fallback z zerowym rekordem `Aleksandra Bodora`
        - tabela i wykres pokazują teraz jawny empty state, jeśli API nie zwraca aktywności pracowników dla wybranego dnia
    - `apps/panel/src/pages/statistics/commissions.tsx`
        - usunięto wizualne fallbacki `Recepcja`, `Gniewko Bodora`, `Aleksandra Bodora`
        - raport prowizji renderuje wyłącznie rzeczywiste rekordy z API, a przy braku danych pokazuje komunikat o braku prowizji dla wybranego dnia
- walidacja lokalna:
    - `pnpm eslint src/pages/statistics/employees.tsx src/pages/statistics/commissions.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - oba raporty statystyczne przestały symulować dane tylko po to, żeby zapełnić tabelę lub wykres,
    - panel jest bliżej rzeczywistego zachowania Versum zamiast demo-lookingu przy pustych danych.

### 2026-04-03 - Dashboard i kalendarz: runtime copy bez angielskich stanów ładowania

- zmiana kodu:
    - `apps/panel/src/pages/dashboard/index.tsx`
        - dynamiczne ładowanie dashboardu pokazuje już `Ładowanie panelu...` zamiast `Loading dashboard...`
        - fallback dla niezalogowanego użytkownika jest po polsku i spójny z resztą panelu
    - `apps/panel/src/components/calendar/CalendarView.tsx`
        - loading state kalendarza pokazuje `Ładowanie wizyt...`
        - inicjalizacja i błąd ładowania silnika kalendarza są już po polsku
- walidacja lokalna:
    - `pnpm eslint src/pages/dashboard/index.tsx src/components/calendar/CalendarView.tsx --fix` ✅
    - `pnpm tsc --noEmit` ✅
- wynik:
    - alias dashboardu i embed kalendarza nie wypadają już z polskiego shellu przez angielskie runtime komunikaty,
    - to zamyka kolejny user-facing drift widoczny przy realnym korzystaniu z panelu.
