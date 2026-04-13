# Versum Services and Products Import Runbook

_Last updated: 2026-04-03_

Ten runbook opisuje najkrótszą bezpieczną ścieżkę importu danych Versum, które już są gotowe do użycia w SalonBW:
- usług z `19581_cennik_uslug_wygenerowany_2026-04-03.xlsx`
- produktów z `19581_baza_produktow_z_2026-02-03.xlsx`

Dokument dotyczy wyłącznie importu do środowiska lokalnego albo kontrolowanego stagingu.
Nie używaj go do produkcji bez osobnej decyzji i backupu.

## 1. Pliki wejściowe

### Usługi

- `/Users/gniewkob/Downloads/19581_cennik_uslug_wygenerowany_2026-04-03.xlsx`

Rozpoznane kolumny:
- `Usługa`
- `Cena (zł)`
- `Cena maksymalna (zł)`
- `Trwa (minuty)`
- `Opis`

Importer:
- `backend/salonbw-backend/scripts/import-services.ts`
- `pnpm import:services`

### Produkty

- `/Users/gniewkob/Downloads/19581_baza_produktow_z_2026-02-03.xlsx`

Rozpoznane kolumny:
- `Produkt`
- `Producent`
- `Cena netto (zł)`
- `Stawka VAT`
- `Cena brutto (zł)`
- `Ostatnia cena zakupu netto`
- `Stan magazynowy w opakowaniach`
- `Stan magazynowy w jednostce zużycia`
- `Rodzaj produktu`
- `Jednostka zużycia`
- `Rozmiar opakowania`
- `Opis`
- `Kod wewnętrzny (SKU)`
- `Kod kreskowy`

Importer:
- `backend/salonbw-backend/scripts/import-products.ts`
- `pnpm import:products`

## 2. Preconditions

Przed importem:
- upewnij się, że target to `local` albo kontrolowany `staging`,
- zrób backup bazy, jeśli to nie jest disposable env,
- nie commituj plików eksportu do repo,
- nie wrzucaj tych plików do CI artifacts,
- potwierdź, że `DATABASE_URL` wskazuje właściwą bazę.

Minimalna walidacja targetu:

```bash
cd /Users/gniewkob/Repos/salonbw/backend/salonbw-backend
echo "$DATABASE_URL"
```

Jeśli `DATABASE_URL` jest puste, ustaw je jawnie przed importem.

## 3. Import usług

Uruchom:

```bash
cd /Users/gniewkob/Repos/salonbw/backend/salonbw-backend
IMPORT_SERVICES_XLSX=/Users/gniewkob/Downloads/19581_cennik_uslug_wygenerowany_2026-04-03.xlsx pnpm import:services
```

Co robi importer:
- czyta pierwszy sheet z workbooka,
- traktuje standalone rows jako kategorie usług,
- mapuje `Cena maksymalna` na `priceType=from`,
- tworzy lub aktualizuje:
  - `service_categories`
  - `services`
  - `service_variants`

Oczekiwany efekt:
- usługi pojawią się w module `services`,
- kategorie typu `Dzieci` będą widoczne jako kategorie usług,
- warianty będą tworzone z nazw zawierających separator ` - `.

## 4. Import produktów

Uruchom:

```bash
cd /Users/gniewkob/Repos/salonbw/backend/salonbw-backend
IMPORT_PRODUCTS_XLSX=/Users/gniewkob/Downloads/19581_baza_produktow_z_2026-02-03.xlsx pnpm import:products
```

Co robi importer:
- szuka header row po `Produkt` + `Producent`,
- traktuje standalone rows jako sekcje pomocnicze,
- mapuje:
  - `Rodzaj produktu` -> `ProductType`
  - `Cena brutto (zł)` -> `unitPrice`
  - `Ostatnia cena zakupu netto` -> `purchasePrice`
  - `Stan magazynowy w jednostce zużycia` -> `stock`
- aktualizuje istniejące rekordy po:
  - `barcode`,
  - albo `sku + name`,
  - albo `name + brand`

Oczekiwany efekt:
- produkty pojawią się w module `products`,
- stock i ceny będą zasilone z eksportu Versum,
- importer nie wymaga osobnego raportu magazynowego do pierwszego zasiania katalogu produktów.

## 5. Post-import validation

Po imporcie sprawdź:

### Backend

```bash
cd /Users/gniewkob/Repos/salonbw/backend/salonbw-backend
pnpm typecheck
```

### Panel

Po uruchomieniu aplikacji potwierdź ręcznie:
- `/services`
- `/products`
- `/statistics/services`

Sprawdź:
- czy kategorie usług się zgadzają,
- czy ceny i czasy usług wyglądają poprawnie,
- czy produkty mają sensowne stock/ceny/brand,
- czy nie ma oczywistych duplikatów po `SKU` albo `barcode`.

## 6. Known limitations

Ten import nie daje jeszcze pełnego snapshotu operacyjnego.

Brakuje nadal:
- klientów,
- pracowników jako rekordów importowalnych,
- wizyt,
- sprzedaży per rekord,
- pozycji sprzedaży,
- historii komunikacji,
- timetable/settings jako danych importowalnych.

To oznacza:
- możemy już oprzeć moduł usług i produktów na realnych danych Versum,
- nie możemy jeszcze odtworzyć pełnego CRM, kalendarza i sprzedaży na rzeczywistym snapshotcie.

## 7. Safety note

Dla tych dwóch plików nie jest potrzebna anonimizacja danych osobowych klientów, bo:
- `cennik usług` nie zawiera klientów,
- `baza produktów` nie zawiera klientów.

To są dobre pierwsze pliki do bezpiecznego importu.
Raporty pracownicze, finansowe i retencyjne traktuj osobno jako `reference/parity`, a nie jako import source do surowych rekordów.
