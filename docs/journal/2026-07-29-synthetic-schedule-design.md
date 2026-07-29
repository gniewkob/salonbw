# Projekt powiązania datasetu syntetycznego z grafikiem Oli

- **Data:** 2026-07-29
- **Agent:** Codex + owner
- **Commit(y):** bieżący commit
- **PR:** brak

## Finding

Generator w
`backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.ts`
wyznacza daty wizyt arytmetycznymi przesunięciami od dnia uruchomienia i nie
odczytuje grafiku pracownika. W efekcie utworzył cztery wizyty `in_progress`
w środę, mimo że kalendarz poprawnie wskazywał ten dzień jako zamknięty.

`CalendarService` już traktuje aktywny grafik pracownika jako pełną definicję
dostępności, wraz z przerwami i wyjątkami. Finding dotyczy generatora danych,
nie produkcyjnego wyznaczania wolnych terminów.

## Change

Owner zatwierdził wariant pełnej synchronizacji z grafikiem Oli. Zapisano
projekt obejmujący resolver grafiku, deterministyczny przydział wizyt,
konwersję niedozwolonych `in_progress` na przyszłe `confirmed`, niezależny
walidator oraz bramki kontrolowanego ponownego `apply`.

Nie zmieniono kodu wykonywalnego ani danych produkcyjnych.

## Validation

- projekt omówiony i zaakceptowany sekcjami: architektura, bezpieczeństwo,
  testy i rollout;
- specyfikacja nie zawiera `TODO`, `TBD` ani nieustalonego fallbacku;
- zakres produkcyjnej mutacji pozostaje za osobną zgodą, świeżym `pg_dump`
  i pojedynczym `apply`.

## Rollout

Nie dotyczy — zmiana dokumentacyjna. Dataset produkcyjny nie został zmieniony.

## Follow-up

Przygotować szczegółowy plan implementacji test-first, następnie wdrożyć kod
i przejść bramki CI/deploy. Po odczytowym `plan` uzyskać osobną zgodę ownera
przed świeżym dumpem i pojedynczym `apply`.
