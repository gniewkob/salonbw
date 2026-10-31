# Aktualizacja zależności bezpieczeństwa

- **Data:** 2026-10-31
- **Agent:** Codex
- **Baza:** `b208e36ebb9df508bc8f4555346d1de9ffa5e9b7`

## Finding

`follow-redirects` 1.16.1 (GHSA-mrwp-f3q8-3g9p) jest w produkcyjnym grafie backendu przez axios; `joi` 18.3.0 (GHSA-4528-x5fx-h6hg) jest w deweloperskim grafie landingu przez start-server-and-test i wait-on.

## Change

Dwa minimalne override i lockfile pnpm 10.14.0: odpowiednio 1.16.2 i 18.3.1. Żadnych nowych wyjątków audytu.

## Validation

Frozen-lockfile install zakończony pomyślnie; `pnpm audit --audit-level=high` nie wykazał HIGH/CRITICAL (2 moderate, 1 low). Wyniki testów i dokładnego CI należy sprawdzić w PR.

## Rollout

Bez deploymentu. Merge wymaga zielonych kontroli i review.

## Follow-up

Zweryfikować wyniki testów, CI i advisory po publikacji PR. Osobno #1573: serwer PostgreSQL zgłosił `ssl=off`; wyjaśnić z dostawcą transport i możliwość verified TLS przed decyzją o konfiguracji.

## Follow-up: produkcyjny npm (2026-10-31)

Npm na MyDevil instaluje z manifestu backendu, nie z lockfile pnpm. Zastąpiono
przestarzałe overrides zakresowymi wersjami `ip-address` i `js-yaml`, dodano
`follow-redirects`, ignorowanie istniejącego npm lockfile i bramkę sprawdzającą
manifest przed uploadem oraz całe zainstalowane drzewo przed migracją/restartem.
Bramka pochodzi z rewizji workflow; historyczny release bez wymaganych overrides
jest odrzucany przed zmianą hosta. Pozostała część grafu npm nie jest utrwalona.
Testy bramki obejmują zagrożone kopie zagnieżdżone i starszy manifest.
Weryfikacja izolowana na FreeBSD i wyniki CI: patrz opis aktualnego PR #1576.
Nie uruchamiano deploymentu.
