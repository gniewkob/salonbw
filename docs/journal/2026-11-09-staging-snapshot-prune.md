# Ograniczona retencja snapshotów rollback DEV (#1673)
- **Data:** 2026-11-09
- **Agent:** Claude Opus 5.5
- **Commit(y):** `50434c14b` + ten wpis
- **PR:** brak (branch `fix/staging-snapshot-prune-1673`)

## Finding
Konto MyDevil: `devil info limits` 94,61% (47,3G/50G). `~/.deployment-private/staging-rollback`
zajmuje ok. 23 GiB: panelbw_dev 44 snapshoty w 5 dni (~434 MiB każdy, z czego ~426 MiB
to `node_modules`; tylko 2 różne hashe `package-lock`, brak hardlinków), api_salonbw_dev 9,
salonbw 6 + `uat-selective-20261028-1350`. Przyczyna: `prepare` w
`scripts/mydevil/staging-release-snapshot.sh` robi pełne `cp -Rp` przy każdym deployu
staging, a `deploy.yml` nigdy nie wołał `finalize`. Inne duże katalogi (poza zakresem):
mail 8,2G, apps 6,0G, `production-p0` 2,8G (produkcja, nie ruszane).

## Change
- `staging-release-snapshot.sh`: tryb `prune` (domyślnie dry-run, `--execute` usuwa),
  zostawia `DEPLOY_SNAPSHOT_KEEP` (domyślnie 3, min. 2) najnowszych snapshotów
  `<run_id>-<attempt>` per aplikacja; chroni bieżący/nowsze tokeny, nazwy inne niż run,
  `.pending-*`, `KEEP`, `ROLLED_BACK` < 7 dni, `DEPLOY_SNAPSHOT_PROTECT`, złą tożsamość.
  Usunięcia logowane do `prune.log`. Wspólna blokada `.lock` dla prepare/rollback/finalize/prune
  (przejmowanie porzuconej). `rollback` zapisuje `ROLLED_BACK`.
- `deploy.yml`: krok „Prune old development snapshots" po pełnym sukcesie staging;
  usuwa tylko przy `SNAPSHOT_PRUNE_EXECUTE=true`.
- `docs/DEV_DEPLOYMENT_POLICY.md`: opis retencji i przypinania.

## Validation
- `scripts/test-mydevil-release-rollback.sh`: PASS (dotychczasowe + nowe przypadki prune i blokady).
- `scripts/check-ops-workflows.sh`, `scripts/check-ops-workflow-docs-consistency.sh`: OK; YAML parsuje się.
- Dry-run na hoście (chronione `42619480638-1`, `42089478848-1`): panel 40 kandydatów
  / 17 445 334 KiB, API 6 / 1 643 658 KiB, landing 2 / 804 696 KiB; razem ~19 GiB.
  Brak `.lock` i `prune.log` po próbie — nic nie usunięto.

## Rollout
Nie dotyczy (brak merge, brak deployu, brak usunięć na hoście).

## Follow-up
Decyzja ownera: zmiana polityki z #1673 („5 + 72h" zostawiłoby ~25 kopii panelu) na
„ostatnie N + przypięcia", zgoda na pierwsze `prune --execute` lub ustawienie
`SNAPSHOT_PRUNE_EXECUTE=true` po merge, `touch KEEP` dla `42089478848-1`, jeśli ma zostać.
