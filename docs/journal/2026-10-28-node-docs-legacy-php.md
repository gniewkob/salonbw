# Aktualizacja dokumentacji Node i plan wycofania CodeIgnitera

- **Data:** 2026-10-28
- **Agent:** Codex
- **Commit(y):** `a45833f5`, `46ec03c8`, `f282ef7a`, `b9d74111` (gałąź dokumentacyjna)
- **PR:** #1555

## Finding

Współdzielony ZIP strony jest archiwum CodeIgniter 3.0.4, niezwiązanym z aktualnym monorepo. GitHub `gniewkob/salonbw` działa w Node.js 22, ale główny `README.md` nadal kierował do nieistniejącego katalogu `frontend/`, błędnego `docs/DEPLOYMENT_hosting.md`, archiwalnego `AGENT_STATUS.md` i opisywał dawny deployment oraz wspólne środowiska. Aktualny `PROJECT_STATE.md` (2026-10-26) potwierdza przełączenie domeny głównej na Next.js 2026-10-25, a pierwotny zapis `AGENTS.md` mówił o zachowaniu starego PHP do rollbacku. Nowsze raporty [#1520](https://github.com/gniewkob/salonbw/pull/1520) i [#1521](https://github.com/gniewkob/salonbw/pull/1521) potwierdzają wykonane usunięcie legacy `public_html` 2026-10-26 (1663 pliki / 77 MB); brak świeżego SSH w tym zadaniu.

## Change

- Odświeżono `README.md`: rzeczywisty układ katalogów, stack, Node/pnpm, domeny, komendy i workflow.
- Dodano `docs/LEGACY_PHP_RETIREMENT.md` — status wykonanej operacji 2026-10-26, zakres dowodów i zakaz ponownego usuwania; dokument ma charakter informacyjny.
- Dopisano zweryfikowane fakty i decyzję ownera do `docs/PROJECT_STATE.md`.

Nie zmieniono aplikacji, deployu, bazy, sekretów ani produkcyjnych plików PHP.

## Validation

- Sprawdzono API GitHub: główny tree repozytorium, pliki `package.json` w trzech aplikacjach, `AGENTS.md`, `Agent.md`, `docs/HANDOFF_PROTOCOL.md`, `docs/PROJECT_STATE.md`, `docs/DEPLOYMENT_MYDEVIL.md`, `.github/workflows/ci.yml` i `deploy.yml`.
- CI SHA `69f6652be269bb7f6726a9c89bccdfbf270ea21b`: `completed/success` (run `40762760076`) przed zmianą dokumentacji.
- Po stronie GitHub dokumenty tworzą spójny opis aktualnego stacku; do wykonania: bramki CI dla PR. Nie przeprowadzono testów uruchomieniowych, produkcyjnego SSH ani restore drill.

## Rollout

Zmiana wyłącznie dokumentacyjna; brak deployu do produkcji w ramach zadania. Push/merge może uruchomić automatyczne workflow — zweryfikować CI i brak niezamierzonego deployu aplikacji.

## Follow-up

Priorytetem jest zamknięcie bramek wydania PR #1543 (CI exact-SHA, review, izolowany UAT, backup/rollback, GO ownera) i praca nad wyglądem z PR #1527 na staging. Nie uruchamiać ponownie usuwania PHP.
