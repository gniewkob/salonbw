# Versum Export Import Plan

_Last updated: 2026-04-03_

Ten dokument mapuje dostępne eksporty Versum do domen SalonBW i określa:
- czy plik nadaje się do importu danych,
- czy plik nadaje się tylko do parity/reference,
- jakie pola można z niego odzyskać,
- jakie są ryzyka danych,
- czego jeszcze brakuje do pełnego snapshotu roboczego.

Powiązany runbook wykonawczy dla pierwszego bezpiecznego importu:
- [VERSUM_SERVICES_PRODUCTS_IMPORT.md](./VERSUM_SERVICES_PRODUCTS_IMPORT.md)

Narzędzie pomocnicze do szybkiego rozpoznania nowych eksportów (kolumny/sheety):
- `pnpm inspect:versum-workbook <plik.xls[x]> [maxRows]` w `backend/salonbw-backend`
- Snapshot referencyjny statystyk do DB:
  - `pnpm extract:versum-reference`
  - `pnpm save:versum-reference-db`

## 1. Status ogólny

Obecny zestaw eksportów jest wystarczający, żeby zacząć pracę na:
- usługach,
- produktach,
- magazynie,
- statystykach,
- raportach finansowych,
- prowizjach,
- napiwkach,
- źródłach klientów,
- retencji klientów.

Nie jest jeszcze wystarczający do pełnego snapshotu bazy dla developmentu panelu, bo brakuje surowych danych:
- klientów,
- pracowników jako rekordów importowalnych,
- wizyt,
- sprzedaży per rekord,
- historii komunikacji,
- ustawień jako danych importowalnych.

## 2. Mapa eksportów

### 2.1 Import-ready lub prawie import-ready

#### `19581_cennik_uslug_wygenerowany_2026-04-03.xlsx`

- Typ: `import candidate`
- Domena SalonBW:
  - `services`
  - częściowo `service categories`
- Widoczne pola:
  - nazwa usługi
  - cena
  - cena maksymalna
  - czas trwania
  - opis
  - sekcje/kategorie typu `Dzieci`
- Wartość:
  - bardzo dobra baza do importu katalogu usług
  - dobra baza do mapowania czasu/ceny do widoków Versum-like
- Ryzyko:
  - niskie do średnie
  - dane biznesowe, ale bez pełnych danych osobowych klientów

#### `19581_baza_produktow_z_2026-02-03.xlsx`

- Typ: `high-value import candidate`
- Domena SalonBW:
  - `products`
  - częściowo `warehouse`
- Wartość:
  - najcenniejszy plik produktowy, bo prawdopodobnie zawiera bazę produktów zamiast samego raportu
- Status:
  - wymaga osobnego rozczytania i mapowania kolumn
- Ryzyko:
  - niskie do średnie

#### `19581_raport_magazynowy_wygenerowany_2026-04-03.xlsx`

- Typ: `import support + parity reference`
- Domena SalonBW:
  - `warehouse`
  - `products`
  - `inventory reports`
- Widoczne pola:
  - nazwa produktu
  - różnica
  - początkowy stan
  - końcowy stan
  - zużycie
  - sprzedaż
  - dostawy
  - manualne korekty
  - ilości i wartości netto/brutto
- Wartość:
  - świetny materiał do walidacji logiki magazynowej i ekranów raportowych
  - może częściowo zasilić snapshot magazynu, ale nie zastępuje pełnego ledgeru transakcji
- Ryzyko:
  - średnie biznesowo, niskie personalnie

#### `19581_raport_gospodarki_magazynowej_wygenerowany_2026-04-03.xlsx`

- Typ: `import support + parity reference`
- Domena SalonBW:
  - `warehouse transactions`
  - `deliveries`
  - `inventory economics`
- Widoczne pola:
  - typ / ID transakcji
  - data transakcji
  - data wprowadzenia
  - wartości netto/brutto
- Wartość:
  - bardzo dobra referencja do zbudowania widoków gospodarki magazynowej
  - dobra do walidacji agregatów i sekwencji zmian
- Ryzyko:
  - średnie biznesowo

### 2.2 Parity / reference only

#### `19581_raport_finansowy_od_2000-01-01_do_2026-12-31.xlsx`

- Typ: `parity reference`
- Domena SalonBW:
  - `statistics`
  - `financial dashboard`
  - `register summaries`
- Widoczne pola:
  - liczba wizyt
  - łączny czas
  - sprzedaż usług brutto/netto
  - sprzedaż towarów brutto
- Wartość:
  - bardzo dobra referencja dla ekranów statystyk i finansów
- Ograniczenie:
  - to agregat, nie surowe rekordy
- Ryzyko:
  - wysokie biznesowo, niskie personalnie

#### `19581_popularnosc_uslug_od_2000-01-01_do_2026-12-31.xlsx`

- Typ: `parity reference`
- Domena SalonBW:
  - `statistics/services`
- Widoczne pola:
  - udział procentowy
  - zapłacono łącznie
  - czas łącznie
  - liczba wykonań
  - oczekujące vs sfinalizowane
- Wartość:
  - bardzo dobra referencja dla rankingów i drzew usług
- Ograniczenie:
  - brak rekordów źródłowych

#### `19581_popularnosc_uslug_wg_pracownikow_od_2000-01-01_do_2026-12-31.xlsx`

- Typ: `parity reference`
- Domena SalonBW:
  - `statistics/employees`
  - `statistics/services by employee`
- Widoczne pola:
  - pracownik
  - udział procentowy
  - zapłacono łącznie
  - czas
  - liczba wykonań
- Wartość:
  - bardzo dobra referencja dla dashboardów pracowniczych
- Ryzyko:
  - zawiera dane osobowe pracowników
- Wymaganie:
  - anonimizacja nazw pracowników przed dalszym wykorzystaniem poza lokalnym, kontrolowanym środowiskiem

#### `19581_raport_powracalnosci_klientow_wygenerowany_2026-04-03.xlsx`

- Typ: `parity reference`
- Domena SalonBW:
  - `statistics/customers/returning`
- Widoczne pola:
  - pracownik
  - liczba klientów
  - liczba pierwszych wizyt
  - liczba klientów powracających
- Wartość:
  - bardzo dobra referencja dla retention metrics
- Ryzyko:
  - zawiera dane osobowe pracowników

#### `19581_raport_od_2000-01-01_do_2026-12-31.xlsx`

- Typ: `parity reference`
- Domena SalonBW:
  - `statistics/customer-origins`
- Widoczne pola:
  - pochodzenie klientów
  - liczba klientów
  - liczba klientów odwiedzających salon
  - łączny obrót
  - średni obrót
- Wartość:
  - bardzo dobra referencja do customer origins
- Ryzyko:
  - niskie personalnie, średnie biznesowo

#### `19581_napiwki_od_2000-01-01_do_2026-12-31.xls`

- Typ: `parity reference`
- Domena SalonBW:
  - `statistics/tips`
- Widoczne pola:
  - `Pracownik`
  - `Ilość`
  - `Zapłacono gotówką`
  - `Zapłacono kartą`
  - `Zapłacono czekiem`
  - `Zapłacono przelewem`
  - `Wartość napiwków`
- Wartość:
  - kluczowy do odtworzenia dashboardu napiwków i breakdownu metod płatności
- Ryzyko:
  - średnie biznesowo, zawiera dane osobowe pracowników
- Dalszy krok:
  - używać po anonimizacji nazw pracowników

#### `19581_prowizje_od_2000-01-01_do_2026-12-31.xls`

- Typ: `parity reference`
- Domena SalonBW:
  - `statistics/commissions`
- Widoczne pola:
  - `Pracownik`
  - `Obroty na usługach brutto`
  - `Obroty na usługach netto`
  - `Prowizja od usług brutto`
  - `Prowizja od usług netto`
  - `Obroty na produktach brutto`
  - `Obroty na produktach netto`
  - `Prowizja z produktów brutto`
  - `Prowizja z produktów netto`
  - `Łącznie obroty brutto`
  - `Łącznie prowizja brutto`
- Wartość:
  - kluczowy do walidacji prowizji
- Ryzyko:
  - średnie biznesowo, zawiera dane osobowe pracowników
- Dalszy krok:
  - używać po anonimizacji nazw pracowników

## 3. Linki Versum jako źródło funkcjonalne

Podane linki są wartościowe jako:
- źródło identyfikacji ekranów referencyjnych,
- źródło nazw modułów i zakresu raportów,
- punkt odniesienia dla parity testów i screenshot workflows.

Nie zastępują eksportów danych. Traktujemy je jako:
- `behavior reference`
- `route reference`
- `report scope reference`

## 4. Czego jeszcze brakuje do pełnego snapshotu

Do pracy na rzeczywistych danych operacyjnych w panelu nadal brakuje eksportów:

### 4.1 Kluczowe brakujące dane

- klienci
- pracownicy jako pełne rekordy
- wizyty
- sprzedaże
- pozycje sprzedaży
- historia komunikacji
- zgody marketingowe
- notatki klientów
- grafiki pracowników / timetable jako dane importowalne

### 4.2 Najważniejsze brakujące relacje

- klient ↔ wizyta
- pracownik ↔ wizyta
- usługa ↔ wizyta
- klient ↔ sprzedaż
- pracownik ↔ prowizja per rekord
- appointment ↔ payment / register record

Bez tego nie zrobimy pełnego snapshotu bazy do developmentu panelu.

## 5. Anonimizacja raportów pracowniczych

Raporty zawierające nazwiska pracowników powinny być anonimizowane przed szerszym użyciem poza lokalnym, kontrolowanym środowiskiem.

Gotowy skrypt:
- `backend/salonbw-backend/scripts/anonymize-versum-employee-report.ts`
- `backend/salonbw-backend/scripts/anonymize-versum-employee-reports-batch.ts`

Komenda:

```bash
cd /Users/gniewkob/Repos/salonbw/backend/salonbw-backend
pnpm anonymize:versum-report --map-out /tmp/versum-workers-map.json /Users/gniewkob/Downloads/19581_prowizje_od_2000-01-01_do_2026-12-31.xls /tmp/19581_prowizje_anon.xlsx
pnpm anonymize:versum-report --map-in /tmp/versum-workers-map.json --map-out /tmp/versum-workers-map.json /Users/gniewkob/Downloads/19581_napiwki_od_2000-01-01_do_2026-12-31.xls /tmp/19581_napiwki_anon.xlsx
```

Skrypt:
- wykrywa tabele z kolumną `Pracownik`,
- zastępuje nazwiska aliasami `Pracownik 01`, `Pracownik 02`, ...
- zachowuje niefizyczne etykiety typu `Recepcja`, `Solarium`, `Nie wskazano pracownika`,
- wypisuje mapping do stdout,
- umożliwia współdzielenie mapy aliasów między wieloma raportami (`--map-in`, `--map-out`),
- zapisuje wynik jako stabilny plik `.xlsx` (zalecane także przy wejściu `.xls`).

Batch (zalecane dla wielu raportów naraz):

```bash
cd /Users/gniewkob/Repos/salonbw/backend/salonbw-backend
mkdir -p /tmp/versum-employee-anon
pnpm anonymize:versum-reports --map-out /tmp/versum-employee-anon/workers-map.json --out-dir /tmp/versum-employee-anon /Users/gniewkob/Downloads/19581_prowizje_od_2000-01-01_do_2026-12-31.xls /Users/gniewkob/Downloads/19581_napiwki_od_2000-01-01_do_2026-12-31.xls /Users/gniewkob/Downloads/19581_popularnosc_uslug_wg_pracownikow_od_2000-01-01_do_2026-12-31.xlsx /Users/gniewkob/Downloads/19581_raport_powracalnosci_klientow_wygenerowany_2026-04-03.xlsx
```

## 6. Zapis snapshotu referencyjnego do bazy

Po anonimizacji raportów pracowniczych i zebraniu eksportów statystyk można zapisać znormalizowany snapshot do Postgresa.

Tabela docelowa:
- `versum_reference_snapshots`

Kroki:

```bash
cd /Users/gniewkob/Repos/salonbw/backend/salonbw-backend
pnpm extract:versum-reference --map /tmp/versum-employee-anon/workers-map.json --out /tmp/versum-reference-snapshot.json --base-dir /Users/gniewkob/Downloads
pnpm save:versum-reference-db --snapshot /tmp/versum-reference-snapshot.json --source-key versum_downloads_2026_04_03
```

Wersja jednokomendowa (extract + save + verify):

```bash
cd /Users/gniewkob/Repos/salonbw/backend/salonbw-backend
pnpm seed:versum-reference-db --source-key versum_downloads_2026_04_03 --base-dir /Users/gniewkob/Downloads --map /tmp/versum-employee-anon/workers-map.json --out /tmp/versum-reference-snapshot.json
```

Weryfikacja (read-only):

```bash
cd /Users/gniewkob/Repos/salonbw/backend/salonbw-backend
node -e "const { Client } = require('pg'); (async () => { const c = new Client({ connectionString: process.env.DATABASE_URL }); await c.connect(); const r = await c.query('select id, source_key, snapshot_generated_at, pg_column_size(payload) as payload_bytes from versum_reference_snapshots order by id desc limit 5'); console.log(r.rows); await c.end(); })()"
```

## 5. Decyzja praktyczna

Na bazie obecnych plików można już teraz:

1. budować i weryfikować:
   - `services`
   - `products`
   - `warehouse`
   - `statistics`
   - `financial dashboards`
   - `commissions`
   - `tips`
   - `customer origins`
   - `returning customers`

2. przygotować bezpieczny pipeline anonimizacji dla:
   - nazw pracowników,
   - identyfikatorów produktów,
   - danych finansowych raportowych

3. robić parity z Versum bez pełnego dumpu klientów

## 6. Co robić dalej

### 6.1 Teraz

- zanonimizować dane osobowe pracowników w raportach
- przygotować parser/import plan dla:
  - `cennik usług`
  - `baza produktów`
  - `raport magazynowy`
  - `raport gospodarki magazynowej`
- przygotować parity reference map dla:
  - finansów
  - prowizji
  - napiwków
  - popularności usług
  - retencji
  - źródeł klientów

### 6.2 Następnie

zdobyć eksporty:
- klientów
- wizyt
- sprzedaży
- pracowników
- timetable/settings

## 7. Go / No-Go

### GO teraz

- prace nad importem usług
- prace nad importem produktów
- prace nad magazynem
- prace nad parity statystyk
- przygotowanie anonimizacji raportów

### NO-GO teraz

- ogłaszanie gotowości pełnego snapshotu produkcyjnego
- ładowanie surowych danych klientów do non-prod
- traktowanie obecnych raportów jako zamiennika pełnego ledgeru operacyjnego
