# V18 — harmonogramy NestJS wyłączone w APP_ENV=test

- Data: 2026-11-14
- PR: #1705 (Draft)
- Zakres: polityka uruchamiania harmonogramów backendu podczas izolowanego real-stack UAT

## Finding

`backend/salonbw-backend/src/app.module.ts` konfigurował `ScheduleModule.forRoot` przez `process.env.APP_ENV !== 'development'`. To **włączało** joby cron, interwały i timeouty przy `APP_ENV=test` używanym w `.github/workflows/v18-client-role-and-slots-qa.yml` i `v18-booking-slots-real-stack-qa.yml` w trakcie uruchamiania rzeczywistego NestJS. W tym trybie `OUTBOUND_DELIVERY_ENABLED=false` i `SMSAPI_ENABLED=false` są osobną bramką, ale nie wyłączają wszystkich wewnętrznych skutków ubocznych zadań cyklicznych.

## Change

- `src/environment-isolation.ts`: `scheduledJobsEnabled(env)` zwraca `true` **wyłącznie** dla `APP_ENV=production`.
- `src/app.module.ts`: NestJS `ScheduleModule` korzysta z tej polityki dla `cronJobs`, `intervals` i `timeouts`.
- `src/auth/environment-isolation.spec.ts`: test regresyjny dla `production`, `development`, `test`, `staging` i niezdefiniowanego `APP_ENV`.

Zmiana jest ograniczona do planowania jobów NestJS. Nie zmienia połączeń sieciowych, zewnętrznych sekretów, danych, istniejącej polityki kalendarza/cache, uruchamiania jawnych endpointów ani procesów cron poza aplikacją (np. crontab hostingu).

## Validation

- GitHub source inspection: APP_ENV=test według workflow; poprzednia polityka uruchamiała harmonogramy. W kodzie potwierdzono pojedynczą konfigurację `ScheduleModule.forRoot`, oraz wystąpienia `@Cron` i `@Interval` w backendzie.
- Na dokładnym źródłowym blobie `f7a8f9228d035d18f679ee112468b952ce013978` wykonano izolowany Node 22 z `--experimental-strip-types`: `scheduledJobsEnabled` **6/6 PASS** (`production`, `development`, `test`, `staging`, tylko `NODE_ENV=production`, pusty env). Lokalna kopia miała ten sam wynik `git hash-object` co blob GitHub. Nie uruchamiano NestJS ani Jest w tej próbie.
- Na końcowym kodzie odczytowo sprawdzono implementację helpera, trzy opcje modułu i nowy zestaw przypadków testowych.
- **Nieuruchomione:** Jest, TypeScript, backend build, pełne testy PostgreSQL/Playwright i manualny SSH test nowego SHA. Brak dowodu PASS z działającego runnera; test źródłowy/funkcyjny wymaga wykonania przez lokalnego agenta.
- Produkcyjne `APP_ENV=production` nadal aktywuje joby. Wszystkie inne wartości je wyłączają (fail-closed).

## Rollout

Brak merge, deploy, restartów i działań na MyDevil. Draft / DEV i PROD **NO-GO**.

## Follow-up

1. Na dokładnym HEAD uruchomić `pnpm --filter salonbw-backend exec jest --runInBand environment-isolation.spec.ts` i backend typecheck/build.
2. W odrębnym, pozbawionym zewnętrznego egress środowisku Docker uruchomić rzeczywiste NestJS z `APP_ENV=test`, monitorować brak startu jobów i wykonać real-stack UI→API→synthetic PostgreSQL.
3. Nie uruchamiać istniejącego destrukcyjnego fixture na lokalnym 5432; zaktualizowany fixture nadal wymaga rzeczywistej walidacji pustej bazy i skuteczności negatywnego przypadku.
4. Zweryfikować dodatkowe procesy i zadania crontab MyDevil osobno; problem uprawnień DB P0 pozostaje [#1706](https://github.com/gniewkob/salonbw/issues/1706).
