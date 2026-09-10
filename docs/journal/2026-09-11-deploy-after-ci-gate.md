# Bramka CI przed wdrożeniem tego samego SHA

- **Data:** 2026-09-11
- **Agent:** Codex
- **Commit(y):** bieżący commit
- **PR:** brak

## Finding

`Deploy (MyDevil)` startował bezpośrednio po pushu równolegle z CI. Świeży run
F2 potwierdził ryzyko: Deploy `34538216861` zakończył się sukcesem, gdy CI
`34538216816` nadal trwało. Automatyczny deploy `master` używał GitHub
environment `staging`, choć `DEPLOY_ENV` wybierał produkcyjne ścieżki.

## Change

- Workflow rozwiązuje ref wejściowy przez GitHub API do pełnego, niezmiennego
  SHA i checkoutuje właśnie ten commit.
- `scripts/ci/wait-for-ci-success.sh` wyszukuje run `CI` dla dokładnie tego SHA.
  Dopiero wynik `completed/success` otwiera dalsze kroki; failure, cancellation,
  brak wyniku przez 30 minut i inne zakończenia przerywają deploy.
- Bramka działa przed instalacją zależności, buildem, SSH, uploadem, migracjami
  i restartem. Probe pozostaje oddzielnym, bezkodowym testem połączenia.
- Push `master` korzysta teraz z GitHub environment `production`, zgodnie z
  produkcyjnymi ścieżkami `DEPLOY_ENV`.
- Instrukcje repozytorium i runbooki opisują nową kolejność.

## Validation

- Fail-first: `scripts/check-ops-workflows.sh` zgłosił brak skryptu bramki.
- Test mock: success zaakceptowany; failure i skrócone SHA odrzucone.
- Rzeczywisty odczyt GitHub: pełny SHA `ef81d225...` został powiązany z CI
  `34538216816` i zaakceptowany dopiero jako `completed/success`.
- `scripts/check-ops-workflows.sh`: PASS.
- `bash -n` dla trzech skryptów: PASS.
- Parser YAML i Prettier dla `deploy.yml`: PASS; `git diff --check`: PASS.

## Rollout

Commit `86fbbf60`, CI `34538833580` success. Deploy `34538833612` rozpoczął krok
`Wait for successful CI` o 22:43:35 UTC i zakończył go powodzeniem dopiero o
22:48:41 UTC, po zakończeniu CI dla dokładnego SHA
`86fbbf603e7964ccee470ccc7347e99fdf6eb100`. Instalacja zależności i buildy
pozostawały do tego czasu zablokowane. Końcowy wynik Deploy jest monitorowany.

## Follow-up

F5/F7: rozróżnić błąd historii przygotowania od pustej historii oraz zwracać
świeże dane po edycji usługi.
