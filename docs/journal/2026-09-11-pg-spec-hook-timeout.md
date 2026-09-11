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
produkcyjnego. Numery runów CI/Deploy do uzupełnienia po przebiegu na PR.

## Follow-up

Po zielonym CI na tym SHA: doprowadzić `d2d4ff18` (F3/F8) do rolloutu, a potem
wykonać domyślny plan importu na rzeczywistych plikach ownera bez zapisu.
