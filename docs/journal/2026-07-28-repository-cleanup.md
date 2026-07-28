# Konsolidacja gałęzi i porządki zależności

- **Data:** 2026-07-28
- **Agent:** Codex
- **Commit(y):** `9dd20e19`, `79540e4a`, ten commit
- **PR:** brak

## Finding

Repo miało 22 otwarte gałęzie Dependabota, jedną lokalną gałąź dokumentacyjną
i przestarzały wpis aktywnej gałęzi w `PROJECT_STATE.md`. Po scaleniu GitHub
pozostawił alert Dependabota #326 (`high`) dla podatnych wersji
`brace-expansion` w `pnpm-lock.yaml`. Scoped override naprawiał tylko ścieżkę
`glob@10`, więc lockfile nadal zawierał wersje 1.x i 2.x.

## Change

- wszystkie gałęzie zmian scalono do `master`; zmergowane referencje usunięto
  dopiero po sprawdzeniu relacji przodka,
- wersje Jest ujednolicono do 30.4.2,
- globalny override `minimatch@10.2.6` zastąpił scoped override dla `glob@10`,
  dzięki czemu lockfile zawiera wyłącznie `brace-expansion@5.0.8`,
- `PROJECT_STATE.md` zaktualizowano do rzeczywistego stanu repo i produkcji.

## Validation

- czysta instalacja: `pnpm install --force --frozen-lockfile`,
- testy: backend 245, landing 56, panel 346 — łącznie 691/691,
- lint: landing i panel bez błędów; backend 0 błędów i 176 istniejących
  ostrzeżeń,
- typecheck i build: landing, panel oraz backend zakończone kodem 0,
- `pnpm audit --audit-level=high`: brak znanych podatności,
- smoke przed rolloutem: API 200, landing 200, panel 307; database, SMTP
  i Instagram `ok`.

## Rollout

Automatyczny CI i Deploy (MyDevil) po pushu do `master`; wynik wymagany jako
końcowa bramka zadania.

## Follow-up

Ponownie uruchomić `e2e-visual-sweep.yml`, następnie kontynuować fazę A zgodnie
z sekcją „Następny krok" w `PROJECT_STATE.md`.
