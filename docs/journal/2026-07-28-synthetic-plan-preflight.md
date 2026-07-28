# Preflight syntetycznego planu i trwałego konta CI

- **Data:** 2026-07-28
- **Agent:** Codex
- **Commit(y):** pending
- **PR:** brak

## Finding

Pierwsze realne, read-only uruchomienie `synthetic:data:plan` zatrzymało się
przed bazą, ponieważ manifest używał technicznego `ownerUserId=0`, odrzucanego
przez prawdziwy generator. Test usługi korzystał z mocka i nie ujawniał tej
niezgodności. Po usunięciu blokera baza potwierdziła brak trwałego klienta CI.

Wrapper `pnpm` wypisuje argumenty uruchamianego skryptu, więc przekazywanie
chronionych adresów przez `--protect` nie spełniało zasady minimalnej ekspozycji.

## Change

Dodano regresję uruchamiającą usługę z prawdziwym generatorem i zmieniono
techniczne identyfikatory manifestu na dodatnie. Parser przyjmuje teraz
`SYNTHETIC_PROTECTED_EMAILS` z prywatnego środowiska; runbook nie przekazuje
adresów w argv.

## Validation

- Test regresyjny najpierw odtworzył `ownerUserId must be a positive integer`.
- `synthetic-data.config.spec.ts` + `synthetic-data.service.spec.ts`: 2 suite,
  17 testów, wszystkie zielone.
- Pełny backend: 40 suite, 283 testy, wszystkie zielone.
- Celowany ESLint, typecheck i build backendu: exit 0.
- Read-only audyt bazy: 1 admin, 5 klientów, 141 usług, 19 wizyt, 822 produkty;
  brak któregokolwiek historycznego konta testowego.
- Nie wykonano żadnego zapisu do bazy ani zmiany sekretu.

## Rollout

Oczekuje na pełną walidację, push i CI/deploy.

## Follow-up

Uzyskać jawną zgodę na utworzenie trwałego klienta CI oraz zmianę dwóch
sekretów GitHub, potem ponowić read-only `plan`.
