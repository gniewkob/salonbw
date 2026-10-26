# Usunięcie syntetycznych danych produkcyjnych po imporcie Booksy

- **Data:** 2026-10-26
- **Agent:** Codex
- **PR:** #1521, rozszerzenie zakresu na jawne żądanie ownera
- **Autoryzacja:** owner: „eksport pozostaje z 23.10 […] usuń z produkcji też wszystkie dane syntetyczne”. Finalny eksport dopiero przy końcowym cutoverze.

## Finding

Odczyt produkcji: 1068 klientek, w tym 20 z deterministycznym markerem
synthetic.client.*@example.invalid i jedna dodatkowa karta E2E na zarezerwowanej
domenie testowej z jawną nazwą testową. Dwa konta administratorów nie są
fixture i pozostają. 70 wizyt należy do kart syntetycznych, dokładnie tyle samo
wizyt nie ma linku Booksy. Powiązania źródłowe: 1047 klientek, 10 109 wizyt,
144 opinie. Produkty i dokumenty magazynowe mają markery SYNTH-/SYNTHETIC-.

Stary cleanup prelive zakłada brak realnych klientek i nie nadaje się do
obecnej mieszanej bazy. Nie wykonano resetOperationalData ani starego apply.

## Change

Dodano cleanup-production-synthetic.ts z trybami plan/apply:

- Wybór klientek po ścisłym markerze lub zarezerwowanej domenie i nazwie
  testowej łącznie. Samo nazwisko/nazwa nie kwalifikuje konta. Role admin
  nie są wybierane. Produkty, kategorie, dostawcy i dokumenty po markerach.
- Zależności ustalane z rzeczywistych FK, także nowych tabel i tabel bez id.
  Poszerzenie zbioru o nieoznaczony główny rekord biznesowy blokuje operację.
  Wybór jakiegokolwiek rekordu powiązanego z importem także blokuje operację.
- Plan jest READ ONLY. Apply wymaga frazy, dokładnego SHA256 planu i prywatnego
  świeżego dumpa custom z inwentarzem pg_restore oraz zgodną nazwą bazy.
- Jedna transakcja SERIALIZABLE, limit oczekiwania na lock 3 s, zapytania 30 s.
  Zmieniony plan i skutki uboczne poza manifestem prowadzą do rollbacku.
- Liczby i skróty wszystkich pozostających rekordów muszą być identyczne
  przed/po. Dotyczy też całych realnych rekordów, kont administratorów,
  konfiguracji, katalogu i import_source_links. Surowe dane nie opuszczają DB.
- Odtwarzalny query-result-cache jest jawnie invalidowany, aby nie utrzymywać
  zestawień usuniętych fixture. Nie zmieniamy źródłowych realnych danych.
- Załączniki prywatne blokują cleanup do przygotowania manifestu storage;
  w obecnym planie nie wybrano takich rekordów.

## Plan produkcyjny — tylko odczyt

| Tabela                                                                            | Do usunięcia |
| --------------------------------------------------------------------------------- | -----------: |
| users (tylko klientki testowe)                                                    |           21 |
| appointments                                                                      |           70 |
| reviews                                                                           |            2 |
| commissions                                                                       |            9 |
| products / product_categories / suppliers                                         |   12 / 4 / 2 |
| deliveries / warehouse_orders / warehouse_sales / warehouse_usages / stocktakings |         po 1 |
| delivery_items / warehouse_order_items                                            |         po 3 |
| warehouse_sale_items / warehouse_usage_items / service_recipe_items               |         po 1 |
| stocktaking_items                                                                 |           12 |
| loyalty_balances / loyalty_transactions                                           |        2 / 3 |
| refresh_tokens / logs przypisane wyłącznie testowym kontom                        |       9 / 32 |

Plan SHA256 w chwili kontroli:
`e3b4f8efd8aa6bf493175936012237142d18c04314095e6ea16e9796697871c9`.
Przed wykonanym apply plan wyliczono ponownie i porównano pod blokadą.
Cache w tym planie nie zawierał wierszy.

## Validation

- Nowy test odtworzył problem prawdziwego schematu: nazwa query-result-cache
  była odrzucana (RED); bezpiecznie cytowane nazwy z łącznikami działają (GREEN).
- 11/11 testów z jednorazowym PostgreSQL: READ ONLY, plan drift, idempotencja,
  ochrona trzech rodzajów importowanych encji, mieszane zależności,
  ochrona realnej wizyty, blokada prywatnych plików, rollback skutku triggera.
- Pełny backend z włączoną integracją cleanupu: 65 suites, 517 PASS,
  1 pominięty niezależny opt-in test importu Booksy (zaliczony wcześniej).
- CI tworzy oddzielną jednorazową bazę cleanup_synthetic i uruchamia również
  10 testów PostgreSQL cleanupu w standardowym jobie backendu.
- Build/typecheck/lint nowego skryptu PASS. Żadne dane produkcyjne nie trafiły
  do lokalnej bazy testowej ani dev. Raporty zawierają wyłącznie agregaty.

## Rollout / wykonanie

**DONE — 2026-10-26, 12:51:39 Europe/Warsaw.** Narzędzie z `8aa1c7b8`
wykonało jeden apply zgodnego planu SHA powyżej: **192 rekordy** z tabel
w manifeście, w tym 21 testowych klientek, 70 wizyt i 12 produktów.
Raport hosta potwierdza `retainedDataUnchanged=true`,
`importLinksUnchanged=true`. Prywatny backup sprzed operacji znajduje się w
`~/db-backups/pre-synthetic-cleanup-20261026T114254.dump`: 1 427 706 bajtów,
tryb 0600, 82 wpisy TABLE DATA; format i tożsamość bazy zweryfikowane.
Nie przeprowadzono pełnego restore-drill.

CI dokładnego kodu `8aa1c7b8`: run `40317355479` SUCCESS; staging API
`40317833037` SUCCESS. Operacja danych była odrębna od deploymentu aplikacji;
produkcja pozostała na `328d362f`, bez migracji schematu/restartu/merge.

**Niezależny odczyt 2026-10-26, 18:12 Europe/Warsaw:** 1047 klientek,
10 109 wizyt, 144 opinie, dwa konta admina; identyczne liczby linków Booksy,
zero zerwanych linków. Produkty, kategorie, dostawcy i wskazane dokumenty
magazynowe: zero. Świeży plan `counts={}`; SHA
`cef5682674b50b7e6fb25a96fa6f5011139c8edfeb0d26fa6c70c5151f49d419`.
SHA może zmieniać się wraz z pozostającymi danymi; kryterium idempotencji
jest pusty wybór. Nie wykonano ponownego apply. Produkcyjny health 200,
database/smtp/instagram `ok`.

Wcześniejsze PENDING w tym journalu i plan-only w PROJECT_STATE były błędnym
opisem faktycznego stanu po wykonanej operacji. Nowe zlecenie cleanupu
rozliczono przez świeżą kontrolę, bez powtórzenia destrukcyjnego zapisu.

## Kontrole i rollback

Dump pozostaje prywatnie na MyDevil, poza katalogiem publicznym. Nagłówek,
format, uprawnienia i lista pg_restore nie są dowodem pełnego restore-drill.
Przed COMMIT błąd oznacza rollback całej operacji. Po COMMIT odtworzenie danych
wymaga kontrolowanego przywrócenia ze świeżego dumpa; nigdy automatycznego
nadpisania całej produkcji. Kodu aplikacji nie trzeba cofać: nie zmieniamy
endpointów ani migracji.

Usunięcie dodatkowej karty E2E oznacza, że stare produkcyjne sekrety E2E
klientki nie mają już odpowiadającego konta. Nie odtwarzać fixture na produkcji.
Dalsze testy zapisujące wyłącznie na dev; biznesowy UAT ownera pozostaje osobną
akceptacją, a prawdziwe dostarczenie wiadomości osobnym testem odbiorcy.

## Follow-up

Kontynuować przygotowanie migracji na zaakceptowanym snapshotcie 23.10.
Świeży eksport nie blokuje prac przygotowawczych; jest potrzebny dopiero do
końcowego reconciliation/GO/importu. Anonimowe wizyty, nakładanie i przeszłe
confirmed pozostają wyjątkami do rozstrzygnięcia przed finalnym importem.
Booksy pozostaje aktywne; nie importować przyszłych wizyt bez GO.
