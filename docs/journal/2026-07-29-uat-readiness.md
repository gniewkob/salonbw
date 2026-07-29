# Gotowość do UAT po E4.2

- **Data:** 2026-07-29
- **Agent:** Codex
- **Commit(y):** ten commit
- **PR:** brak

## Finding

E4.2 i regresja panelu są zakończone, ale trzy warunki fazy A nadal blokują
realny UAT właścicielki: zmiana tymczasowego hasła admina (E2.2), podpięcie
Sentry (E2.5) oraz fizyczne potwierdzenie alertu rezerwacji (E2.11).

Produkcja nie ma `SENTRY_DSN`. `BOOKING_ALERT_EMAIL` również nie jest ustawione,
ale kod ma jawny fallback `kontakt@salon-bw.pl`, chroniony testem jednostkowym.
Runbook UAT nadal opisywał stan sprzed E4.2: 822 produkty, niewykonany cleanup
i zapis wyniku do archiwalnych plików statusu.

## Change

- Zaktualizowano warunki i oczekiwany dataset UAT do stanu po E4.2.
- Skierowano handoff UAT do `docs/journal/` i `docs/PROJECT_STATE.md`.
- Doprecyzowano cleanup danych utworzonych podczas UAT.
- Dodano `BOOKING_ALERT_EMAIL` wraz z runtime fallbackiem do `docs/ENV.md`.

## Validation

- E4.2 `verify`: 12 klientów, 30 wizyt, 12 produktów, 5 dokumentów,
  2 chronione konta, 0 niesyntetycznych klientów, 0 blockerów.
- E2E Playwright Regression `30443911725`: 23/23 testy.
- Produkcyjny env: `SENTRY_DSN` brak; `BOOKING_ALERT_EMAIL` brak.
- Kod: `appointments.service.ts` kieruje alert na
  `kontakt@salon-bw.pl`, gdy zmienna jest pusta; odpowiadający test oczekuje
  tego adresu.

## Rollout

Zmiana dokumentacyjna; rollout zostanie zapisany po pushu.

## Follow-up

Owner zmienia hasło admina i zakłada projekt Sentry. Następnie agent uruchamia
jedną kontrolowaną rezerwację online, a owner potwierdza fizyczne dotarcie
maila na telefonie. Po zamknięciu trzech bramek rozpoczyna się UAT.
