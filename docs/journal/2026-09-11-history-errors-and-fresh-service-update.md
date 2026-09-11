# Wiarygodna historia przygotowania i świeża odpowiedź po edycji usługi

- **Data:** 2026-09-11
- **Agent:** Codex
- **Commit(y):** bieżący commit
- **PR:** brak

## Finding

Sekcja przygotowania oznaczała każde nieudane pobranie formuł, zużycia lub
historii wizyt jako zakończone ładowanie. W rezultacie awaria API mogła wyglądać
jak prawdziwy brak historii, na której właścicielka opiera czas i recepturę
zabiegu. Osobno `ServicesService.update()` odczytywał usługę przed
unieważnieniem cache i mógł zwrócić poprzednią nazwę lub cenę po udanym zapisie.

## Change

- Karta przygotowania pokazuje stan ładowania i jawny błąd, gdy którekolwiek z
  trzech źródeł danych zawiedzie.
- Częściowo pobrana historia pozostaje widoczna, ale komunikat o pustej historii
  pojawia się wyłącznie po trzech udanych, pustych odpowiedziach.
- Przycisk `Spróbuj ponownie` ponawia komplet trzech ograniczonych zapytań.
- Pobieranie historii zależy od stabilnych ID wizyty i klientki. Nowy obiekt
  tej samej wizyty z renderu rodzica nie zeruje błędu ani nie wywołuje
  samoczynnej, mylącej próby.
- Aktualizacja usługi unieważnia cache przed ponownym odczytem i zapisuje w nim
  świeży rekord użyty również w odpowiedzi.

## Validation

- Fail-first panel: odrzucone `/customers/:id/formulas` było przedstawiane jako
  `Brak zapisanej historii przygotowania.`
- Fail-first backend: rozgrzany cache zwracał obiekt `Old` po aktualizacji do
  `New`.
- Testy celowane po poprawce: PASS.
- Backend: 51 zestawów, 408 testów; typecheck, lint i build PASS.
- Panel: 96 zestawów, 392 testy; typecheck, lint i build PASS.
- Produkcyjny test mobilny pierwszego wdrożenia ujawnił, że ponowny render tej
  samej wizyty zacierał błąd pustą odpowiedzią. Nowy test fail-first odtworzył
  2 pobrania; po stabilizacji zależności pozostaje 1 do czasu użycia przycisku.
- `git diff --check`: PASS.

## Rollout

Commit `a8cfaea5`: CI `34539466722` i Deploy `34539466741` success. Pierwsza
weryfikacja produkcyjnego bundle na 390 px wykryła opisany dodatkowy przypadek
renderu. Poprawka `8e57d9c6` przeszła CI `34571875569` i Deploy `34571875597`.
Ponowny test produkcyjny 390 x 844 potwierdził jawny błąd historii bez
fałszywego komunikatu o braku danych; przycisk ponowienia po trzech udanych
pustych odpowiedziach pokazał prawidłowy pusty stan. Jedyny błąd konsoli był
oczekiwanym skutkiem celowo zasymulowanego 503. Użyto tylko syntetycznych
odpowiedzi i nie modyfikowano danych klientek.

## Follow-up

F3/F8: wdrożyć przygotowaną bramkę importu, następnie wykonać plan na
rzeczywistych plikach bez zapisu.
