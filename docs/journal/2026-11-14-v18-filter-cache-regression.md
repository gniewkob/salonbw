# Studio V18 — regresja resetu filtra

- Data: 2026-11-14. PR: #1705 (Draft). Baza: `4c0c07bc2ae8de4dd6ba65b7aabed0b5c48dd670`.

## Finding

Klucz `useCalendar` obejmuje `employeeIds`; aplikacja domyślnie traktuje dane jako świeże przez 60 sekund. Reset wraca do wcześniejszego klucza, więc może przywrócić wynik z cache bez żądania. Sam brak żądania nie dowodzi błędu funkcjonalnego. Współdzielony hook obsługuje również klasyczny kalendarz; `staleTime=0` zmieniłby szerszą politykę odświeżania.

## Change

Bez zmian runtime. Syntetyczny test odróżnia odpowiedź filtrowaną od pełnej, sprawdza zniknięcie i powrót wizyty oraz brak parametru `employeeIds` w żądaniu nowego okresu. Reset nie wymaga konkretnego źródła danych.

## Validation

Na drzewie kandydata: Playwright mobile Chromium, cztery scenariusze powtórzone trzykrotnie: 12 PASS; obejmuje szerokości 390, 375 i 320 px. TypeScript PASS. Pierwszy przebieg bez konfiguracji syntetycznej bramki nie był poprawnym testem funkcji; powtórzono z lokalnym fixture. ESLint domyślnie ignoruje plik testowy i nie stanowi dowodu lint dla niego. Wynik exact-SHA podaje raport zadania po commit.

## Rollout

Brak merge i deployu. DEV/PROD NO-GO; lokalny test z syntetycznym API nie jest real-stack UAT ani exact-SHA CI.

## Follow-up

Uruchomić walidację exact-SHA i CI po odblokowaniu Actions; wykonać real-stack UAT, sprawdzić izolację i recovery oraz uzyskać wymagane akceptacje przed jakimkolwiek wdrożeniem.
