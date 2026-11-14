# Studio V18 — Mac Node.js preflight compatible with Node 20+

- **Data:** 2026-11-14
- **PR:** #1705 (Draft)
- **Przebieg operatora:** `31283992f34bf1ee9c9a94e24bf3d3b417a58258`
- **Typ:** TYPE B CRM / prelaunch; lokalny, izolowany real-stack QA

## Finding

Drugi rzeczywisty przebieg `run-from-mac.sh` po pobraniu SHA `31283992f`
zatrzymał się **przed uruchomieniem Docker**:

```text
V18_LOCAL_DOCKER_UAT=BLOCKED (Expected Node 22 for fast QA preflight)
```

Kontener QA ma poprawnie przypięty obraz `node:22-bookworm`. Tylko
niedestrukcyjne testy kontraktowe `node --test` są uruchamiane na Macu.
Tymczasem wrapper wymagał dokładnie `node_major == 22` także na hoście.
Nie ma funkcjonalnego powodu, by blokować kompatybilny Node.js 20+.

Wcześniejszy przebieg `d3f1b7b` poprawnie zbudował Next/Nest/Chromium
i uruchomił prywatny PostgreSQL 16.16, ale zakończył pierwsze testy kontraktu
na `6 PASS / 1 FAIL` (przestarzała asercja CI). Została już poprawiona w
poprzedniej iteracji; nowa blokada host Node nie jest błędem Docker ani DB.

## Change

- `scripts/qa/v18-docker/run-from-mac.sh`:
  wymagane `Node >=20` dla hostowych, pozbawionych zależności kontraktów
  `node:test`. Wypisywana jest rzeczywista wersja host Node w logu.
- `scripts/ci/v18-docker-safety.test.mjs`:
  regresja weryfikuje `node_major >= 20`, brak `node_major == 22` w
  wrapperze oraz **zachowanie `FROM node:22-bookworm` w Dockerfile**.

Brak zmian w biznesowym kodzie Next/Nest, uprawnieniach, sesjach,
połączeniach do DB, Docker Compose, produkcji i polityce cache.

## Validation

- GitHub connector: sprawdzono kod na dokładnym HEAD przed zmianą oraz
  oba zakresowe commity nowego preflightu.
- W odizolowanym kontenerze z Bash przetestowano faktyczny warunek
  `[[ $node_major =~ ^[0-9]+$ ]] && (( node_major >= 20 ))`:
  **7/7 PASS oczekiwanej decyzji**: 18 i 19 odrzucone, 20/22/24/25
  zaakceptowane, wartość `bogus` odrzucona.
- Nie uruchomiono na nowym HEAD rzeczywistego wrappera Mac, pełnych
  `node --test`, `docker compose up`, migracji, NestJS runtime ani
  Playwright. Wyniki wcześniejszych uruchomień nie są przypisywane
  nowemu SHA.

## Rollout

Nie dotyczy — lokalna ścieżka QA. Nie wykonano merge, deploy,
zmiany ACL ani modyfikacji baz MyDevil.

## Follow-up

Ponowić **jeden** przebieg z aktualnego HEAD #1705:

```bash
(
  set -euo pipefail
  cd ~/Repos/salonbw
  git fetch origin codex/v18-integracja-20261113
  QA_SHA="$(git rev-parse origin/codex/v18-integracja-20261113)"
  git show "$QA_SHA:scripts/qa/v18-docker/run-from-mac.sh" | bash
)
```

Wynik początkowy musi zawierać
`V18_LOCAL_DOCKER_FAST_PREFLIGHT=PASS`; dalsze FAIL diagnozować
na podstawie rzeczywistego logu testu, bez obejścia kontroli DB.
Odbiór DEV nadal wymaga real-stack UAT na syntetycznej bazie i
oddzielenia PROD; #1706 dotyczące uprawnień DB pozostaje otwarte.
