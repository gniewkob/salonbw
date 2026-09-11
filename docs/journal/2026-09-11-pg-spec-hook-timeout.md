# Bramka PostgreSQL w CI padała na limicie hooka, nie na logice importu

- **Data:** 2026-09-11
- **Agent:** Claude Opus 5
- **Commit(y):** bieżący commit
- **PR:** draft dla `claude/development-status-1xv0z4`

## Finding

Po `d2d4ff18` CI `34573029409` skończyło się `failure` w jobie „Backend API",
kroku „Test PostgreSQL business flows". Wszystkie 12 testów
`test/appointments-concurrency.pg-spec.ts` zgłosiło ten sam błąd:

```
thrown: "Exceeded timeout of 5000 ms for a hook."   → beforeAll (…pg-spec.ts:60)
Migration "CreateSettingsTables1710020000000" failed, error: Connection terminated
```

To nie była awaria importu ani migracji. `beforeAll` robi `dropSchema: true`
razem z `migrationsRun: true`, a `test/jest-e2e.json` nie ustawiał
`testTimeout`, więc hook dostawał domyślne 5 000 ms. Bootstrap schematu mieścił
się dotąd tuż pod limitem; na wolniejszym przebiegu przekroczył go, Jest zerwał
połączenie w trakcie migracji i stąd wtórne „Connection terminated". W tym samym
runie backend 414/414, lint, typecheck, buildy, panel i audyt bezpieczeństwa
były zielone. Deploy `34573029371` poprawnie zatrzymał się na bramce
„Wait for successful CI" (F6), więc `d2d4ff18` nie trafił na produkcję.

Ten sam wzorzec ma `test/password-recovery.pg-spec.ts` — nie jest uruchamiany
przez obecny krok CI, ale padłby tak samo.

## Change

- `test/jest-e2e.json`: `testTimeout: 60000` — wspólny budżet dla testów e2e,
  które pracują na prawdziwym PostgreSQL.
- `test/appointments-concurrency.pg-spec.ts` i
  `test/password-recovery.pg-spec.ts`: jawny limit `120_000` ms na `beforeAll`,
  żeby bootstrap schematu nie zależał od domyślnej wartości globalnej.

Bez zmian w kodzie produkcyjnym, skryptach importu i migracjach.

## Validation

Izolowany PostgreSQL 15 w kontenerze, wyłącznie dane syntetyczne.

- Fail-first: `--testTimeout=2000` na kodzie sprzed poprawki odtworzyło sygnaturę
  z CI — 12/12 testów przerwanych `Exceeded timeout … for a hook` w `beforeAll`.
- Po poprawce ten sam przebieg `--testTimeout=2000`: 0 wystąpień błędu hooka,
  czyli bootstrap nie dziedziczy już globalnego budżetu.
- Pełny przebieg obu specyfikacji PostgreSQL: 2 zestawy / **14 testów PASS**
  (`appointments-concurrency` 12, `password-recovery` 2), 18,2 s.
- Backend: 52 zestawy / **414 testów PASS**, 11,9 s.
- `turbo run typecheck --filter=salonbw-backend` PASS,
  `turbo run lint --filter=salonbw-backend` PASS,
  `prettier --check` na obu zmienionych plikach `.ts` PASS.
- Uwaga: `test/jest-e2e.json` nie przechodzi `prettier --check` również w wersji
  sprzed zmiany (styl pliku jest starszy niż konfiguracja). CI nie sprawdza
  formatowania JSON, więc zachowano dotychczasowe formatowanie pliku.

## Rollout

Produkcja 2026-09-11 17:14 przed zmianą: `api/healthz` 200, `database`, `smtp`
i `instagram` `ok`; panel 307, landing dev 200 — czyli działa wdrożenie
`8e57d9c6`. Zmiana dotyczy wyłącznie konfiguracji testów, nie zmienia artefaktu
produkcyjnego.

Na PR #1500 (`f0b9f606`): CI `34627357206` success, krok „Test PostgreSQL
business flows" wykonał się i trwał 21 s, czyli ponad czterokrotność
poprzedniego budżetu hooka. Claude Code Review `34627357165` success bez uwag;
review Codeksa nie wykonało się z powodu limitu konta. Po squash-merge do
mastera jako `04956d1c`: CI `34628511807` i Deploy `34628511811` success —
bramka F6 czekała na CI tego SHA od 17:35:36 do 17:40:44 UTC, po czym przeszły
build, upload, migracje, restart i smoke test backendu. Produkcja 18:09:
`api/healthz` 200 z `database`, `smtp` i `instagram` `ok`, panel 307, landing
dev 200. Ten rollout wyniósł na produkcję również `d2d4ff18` (F3/F8).

## Follow-up

F3/F8 jest już wdrożone. Następny krok: domyślny plan importu na rzeczywistych
plikach ownera, bez zapisu. Skrypty importu są wyłącznie CLI, więc sam rollout
nie jest dowodem ich poprawności na rzeczywistych danych.
