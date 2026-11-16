# Studio V18 — częściowa walidacja

- Data: 2026-11-14. PR: #1705. Stan: PARTIAL / DEV NO-GO.
- Baza analizy: `0320f9e97805b4b31d48ab4b85e20ccef66a2df4`.

## Finding

Test PostgreSQL oczekiwał, że starszy endpoint przenoszenia dopuści kolizję na podstawie globalnego ustawienia, choć implementacja wymaga odmowy bez jawnego zatwierdzenia. Test Playwright resetu filtra oczekuje nowego żądania; React Query może użyć przez 60 sekund wcześniejszego wyniku bez filtra.

## Change

Test PostgreSQL zachowuje kontrolę blokady i sprawdza odmowę kolizji oraz niezmieniony termin. Zachowanie aplikacji nie zostało zmienione.

## Validation

Na bazowym SHA: panel Jest 668/668, typecheck i build PASS, lint PASS z 8 ostrzeżeniami; wybrane testy backendu 170/170; 25 testów sterowania wdrożeniem i 13 testów konfiguracji PASS. Gitleaks: 104 commity od merge-base z lokalnym origin/master, brak wykryć. Po zmianie testu: PostgreSQL 27/27 w UTC oraz 27/27 w Europe/Warsaw na tymczasowym kontenerze. Playwright na syntetycznym API: 5 PASS, 1 FAIL, 2 SKIP; FAIL dotyczy braku nowego żądania po resecie. Pierwsze próby Playwright wymagały instalacji przeglądarki i syntetycznej konfiguracji bramki.

Test odtworzenia dwóch syntetycznych rekordów w tymczasowym PostgreSQL PASS, około 1 s; nie jest to pomiar odzyskania backupu operatora ani schematu aplikacji. SSH sprawdził ograniczone ustawienia runtime DEV; dostęp anonimowy do trzech wybranych adresów zakończył się HTTP 401. Uprawnienia innych baz, skuteczna izolacja sesji i harmonogramów pozostają niepotwierdzone.

## Rollout

Nie wykonano merge, deployu ani zmian na hoście. Wyniki lokalne nie są GitHub CI. Exact-SHA CI i zgoda na ewentualne odstępstwo pozostają bramkami.

## Follow-up

Rozstrzygnąć wymóg żądania po resecie filtra, poprawić i zweryfikować Playwright. Następnie wykonać pełny real-stack UAT z danymi syntetycznymi, kontrolę granic uprawnień i efektywnego wyłączenia wysyłek, odtworzenie właściwego schematu i próbę recovery operatora. Ponowić walidację na końcowym SHA oraz uzyskać wymagane decyzje właściciela przed DEV.
