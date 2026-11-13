# Wstrzymanie publicznej rezerwacji i ukrycie logowania

- **Data:** 2026-11-13
- **PR:** #1700

## Finding
Publiczna nawigacja pokazywała logowanie na desktopie i w menu mobilnym. Kandydat PR zawierał też błąd składni danych strukturalnych strony kontaktowej, blokujący build.

## Change
Ukryto niezalogowanym wejście do logowania w nawigacji produkcyjnej, pozostawiając DEV i bezpośredni panel bez zmian. Poprawiono składnię strony kontaktowej. PR obejmuje również wcześniejszą blokadę rezerwacji klientów i komunikat telefoniczny.

## Validation
Test regresji najpierw wykazał widoczny link produkcyjny; po poprawce 3 zestawy / 6 testów PASS. Landing typecheck, ESLint zmienionych plików oraz produkcyjny build PASS. Wyniki lokalne nie zastępują CI ani testów live.

## Rollout
Niepotwierdzony. Poprzedni CI #43423364306 zakończył się przed przydzieleniem runnera skanowi Gitleaks.

## Follow-up
Uzyskać zielone CI dokładnego SHA, wdrożyć API, landing i panel oraz zweryfikować produkcję i logowanie personelu.
