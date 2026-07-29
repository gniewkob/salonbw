# Sentry i alert nowej rezerwacji przed UAT

- **Data:** 2026-07-29
- **Agent:** Codex + owner
- **Commit(y):** uzupełnić po commicie
- **PR:** brak

## Finding

Faza A miała dwie otwarte bramki: brak aktywnego DSN Sentry oraz brak
fizycznego potwierdzenia odbioru alertu nowej rezerwacji. Aktywacja DSN
ujawniła dodatkowo dwa błędy:

- frontend wywoływał integrację Replay podczas SSR/build i panel kończył build
  błędem `replayIntegration is not a function`;
- `scripts/safe-update-api-env.sh` próbował przekazać JSON health-checku przez
  stdin zajęty już przez kod Pythona, więc poprawna odpowiedź kończyła się
  `JSONDecodeError`.

## Change

- Ustawiono produkcyjny DSN dla API oraz zmienną build-time frontendu bez
  ujawniania wartości.
- Inicjalizacja Sentry w landing i panelu kończy się przed konfiguracją Replay,
  gdy kod działa poza przeglądarką.
- Health-check helpera przekazuje JSON do parsera przez dedykowaną zmienną
  procesu; test używa atrapy `curl` i obejmuje ścieżkę weryfikacji.
- Utworzono jedną syntetyczną rezerwację i konta testowe, potwierdzono alert,
  po czym transakcyjnie usunięto wszystkie artefakty tego testu.

## Validation

- Owner potwierdził odbiór maila „Nowa rezerwacja online” z prawidłową usługą,
  pracownikiem, terminem i linkiem do kalendarza.
- Backend: alert miał status `sent`; dzwonek/licznik oczekujących rezerwacji
  wzrósł.
- Cleanup: usunięto 2 konta testowe, 1 wizytę, 1 wpis email i 3 logi;
  pozostało 0 artefaktów tego testu.
- Sentry: testowy event informacyjny i kontrolowany błąd są widoczne w
  produkcyjnym projekcie.
- `bash scripts/test-safe-update-api-env.sh`: zielone po potwierdzonym
  `JSONDecodeError` przed poprawką.
- Build panelu z aktywnym DSN: 113 stron, exit 0 po potwierdzonym błędzie SSR
  przed poprawką.
- Build landingu z produkcyjnym API i aktywnym DSN: 12 stron, exit 0.

## Rollout

Oczekuje na commit, CI i deploy.

## Follow-up

Rozpocząć fazę B: właścicielka przechodzi `docs/UAT_PLAN.md`, a znaleziska są
diagnozowane i naprawiane na bieżąco.
