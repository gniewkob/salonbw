# Czysty dataset syntetyczny przed live

- **Data:** 2026-07-28
- **Agent:** Codex
- **Commit(y):** `013fd510`, `a887695b`, `8d6438f0`, `99f75bb2`,
  `0397caab`, `58924a79`
- **PR:** brak

## Finding

Produkcyjny panel jest nadal rozwijany i używany wyłącznie przez zespół, ale
baza zawiera stare artefakty QA oraz rozbudowany magazyn testowy. Owner posiada
zrzut Versum, lecz zdecydował, że przed live nie wolno ładować danych klientów
ani realnych cen materiałów. Dotychczas brakowało powtarzalnego, fail-closed
narzędzia do przygotowania czystego środowiska testowego.

## Change

Dodano cztery komendy operatorskie: `synthetic:data:plan`, `verify`, `apply`
i `cleanup`. Generator tworzy deterministyczny dataset bez PII. Warstwa store
ma jawny rejestr tabel, kontrolę nieoczekiwanych FK, markerowy cleanup i
zredagowane raporty. `apply` resetuje, seeduje i weryfikuje w jednej transakcji;
zapis wymaga trybu pre-live, jawnej frazy, dwóch chronionych kont i świeżego
dumpa.

Zaktualizowano plan projektu: zrzut Versum pozostaje offline, a jego import jest
odłożony do osobnego okna po decyzji GO.

## Validation

- TDD: wszystkie nowe moduły najpierw potwierdzone testem RED.
- Pełny `jest --runInBand`: 40 suite, 281 testów, wszystkie zielone.
- Celowany ESLint nowych plików: 0 błędów i ostrzeżeń. Pełny lint backendu:
  0 błędów, 176 istniejących ostrzeżeń poza zakresem.
- `tsc --project tsconfig.build.json --noEmit`: exit 0.
- `nest build`: exit 0.
- `pnpm synthetic:data:plan -- --help`: exit 0, bez połączenia z bazą.
- Nie wykonywano `apply`, `cleanup` ani importu Versum.

## Rollout

Nie dotyczy na tym etapie; narzędzie nie zostało uruchomione na bazie.

## Follow-up

Po przełączeniu trwałego konta CI uruchomić read-only `plan`, przejrzeć raport,
wykonać świeży `pg_dump` i uzyskać osobną zgodę ownera na `apply`.
