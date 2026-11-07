# Studio V18 — kryteria odbioru modułu Klienci

**Status: W TRAKCIE.** Dokument stanowi wewnętrzne kryterium produktowe SalonBW, nie wymóg zewnętrznego standardu.

## Zasada zamknięcia

Moduł Klienci uznajemy za ukończony dopiero, gdy użytkownik może zrealizować codzienne operacje CRM **wewnątrz V18, bez przechodzenia do starej karty klienta**. Samo CI PASS, wdrożenie lub poprawny screenshot nie oznaczają DONE. Po zakończeniu prac przeprowadzamy jeden odbiór funkcjonalny i wizualny całego modułu oraz maksymalnie dwie planowane rundy poprawek; błędy blokujące wymagają naprawy niezależnie od limitu rund.

## Funkcjonalność — wszystkie punkty obowiązkowe

| ID | Scenariusz | Kryterium PASS | Dowód odbioru |
|---|---|---|---|
| C01 | Lista klientów | API, wyszukiwanie, sortowanie, paginacja, segmenty, filtry grup/tagów/płci, reset filtrów i stany puste/błędu | E2E + DEV |
| C02 | Tworzenie klienta | Wyłącznie nowa karta V18, walidacja, możliwość wykrycia duplikatu, zapis do CRM, przekierowanie na kartę | E2E + DEV |
| C03 | Karta klienta | Dane i zgody, grupy/tagi, poprawne statystyki, aktualizacja po zmianie, brak przejścia do starej karty | E2E + DEV |
| C04 | Edycja i usuwanie | Istniejące API, walidacja, potwierdzenie usunięcia, bez utraty niezwiązanych danych | E2E + DEV |
| C05 | Historia wizyt | Pełna lista, statusy, filtrowanie po datach, szczegóły, historia produktów/usług; zachowane możliwości starego CRM | E2E + DEV |
| C06 | Statystyki klienta | Zakres dat, wizyty, wydatki, produkty i usługi; zgodne wartości API | E2E + DEV |
| C07 | Notatki | Odczyt, utworzenie, aktualizacja i usunięcie, typy i oznaczenia; komunikaty sukcesu/błędu | E2E + DEV |
| C08 | Komunikacja i zgody | Statusy zgód, historie SMS/e-mail, edycja w V18 bez linku do starego edytora | E2E + DEV |
| C09 | Galeria | Odczyt, dodanie, podgląd i usuwanie zdjęć, bez wycieku danych między klientami | E2E + DEV |
| C10 | Dokumenty | Odczyt, dodanie, pobranie, filtrowanie i usunięcie plików | E2E + DEV |
| C11 | Grupy i tagi | Katalog, przypisania, operacje zbiorcze, poprawny widok odświeżony po zapisaniu | E2E + DEV |
| C12 | Rezerwacja z karty | Jeden zablokowany klient, poprawny termin i pracownik, kontrola konfliktów i zapis pojedynczej wizyty | E2E + DEV |

## Spójność i jakość — bramki obowiązkowe

- **V18 UI:** wspólne komponenty, siatka, typografia, lista wyboru bez systemowego popupu tam, gdzie mamy stylizowany selektor; selektor daty bez podwójnego miesiąca/roku.
- **Lokalizacja:** wybór daty respektuje język interfejsu `pl/de/en`; serializacja do API pozostaje niezależna od języka. Wszystkie nowe teksty wymagają przeglądu przygotowującego wielojęzyczność całego panelu.
- **Responsywność:** 390 px i 1366 px, brak poziomego przewijania całej strony, poprawne okna dialogowe i menu.
- **Dostępność:** etykiety, focus, klawiatura, Escape, stany loading/empty/error, potwierdzenia operacji destrukcyjnych.
- **Integralność:** bez nowych równoległych endpointów CRM, bez zmian uprawnień i bez przypadkowych zapisów w testach; Playwright używa wyłącznie danych syntetycznych i mocków.
- **Release:** Fast Checks PASS, pełne CI PASS dla dokładnego SHA, staging panel deploy PASS, testy przeglądarkowe PASS, ręczny odbiór użytkownika. Produkcja tylko po osobnej decyzji.

## Stan i otwarte działania

- **Dostępne w V18:** lista, wyszukiwanie/filtry, grupy i tagi, tworzenie, edycja, profil, selektory dat, booking z przypisanym klientem.
- **Włączone do bieżącej gałęzi jako adaptacja istniejącego CRM:** historia, statystyki szczegółowe, notatki, komunikacja, zdjęcia i dokumenty. Używają oryginalnych hooków/API — nie są jeszcze odebrane wizualnie ani funkcjonalnie.
- **Do domknięcia:** usunięcie pozostałych systemowych dropdownów w osadzonych sekcjach; przegląd linków do innych starych modułów; testy E2E dla każdej operacji zapisu; pełny odbiór responsywności, galerii i plików.
- **Nie uznawać za DONE** do zakończenia wszystkich pozycji i zebrania dowodów w PR.

## Następny moduł

Po podpisaniu odbioru Klientów: **Kalendarz i Wizyty V18**. Jako wzorzec komponentu mini-kalendarza wykorzystać istniejącą sekcję z `apps/panel/src/pages/studio-v18.tsx` i `apps/panel/src/styles/StudioV18.module.css`; nie projektować trzeciego wariantu.
