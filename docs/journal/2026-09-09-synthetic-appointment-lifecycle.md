# Syntetyczny test pełnego cyklu wizyty

- **Data:** 2026-09-09
- **Agent:** Codex
- **Commit(y):** bieżący commit + dokumentacja wyników wdrożenia
- **PR:** brak; master

## Finding

Dotychczasowe testy chroniły pojedyncze operacje, ale nie wykonywały jednego
spójnego przebiegu od rezerwacji online do rozliczenia. Historyczny
`appointments.e2e-spec.ts` nie uruchamia się w aktualnym środowisku: zatrzymuje
się podczas budowy modułu na brakującym providerze logowania i niedziałającym
sterowniku SQLite. Nie jest wykonywany przez CI.

Nowy scenariusz fail-first na izolowanym PostgreSQL ujawnił dwa błędy procesu:

- finalizacja z produktem próbowała przypisać prowizję za usługę i prowizję za
  produkt do tej samej wizyty. Unikalny indeks bazy odrzucał drugi zapis; przy
  `POS_REQUIRE_COMMISSION=true` wycofywało to całe rozliczenie;
- zużycie materiału zapisywało `clientId=null`, dlatego historia klientki nie
  znajdowała materiałów rozchodowanych podczas jej wizyty.

Pierwszy przebieg zakończył się błędem unikalności
`IDX_commissions_appointmentId_unique`. Po pierwszej poprawce drugi przebieg
doszedł do sprawdzenia historii i otrzymał `clientId=null`. Osobny test
zgodności starych zapisów otrzymał pustą historię mimo prawidłowego
`appointmentId`. Użyto wyłącznie danych syntetycznych w jednorazowej bazie.

## Change

- Dodano do bramki CI rzeczywisty scenariusz PostgreSQL obejmujący rezerwację
  online, akceptację, wiadomości w obie strony, propozycję nowego terminu,
  akceptację klientki, finalizację oraz osobną gałąź anulowania.
- Finalizacja sprawdza w jednym przebiegu usługę dodatkową, rabat, napiwek,
  sprzedaż produktu, rozchód materiału, recepturę, zalecenia, prowizję i stany
  magazynowe.
- Prowizja produktowa używa `productSaleId` i nie zajmuje unikalnego powiązania
  wizyty przeznaczonego dla łącznej prowizji usługowej.
- Zużycie materiału przyjmuje i zapisuje `clientId`; finalizacja przekazuje
  identyfikator klientki dla obu obsługiwanych wariantów zużycia.
- Historia klientki znajduje również starsze wpisy z pustym `clientId` przez
  istniejące powiązanie `appointmentId` z wizytą. Nie jest potrzebna migracja
  ani masowa aktualizacja danych.
- Widok klientki w scenariuszu potwierdza zalecenia i zakończony status oraz
  brak kwoty, napiwku, rabatu i notatki wewnętrznej.

## Validation

- Fail-first 1: finalizacja z produktem — FAIL na unikalnym indeksie prowizji.
- Fail-first 2: po rozdzieleniu prowizji — FAIL, zapis zużycia miał
  `clientId=null`.
- Fail-first 3: starszy zapis z `clientId=null` — FAIL, historia klientki była
  pusta mimo powiązanej wizyty.
- Po poprawkach pełny scenariusz cyklu: 1/1 PASS.
- Wszystkie testy PostgreSQL w bramce: 7/7 PASS.
- Backend: 49 zestawów / 385 testów PASS.
- Typecheck i build backendu PASS. Celowany ESLint: 0 błędów, 10 wcześniejszych
  ostrzeżeń w `retail.service.ts`.
- Nie odczytywano i nie zmieniano danych produkcyjnych, nie wysyłano wiadomości.

## Rollout

Commit `13cc8388`: CI `34333128137` i Deploy `34333128066` zakończone
`success`. Wszystkie zadania CI były zielone, w tym backend z rozszerzoną
bramką PostgreSQL, bezpieczeństwo i skan sekretów. Produkcyjne `/healthz` po
wdrożeniu: HTTP 200; database, smtp i instagram `ok`. W wykonywanym artefakcie
API potwierdzono rozdzielenie prowizji produktowej, przekazanie `clientId` z
wizyty oraz zgodność historii starszych zużyć. Nie wywołano żadnego endpointu
zapisu i nie użyto kont klientek.

Zmiana nie dodaje migracji. Rollback: revert changesetu i ponowne wdrożenie
API; nowe wartości `clientId` w historii są kompatybilne ze starszą wersją.

## Follow-up

Przygotować krótki realny UAT właścicielki na jednym oznaczonym zestawie danych:
rezerwacja na telefonie, odbiór powiadomienia, odpowiedź, przełożenie i jedno
rozliczenie z kontrolą wartości przed/po. Usunąć dane UAT po weryfikacji.
