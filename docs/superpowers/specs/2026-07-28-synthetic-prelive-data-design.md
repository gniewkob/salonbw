# Syntetyczny zestaw danych dla panelu pre-live

**Data:** 2026-07-28  
**Status:** zaakceptowany kierunek, przed implementacją  
**Zakres:** backend i operacyjne dane panelu

## Cel

Zapewnić bezpieczny, deterministyczny zestaw danych do dalszego developmentu
i UAT bez importowania klientów z Versum ani realnych cen i stanów magazynu.
Obecny panel nie ma użytkowników poza zespołem projektowym, ale reset pozostaje
operacją destrukcyjną i podlega bramkom backupu oraz jawnego potwierdzenia.

## Decyzja architektoniczna

Powstanie samodzielny CLI backendu, a nie migracja TypeORM ani seed przez API.
CLI będzie obsługiwał cztery tryby:

- `plan` — tylko odczyt; raport liczności rekordów przeznaczonych do usunięcia
  i utworzenia;
- `apply` — transakcyjny reset danych operacyjnych i utworzenie datasetu;
- `verify` — kontrola liczności, relacji, markerów i chronionych kont;
- `cleanup` — usunięcie wyłącznie danych posiadających markery syntetyczne.

Trybem domyślnym jest `plan`. Żaden zapis nie może nastąpić przez pominięcie
argumentu.

## Bramki bezpieczeństwa

Tryby zapisujące muszą zakończyć się bez zmian, jeśli nie przejdzie którykolwiek
warunek:

1. `SYNTHETIC_DATA_ALLOWED=true`;
2. `APP_LIFECYCLE=prelive`;
3. dokładna fraza `--confirm RESET_PRELIVE_DATA`;
4. wskazany `--backup-file` istnieje, jest zwykłym niepustym plikiem i ma czas
   modyfikacji nie starszy niż 30 minut;
5. jawna lista chronionych kont zawiera co najmniej aktywnego admina oraz konto
   klienta używane przez CI;
6. wszystkie chronione konta istnieją przed rozpoczęciem transakcji;
7. baza nie zawiera nieoznaczonych kont admin/employee poza chronionymi
   kontami — niejednoznaczność powoduje fail-closed.

CLI nie odczytuje ani nie loguje haseł. Hasło syntetycznego klienta logowania,
jeśli konto ma być tworzone, pochodzi wyłącznie ze zmiennej środowiskowej i do
logów trafia tylko informacja `configured=true|false`.

## Granica resetu

### Zachować

- jawnie chronione konta, w tym owner/admin i trwałe konto CI;
- konfigurację salonu i oddziału;
- katalog usług, warianty i kategorie usług;
- przypisania usług do ownera/admina;
- godziny pracy, grafiki i szablony;
- ustawienia rezerwacji, płatności, prywatności, komunikacji i integracji;
- dane techniczne wymagane do działania aplikacji.

### Usunąć przed seedem

- niechronione konta klientów i ich dane CRM;
- wizyty oraz zależne rekordy operacyjne, statystyczne i komunikacyjne;
- opinie, prowizje, lojalność i powiadomienia powiązane z resetowanymi danymi;
- produkty, kategorie produktów, dostawców i stany magazynowe;
- ruchy, zużycia, dostawy, zamówienia, sprzedaże oraz inwentaryzacje magazynu;
- pozostałe artefakty testowe jednoznacznie wskazane przez plan.

Lista tabel jest jawna i wersjonowana. Skrypt nie używa ogólnego kasowania
wszystkich tabel ani dynamicznego usuwania przez `information_schema`.
Nieoczekiwany klucz obcy przerywa transakcję zamiast rozszerzać zakres.

## Markery danych syntetycznych

- e-maile: `synthetic.client.XX@example.invalid`;
- nazwy klientów: prefiks `SYNTHETIC`;
- SKU produktów: prefiks `SYNTH-`;
- kategorie, dostawcy i dokumenty magazynowe: prefiks `SYNTHETIC`;
- notatki i komentarze: neutralne treści testowe bez nazwisk i danych salonu.

Adres `.invalid` jest zarezerwowany do testów i nie wskazuje prawdziwego
odbiorcy. Konta syntetyczne mają wyłączone powiadomienia, nie posiadają push
subscriptions i nie są zapisywane do newsletterów.

## Zawartość datasetu

### Klienci i CRM

- 12 klientów o zróżnicowanej kompletności profilu;
- tagi, grupa, źródło, notatka i pole dodatkowe na reprezentatywnym podzbiorze;
- brak prawdziwych numerów telefonu, adresów i dat urodzenia;
- jedno konto przeznaczone do logowania przez testy, jeśli podano hasło
  w środowisku.

### Wizyty i raporty

Około 30 wizyt względem dnia uruchomienia:

- przeszłe: zakończone, anulowane i no-show;
- bieżące: zaplanowane, potwierdzone i w trakcie;
- przyszłe: zwykłe oraz oczekujące online;
- część z opiniami, prowizją, napiwkiem i metodą płatności;
- co najmniej jeden klient powracający i jeden bez historii.

Generator używa stałego ziarna. Daty są relatywne do początku lokalnego dnia,
więc panel zachowuje użyteczność kalendarza, a rozkład danych jest powtarzalny.

### Magazyn

- 4 fikcyjne kategorie i 12 fikcyjnych produktów;
- ceny niemające związku z eksportem Versum;
- stany: prawidłowy, poniżej minimum i zerowy;
- 2 fikcyjnych dostawców;
- po jednej reprezentatywnej dostawie, sprzedaży, korekcie/zużyciu i zamówieniu;
- jedna zakończona inwentaryzacja, bez pozostawiania procesu „w toku”;
- receptura wybranej istniejącej usługi korzystająca wyłącznie z produktów
  `SYNTH-`.

## Idempotencja i transakcje

`apply` działa w jednej transakcji:

1. ponownie wylicza i blokuje zakres;
2. usuwa resetowane dane w jawnej kolejności zależności;
3. tworzy deterministyczny dataset;
4. wykonuje weryfikację wewnątrz transakcji;
5. zatwierdza tylko przy kompletnym wyniku.

Ponowne `apply` najpierw usuwa poprzedni dataset i odtwarza go bez duplikatów.
Błąd, utrata połączenia lub niezgodność liczności powoduje rollback.

## Raportowanie

Wyjście CLI zawiera wyłącznie:

- liczności przed i po per grupa/tabela;
- identyfikatory techniczne dokumentów syntetycznych;
- status każdej bramki;
- sumę fikcyjnych wartości magazynowych i statystycznych;
- wynik `remaining` dla resetowanych artefaktów.

Nie wolno wypisywać e-maili, telefonów, hashy haseł, sekretów ani rekordów
źródłowych. Opcjonalny raport JSON ma ten sam zanonimizowany kontrakt.

## Testy

- testy jednostkowe deterministycznego generatora i walidacji konfiguracji;
- testy fail-closed dla brakującej flagi, złej frazy, starego/brakującego
  backupu i brakującego konta chronionego;
- test transakcyjny potwierdzający rollback po błędzie w połowie;
- test idempotencji: dwa uruchomienia dają te same liczności i markery;
- test zachowania admina, konta CI, usług, grafików i ustawień;
- test kompletności relacji wizyt i magazynu;
- weryfikacja `plan` bez żadnych zapisów.

## Uruchomienie na obecnym panelu

Implementacja i jej testy mogą zostać zmergowane bez uruchamiania resetu.
Wykonanie na bazie panelu nastąpi dopiero po:

1. zielonym CI i deployu kodu;
2. odczytowym `plan` z licznościami;
3. świeżym `pg_dump`;
4. osobnej, jawnej akceptacji wyniku `plan`;
5. `apply`, `verify`, health-checku i regresji panelu.

Eksporty klientów i magazynu z Versum pozostają poza repo i poza zakresem
pre-live. Ich import będzie osobnym etapem przed publicznym uruchomieniem.

## Poza zakresem

- import lub anonimizacja plików Versum;
- zmiana katalogu usług i jego cen;
- kategoryzacja realnego magazynu;
- tworzenie dodatkowej roli pracownika;
- automatyczne wykonanie resetu przy deployu;
- uruchamianie CLI po przełączeniu `APP_LIFECYCLE` z `prelive`.
