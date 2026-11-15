# Studio V18 — lokalny real-stack UAT w odizolowanym Dockerze

## Cel i granice

Przeglądarka Chromium → rzeczywisty panel Next.js → rzeczywisty NestJS →
jednorazowy PostgreSQL 16 z wyłącznie syntetycznymi danymi.

Zestaw jest **alternatywnym lokalnym QA** przy zablokowanych GitHub Actions.
Nie jest automatycznym odpowiednikiem exact-SHA CI ani zgodą na wdrożenie DEV/PROD.

## Jak uruchomić na Macu

Uruchom z dowolnej gałęzi w `~/Repos/salonbw`, bez przełączania aktualnego
worktree. Użyj *całego SHA* z aktualnego Draft PR #1705:

```bash
cd ~/Repos/salonbw
git fetch origin codex/v18-integracja-20261113
QA_SHA=$(git rev-parse origin/codex/v18-integracja-20261113)
git show "$QA_SHA:scripts/qa/v18-docker/run-from-mac.sh" | bash
```

Skrypt sam tworzy i usuwa osobny, odłączony worktree; buduje obraz dla jego
dokładnego SHA; uruchamia projekt Docker Compose o unikalnej nazwie.
Nie wykonuje `git switch`, `reset`, `stash`, `push`, migracji hosta,
restartów MyDevil, deploymentu ani zmian uprawnień DB.

**Wymagania:** Docker Desktop uruchomiony lokalnie, Docker Compose v2,
wolne miejsce na obrazy Node/Chromium, internet do pobrania obrazów i
zależności w fazie *budowania*. Runner wykonawczy ma wewnętrzną sieć
`internal: true`, bez dostępu do internetu i bez publikowanych portów.

## Mechanizmy bezpieczeństwa

- Docker Compose nie używa `ports:`, `network_mode: host` ani bind-mountów
  hostowych. Proces QA korzysta z `network_mode: service:db`, dlatego
  `127.0.0.1:5432` zawsze odnosi się do jednorazowego PG w tym samym
  namespace kontenera — nigdy do zajętego portu Maca.
- PostgreSQL działa na `tmpfs`; zamknięcie Compose usuwa dane testowe.
  Nie montuje się `.env`, domowych kluczy, node_modules ani rzeczywistych danych.
- `Dockerfile.dockerignore` wyklucza lokalne sekrety, artefakty i `.git`
  z kontekstu build. Build ma `API_PROXY_URL=http://127.0.0.1:3200`,
  a flagi outbound pozostają wyłączone.
- Nowy tryb `QA_ISOLATED_DOCKER=1` wymaga kontenera Linux
  (`/.dockerenv`), `CI=true` i dokładnego 40-znakowego SHA.
  Nie ustawia się ani nie fałszuje `GITHUB_ACTIONS=true` na hoście Mac.
  Istniejąca, niezależna ścieżka GitHub Actions nadal działa.
- Skrypt seed sprawdza w transakcji **READ ONLY** bazę, rolę i pusty
  katalog przed migracjami. `dropSchema` jest stale wyłączone.
- Przed pozytywnym seedem wykonywany jest test *negatywny*: marker danych
  powoduje odmowę seedowania. Weryfikujemy, że marker przetrwał bez zmian,
  po czym usuwamy tylko ten marker z jednorazowej bazy.
- `APP_ENV=test` wyłącza NestJS cron, interwały i timeouty.
  SMS, email, WhatsApp i pozostały outbound są wyłączone.
- Playwright odrzuca żądania browsera do adresów innych niż lokalny panel.

To są zabezpieczenia przed **przypadkowym** użyciem nieprawidłowego hosta.
Nie są dowodem weryfikacji uprawnień MyDevil, izolacji konta DEV od PROD
ani zastępstwem kontroli ACL z issue #1706.

## Zakres wykonywanego QA

1. Strukturalne testy bezpieczeństwa fixture i Compose, backend
   `environment-isolation.spec.ts`, typecheck backendu i panelu.
2. Negatywna próba seedowania niepustej bazy oraz sprawdzenie zachowania danych.
3. Migracje i seed syntetycznych danych PostgreSQL, uruchomienie rzeczywistego
   NestJS i healthcheck.
4. Mobilny real-stack UAT właścicielki: role, tworzenie/przenoszenie/anulowanie
   wizyty, kalendarz, klient, ochrona przed kolizją.
5. Niezależne odczytowe potwierdzenie wizyty po teście mobilnym.
6. Desktop Chromium: drag-and-drop, weryfikacja trwałego stanu wizyty w DB
   i ograniczeń uprawnień.

Wynik pozytywny kończy się markerem:

```text
V18_DOCKER_UAT=PASS_ISOLATED_SYNTHETIC_ONLY
```

Jeżeli jakikolwiek krok zawiedzie, cały pakiet pozostaje FAIL/BLOCKED.
Nie oznaczaj pominiętych scenariuszy jako PASS.

## Cztery niezależne wyniki w jednym uruchomieniu

Mobilny test P0 `Nowa wizyta → przesunięcie → anulowanie`, weryfikacja
zapisu w PostgreSQL, mobilne otwieranie formularza tapnięciem w siatkę
oraz desktop DnD/uprawnienia są obowiązkowe, **ale niezależne**.
Jeżeli jeden test zawiedzie, runner nadal wykona pozostałe, a wynik
końcowy będzie FAIL z wyjaśnieniem, która bramka zawiodła:

```text
V18_DOCKER_OWNER_BROWSER_CRUD=PASS|FAIL
V18_DOCKER_OWNER_DB_VERIFY=PASS|FAIL
V18_DOCKER_MOBILE_SLOT_TAP=PASS|FAIL
V18_DOCKER_DESKTOP_DND_AND_PERMISSIONS=PASS|FAIL
V18_DOCKER_ACCEPTANCE_RESULTS=owner:0 db:0 mobile_slot:0 desktop:0
```

W `V18_DOCKER_ACCEPTANCE_RESULTS` zero oznacza kod zakończenia
testu PASS; wartość różna od zera oznacza FAIL. Nie wolno traktować
niepowodzenia testu slotu jako sukcesu całej bramki. Podczas lokalnego
QA nie tworzymy ani nie zmieniamy danych na MyDevil.

## Ograniczenia

- W chwili utworzenia skryptów **nie wykonano jeszcze pełnego Compose**
  na Macu ani kontenerowego Playwright. Build, Jest, typowanie i funkcje
  fixture mogą ujawnić dodatkowe regresje po rzeczywistym uruchomieniu.
- Zestaw nie przeprowadza hosted DEV UAT, nie korzysta z kopii MyDevil
  i nie ustala rzeczywistego RPO/RTO.
- Rzeczywiste ACL PostgreSQL MyDevil wymagają osobnego procesu operatora:
  [P0 #1706](https://github.com/gniewkob/salonbw/issues/1706).
- Ostateczny business sign-off:
  [#1531](https://github.com/gniewkob/salonbw/issues/1531).
- **Nie wykonuj deploymentu** tylko na podstawie zielonego wyniku tego zestawu.
