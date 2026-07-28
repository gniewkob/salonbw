# Trwałe konto klienta CI i plan E4.2

- **Data:** 2026-07-28
- **Agent:** Codex
- **Commit(y):** ten commit
- **PR:** brak

## Finding

Read-only preflight wykazał brak trwałego konta klienta CI. Dotychczasowe konto
regresji należało do danych przeznaczonych do usunięcia przez E4.2, więc cleanup
przerwałby testy Playwright albo wymagałby pozostawienia starych danych.

## Change

Utworzono w bazie trwałe techniczne konto klienta z losowym hasłem, bez telefonu,
zgód i powiadomień. Dwa sekrety repozytorium GitHub przełączono atomowo na nowe
dane logowania. Adres i hasło nie zostały zapisane w repo ani journalu.

Nie wykonano `synthetic:data:apply` ani importu z Versum.

## Validation

- Weryfikacja rekordu po transakcji: rola `client`, brak telefonu, wszystkie
  zgody i kanały powiadomień wyłączone.
- Logowanie do produkcyjnego API: HTTP 200 i cookie dostępu.
- GitHub: oba sekrety mają ten sam czas aktualizacji.
- `synthetic:data:plan`: oba chronione konta obecne, 0 blockerów.
- Plan usunięcia: 5 klientów, 19 wizyt, 822 produkty i 12 dokumentów
  magazynowych.
- Plan utworzenia: 12 klientów, 30 wizyt, 12 produktów i 5 dokumentów
  magazynowych.
- `E2E Playwright Regression`: run `30399275259` — 23/23 testy przeszły,
  w tym logowanie klienta na nowym koncie.

## Rollout

Zmiana operacyjna nie wdraża kodu aplikacji. Run regresji `30399275259`
zakończył się sukcesem w 1 min 54 s.

## Follow-up

Po świeżym `pg_dump` uzyskać osobną jawną zgodę ownera i dopiero wtedy wykonać
`synthetic:data:apply`, `verify`, health-check oraz ponowną regresję CI.
