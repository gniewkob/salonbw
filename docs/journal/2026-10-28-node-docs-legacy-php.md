# Aktualizacja dokumentacji Node i plan wycofania CodeIgnitera

- **Data:** 2026-10-28
- **Agent:** Codex
- **Commit(y):** do przypisania po utworzeniu PR
- **PR:** zgłoszenie w GitHub po zapisie gałęzi

## Finding

Współdzielony ZIP strony jest archiwum CodeIgniter 3.0.4, niezwiązanym z aktualnym monorepo. GitHub `gniewkob/salonbw` działa w Node.js 22, ale główny `README.md` nadal kierował do nieistniejącego katalogu `frontend/`, błędnego `docs/DEPLOYMENT_hosting.md`, archiwalnego `AGENT_STATUS.md` i opisywał dawny deployment oraz wspólne środowiska. Aktualny `PROJECT_STATE.md` (2026-10-26) potwierdza przełączenie domeny głównej na Next.js 2026-10-25, a `AGENTS.md` pozostawia stare pliki PHP na serwerze w celu rollbacku. Brak dowodu testu odtworzeniowego i bezpiecznej, dokładnej listy plików do usunięcia.

## Change

- Odświeżono `README.md`: rzeczywisty układ katalogów, stack, Node/pnpm, domeny, komendy i workflow.
- Dodano `docs/LEGACY_PHP_RETIREMENT.md` — warunki, plan bezpiecznego wycofania starego PHP z hostingu, oddzielny od GitHub i od aktualnej aplikacji Node.
- Dopisano zweryfikowane fakty i decyzję ownera do `docs/PROJECT_STATE.md`.

Nie zmieniono aplikacji, deployu, bazy, sekretów ani produkcyjnych plików PHP.

## Validation

- Sprawdzono API GitHub: główny tree repozytorium, pliki `package.json` w trzech aplikacjach, `AGENTS.md`, `Agent.md`, `docs/HANDOFF_PROTOCOL.md`, `docs/PROJECT_STATE.md`, `docs/DEPLOYMENT_MYDEVIL.md`, `.github/workflows/ci.yml` i `deploy.yml`.
- CI SHA `69f6652be269bb7f6726a9c89bccdfbf270ea21b`: `completed/success` (run `40762760076`) przed zmianą dokumentacji.
- Po stronie GitHub dokumenty tworzą spójny opis aktualnego stacku; do wykonania: bramki CI dla PR. Nie przeprowadzono testów uruchomieniowych, produkcyjnego SSH ani restore drill.

## Rollout

Zmiana wyłącznie dokumentacyjna; brak deployu do produkcji w ramach zadania. Push/merge może uruchomić automatyczne workflow — zweryfikować CI i brak niezamierzonego deployu aplikacji.

## Follow-up

Owner decyduje, czy zachować stare PHP w prywatnym backupie, czy zlecić jego trwałe usunięcie po inwentaryzacji, testowym odtworzeniu i okresie obserwacji. Prace nad wyglądem prowadzić na staging w oddzielnym PR.
