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
