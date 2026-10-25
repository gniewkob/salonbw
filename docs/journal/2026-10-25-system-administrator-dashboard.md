# Administrator systemu poza personelem salonu

- **Data:** 2026-10-25
- **Agent:** Codex
- **Commit(y):** ten commit
- **PR:** osobny PR funkcji administratora systemu

## Finding

Owner potwierdził, że nowe konto administracyjne ma mieć pulpit techniczny,
pełny dostęp do modułów i nie być personelem ani wykonawcą rezerwacji.
Dotychczas role admina i personelu były utożsamiane: każdy admin pojawiał się
na listach pracowników i mógł zostać wskazany jako wykonawca wizyty.

Próba pełnego HTTP testu wykazała ponadto, że globalne nadpisania pnpm
wymuszały Express 4 i path-to-regexp 0.1 na NestJS 11. Serwer testowy nie
startował; jednostkowe testy bez HTTP tego nie wykrywały.

## Change

- Addytywna kolumna users.isSystemAdmin, NOT NULL, default false. Poziom
  uprawnień pozostaje role=admin; brak reguł opartych na e-mailach i brak
  automatycznego przypisania flagi istniejącym kontom.
- Flaga wybiera pulpit techniczny /dashboard, etykietę administratora systemu
  i nawigację techniczną zamiast kalendarza/list pracowników.
- Backend wyklucza konto techniczne z personelu, usług, grafików, blokad czasu
  oraz wykonawców wizyt. Właścicielka jako zwykły admin pozostaje bookable.
  Kontrole zapisów następują przed mutacjami; odczyty filtrują też stare
  powiązania, jeśli istniałyby przed zmianą funkcji konta.
- GET /system/status: JWT + admin + aktualna flaga odczytana z bazy,
  Cache-Control no-store, limit 10/min. Wynik opiera się na HealthService;
  surowe komunikaty błędów/hosty/sekrety nie trafiają do odpowiedzi.
- Wyświetlane są API, baza, SMTP, Instagram, czas kontroli/procesu i wersja
  APP_RELEASE. SMTP nie dowodzi dostarczenia; SMS/push/historia incydentów
  są jawnym brakiem danych. Błąd odświeżenia ukrywa poprzedni stan.
- Deploy zapisuje APP_RELEASE z rozwiązanego immutable SHA; brak/niepoprawna
  wartość pozostaje null. OpenAPI i dokumentacja środowiska/rolloutu uzupełnione.
- Nadpisania Express/path-to-regexp zawężone do wymaganych przez Nest 11
  wersji (Express 5.2.1, path-to-regexp 8.4.2); stare zależności poza Nest
  zachowują istniejące nadpisania. Bez wyłączania parsera w teście HTTP.
- Pulpit ma scoped CSS, bo historyczne style panelu nadpisywały nowe karty.
  Kolory/tokeny i fonty marki, mobile min. 16 px, touch target >=44 px.

## Validation

- Fail-first: personel, wykonawca wizyty, bloki czasu, przypisania usług,
  grafiki, wybór pulpitu, nawigacja i etykieta roli. Każdy odpowiedni przypadek
  obserwowano bez poprawki; potem PASS. Nie używano stash na głównym checkoucie.
- HTTP: pełna inicjalizacja serwera Nest i rzeczywiste guards/kontroler/serwis,
  z deterministycznym zastąpieniem uwierzytelniania i danymi health/user.
  401 bez sesji, 403 salon-admin/client, 200 system-admin, no-store,
  pominięcie prywatnego komunikatu i uczciwe unknown/degraded.
- Panel: 412 testów (100 zestawów) PASS; backend: 475 testów (60 zestawów)
  PASS. To wyniki izolowanej gałęzi bez lokalnych commitów Fazy 0 domeny.
- Typecheck i build panelu/backendu PASS; canonical backend lint z autofix
  PASS (151 istniejących ostrzeżeń). 68 niezwiązanych zmian formatowania
  przywrócono wyłącznie w izolowanym worktree, by nie rozszerzać diffu.
- Audit high: exit 0; 12 moderate i 1 high objęte istniejącym wyjątkiem.
  Nie dodano wyjątku audytu. Guardy ops/deploy/docs PASS.
- Podgląd lokalny używa wyłącznie fikcyjnego profilu i wyników kontroli;
  nie jest dowodem stanu produkcji. Kontrole 1440/390: brak overflow,
  brak filtrów pracowników w pulpicie technicznym. Końcowe screenshoty
  sprawdzone po korekcie scoped CSS; Lighthouse accessibility 100/100
  dla lokalnego /dashboard (fixture), bez niezaliczonych audytów.

## Rollout

Kod przygotowany do przeglądu; migracji ani przypisania flagi w produkcji
nie wykonano. Odrębny PR godzin landingu: #1514, CI zielone.

Kolejność wdrożenia po akceptacji: API+migracja, panel, kontrolowane przypisanie
flagi wskazanemu przez ownera istniejącemu adminowi, ponowne logowanie i smoke.
Przed przypisaniem potwierdzić zero usług/grafików/wizyt jako wykonawca;
nie zmieniać roli salonu ani haseł. W tej samej transakcji podnieść authVersion
tego jednego konta i unieważnić jego refresh tokeny, bez kasowania prób logowania.
Adres konta nie jest utrwalony w repo. Rollback UI nie wymaga DROP COLUMN;
cofnięcie flagi musi być osobną celowaną operacją z kontrolą sesji.

## Review and approved rollout follow-up (2026-10-25)

Owner explicitly approved merging #1515, deploying API/panel and activating the
technical account. Automated Claude review failed execution twice; external
Codex review remained running for several hours without a verdict. Neither is
claimed as a completed review. Local source review covered the auth boundary,
profile routing, staff writes/selectors, booking provider validation, migration,
release metadata and rollback.

Local review found that employee DELETE and commission read/write still accepted
technical account IDs. Three fail-first tests reproduced this; guards now reject
the target before deletion or commission mutation. Targeted suite: 7/7 PASS;
backend typecheck PASS. The remaining reviewed changes have no blocking findings.
CI is rerun for the final SHA before merge/deploy.

## Follow-up

CI dokładnego SHA, przegląd i akceptacja wdrożenia zmiany uwierzytelniania
zgodnie z instrukcjami ownera. Następnie rzeczywisty smoke: właścicielka ma
pulpit salonu, admin systemu ma techniczny i pełne moduły, nie jest pracownikiem,
klient nie odczytuje /system/status, a APP_RELEASE odpowiada wdrożonemu API.
Cutover domeny i izolacja dev pozostają odrębnymi bramkami UAT.

## Production verification (2026-10-25)

Owner approved rollout. PR #1515 merged as ad41ae49; CI 40212869107 and
Deploy 40212869116 completed successfully. Pre-migration database dump
pre-system-admin-2026-10-25T16-35-13-526Z.dump is on the server, mode 600;
pg_restore --list passed (archive index proof, not a restore drill).

Target account was confirmed admin with zero employee_services, timetables,
appointments as provider and time_blocks. Set the flag, incremented authVersion
and revoked one refresh token atomically. Password unchanged.

Live API checks using short-lived signed read-only test sessions: technical
200, business admin 403, client 403, anonymous 401; no-store and API SHA match.
Technical account absent from employees, ordinary owner/admin remains; commission
GET for technical ID returns 404. API/database/SMTP/Instagram health all ok.
Actual browser renders technical dashboard on desktop/mobile. This does not
claim password-login verification; separate production Playwright regression
40213894642 exercises the existing test accounts.

Mobile screenshot exposed 11px overflow with a real full-length release SHA
(the earlier fixture had null). Next scoped UI change wraps the code element;
final mobile acceptance remains pending that deployment.
