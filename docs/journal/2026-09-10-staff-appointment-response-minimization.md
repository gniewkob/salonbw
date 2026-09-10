# Minimalizacja danych szczegółów wizyty dla personelu

- **Data:** 2026-09-10
- **Agent:** Codex
- **Commit(y):** ten commit
- **PR:** brak

## Finding

Nowy odczyt `GET /appointments/:id`, używany do otwierania wizyty z
bezpośredniego linku, zwracał surową encję `Appointment` z pełnymi relacjami
klienta, pracownika i usługi. Test fail-first wykazał, że poza danymi
potrzebnymi w szufladzie panel otrzymywał m.in. adres klientki, dane kontaktowe
i podstawę prowizji pracownika, prywatny opis i prowizję usługi oraz techniczny
stan przypomnień.

Regeneracja OpenAPI ujawniła dodatkowo, że globalne wymuszenie
`path-to-regexp` 0.1.13 zastępowało wersję 8.4.2 wymaganą przez
`@nestjs/swagger`. Generator kończył się błędem `parse is not a function`, więc
kontrakt był nieaktualny.

## Change

- Dodano jawny `StaffAppointmentResponseDto` i mapper wybierający wyłącznie
  pola używane podczas przygotowania, obsługi i finalizacji wizyty.
- Klient zawiera tylko identyfikator, nazwę, telefon i e-mail; pracownik tylko
  identyfikator i nazwę; usługa tylko dane potrzebne w panelu wizyty.
- Dokumentacja `GET /appointments/:id` wskazuje nowy kontrakt. Istniejąca lista
  wizyt ma ponownie jawnie opisany typ tablicowy.
- Zakres override zależności pozostawia załataną linię 0.1.x dla Express, ale
  pozwala `@nestjs/swagger` używać deklarowanej wersji 8.4.2. Odświeżono OpenAPI
  i paczkę typów API.

## Validation

- Test fail-first kontrolera: przed mapperem 10 nadmiarowych pól, po zmianie
  13/13 testów PASS.
- Backend: 51 zestawów, 402/402 testy PASS; typecheck, lint i build PASS.
- Panel: 96 zestawów, 391/391 testów PASS; typecheck i build produkcyjny PASS.
- Generator Swagger oraz `@salonbw/api` generate/build PASS.
- OpenAPI: 98 tras; względem poprzedniego pliku 22 dodane i 0 usuniętych.
- Audyt zależności produkcyjnych: 0 high/critical, 3 moderate.

## Rollout

Oczekuje na push, CI, Deploy i weryfikację produkcyjną.

## Follow-up

Przejść realny UAT właścicielki na jednym oznaczonym zestawie danych przed
importem danych rzeczywistych.
