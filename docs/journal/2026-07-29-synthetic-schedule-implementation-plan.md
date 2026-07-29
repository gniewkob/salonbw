# Plan implementacji zgodności datasetu z grafikiem Oli

- **Data:** 2026-07-29
- **Agent:** Codex + owner
- **Commit(y):** bieżący commit
- **PR:** brak

## Finding

Zaakceptowana specyfikacja wymagała planu wykonawczego, który zachowa
fail-first, granicę transakcji oraz osobną zgodę na produkcyjny reset.
Dotychczasowy generator tworzy manifest przed rozpoznaniem rzeczywistego
ownera i nie ma interfejsu na znormalizowany grafik.

## Change

Przygotowano sześcioczęściowy plan implementacji: resolver grafiku, alokator
wizyt, niezależny walidator, adapter PostgreSQL, orkiestrator oraz raportowanie
z dokumentacją operatora. Każda część ma wskazane interfejsy, test RED/GREEN,
komendy i osobny commit.

Nie zmieniono kodu wykonywalnego ani danych produkcyjnych.

## Validation

- plan pokrywa regularne godziny, przerwy, wyjątki, pracującą niedzielę,
  zamknięty dzień i brak pojemności;
- walidacja manifestu następuje przed transakcją, a rzeczywistych rekordów
  ponownie wewnątrz transakcji;
- `cleanup` nie wymaga generowania datasetu ani odczytu grafiku;
- produkcyjny `apply` pozostaje poza wykonaniem planu i wymaga nowej zgody.

## Rollout

Nie dotyczy — zmiana dokumentacyjna nie wpływa na runtime ani dane.

## Follow-up

Owner wybiera tryb wykonania planu. Po implementacji i zielonym deployu agent
wykonuje tylko odczytowy `plan`; dump i pojedyncze `apply` są osobnym krokiem.
