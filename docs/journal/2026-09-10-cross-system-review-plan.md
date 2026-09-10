# Przegląd przekrojowy i plan poprawek przed importem

- Data: 2026-09-10
- Agent: Codex
- Baza review: `605fec3597f89606a3f4c6bc9c32eeaebb17a2c7`
- Zakres zmiany: raport i plan, bez zmian kodu aplikacji.
- Decyzja: NO-GO dla szerokiego startu do zamknięcia P1 poniżej.

## Zakres i ograniczenia dowodów

Przegląd przekrojowy objął kontrakty panel/API, wizyty i finalizację,
katalog usług, importy produktów/usług, przygotowanie koloryzacji, sesje,
role, powiadomienia, bramki CI/deploy oraz dokumentację gotowości.
Przejrzano również fragmenty kontroli dostępu magazynu i obsługi uploadów.
Repozytorium ma 1096 plików w katalogach źródłowych objętych inwentaryzacją
i 52 kontrolery backendu. To review oparte na ryzyku, nie certyfikacja każdej
linii ani każdego ekranu. Nie przeprowadzono nowego pełnego UAT przeglądarkowego,
testu penetracyjnego ani odczytu danych klientek na produkcji.

Status dowodów: **R** — reprodukcja syntetyczna wykonana w tej sesji;
**S** — potwierdzenie przez analizę kodu, bez reprodukcji integracyjnej;
**V** — otwarty warunek weryfikacji, nie potwierdzona awaria.

## Finding

### F1 · P1 · R — klientka odczytuje wewnętrzne pola wizyty przez inną trasę

`backend/salonbw-backend/src/appointments/appointments.controller.ts:99`
zwraca surowe encje w `items` dla roli Client. `findForUser` w
`appointments.service.ts:605` ładuje także receptury. Tymczasem `/appointments/me`
celowo usuwa notatki i kwoty. Reprodukcja wywołania kontrolera z syntetycznym
serwisem potwierdziła obecność `internalNote` i `paidAmount` w ogólnej liście
oraz brak `internalNote` w dedykowanej odpowiedzi. To własne wizyty klientki,
nie dowód odczytu wizyt innych klientek. Lista personelu także nadal oddaje
pełne relacje (`appointments.service.ts:401`), omijając minimalizację `/:id`.

Naprawa: wspólne, jawne DTO dla klientki i personelu we wszystkich odczytach
i odpowiedziach mutacji; jednoznaczny format list. Kryterium: test HTTP z rolą
Client nie otrzymuje notatki wewnętrznej/rozliczeń żadną dostępną trasą;
pracownik nie otrzymuje zbędnych pól relacji. Zweryfikować również OpenAPI.

### F2 · P1 · S — równoczesna finalizacja może podwoić skutki magazynowe

`appointments.service.ts:1266` odczytuje status przed transakcją;
`:1387` wykonuje bezwarunkowy UPDATE po ID. Dwa żądania mogą zobaczyć ten sam
stary status, a drugie po odblokowaniu wiersza kontynuować finalizację.
`commissions.service.ts:108` zwraca istniejącą prowizję, więc jej unikalność
nie blokuje dalszego zapisu sprzedaży, zużycia i receptury. Transakcja chroni
przed częściowym zapisem pojedynczego żądania, ale nie zapewnia jednokrotności.

Naprawa: ponowny odczyt i walidacja statusu pod blokadą w transakcji albo
warunkowa zmiana statusu z kontrolą liczby zmienionych wierszy. Kryterium:
test PostgreSQL z barierą dwóch żądań daje dokładnie jeden komplet zapisów
sprzedaży, zużycia i receptury, jedną prowizję oraz przewidywalny wynik
drugiego żądania. Dodać też wyścig anulowanie–finalizacja. Reprodukcja PG
jest pierwszym krokiem tej poprawki; nie wykonano jej podczas tego review.

### F3 · P1 przed importem · S — reimport usług niszczy powiązania wariantów

`backend/salonbw-backend/scripts/import-services.ts:359` usuwa wszystkie
warianty istniejącej usługi i tworzy nowe identyfikatory. Migracja
`src/migrations/1760070000000-AddServiceDetailsTables.ts:52` ustawia dla wizyt
ON DELETE SET NULL, a dla `employee_services` (:71) ON DELETE CASCADE.
Ponowny import może więc odłączyć wariant od wizyty i usunąć przypisania
pracowników. Operacje nie są objęte jedną transakcją importu.

Naprawa: stabilne mapowanie identyfikatorów źródłowych i upsert; archiwizacja
brakujących wariantów zamiast usuwania używanych. Kryterium: drugi import
nie zmienia ID ani FK istniejącej wizyty i przypisań; awaria wycofuje pakiet.

### F4 · P1/P2 · R+S — katalog ujawnia pola wewnętrzne

`src/services/services.controller.ts:45` dopuszcza klientki do ogólnego
katalogu; `services.service.ts:65`, `:110`, `:145` zwracają pełne encje,
w tym `privateDescription` i `commissionPercent`. Publiczna metoda (:153)
usuwa tylko opis prywatny. Reprodukcja syntetyczna potwierdziła pozostawienie
prowizji w odpowiedzi publicznej. Nie sprawdzano wartości na produkcji.

Naprawa: jawny DTO publicznego/rezerwacyjnego katalogu i osobny kontrakt
administracyjny. Kryterium: brak prywatnego opisu i prowizji w odpowiedziach
anonimowych oraz Client; rezerwacja nadal ma ceny, warianty i czas.

### F5 · P2 · S — awaria historii wygląda jak brak historii

`apps/panel/src/components/calendar/appointment-drawer/FormulaSection.tsx:67`,
`:82`, `:94` ustawiają stan „załadowano” także po błędzie, pozostawiając puste
tablice. Widok (:197) może wtedy pokazać „Brak zapisanej historii przygotowania”
lub niepełne materiały bez ostrzeżenia. To wpływa bezpośrednio na decyzję żony
o czasie koloryzacji i przygotowaniu farby/oksydantu.

Naprawa: osobne stany błąd/pusto/sukces dla trzech źródeł, informacja o
częściowych danych i ponowienie pobrania. Kryterium: 500/403/offline nigdy
nie są przedstawiane jako potwierdzony brak historii; test telefonu 390 px.

### F6 · P1 procesu wydania · S — Deploy nie czeka na CI

`.github/workflows/deploy.yml:7` startuje niezależnie na push; brak bramki
sukcesu CI dla wdrażanego SHA. Linie 91–97 używają GitHub environment staging
także dla automatycznych ścieżek produkcyjnych. Kod może trafić na produkcję
przed zakończeniem testów lub mimo późniejszego czerwonego audytu.

Naprawa: zależność wdrożenia od pełnego CI dokładnie tego samego SHA, również
dla ręcznego ref; zgodność środowiska z rzeczywistym celem. Zachować
autoryzowany automatyczny rollout. Kryterium: test workflow z czerwonym CI
nie dochodzi do uploadu ani migracji; nowszy commit nie podmienia artefaktu.

### F7 · P2 · R — odpowiedź edycji usługi zawiera starą cenę

`services.service.ts:173` zapisuje zmianę, następnie `findOne` (:174) może
odczytać stary cache; invalidacja jest dopiero po tym odczycie (:184).
Reprodukcja syntetyczna: zapis ceny 200, odpowiedź PATCH 100.

Naprawa: invalidacja przed odczytem odpowiedzi albo świeży odczyt repozytorium.
Kryterium: przy rozgrzanym cache PATCH oraz następny GET pokazują nową cenę,
czas i nazwę; log opisuje aktualny stan.

### F8 · P2 przed importem · S — dry-run nie opisuje rzeczywistych zmian

`scripts/import-products.ts:298` i `scripts/import-services.ts:240` kończą
dry-run po parsowaniu, przed porównaniem z bazą. Nie pokazują kolizji,
nadpisań i skutków dla FK. Produkty (:262) wybierają ilość jednostek albo
opakowań bez jawnego przelicznika i zaokrąglają do całości; (:406) nadpisują
aktualny stan. Nie zakładamy, że to właściwa semantyka dla materiałów farbowania.

Naprawa: raport create/update/skip/conflict, jawne jednostki i przeliczniki,
walidacja cen, czasów, duplikatów i uciętych wartości; domyślnie plan, apply
zatwierdzonego wsadu. Kryterium: 1 opakowanie 60 ml nie staje się 1 ml;
drugi import nie resetuje sprzedaży/zużycia po pierwszym imporcie; raport
uzgadnia liczbę klientek, wizyt, receptur i powiązań przed/po.

## Plan realizacji

| Kolejność | Pakiet / odpowiedzialny | Warunek ukończenia |
|---|---|---|
| 1 | F1 + F4, implementacja techniczna | Macierz anonim/Client/Employee/Receptionist/Admin i testy HTTP minimalizacji; DTO oraz OpenAPI zgodne |
| 2 | F2, implementacja techniczna | Test PG fail-first; pojedynczy skutek przy powtórzeniu/wyścigu, zachowana atomowość |
| 3 | F6, implementacja techniczna | Produkcyjny rollout wyłącznie po zielonym CI wdrażanego SHA |
| 4 | F5 + F7, implementacja techniczna | Wiarygodne stany historii i świeże dane po edycji; testy błędów i mobile |
| 5 | F3 + F8, technicznie + owner mapowanie | Idempotentny import próbki na izolowanej bazie, FK i bilans danych bez strat |
| 6 | Owner + agent: rzeczywisty UAT | Koloryzacja z proporcjami → decyzja o czasie → rozmowa → przełożenie → finalizacja; powiadomienie odebrane na wskazanym telefonie |

Każdy pakiet: osobny minimalny commit, test odtwarzający problem przed
naprawą, celowana regresja, typecheck/build, journal, CI i weryfikacja
wdrożenia. Nie łączyć zmian autoryzacji z importem danych w jednym rolloutcie.
Wycofanie poprawek aplikacji: revert danego pakietu i ponowne wdrożenie;
wycofanie importu wymaga osobnego, uprzednio sprawdzonego planu danych.

## Dalsze weryfikacje (V), nie potwierdzone awarie

- Sesje: sprawdzić równoległy refresh z dwóch kart — w `auth.service.ts:251–282`
  odczyt i unieważnienie tokenu nie są atomowe. Jedno żądanie nie powinno
  pozwalać na wielokrotne zużycie starego tokenu. Obecny `authVersion` jest
  sprawdzany; nie mylić tego z brakiem unieważniania sesji.
- Import klientek/wizyt/receptur: mapowanie z rzeczywistego formatu wsadu,
  zachowanie proporcji i dat, deduplikacja kont już zarejestrowanych oraz
  wyłączenie wysyłki historycznych powiadomień podczas importu.
- Backup i uploads: decyzja ownera z 2026-08-06 świadomie pomijała restore-drill.
  Nie odwołujemy tej decyzji automatycznie. Przed realnym importem rekomendowana
  próba odtworzenia bazy i plików; stan health nie jest dowodem odtwarzalności.
- Powiadomienia: health SMTP i testy mock nie dowodzą dostarczenia e-maila,
  WhatsApp/SMS/push. Potrzebny wskazany odbiorca i kontrolowany scenariusz.
- Wydajność: lista wizyt personelu nie ma limitu przy braku dat. Zmierzyć
  p95 i pamięć na oczekiwanej wielkości importu; ustalić zakres dat/paginację.
- Dokumentacja: PROJECT_STATE wyłącza pracownika z GO, choć owner prosił
  o jego ścieżkę. Rozdzielić dowód techniczny od decyzji o kontach na start.
  Ujednolicić starsze opisy admin jako osobnej aplikacji z aliasem panelu
  w workflow. Nie uznawać historycznego UAT za akceptację nowych zmian.
- Landing/UX: aktualny typecheck przechodzi; pozostaje pełny przegląd ekranów
  publicznych i panelu po zalogowaniu, klawiatura, telefon, stany błędów,
  niedziałające akcje, zgody i cutover. Review kodu nie zastępuje tego dowodu.

## Validation

- Świeżo uruchomione: backend 51 zestawów / 402 testy PASS; panel 96 / 391 PASS.
- `pnpm -r --if-present typecheck`: backend, panel, landing PASS.
- `pnpm audit --prod --audit-level high`: 3 moderate, 0 high/critical.
- Reprodukcje R wykonane przez ts-node z syntetycznymi repozytoriami/serwisami;
  bez połączenia z bazą, bez sekretów i danych klientek.
- CI `34508910141` i Deploy `34508909939` dla bazowego commitu ponownie
  sprawdzone przez GitHub CLI: success. Nie uruchamiano nowych buildów ani
  testów PG w tej sesji; nie przypisujemy im nowego wyniku.

## Change / Rollout / Follow-up

Zapisano plan i uaktualniono bieżące ryzyka w PROJECT_STATE. Bez wdrożenia
aplikacji i bez importu. Następny krok: F1 + F4, następnie test równoległej
finalizacji F2; import właściwy dopiero po pakiecie 5 i osobnej decyzji ownera.
