# Powiązanie danych syntetycznych z grafikiem Oli

**Data:** 2026-07-29
**Status:** zaakceptowany projekt, przed implementacją
**Zakres:** backendowy generator danych syntetycznych i jego walidacja

## Cel

Usunąć sprzeczność, w której kalendarz poprawnie wskazuje dzień zamknięty,
ale dataset syntetyczny zawiera wtedy wizyty `in_progress`. Jedynym źródłem
prawdy o otwarciu salonu jest aktywny grafik Oli: regularne godziny, przerwy
oraz wyjątki datowe.

Zmiana nie modyfikuje publicznego wyznaczania dostępności. Obecny kalendarz
i rezerwacje już respektują grafik pracownika; poprawiany jest generator
pre-live oraz jego kontrola przed zapisem.

## Decyzja

Generator otrzyma znormalizowane przedziały pracy Oli dla całego horyzontu
datasetu. Każda syntetyczna wizyta zostanie umieszczona w całości wewnątrz
jednego dostępnego przedziału. Osobny walidator odrzuci kompletny dataset,
jeśli choć jedna wizyta naruszy grafik lub regułę czasową swojego statusu.

Nie stosujemy godzin oddziału ani zakodowanych dni tygodnia jako fallbacku.
Brak aktywnego grafiku jest blockerem.

## Model danych grafiku

Do `DatasetInput` zostanie dodana kolekcja znormalizowanych dni:

```ts
interface SyntheticWorkingDay {
    date: string; // YYYY-MM-DD w strefie salonu
    ranges: Array<{
        startMinute: number; // włącznie, od lokalnej północy
        endMinute: number; // wyłącznie
    }>;
}
```

Kolekcja zawiera każdy dzień sprawdzanego horyzontu. Pusta tablica `ranges`
oznacza jednoznacznie dzień zamknięty. Przedziały są posortowane,
niezachodzące na siebie i mają dodatnią długość.

Daty są rozstrzygane w lokalnej strefie salonu (`Europe/Warsaw`), a godziny
jako minuty od lokalnej północy. Dzięki temu zmiana czasu nie jest liczona jako
stałe przesunięcie 24 godzin.

## Rozstrzyganie grafiku

Warstwa dostępu do bazy przygotuje kalendarz dla chronionego konta
administratora będącego Olą:

1. wybiera najnowszy aktywny grafik obowiązujący danego dnia;
2. pobiera regularne przedziały pracy dla dnia tygodnia;
3. scala przedziały zachodzące lub stykające się;
4. odejmuje regularne przerwy;
5. stosuje wyjątek datowy:
   - `custom_hours` zastępuje regularne godziny podanym przedziałem;
   - dzień wolny, urlop, choroba, szkolenie i pozostałe wyjątki zwracają
     pustą listę;
6. brak obowiązującego aktywnego grafiku zgłasza jako blocker, zamiast używać
   godzin oddziału.

Semantyka odpowiada istniejącemu kontraktowi `CalendarService`: grafik
pracownika w pełni definiuje dostępność, dlatego zaplanowana niedziela jest
dniem pracy, a nieujęta w grafiku środa może być dniem zamkniętym.

## Horyzont

Resolver pobiera dni od 35 dni przed `anchorDate` do 60 dni po niej.
Zakres obejmuje obecny rozkład historyczny (do 21 dni wstecz), przyszły
(do 14 dni naprzód) oraz bufor na kolejne dni wolne.

Jeżeli w tym jawnym zakresie nie ma dość pojemności na 30 wizyt, generowanie
kończy się blockerem. Generator nie rozszerza horyzontu w sposób ukryty.

## Kolejność wykonania

Obecne tworzenie wstępnego manifestu z `ownerUserId=1` zostanie zastąpione
następującym przepływem:

1. połączenie z bazą i rozpoznanie chronionych kont;
2. wybór chronionego administratora jako ownera oraz odczyt usług;
3. odczyt i normalizacja grafiku ownera w pełnym horyzoncie;
4. wygenerowanie datasetu z rzeczywistym `ownerUserId`, usługami i grafikiem;
5. zbudowanie raportu `plan`, w tym liczności tworzonego datasetu;
6. niezależna walidacja całego datasetu;
7. dla `apply`: rozpoczęcie transakcji dopiero po przejściu powyższych kontroli,
   reset, insert, weryfikacja stanu i commit.

Tryby `plan`, `apply` i `verify` używają tej samej ścieżki przygotowania
datasetu. `cleanup` nie wymaga generowania wizyt, ale zachowuje dotychczasowe
bramki kont chronionych i schematu resetu.

## Przydzielanie wizyt

Generator zachowuje stałą liczbę 30 wizyt, stałe ziarno i dotychczasowe
zróżnicowanie klientów, usług oraz statusów, z poniższymi regułami:

- `completed`, `cancelled` i `no_show` trafiają wyłącznie do zakończonych
  przedziałów pracy przed `anchorDate`;
- `scheduled`, `confirmed`, `online_pending` i `rescheduled_pending` trafiają
  wyłącznie do przyszłych przedziałów pracy;
- `in_progress` może pozostać tym statusem tylko w dniu `anchorDate`, gdy
  chwila uruchomienia przypada w przedziale pracy Oli;
- jeśli dziś jest zamknięte albo uruchomienie wypada poza godzinami pracy,
  każda planowana pozycja `in_progress` zmienia status na `confirmed`
  i trafia do najbliższego dostępnego przyszłego terminu;
- czas trwania 30, 60 lub 90 minut musi w całości zmieścić się w jednym
  przedziale;
- terminy jednej pracowniczki nie mogą się nakładać, niezależnie od statusu.

Terminy są przydzielane stabilnie: sortowanie po dacie, początku przedziału
i kluczu syntetycznej wizyty. Ten sam `anchorDate`, grafik, owner i lista usług
dają identyczny dataset.

## Niezależna walidacja

Walidator nie wybiera terminów. Otrzymuje gotowy dataset oraz znormalizowany
grafik i osobno sprawdza:

- identyfikator pracownika każdej wizyty;
- poprawność dat i dodatni czas trwania;
- pełne zawarcie wizyty w jednym przedziale pracy;
- brak wizyt w pustych dniach i podczas przerw;
- brak nakładania się wizyt ownera;
- zgodność statusu z przeszłością, teraźniejszością lub przyszłością;
- regułę `in_progress` względem dnia i godzin pracy;
- kompletność horyzontu grafiku dla każdej daty wizyty.

Wykrycie naruszenia tworzy zanonimizowany blocker zawierający wyłącznie klucz
syntetycznej wizyty i kod reguły. Operacja kończy się przed mutacją.

## Błędy i raportowanie

Blockerami są:

- brak chronionego administratora lub brak aktywnego grafiku w wymaganym dniu;
- niepoprawny albo zachodzący po normalizacji przedział;
- wyjątek `custom_hours` bez obu poprawnych godzin;
- brak wystarczającej pojemności w horyzoncie;
- dowolne naruszenie wykryte przez walidator.

Raport `plan` zostanie rozszerzony o bezpieczne podsumowanie: liczba dni
roboczych, liczba dni zamkniętych, data początku i końca horyzontu oraz liczba
wizyt przeniesionych z `in_progress` do `confirmed`. Raport nie zawiera danych
klientów, sekretów ani surowej treści grafiku.

## Testy

Implementacja przebiega test-first. Pokrycie obejmuje:

1. dzień roboczy i wizyty w całości wewnątrz godzin Oli;
2. dzień wolny: zero wizyt tego dnia i konwersja `in_progress` na przyszłe
   `confirmed`;
3. urlop i inny wyjątek zamykający dzień;
4. `custom_hours`;
5. regularną przerwę w środku zmiany;
6. pracującą niedzielę;
7. brak aktywnego grafiku;
8. brak wystarczającej pojemności w horyzoncie;
9. stabilny wynik dla tych samych danych wejściowych;
10. brak nakładających się wizyt;
11. niezależne odrzucenie ręcznie zmienionej wizyty poza grafikiem;
12. rollback `apply` po blockerze walidacji;
13. poprawne zachowanie `plan`, `verify` i `cleanup`.

Walidacja techniczna obejmuje celowane testy Jest, pełne testy modułu danych
syntetycznych, lint, typecheck oraz build backendu.

## Rollout danych

Wdrożenie kodu nie uruchamia resetu bazy. Po zielonym CI i deployu:

1. odczytowo sprawdzamy aktywny grafik Oli;
2. uruchamiamy `plan` i sprawdzamy podsumowanie grafiku oraz blockerów;
3. prosimy ownera o osobną zgodę na mutację;
4. po zgodzie wykonujemy świeży `pg_dump`;
5. wykonujemy dokładnie jedno kontrolowane `apply`;
6. uruchamiamy `verify`, `/healthz` i kontrolę kalendarza;
7. potwierdzamy, że dzień wolny jest pusty, a wszystkie wizyty mieszczą się
   w grafiku;
8. ponownie obracamy tymczasowe hasło bazy po zakończeniu testów.

Rollback danych polega na przywróceniu świeżego dumpa. Rollback kodu polega na
wycofaniu jednego commita; wcześniejszy dataset pozostaje zgodny ze schematem.

## Odrzucone warianty

- Tylko tygodniowe godziny bez wyjątków: nie respektują urlopu i dni
  niestandardowych.
- Zakodowane dni wolne: rozchodzą się z panelem po każdej zmianie grafiku.
- Fallback do godzin oddziału: narusza zatwierdzoną regułę, że zamknięcie jest
  w 100% powiązane z grafikiem Oli.

## Poza zakresem

- zmiana logiki dostępności rezerwacji i endpointu godzin otwarcia;
- import danych klientów lub magazynu z Versum;
- zmiana realnych usług, cen albo grafiku Oli;
- automatyczne `apply` podczas deployu;
- uruchomienie resetu bez świeżego backupu i odrębnej zgody ownera.
