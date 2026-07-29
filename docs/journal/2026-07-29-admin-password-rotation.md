# Rotacja hasła administratora przed UAT

- **Data:** 2026-07-29
- **Agent:** Codex
- **Commit(y):** ten commit
- **PR:** brak

## Finding

E2.2 blokowało UAT. Historyczne konto `test.admin@…` zostało wcześniej
usunięte zgodnie z migracją, natomiast produkcja pre-live ma dokładnie jedno
właściwe konto z rolą admin. Pierwsza próba zapisu wygenerowanego sekretu do
Keychain ujawniła, że bezpieczny prompt wymaga dwukrotnego podania; niezależny
readback wykrył pustą wartość przed uznaniem zadania za zakończone.

## Change

- Dodano `scripts/rotate-prelive-admin-password.sh`.
- Skrypt wymaga dokładnie jednego admina, aktualizuje hash warunkowo i nie
  wypisuje adresu, hasła ani hasha.
- Losowy sekret trafia przez stdin do macOS Keychain, jest odczytywany ponownie
  i dopiero nim skrypt weryfikuje logowanie przez produkcyjne API.
- Po wykryciu pustego wpisu wykonano ponowną rotację poprawionym przepływem.

## Validation

- Nieaktualny identyfikator konta: 0 rekordów, zapis do bazy nie nastąpił.
- Właściwa rotacja: dokładnie 1 rekord z rolą admin zaktualizowany.
- Weryfikacja bcrypt po stronie operacji: OK.
- Produkcyjne `POST /auth/login` nowym hasłem: HTTP 200.
- Niezależny odczyt sekretu z Keychain i ponowne logowanie: HTTP 200.
- Hasło, hash i pełny adres konta nie zostały wypisane ani zapisane w repo.

## Rollout

Operacja bazodanowa zakończona. Rollout skryptu zostanie zapisany po pushu.

## Follow-up

Po zakończeniu UAT ponownie uruchomić ten sam skrypt, aby unieważnić hasło
używane podczas testów. Przed UAT pozostają E2.5 (Sentry) i E2.11 (fizyczne
potwierdzenie alertu rezerwacji).
