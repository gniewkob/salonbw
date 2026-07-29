# Sentry i alert nowej rezerwacji przed UAT

- **Data:** 2026-07-29
- **Agent:** Codex + owner
- **Commit(y):** `ddbea1d6`, `58b3c3b0`, `6ac4ac39`
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
- Automatyczny deploy `master` używa produkcyjnych ścieżek, ale GitHub
  Environment `staging`; DSN istniał tylko w `production`. Krok build landingu
  nie przekazywał `NEXT_PUBLIC_SENTRY_DSN` wcale.

## Change

- Ustawiono produkcyjny DSN dla API oraz zmienną build-time frontendu bez
  ujawniania wartości.
- Inicjalizacja Sentry w landing i panelu kończy się przed konfiguracją Replay,
  gdy kod działa poza przeglądarką.
- Health-check helpera przekazuje JSON do parsera przez dedykowaną zmienną
  procesu; test używa atrapy `curl` i obejmuje ścieżkę weryfikacji.
- Oba buildy frontendu otrzymują `NEXT_PUBLIC_SENTRY_DSN`, a publiczna
  zmienna build-time jest zsynchronizowana w środowiskach GitHub używanych
  przez ręczny i automatyczny deploy.
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
- Kontrola workflow najpierw failowała, gdy tylko panel otrzymywał DSN, a po
  zmianie wymaga mapowania zmiennej w obu krokach build.

## Rollout

- Pierwszy rollout kodu: CI `30451653489` i deploy `30451653483` — success.
  Live-check wykazał jednak DSN tylko w jednym bundle, co ujawniło różnicę
  GitHub Environment opisaną w Finding.
- Rollout mapowania env: deploy `30452215230` — success. Produkcyjne bundle
  panelu i landingu zawierają runtime marker hosta DSN; HTTP panelu 307,
  landingu 200, API i baza `ok`.
- CI `30452213392` wykryło użycie niedostępnego `rg` w nowym guardzie. Po
  zamianie na `grep`, test przeszedł z PATH ograniczonym do `/usr/bin:/bin`;
  końcowe CI `30452351685` i deploy `30452350055` — success.

## Follow-up

Rozpocząć fazę B: właścicielka przechodzi `docs/UAT_PLAN.md`, a znaleziska są
diagnozowane i naprawiane na bieżąco.
