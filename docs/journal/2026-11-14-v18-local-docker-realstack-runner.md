# Studio V18 — przygotowanie prywatnego Docker real-stack UAT

- Data: 2026-11-14
- PR: [#1705](https://github.com/gniewkob/salonbw/pull/1705), Draft.
- Źródło przed zmianą: `3e25e355b85f2a632d48a3ffbdd22397a4a05f9b`.
- Badany zakres: fixture właścicielki, Playwright (desktop/mobile), Compose, Node/NestJS/Next i skrypty safety.

## Finding

GitHub Actions są zablokowane, a istniejąca ścieżka real-stack QA używała
sztywno `127.0.0.1:5432`, przy czym na Macu port 5432 zajmuje inna usługa.
Próba uruchomienia CI-fixture bez izolacji mogłaby trafić w niewłaściwą bazę.
Fixture z poprzedniego zadania nie używa już `dropSchema` i sprawdza pusty
katalog bazy, ale wymagało to osobnego, bezpiecznego procesu wykonawczego.

Dodatkowo `@types/pg` nie występuje w aktualnym `pnpm-lock.yaml`, chociaż
skrypt fixture importował `Client` z modułu `pg`; `tsconfig.json` obejmuje
`scripts/**/*.ts` i ma `noImplicitAny`. Mogło to zablokować typecheck.

## Change

1. `scripts/qa/v18-docker/compose.yaml`: odrębny, nietrwały PostgreSQL 16
   na `tmpfs`; `internal: true`; QA dzieli sieć z DB przez
   `network_mode: service:db`; brak `ports:`, bind-mountów i host network.
   Odpowiada to dokładnemu, już ograniczonemu DSN CI fixture bez użycia
   rzeczywistego portu Maca.
2. `scripts/qa/v18-docker/Dockerfile` oraz `Dockerfile.dockerignore`:
   Node 22, pnpm 10.14.0, Chromium, build panelu i NestJS; kontekst
   wyklucza klucze i pliki `.env`. Nawet podczas builda API wskazuje loopback,
   wszystkie flagi outbound są wyłączone.
3. `run-from-mac.sh`: bierze aktualny HEAD `origin/codex/v18-integracja-20261113`,
   tworzy odłączony czysty worktree, wymaga lokalnego Docker Desktop/Unix socket,
   uruchamia nazwany projekt Compose, a następnie usuwa wyłącznie własne
   zasoby i worktree. Nie narusza gałęzi użytkownika.
4. `qa-owner-browser-postgres.ts`, test desktopowego DnD i odzyskany
   syntetyczny mobile real-stack test: niezależny tryb kontenerowy wymaga
   `QA_ISOLATED_DOCKER=1`, Linux `/.dockerenv`, `CI=true` i 40-znakowego SHA;
   nie fałszuje `GITHUB_ACTIONS=true` na Macu. Stara droga Actions zachowana.
5. Negatywny scenariusz: znacznik w disposable DB → seed musi odmówić
   dokładnie z `OWNER_BROWSER_PG_NONEMPTY_DB=BLOCKED` → potwierdzenie, że
   znacznik i katalog nie zostały zmodyfikowane → jego bezpieczne usunięcie
   i pozytywne seedowanie do pustej bazy.
6. `apps/panel/playwright.config.ts` w trybie kontenerowym uruchamia
   wcześniej zbudowany Next, bez próby ponownego builda po odcięciu egress.
7. `scripts/ci/v18-docker-safety.test.mjs`: kontrole izolacji Compose,
   wykluczenia sekretów, flag uruchamiania oraz składni skryptów.
   Fixture używa wąskiej typowanej fasady runtime `pg` bez dodawania
   nieobecnej paczki deklaracji i bez zmiany lockfile.
8. `scripts/qa/v18-docker/README.md`: jedno polecenie operatorskie.

**Nie zmieniano** kodu biznesowego kalendarza, cache React Query, migracji,
produkcyjnych danych, konfiguracji MyDevil i ACL.

## Validation

- Odczyt repo przez GitHub connector: **25/25 kontroli strukturalnych PASS**
  (porównanie treści plików, granic dostępu, flags, nazw i obecności scenariuszy).
  Nie są to testy rzeczywistego PostgreSQL ani uruchomienie Node.
- Zewnętrzna dokumentacja Dockera potwierdza `network_mode: service:db`,
  `networks.internal` i pliki `Dockerfile.dockerignore`:
  https://docs.docker.com/reference/compose-file/services/ oraz
  https://docs.docker.com/build/concepts/context/
- **Nie uruchomiono** obrazu, `docker compose config`, pełnego testu
  `node --test`, Jest/typecheck na końcowym SHA, migracji/seedowania ani
  Playwright. Brak rzeczywistego PASS full-stack.
- Nie wykorzystywano SSH MyDevil ani danych klientów; brak merge/deploy/restart.
- Brak potwierdzonych runnerów GitHub Actions dla nowego SHA.

## Rollout

Brak. PR pozostaje Draft / **DEV i PROD NO-GO**.
Nie traktować samego przygotowania runnera jako release readiness.

## Follow-up

1. Na Macu z działającym Docker Desktop uruchomić jednokrotnie:
   `git show "$(git rev-parse origin/codex/v18-integracja-20261113):scripts/qa/v18-docker/run-from-mac.sh" | bash`.
   Skrypt sam pobiera HEAD i przechodzi na własne, osobne worktree.
2. Naprawić wykryte testami błędy, dodać regresje i ponowić QA na nowym
   exact HEAD. Wszystkie wyniki dokumentować z liczbami PASS/FAIL/SKIP.
3. Niezależnie rozwiązać izolację PostgreSQL `PUBLIC CONNECT` [#1706](https://github.com/gniewkob/salonbw/issues/1706)
   oraz hosted business UAT [#1531](https://github.com/gniewkob/salonbw/issues/1531),
   sesje/outbound i provider restore.
4. CI lub jawne zatwierdzone odstępstwo od jego bramki nadal wymagane.
