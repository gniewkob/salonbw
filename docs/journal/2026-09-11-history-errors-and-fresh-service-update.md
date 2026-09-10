# Wiarygodna historia przygotowania i świeża odpowiedź po edycji usługi

- **Data:** 2026-09-11
- **Agent:** Codex
- **Commit(y):** bieżący commit
- **PR:** brak

## Finding

Sekcja przygotowania oznaczała każde nieudane pobranie formuł, zużycia lub
historii wizyt jako zakończone ładowanie. W rezultacie awaria API mogła wyglądać
jak prawdziwy brak historii, na której właścicielka opiera czas i recepturę
zabiegu. Osobno `ServicesService.update()` odczytywał usługę przed
unieważnieniem cache i mógł zwrócić poprzednią nazwę lub cenę po udanym zapisie.

## Change

- Karta przygotowania pokazuje stan ładowania i jawny błąd, gdy którekolwiek z
  trzech źródeł danych zawiedzie.
- Częściowo pobrana historia pozostaje widoczna, ale komunikat o pustej historii
  pojawia się wyłącznie po trzech udanych, pustych odpowiedziach.
- Przycisk `Spróbuj ponownie` ponawia komplet trzech ograniczonych zapytań.
- Aktualizacja usługi unieważnia cache przed ponownym odczytem i zapisuje w nim
  świeży rekord użyty również w odpowiedzi.

## Validation

- Fail-first panel: odrzucone `/customers/:id/formulas` było przedstawiane jako
  `Brak zapisanej historii przygotowania.`
- Fail-first backend: rozgrzany cache zwracał obiekt `Old` po aktualizacji do
  `New`.
- Testy celowane po poprawce: PASS.
- Backend: 51 zestawów, 408 testów; typecheck, lint i build PASS.
- Panel: 96 zestawów, 392 testy; typecheck, lint i build PASS.
- `git diff --check`: PASS.

## Rollout

Oczekuje na commit, CI, Deploy oraz bezpieczną weryfikację produkcyjną bez
modyfikowania danych klientek.

## Follow-up

F3/F8: zabezpieczyć import przed usuwaniem używanych wariantów i dodać
wiarygodny dry-run przed właściwym importem danych.
