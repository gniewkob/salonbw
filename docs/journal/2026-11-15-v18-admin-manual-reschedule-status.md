# SalonBW Studio V18 — ręczne przesunięcie bez fałszywego statusu oczekiwania

- Data: 2026-11-15
- Typ: TYPE B / PRELAUNCH / DEV syntetyczny
- PR: #1705, Draft
- Punkt wejściowy: `PATCH /appointments/:id/reschedule`

## Finding

W `AppointmentsService.reschedule` każda zmiana terminu automatycznie
ustawiała `rescheduled_pending`, nawet przy ręcznym przeniesieniu wizyty
przez właścicielkę Studio V18. Skutkiem była myląca informacja
`Zmiana do potwierdzenia` / `Czeka na klienta`. Jednocześnie ten
sam endpoint obsługuje rzeczywiste propozycje terminu klientowi i ich
akceptację: bezwarunkowa zmiana statusu na `scheduled` złamałaby
dotychczasowy proces.

## Zmiana biznesowa

Wprowadzono opcjonalne `confirmImmediately: true` **tylko dla Admin**:

- `scheduled` i `confirmed` zachowują dotychczasowy status po
  ręcznym przeniesieniu terminu, zarówno w formularzu Studio V18,
  jak i przy drag-and-drop (również świadome nadpisanie kolizji).
- Domyślna ścieżka bez flagi nadal ustawia `rescheduled_pending` i
  zachowuje `reschedulePreviousStartTime/EndTime` dla propozycji.
- Już oczekująca propozycja nie może zostać po cichu zatwierdzona
  flagą — serwis odrzuca tę próbę. Uprawnienia kontroluje i HTTP
  kontroler, i sam serwis; Employee/Receptionist nie mogą użyć flagi.
- Kontrola kolizji, hard blocks, czas trwania usługi, transakcje,
  przypomnienia i powiadomienie klienta o przesunięciu bez zmian.
  Zapis audytu rozróżnia `owner_manual` od `client_proposal`.
- Klasyczny kalendarz i inne istniejące wywołania endpointu
  nie przekazują nowej flagi; ich semantyka pozostaje dotychczasowa.

## Testy / dowód

- Dodano testy jednostkowe serwisu: pozostawienie statusu
  scheduled/confirmed, odmowa dla staff, odmowa konwersji oczekującej
  propozycji oraz log audit.
- Dodano testy kontrolera i DTO: propagacja, role admin, boolean-only.
- Dodano jednostkowe testy panelu dla admin drag i non-admin.
- Dopasowano real-stack mobilny CRUD, desktop DnD i syntetyczny
  mobilny UAT; oczekują `scheduled` i potwierdzają flagę.
- W Docker runnerze dołączono backend `appointments.service.spec.ts`,
  `appointments.controller.spec.ts` oraz panelowy
  `v18CalendarPilot.test.tsx`.
- Odczyt wszystkich 13 zmienionych istotnych plików z aktualnego
  GitHub HEAD: **31/31 kontroli źródłowych PASS**.
- **Brak uruchomienia pełnych testów** Jest, tsc, NestJS/Next build,
  Playwright oraz PostgreSQL na tym nowym SHA. Wyniki wcześniej
  wykonanych QA obowiązują tylko ich konkretny SHA.
- **Brak merge/deploy i modyfikacji DEV/PROD**; zero działań na
  klientach, sesjach i ACL.

## Następny krok

Wykonać istniejący jednokrokowy Docker UAT na końcowym SHA, który
sprawdzi testy jednostkowe i cztery niezależne scenariusze
`owner CRUD`, `PG verification`, `mobile tap`, `desktop DnD`.
Jeżeli przejdzie, wykonać kontrolowany deploy DEV z danymi syntetycznymi.
Nie scalać ani nie wdrażać na produkcję bez osobnej bramki bezpieczeństwa
i odbioru. P0 PostgreSQL ACL #1706 pozostaje nierozwiązane.
