# Salon Black & White — SalonBW

[![CI](https://github.com/gniewkob/salonbw/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/gniewkob/salonbw/actions/workflows/ci.yml)

Repozytorium produkcyjnego systemu salonu fryzjerskiego. **Aktualnym stackiem jest Node.js 22, Next.js 15 i NestJS 11**, a nie Laravel ani historyczny CodeIgniter. Szczegółowy stan wydań i decyzji jest w [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md); każda zmiana wymaga zasad z [docs/HANDOFF_PROTOCOL.md](docs/HANDOFF_PROTOCOL.md).

## Aplikacje i środowiska

| Komponent | Kod | Stos |
| --- | --- | --- |
| Landing publiczny | [apps/landing](apps/landing) | Next.js 15 / React 18 |
| Panel salonu | [apps/panel](apps/panel) | Next.js 15 / React 18 |
| Backend API | [backend/salonbw-backend](backend/salonbw-backend) | NestJS 11 / TypeORM / PostgreSQL |
| Wspólne moduły | [packages](packages) | TypeScript / klient API |

| Środowisko | Landing | Panel | API |
| --- | --- | --- | --- |
| Produkcja | [salon-bw.pl](https://salon-bw.pl) | [panel.salon-bw.pl](https://panel.salon-bw.pl) | [api.salon-bw.pl](https://api.salon-bw.pl) |
| Development (staging) | [dev.salon-bw.pl](https://dev.salon-bw.pl) | [dev-panel.salon-bw.pl](https://dev-panel.salon-bw.pl) | [dev-api.salon-bw.pl](https://dev-api.salon-bw.pl) |

Development jest oddzielony od produkcji (osobna baza, sekrety i ciasteczka, bramka HTTP, `noindex`, wyłączone wysyłki oraz schedulery). Nie kopiuj prawdziwych danych klientek na development. Na hostingu mydevil.net aplikacjami zarządza Passenger; nie uruchamiaj dodatkowych procesów `next start` albo `node app.js` do diagnostyki.

**Stan operacyjny:** przełączenie domeny głównej na Node wykonano 2026-10-25; według zapisu z tego dnia regresja produkcyjna przeszła 23/23. To nie oznacza biznesowej zgody na start rezerwacji zamiast Booksy — potrzebne jest UAT właściciela. Przed każdą decyzją operacyjną sprawdź bieżący stan, nie polegaj na tym historycznym wyniku.

## Uruchomienie lokalne

Wymagania: Node.js **22** (plik [.nvmrc](.nvmrc)), **pnpm 10.14.0** ([package.json](package.json)), PostgreSQL i ustawienia środowiska opisane w [docs/ENV.md](docs/ENV.md). Dodatkowe wskazówki: [docs/DEV_SETUP_MAC.md](docs/DEV_SETUP_MAC.md).

~~~bash
corepack enable
pnpm install --frozen-lockfile
~~~

Skonfiguruj lokalne pliki `.env` na podstawie plików `.example`. Nie commituj sekretów i nie używaj produkcyjnej bazy jako środowiska testowego.

Osobne terminale, zgodnie z ustawieniami portów i API z dokumentacji developerskiej:

~~~bash
pnpm --filter salonbw-backend start:dev
pnpm --filter @salonbw/landing dev
pnpm --filter @salonbw/panel dev
~~~

## Kontrola jakości

~~~bash
pnpm --filter @salonbw/landing lint
pnpm --filter @salonbw/landing typecheck
pnpm --filter @salonbw/landing test
pnpm --filter @salonbw/landing build

pnpm --filter @salonbw/panel lint
pnpm --filter @salonbw/panel typecheck
pnpm --filter @salonbw/panel test
pnpm --filter @salonbw/panel build

pnpm --filter salonbw-backend test
pnpm --filter salonbw-backend typecheck
pnpm --filter salonbw-backend build
~~~

Przed commitem stosuj dodatkowe zasady z [AGENTS.md](AGENTS.md) i [Agent.md](Agent.md). Zmiany UI muszą uwzględniać brand system z `.claude/skills/salonbw-brand/SKILL.md` oraz weryfikację desktop/mobile. CI dla PR i `master` definiuje [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Wdrożenia — mydevil.net

Źródło prawdy: [docs/DEPLOYMENT_MYDEVIL.md](docs/DEPLOYMENT_MYDEVIL.md), [docs/CI_CD.md](docs/CI_CD.md) i [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).

- Workflow: **Deploy (MyDevil)** w [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
- Cele: `landing`, `panel`, `api`, `all`, `frontends` i `probe` (aliasy `public`, `dashboard`, `admin` są zachowane dla kompatybilności).
- Środowiska: `staging` i `production`. Automatyczny push do `master` może uruchamiać deployment produkcyjny dla zmienionych aplikacji; PR nie należy scalać bez zielonego CI.
- Workflow rozwiązuje wskazany ref do pełnego SHA i wymaga sukcesu CI dla **tego samego SHA** przed instalacją, buildem, migracjami i przełączeniem.
- W pełnym deployu API (wraz z migracjami) musi zostać wdrożone przed frontendami. Release i smoke testy należy zweryfikować po zakończeniu workflow.

Przykład ręcznego wydania już sprawdzonego commitu na staging:

~~~bash
gh workflow run .github/workflows/deploy.yml --ref master -F ref=<PELNY_SHA> -F environment=staging -F target=all
~~~

Produkcja wymaga osobnej decyzji o wydaniu, zweryfikowanego backupu i checklisty. Nie wykonuj ręcznie migracji bez przeglądu; wdrażaj kod przez workflow, nie przez nadpisanie plików na serwerze.

## Poprzedni system PHP

Archiwalny ZIP strony zawiera **CodeIgniter 3.0.4** (`application/`, `system/`). **Nie jest aktualnym repozytorium SalonBW** i nie zawiera aplikacji Node. W GitHubowym monorepo nie ma już katalogów wykonawczych starego PHP. Po przełączeniu domeny część plików PHP zachowano na hostingu jako możliwość awaryjnego przywrócenia strony.

Nie usuwaj `public_html` ani kopii PHP bez inwentaryzacji docelowej ścieżki, odtwarzalnego backupu i akceptacji ownera. Procedura: [docs/LEGACY_PHP_RETIREMENT.md](docs/LEGACY_PHP_RETIREMENT.md).

## Dalsze prace

1. **UAT biznesowe**: sprawdzić kalendarz, rezerwację, historię klientki, obsługę wizyty i powiadomienia zgodnie z [docs/UAT_PLAN.md](docs/UAT_PLAN.md).
2. **Wygląd**: kontynuować [docs/LANDING_DESIGN_PLAN.md](docs/LANDING_DESIGN_PLAN.md) w osobnym PR i akceptować na staging przed produkcją.
3. **Start rezerwacji**: osobna zgoda ownera i finalny import przyszłych rezerwacji z Booksy; nie jest częścią prac dokumentacyjnych.

## Dokumentacja

- [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) — aktualny stan i blokery.
- [docs/HANDOFF_PROTOCOL.md](docs/HANDOFF_PROTOCOL.md) — obowiązkowy zapis zmian.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — architektura.
- [docs/ENV.md](docs/ENV.md) — konfiguracja środowisk.
- [docs/DEPLOYMENT_MYDEVIL.md](docs/DEPLOYMENT_MYDEVIL.md) — produkcja i staging.
- [docs/ROLLBACK_PROCEDURE.md](docs/ROLLBACK_PROCEDURE.md) — wycofywanie wydań Node.
- [docs/LEGACY_PHP_RETIREMENT.md](docs/LEGACY_PHP_RETIREMENT.md) — wycofanie starego hostingu PHP.
- [docs/journal](docs/journal) — historia decyzji i dowodów.
