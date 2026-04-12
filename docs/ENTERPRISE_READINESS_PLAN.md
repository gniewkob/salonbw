# Enterprise Readiness Plan

_Last updated: 2026-04-03_

Ten dokument opisuje plan dojścia SalonBW do poziomu enterprise dla danych:
- finansowych,
- personalnych,
- operacyjnych,
- tenantowych.

Cel nie polega na "dodaniu kilku zabezpieczeń", tylko na domknięciu całego łańcucha:
- aplikacja,
- logi,
- CI/CD,
- backup/restore,
- dostęp operacyjny,
- środowiska,
- obserwowalność,
- audyt.

## 1. Status docelowy

Za gotowość enterprise uznajemy stan, w którym:
- produkcja nie jest obsługiwana przez szerokie, ad hoc operacje SSH z GitHub Actions,
- dane wrażliwe nie trafiają do logów, artefaktów CI ani snapshotów bez kontroli,
- backupy są szyfrowane i regularnie testowane przez restore drill,
- środowiska mają twarde approval gates i kontrolę dostępu,
- staging/local używają danych zanonimizowanych lub pseudonimizowanych,
- istnieje pełny audit trail dla operacji administracyjnych i dostępu do danych wrażliwych,
- istnieje jawna decyzja `go/no-go` dla onboardingu danych wrażliwych.

## 2. Model wykonania

Plan jest podzielony na trzy poziomy:

- `Must-Have`
  - blokery przed wpuszczeniem pełnych danych finansowych i personalnych
- `Next`
  - rzeczy potrzebne, żeby środowisko nie było tylko "bezpieczniejsze", ale operacyjnie dojrzałe
- `Later`
  - refaktory i podniesienie jakości do poziomu długoterminowego

## 3. Must-Have

### 3.1 Production access hardening

#### Zakres
- Wyciąć pozostałości szerokiego trybu operacyjnego przez SSH.
- Zostawić wyłącznie allowlistowane operacje:
  - deploy,
  - restart,
  - health probe,
  - redacted log fetch,
  - migration status.
- Włączyć GitHub Environments z required reviewers dla `production`.
- Ograniczyć, kto może odpalać workflowy produkcyjne i kto może zatwierdzać deploy.

#### Kryteria akceptacji
- wszystkie workflowy produkcyjne używają `production` environment,
- `production` ma required reviewers,
- nie istnieje workflow z arbitralnym remote shell input,
- operatorzy produkcyjni są jawnie wskazani rolą lub nazwą.

#### Dowody
- screenshot lub eksport ustawień GitHub Environment,
- lista workflowów deploy/ops z krótkim opisem,
- wpis w `docs/AGENT_STATUS.md`.

### 3.2 Backup / restore as a controlled capability

#### Zakres
- Wdrożyć szyfrowane backupy bazy danych i backupów operacyjnych.
- Udokumentować:
  - ownera backupów,
  - lokalizację,
  - sposób szyfrowania,
  - retencję,
  - sposób odtwarzania.
- Wykonywać restore drill cyklicznie i zapisywać wynik.
- Traktować "backup without tested restore" jako niewystarczający.

#### Kryteria akceptacji
- istnieje jeden aktualny runbook backup/restore,
- backup jest szyfrowany in transit i at rest,
- retencja jest określona,
- ostatni restore drill ma datę i wynik,
- jest wskazany owner procesu.

#### Dowody
- aktualizacja `docs/ROLLBACK_PROCEDURE.md`,
- wpis o restore drill w `docs/AGENT_STATUS.md`,
- jawna checklista restore.

### 3.3 Secret management

#### Zakres
- Odejsć od rozproszonego modelu sekretów w `.env` i samych GitHub Secrets.
- Wdrożyć dedykowany secret manager:
  - Vault,
  - Doppler,
  - 1Password Secrets Automation,
  - albo równoważny system.
- Wprowadzić rotację sekretów produkcyjnych:
  - JWT,
  - SMTP,
  - SMS,
  - WhatsApp,
  - płatności,
  - bazy danych.

#### Kryteria akceptacji
- istnieje źródło prawdy dla sekretów,
- każdy sekret ma ownera,
- istnieje procedura rotacji,
- po wdrożeniu hardeningu wykonano przynajmniej jedną rotację sekretów krytycznych.

#### Dowody
- uzupełnione `docs/ENV.md`,
- wpis o rotacji w `docs/AGENT_STATUS.md`.

### 3.4 Sensitive logging policy

#### Zakres
- Dokończyć przegląd wszystkich ścieżek logowania payloadów.
- Wymusić redakcję dla:
  - tokenów,
  - cookies,
  - haseł,
  - adresów email,
  - telefonów,
  - kodów bonów,
  - payloadów integracji,
  - danych finansowych.
- Utrzymać zasadę: dane wrażliwe są redagowane przed zapisem, nie po fakcie.

#### Kryteria akceptacji
- przegląd krytycznych ścieżek został odhaczony:
  - auth,
  - email,
  - SMS,
  - WhatsApp,
  - logs ingestion,
  - reminder flows,
  - exports/imports,
  - payment-related paths,
- nie ma znanych workflowów zwracających surowe produkcyjne payloady,
- istnieje polityka redakcji w `docs/SECURITY.md`.

#### Dowody
- lista przejrzanych ścieżek,
- wpis statusowy,
- wynik grep/review dla loggerów i `console.*`.

### 3.5 Non-production data policy

#### Zakres
- Staging i local dev nie mogą używać pełnych danych osobowych/finansowych z produkcji.
- Zbudować pipeline pseudonimizacji/anonymizacji snapshotów.
- Zabronić surowych dumpów do:
  - repo,
  - artefaktów GitHub Actions,
  - współdzielonych katalogów roboczych.

#### Kryteria akceptacji
- istnieje jawny, opisany proces tworzenia snapshotu non-prod,
- snapshot przechodzi przez anonimizację lub pseudonimizację,
- onboarding danych do local/staging używa checklisty,
- zabronione miejsca składowania dumpów są zapisane w docs.

#### Dowody
- dedykowana checklista onboardingu danych,
- skrypt albo runbook anonimizacji,
- wpis statusowy.

## 4. Next

### 4.1 CI/CD security gates

- Dodać obowiązkowe:
  - SAST,
  - secret scanning,
  - dependency scanning,
  - IaC/workflow scanning.
- Wymusić least-privilege `permissions` we wszystkich workflowach.
- Rozdzielić pipeline deploy od pipeline migracji bazy.
- Wprowadzić approval gate dla migracji produkcyjnych.

### 4.2 Access model and authorization

- Utwardzić RBAC i uzupełnić o action-level permissions.
- Rozważyć ABAC dla operacji na danych wrażliwych.
- Rozdzielić dostęp:
  - zwykły panel biznesowy,
  - administracja,
  - operacje/infrastruktura.
- Dla wybranych operacji dodać `reason for access`.

### 4.3 Audit trail

- Zapisywać nienaruszalny audit trail dla:
  - eksportów,
  - importów,
  - zmian ustawień płatności,
  - działań administracyjnych,
  - zmian ról/uprawnień,
  - odczytów krytycznych danych.
- Zapewnić, że audit trail sam nie przechowuje surowych sekretów ani payloadów wrażliwych.

### 4.4 Observability for security and compliance

- Dodać dashboardy i alerty dla:
  - anomalii logowania,
  - błędów auth/CSRF/cookies,
  - wzrostów eksportów,
  - błędów integracji płatności,
  - błędów masowej komunikacji,
  - działań administracyjnych poza normą.
- Wymusić correlation IDs przez:
  - HTTP,
  - jobs,
  - mail,
  - SMS,
  - WhatsApp.

## 5. Later

### 5.1 Architecture uplift

- Rozważyć `BFF` dla panelu tam, gdzie uprości to polityki auth i ograniczy ekspozycję tokenów.
- Rozdzielić shell biznesowy od shellu administracyjno-operacyjnego.
- Ograniczyć direct-to-API surface tam, gdzie nie jest potrzebna.

### 5.2 Data minimization and encryption

- Ograniczyć zakres przechowywanych danych do minimum biznesowego.
- Wprowadzić field-level encryption dla najbardziej wrażliwych pól:
  - telefony,
  - emaile,
  - notatki klienta,
  - identyfikatory finansowe,
  - kody bonów lub odpowiedników.

### 5.3 Supply-chain maturity

- Dodać podpisywanie buildów i provenance artefaktów.
- Ustabilizować dependency governance.
- Wprowadzić formalne review dla zmian workflowów, auth i operacji.

## 6. Priorytet wykonania

1. Environment protections + approval gates + kontrola dostępu do produkcji.
2. Backup/restore with encryption + restore drill.
3. Secret manager + rotacja sekretów.
4. Snapshot pipeline dla staging/local z pseudonimizacją.
5. Dokończenie redakcji logów i przeglądu ścieżek integracyjnych.
6. Audit trail dla operacji wrażliwych.
7. Security gates w CI/CD.
8. Głębsze refaktory architektoniczne.

## 7. Go / No-Go gate dla danych wrażliwych

Pełne dane finansowe i personalne można wpuścić dopiero wtedy, gdy wszystkie warunki poniżej są spełnione:

- [ ] `production` environment ma required reviewers i kontrolę dostępu
- [ ] nie istnieją workflowy z arbitralnym remote shell
- [ ] produkcyjne logi są redagowane i scoped
- [ ] backup jest szyfrowany
- [ ] restore drill został wykonany i zapisany
- [ ] sekrety krytyczne mają ownera i rotację
- [ ] istnieje pipeline pseudonimizacji dla non-prod
- [ ] istnieje checklista onboardingu danych
- [ ] istnieje jawna decyzja właścicielska `go`

Jeśli choć jeden punkt jest niespełniony:
- decyzja = `NO-GO`
- dopuszczalne są wyłącznie dane zanonimizowane lub pseudonimizowane

## 8. Rejestr ryzyk

### R1. Eksfiltracja przez workflowy operacyjne
- Skutek: wyciek logów, sekretów albo danych klienta
- Redukcja: allowlist workflows, environment protections, least privilege

### R2. Backup bez restore
- Skutek: fałszywe poczucie bezpieczeństwa, brak odzysku danych po incydencie
- Redukcja: restore drill, owner, retencja, szyfrowanie

### R3. Wyciek przez logi aplikacyjne
- Skutek: PII lub payloady finansowe w Loki, plikach logów albo artefaktach
- Redukcja: centralna redakcja, przegląd loggerów, polityka logowania

### R4. Użycie surowych danych produkcyjnych w non-prod
- Skutek: niekontrolowane powielenie danych osobowych
- Redukcja: anonimizacja, checklista onboardingu, zakaz surowych dumpów

### R5. Brak kontroli dostępu do produkcji
- Skutek: nieautoryzowane deploye, restart, migracje, odczyt logów
- Redukcja: GitHub Environment protections, ograniczenie operatorów, audit trail

## 9. Artefakty wymagane do zamknięcia planu

Minimum dokumentacyjne i operacyjne:
- `docs/SECURITY.md`
- `docs/ROLLBACK_PROCEDURE.md`
- `docs/CI_CD.md`
- `docs/AGENT_OPERATIONS.md`
- `docs/ENV.md`
- `docs/AGENT_STATUS.md`
- `docs/SENSITIVE_DATA_ONBOARDING_CHECKLIST.md`

## 10. Co robić teraz

Najbliższe działania praktyczne przed wpuszczeniem pełnych danych finansowych i personalnych:

1. Zweryfikować GitHub Environment protections dla `production`.
2. Ustalić i opisać ownera backupów, szyfrowanie, retencję i ostatni restore drill.
3. Dokończyć przegląd logowania payloadów biznesowych i integracyjnych.
4. Zrotować istniejące sekrety produkcyjne po hardeningu workflowów.
5. Przygotować pipeline pseudonimizowanego eksportu do pracy na danych zbliżonych do realnych.
6. Użyć checklisty onboardingu danych przed jakimkolwiek snapshotem spoza dummy seed.

## 11. Decyzja operacyjna

Do czasu zamknięcia sekcji `Must-Have` nie należy traktować platformy jako w pełni gotowej na pełne dane finansowe i personalne w standardzie enterprise.
