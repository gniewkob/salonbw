# Automatyczne odświeżanie tokenu Instagrama

- **Data:** 2026-10-24
- **Agent:** Claude Opus 5.5
- **Commit(y):** ten commit
- **PR:** brak

## Finding

Długoterminowy token Instagrama wygasa po ok. 60 dniach, a po wygaśnięciu da
się go tylko wygenerować ręcznie w panelu Meta (dziś: błąd
`oauthexception_190`, ręczna rotacja — patrz
[journal](2026-10-24-instagram-token-rotacja.md)). Nic go nie odświeżało.

## Change

- `scripts/safe-update-instagram-token.sh --refresh`: czyta bieżący token
  z `.env` API na serwerze (przez SSH, bez wypisywania), wymienia go na nowy
  60-dniowy przez `graph.instagram.com/refresh_access_token`
  (`grant_type=ig_refresh_token`), a dalej działa jak dotąd: walidacja,
  zapis w `.env` API/landingu/panelu z kopią zapasową, restart domen,
  sprawdzenie `/healthz`. Do logu trafia tylko `expires_in_days`.
- `.github/workflows/ops_instagram_token_refresh.yml`: co tydzień w niedzielę
  01:30 UTC (salon zamknięty, bo skrypt restartuje aplikacje) + ręczne
  uruchomienie. `permissions: contents: read`, concurrency guard,
  `environment: production`, konfiguracja SSH jak w deployu, sprzątanie
  klucza na końcu.
- Wpisy rejestru w `docs/AGENT_OPERATIONS.md` (macierz uprawnień) i
  `docs/AGENT_STATUS.md` (wymaga ich kontrola CI).

## Validation

- `bash -n` skryptu: OK.
- Test `--refresh` z podstawionym `ssh` i testowym `.env`: token odczytany
  poprawnie dla zapisu `"…"`, `'…'` i bez cudzysłowów; brak klucza →
  „INSTAGRAM_ACCESS_TOKEN not found”; fałszywy token → „refresh failed
  reason=400”, exit 1, token nie wypisany.
- `scripts/check-ops-workflows.sh`, `scripts/check-ops-workflow-docs-consistency.sh`:
  OK. YAML workflowu parsuje się (schedule + workflow_dispatch, 4 kroki).
- Nie uruchomiono na produkcji: Instagram odświeża tylko tokeny starsze niż
  24 h, a obecny wygenerowano 2026-10-24.

## Rollout

Workflow aktywny po pushu na `master`. Pierwsze zaplanowane uruchomienie:
niedziela 2026-11-01, 01:30 UTC. Ręczne uruchomienie ma sens najwcześniej
2026-10-25 wieczorem.

## Follow-up

- Po pierwszym przebiegu sprawdzić log (`instagram_token_refresh=ok
  expires_in_days=…`) i `/healthz`.
- Nieudany zaplanowany przebieg GitHub zgłasza mailem; termin awaryjny
  ręcznej rotacji: przed 2026-12-23.
