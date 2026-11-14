# V18 — izolacja i lokalna próba recovery

- Data: 2026-11-14. PR: #1705 (Draft). Wynik: PARTIAL / DEV i PROD NO-GO.
- Badany kod: `bce7685893beb7c32462a4f8d03a6d88385558c9`.

## Finding

Odczyt metadanych klastra przez rolę DEV wykazał efektywny przywilej CONNECT do produkcyjnej bazy; CONNECT jest też nadany PUBLIC. Nie wykonywano połączenia do bazy produkcyjnej: dostępu do danych, tabel ani reguł sieciowych nie sprawdzono. Rozdzielone nazwy ról i baz nie dowodzą izolacji uprawnień. Statyczna konfiguracja flag wysyłek nie dowodzi stanu wszystkich działających procesów; odczytano jedną aktywną linię crontab użytkownika, bez badania jej treści. Sesje i pozostałe harmonogramy pozostają niezweryfikowane.

Skrypt real-stack fixture używa na sztywno localhost:5432 i `dropSchema`; port zajmuje inna lokalna usługa. Nie uruchomiono go przeciw temu portowi. Pełny odizolowany real-stack UAT nadal jest otwarty.

## Change

Wyłącznie dokumentacja; kod aplikacji, cache, konfiguracja i uprawnienia bez zmian.

## Validation

- Panel Jest 668/668, backend Jest 650 PASS, 3 SKIP; lint panelu 0 błędów, 8 ostrzeżeń. Build i typecheck panelu oraz backendu PASS. Lokalny Gitleaks: 106 commitów, bez wykryć. Pierwszy typecheck panelu podczas równoczesnego buildu trafił na usuwany plik `.next/types`; ponowienie po buildzie PASS.
- Playwright z przechwyconym API: 6 PASS, 2 planowe SKIP, desktop i mobile 390 px. To nie jest real-stack UAT.
- W odrębnej wewnętrznej sieci Docker, bez publikacji portów, pełny syntetyczny fixture PostgreSQL utworzony PASS; NestJS uruchomiony i healthcheck PASS. Pierwszy start był BLOCKED przez brak linuxowej biblioteki `sharp`; po dostarczeniu testowej zależności dla Linux ARM64 start przeszedł. Próba anonimowego adresu zwróciła 404 z powodu użycia prefiksu panelu — autoryzacja nie została tą próbą sprawdzona. Brak testu przeglądarka → panel → API → DB.
- Read-only SSH: tożsamość DEV, transakcja read-only i brak uprawnień administracyjnych klastra PASS; ustawienia runtime i outbound wyłącznie jako kontrola konfiguracji. `has_database_privilege` wykazało CONNECT; ACL bazy wskazuje PUBLIC CONNECT.
- PostgreSQL 16 w prywatnej sieci Docker bez portów: 106 migracji na pustej syntetycznej bazie, `pg_dump` i `pg_restore --exit-on-error` do odrębnej bazy PASS. Źródło i cel: 84 tabele, 246 ograniczeń, 106 wpisów migracji. Nie porównano wszystkich danych i definicji ani nie wykonano testu aplikacji na odtworzonej bazie.
- To nie jest test kopii MyDevil ani pomiar RPO/RTO. Dostępność punktu odzyskiwania, czas otrzymania i przywrócenia kopii oraz zgodność danych pozostają nieznane; patrz `docs/DEV_DEPLOYMENT_POLICY.md`.
- GitHub wskazuje tylko check GitGuardian, nie kompletne exact-SHA CI. Żaden lokalny wynik nie jest wynikiem GitHub Actions.

## Rollout

Brak merge, deploymentu, restartu lub zmiany hosta. Nie użyto danych klientów ani nie wykonano wysyłek. Kontenery i sieć próby usunięto po zakończeniu.

## Follow-up

Właściciel i operator DB: ocenić PUBLIC CONNECT, granice HBA i uprawnień danych oraz przygotować odrębnie zatwierdzoną korektę. Zbudować izolowany harness bez kolizji localhost, przeprowadzić real-stack UAT, sprawdzić sesje i wszystkie schedulery/wysyłki, odtworzyć kopię dostawcy na izolowanym celu i ustalić RPO/RTO. Uzyskać niezależny review i exact-SHA CI przed decyzją o DEV.
