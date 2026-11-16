# Prawa decyzyjne ownera i klasy ryzyka dla agentów

- **Data:** 2026-11-16
- **Agent:** Claude (sesja review z ownerem)
- **Commit(y):** ten commit
- **PR:** do otwarcia przez ownera z gałęzi `chore/decision-rights-risk-classes-20261116`
- **Klasa:** B (zmienia zasady pracy wszystkich agentów)

## Finding
Instrukcje miały jedną definicję ukończenia dla każdej zmiany, definiowały
prawa ownera tylko negatywnie (`HANDOFF_PROTOCOL.md` §8) i nie miały miejsca
na zapis przyjętego ryzyka. Skutek: agenci sami wydawali werdykty NO-GO
(25 wystąpień NO-GO/bramka/gate w `PROJECT_STATE.md`), ponownie podnosili
zamknięte ryzyka i dokładali kontrole (31 workflowów).

## Change
- `AGENTS.md`, `Agent.md`: nadrzędna sekcja „Prawa decyzyjne i proporcjonalność".
- `docs/HANDOFF_PROTOCOL.md` 1.1: §3 z klasami A/B/C; journal i
  `PROJECT_STATE.md` tylko dla B i C.
- `scripts/handoff-check.sh`: `HANDOFF_CLASS=A` pomija wymóg journala.
- `docs/decisions/RISK_REGISTER.md`: pusty rejestr z wzorem.
- `.github/CODEOWNERS`, `.github/copilot-instructions.md`.

## Validation
`bash -n scripts/handoff-check.sh` OK. CI nie było uruchamiane dla tej gałęzi.

## Rollout
Nie dotyczy (bez wdrożenia). CODEOWNERS zaczyna działać dopiero po włączeniu
ochrony gałęzi `master` przez ownera.

## Follow-up
Owner: review i merge PR; wpisać do rejestru ryzyka już przyjęte; włączyć
ochronę gałęzi. Potem: scalić `AGENTS.md`, `Agent.md` i `WARP.md` w jeden plik.
