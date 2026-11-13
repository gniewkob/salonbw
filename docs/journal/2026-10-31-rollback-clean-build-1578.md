# #1578 — niezależny build Node 22

- **Data:** 2026-10-31; **agent:** Codex; **PR:** brak.

## Finding
Wcześniejsze buildy Node 22 i 26 korzystały z tego samego istniejącego node_modules, co nie dowodziło niezależnej instalacji zależności builda.

## Change
Udokumentowano porównanie z czystym źródłem i nowym store; bez zmian aplikacji i workflow.

## Validation
Z `git archive` pełnego SHA `1ced2e70a441389ded5a075659f8bf06b670644e` w katalogu tymczasowym: macOS Node 22.23.4, pnpm 10.14.0, `pnpm --filter salonbw-backend... install --frozen-lockfile --ignore-scripts --store-dir <temporary>`, następnie `pnpm exec nest build`: PASS. Porównanie JS/JSON w dist z wcześniejszym prototypem: 449/449 identycznych, 0 nowych, brakujących i różnych. Katalog i store usunięte. Nie porównano innych plików ani runtime npm, FreeBSD, Passenger lub DB.

## Rollout / follow-up
Nie dotykano DEV ani produkcji. BLOCKED: oddzielna procedura aktywacji, DB, Passenger, FreeBSD, graf runtime i przypadek regresji.
