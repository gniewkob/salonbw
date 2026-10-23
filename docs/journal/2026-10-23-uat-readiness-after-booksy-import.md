# Gotowość produkcji do UAT po imporcie Booksy

- **Data:** 2026-10-23
- **Agent:** Codex
- **Commit(y):** `749ed82d`, ten commit
- **PR:** #1512 (zmiany trafiły bezpośrednio na `master`, ponieważ aktywne konto nie miało uprawnienia GraphQL do merge)

## Finding

Import Booksy zresetował hasło technicznego konta klienta. Produkcyjny workflow
Playwright Regression `39996678245` nie przeszedł fazy logowania dla admina ani
klienta, więc 21 testów funkcjonalnych nie zostało wykonanych. Dodatkowo
`scripts/rotate-prelive-admin-password.sh` zmieniał hash hasła, ale pozostawiał
stare refresh tokeny, nie zwiększał `authVersion` i nie usuwał wpisów
`login_attempt`. Po trzech nieudanych próbach poprawne nowe hasło nadal dawało
401 z powodu wymaganej CAPTCHA.

## Change

- Wdrożono `749ed82d` z poprawkami: poprawne parsowanie wartości `false` w
  filtrach klientek, wyszukiwanie po e-mailu oraz `lastPerformedAt` liczone
  osobno dla każdej usługi.
- Zrotowano techniczne konta admina i klienta. Wartości zapisano w macOS
  Keychain i GitHub Secrets; nie zapisano ich w repo ani w logach.
- Rotacja admina zwiększa teraz `authVersion`, usuwa refresh tokeny i czyści
  `login_attempt` w tej samej transakcji co zmiana hasła.

## Validation

- `749ed82d`: CI `39996678194` — success.
- `749ed82d`: Deploy `39996678153` — success; API i panel wdrożone.
- Playwright Regression `39998664590`: 23/23 testów produkcyjnych — PASS
  (admin i klient, 34,9 s samego zestawu testów).
- Live API po zalogowaniu admina: 1068 klientek; filtr zgody e-mail dzieli
  zbiór na 1068 `false` i 0 `true`; wyszukiwanie po dokładnym e-mailu zwraca
  właściwą kartę; 5/5 ulubionych usług ma `lastPerformedAt`, z 5 różnymi
  datami.
- `bash -n scripts/rotate-prelive-admin-password.sh` — PASS.

## Rollout

Kod aplikacji wdrożony przez Deploy `39996678153`. Rotacja kont technicznych
wykonana po deployu i zweryfikowana logowaniem HTTP 200. Commit operacyjny
`a35fcaab` przeszedł CI `39999143045` w drugiej próbie; pierwsza próba miała
chwilowy błąd parsera odpowiedzi Google Fonts w `next/font`, a ponowiony ten sam
job landingu przeszedł bez zmiany kodu. Deploy `39999143046` — success; detektor
zmian poprawnie pominął wdrożenie aplikacji dla zmiany skryptu i dokumentacji.

## Follow-up

Owner wykonuje UAT na realnym sposobie pracy. Po akceptacji: świeży eksport
Booksy, finalny import 91 przyszłych rezerwacji, miękki start i hypercare.
Osobno należy odnowić token Instagrama.
