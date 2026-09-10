# Ścieżka pracownika: kalendarz i przygotowanie wizyty

- **Data:** 2026-09-09
- **Agent:** Codex
- **Commit(y):** bieżący commit + dokumentacja wyników wdrożenia
- **PR:** brak; master

## Finding

Po wdrożeniu historii przygotowania sprawdzono ją w roli właścicielki/admina,
ale nie wykonano osobnego przebiegu roli `employee`.

Przegląd ujawnił dwa konkretne problemy:

- panel ukrywał wizyty innych pracowników, lecz `GET /calendar/events` ufał
  filtrowi z zapytania. Pracownik mógł pominąć filtr albo podać cudzy
  identyfikator i otrzymać z API cudze wydarzenia oraz dane klientek;
- panel potrafił otworzyć wizytę z powiadomienia poza aktualnym dniem przez
  `GET /appointments/:id`, ale API nie udostępniało takiego odczytu. Link
  kończył się odpowiedzią 404.
- poboczne operacje pracownika nie stosowały jednej reguły własności. Dotyczyło
  to bloków czasu, sprawdzania konfliktów, przypisania przy tworzeniu i
  przełożeniu wizyty, notatek, rozmowy oraz propozycji zużycia materiałów.

Testy fail-first potwierdziły oba braki: filtr pracownika przekazywał do
serwisu obcy identyfikator, a metoda bezpośredniego odczytu nie istniała.

## Change

- Kalendarz po stronie API zawsze wymusza identyfikator zalogowanego
  pracownika. Filtr przesłany przez przeglądarkę nie może rozszerzyć jego
  widoczności. Admin i recepcja zachowują możliwość filtrowania zespołu.
- Dodano odczyt pojedynczej wizyty dla admina, recepcji i pracownika.
  Pracownik otrzymuje wizytę tylko wtedy, gdy jest do niej przypisany;
  brakująca wizyta zwraca 404, a cudza 403.
- Ta sama kontrola obejmuje przełożenie, konflikt, notatki wewnętrzne i dla
  klientki, rozmowę oraz propozycje zużycia. Termin utworzony przez pracownika
  jest przypisywany do niego, a jego blok czasu i kontrola konfliktu zawsze
  używają jego identyfikatora. Przenoszenie własnej wizyty do kalendarza innej
  osoby jest zablokowane; admin i recepcja nadal obsługują cały zespół.
- Zakres startu opisany w `PROJECT_COMPLETION_PLAN.md` nadal obejmuje
  właścicielkę jako admina. Ta poprawka zabezpiecza gotowość przyszłego konta
  pracownika, bez zmiany decyzji o zakresie GO.

## Validation

- Fail-first: próba wymuszenia `employeeIds=[99]` przez pracownika 7 — FAIL
  przed poprawką, PASS po wymuszeniu `[7]` na serwerze.
- Fail-first: bezpośredni odczyt wizyty nie istniał — 5/5 testów FAIL przed,
  PASS po dodaniu odczytu i kontroli przypisania.
- Celowane kontrolery: 2 zestawy / 17 testów PASS.
- Pełny backend: 51 zestawów / 402 testy PASS; typecheck i build PASS.
- Lint backendu: 0 błędów, 151 istniejących ostrzeżeń.
- Produkcyjny panel z przechwyconymi odpowiedziami i wyłącznie syntetycznymi
  danymi: rola pracownika widzi własną wizytę, nie widzi wizyty innej osoby,
  otwiera przygotowanie z kalendarza i bezpośredniego linku. Widoki 1366 px
  oraz 390 px, konsola 0 błędów.
- Zrzuty: `output/playwright/employee-calendar-desktop.png`,
  `output/playwright/employee-preparation-desktop.png`,
  `output/playwright/employee-preparation-mobile-390.png`,
  `output/playwright/employee-direct-link-desktop.png` i
  `output/playwright/employee-direct-link-mobile-390.png`.
- Nie użyto kont ani danych klientek i nie wykonano zapisu produkcyjnego.

## Rollout

Commit `6333c2ae`: CI `34385687700` i Deploy `34385687786` zakończone
`success`. Produkcyjne `/healthz` 2026-09-10: HTTP 200; database, smtp i
instagram `ok`. Odczyt pojedynczej wizyty i wydarzeń kalendarza bez sesji
zwraca 401.

W wykonywanym artefakcie API potwierdzono reguły: pracownik czyta i tworzy
wizyty wyłącznie we własnym kalendarzu, a lista wydarzeń wymusza identyfikator
z zalogowanej sesji. Nie wywoływano zapisu i nie użyto rzeczywistych kont.

Rollback: revert kontrolerów kalendarza i wizyt, następnie ponowne wdrożenie
API. Brak migracji i zmian danych.

## Follow-up

Jeżeli rola pracownika ma wejść do rzeczywistego zakresu uruchomienia, wykonać
UAT na osobnym koncie pracownika: logowanie, własny dzień, otwarcie wizyty,
historia koloryzacji, rozmowa, zmiana statusu i finalizacja. Obecny zakres GO
pozostawia tę rolę poza uruchomieniem.
