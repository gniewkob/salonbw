# API-only: preflight rollbacku zależności (#1578)

**Status: BLOCKED / NO-GO.** Ten dokument nie jest autoryzacją deploymentu,
przywrócenia, migracji ani restartu. Aktualną ocenę i dowody operacyjne należy
przekazać właścicielowi kanałem prywatnym. Przed wykonaniem jakiejkolwiek
procedury wymagane są odrębna zgoda i uzgodniony operator.

## Zakres i warianty

- **A — archiwum runtime:** odtworzenie historycznego runtime razem z jego
  `node_modules` jest niedopuszczalne, jeśli graf nie przechodzi aktualnej
  polityki bezpieczeństwa. Integralność archiwum nie dowodzi bezpiecznych
  zależności, tożsamości commitu, poprawności restore ani zgodności z bieżącą
  bazą. Nowy, zatwierdzony graf wymaga osobnego artefaktu i nowej próby.
- **B — kod z zatwierdzonym grafem:** wskazać pełny, niezmienny SHA zawierający
  akceptowany kod, manifest npm i bieżącą bramkę bezpieczeństwa; zbudować
  artefakt oraz zainstalować i sprawdzić go na FreeBSD w izolacji. Nie
  zastępować npm-owego grafu przypuszczeniami wynikającymi z lockfile pnpm.
  B nie cofa regresji spowodowanej samą wersją zależności, jeśli zachowuje tę
  samą wersję. Dla takiej regresji potrzebna jest inna, bezpieczna wersja i
  odrębny kandydat z testami; nie wolno przywracać znanej podatnej wersji.

## Warunki przygotowania kandydata

1. Udokumentować przyczynę rollbacku, dokładny docelowy SHA i czas punktu
   odtworzenia. Potwierdzić, że wersja workflow i aplikacji są zidentyfikowane
   osobno, release jest dopuszczalnym przodkiem chronionego master oraz ma CI
   dla dokładnego SHA. Nie używać starego workflow pomijającego bramkę.
2. Potwierdzić prywatne backupy, uprawnienia, niezależne sumy, integralność,
   kompletność, bezpieczne ścieżki i izolowaną próbę odtworzenia. Same sumy
   zapisane obok archiwum nie dowodzą pochodzenia. Nie rozpakowywać danych
   klientek ani `.env` do środowisk testowych.
3. Zweryfikować kopię zatwierdzonego artefaktu: manifest, entrypoint, build,
   pełny graf zależności i oczekiwaną tożsamość SHA; wykonać instalację
   `npm22 install --omit=dev --ignore-scripts --no-package-lock` i identyczną
   bramkę zagnieżdżonych wersji. Przetestować Sharp (JPEG/PNG/WebP) i bcrypt na
   danych syntetycznych oraz sprawdzić aktualny audyt i pozostałe podatności.
4. Określić kompatybilność schematu bazy z obydwoma kodami i sposób obsługi
   wykonanych migracji. Jeśli zgodność nie jest dowiedziona: STOP. Ani ten
   dokument, ani izolowana próba nie zatwierdzają zmian w bazie.
5. Uzgodnić i przetestować niezmienność `.env` i uploads, a także niezależne
   ustawienie i wiarygodne sprawdzenie znacznika release. Istniejący workflow
   generuje i scala `.env` z `APP_RELEASE` oraz uruchamia migracje: nie spełnia
   bez dodatkowej walidacji założenia niezmiennego `.env` i braku migracji.
6. Przygotować oddzielną, odwracalną procedurę API-only oraz kopię aktualnego
   release do powrotu; potwierdzić, że panel, landing i uploads nie są w jej
   zakresie. Historyczne release bez wymaganych overrides muszą zostać
   odrzucone przed modyfikacją hosta.

## STOP / GO i weryfikacja po osobnej zgodzie

**STOP** przy braku któregokolwiek dowodu, nieznanym SHA, niezgodnym grafie,
złym archiwum, zmianie `.env` lub uploads poza uzgodnionym zakresem,
nieustalonej zgodności bazy, nieudanym teście native albo braku właściciela i
operatora. Nie obchodź bramki, nie wymuszaj podatnej wersji i nie pomijaj
kontroli tylko po to, by umożliwić rollback.

**GO** wyłącznie po zakończeniu wszystkich powyższych kontroli i oddzielnej
zgodzie właściciela na konkretny plan, artefakt i okno. Po wykonaniu operator
sprawdza `/healthz`, zależność od bazy i nagłówek `X-SalonBW-Release` równy
wybranemu pełnemu SHA; porównuje integralność niezmienianych danych i monitoruje
błędy bez ujawniania logów lub sekretów. Niezgodność oznacza STOP i uruchomienie
wcześniej przetestowanego planu powrotu do zatwierdzonej wersji docelowej, z
analogiczną kontrolą jej SHA i zdrowia. Ta kontrola nie zastępuje UAT.

## Projekt kandydata C — regresja zachowania zależności (2026-10-31)

**C = projekt, nie gotowy artefakt; BLOCKED.** Bazą kodu jest `b208e36ebb9df508bc8f4555346d1de9ffa5e9b7`, z manifestem i polityką #1576 (`1ced2e70a441389ded5a075659f8bf06b670644e`). Między tymi SHA kod API jest taki sam; jest to zatem użyteczna baza code-only, lecz nie odwraca regresji zależności. Dla zaobserwowanej regresji należy najpierw zapisać konkretny kontrakt i syntetyczny test fail-first na grafie #1576, następnie przygotować minimalną poprawkę adaptera/kodu lub inną bezpieczną wersję po ponownej ocenie advisory i polityki bramki. Nie znając regresji, nie wybierać spekulatywnie wersji ani nie twierdzić, że C przywraca zachowanie. Nowy SHA i kompletny artefakt wymagają własnego CI, review, audytu i testów regresji. Zmiana polityki bezpieczeństwa wymaga osobnej zgody.

### Macierz i granice

- **A:** archiwum nieznanego SHA — NO-GO; suma i odtworzenie kodu nie potwierdzają pochodzenia ani bezpieczeństwa.
- **B:** kod historyczny + manifest #1576 — kandydat wyłącznie na regresję kodu; wcześniejszy test FreeBSD jest częściowym dowodem, bez identyfikowalnego release i dowodu DB.
- **C:** kod + poprawiony graf + naprawa konkretnego zachowania — docelowa ścieżka regresji zależności; bez przypadku, implementacji i testów pozostaje projektem.

### Oddzielna procedura API-only: wymagania do implementacji i drill

1. Wybrać konkretny SHA i artefakt z manifestem plików, sumami, dowodem pochodzenia, pełnym grafem i CI dokładnego SHA; oddzielnie zidentyfikować wersję workflow. Weryfikować bramkę przed jakąkolwiek zmianą oraz zainstalowany graf i aktualny audit. Nie zakładać deterministycznego grafu na podstawie samych overrides.
2. W izolacji z syntetycznymi danymi przećwiczyć pełny staging i powrót w obie strony, w tym błędy instalacji, przerwanie transferu, błędny SHA, symlinki/ścieżki, uprawnienia i brak miejsca. Nie używać istniejącego workflow jako gotowej procedury: zmienia `.env`, uruchamia migracje i używa `rsync --delete` dla `dist`.
3. `.env`, uploads, baza i inne aplikacje są poza zestawem zmian. Zweryfikować zakres ścieżek, prawa i integralność przed/po bez ujawnienia treści; unikać podążania za nieoczekiwanymi symlinkami. Zapewnić koordynację zapisów uploads w czasie pomiaru. Kopie i niezależny test odtworzenia pozostają wymagane.
4. DB: porównać migracje i wymagania obu wersji z faktycznym schematem oraz sprawdzić obie wersje na syntetycznej bazie o tym samym schemacie i stanie migracji. Bez dowodu zgodności zatrzymać; nie wykonywać migracji, down-migration ani restore DB w ramach rollbacku API. Przy nieodwracalnej zmianie schematu przygotować osobny plan z akceptacją właściciela.
5. `APP_RELEASE` pochodzi z otoczenia procesu, a kod wysyła nagłówek tylko dla 40-znakowego SHA. Zachowanie `.env` oznacza, że stary `APP_RELEASE` może fałszywie identyfikować nowy kod. Wymagana sprawdzona na docelowym Passenger metoda bez zmiany `.env`, która dostarcza właściwy SHA przed startem i nie jest nadpisywana przez dotenv; jeśli jej nie ma — STOP. Testować prawdziwe źródło nagłówka i artefakt niezależnie, nie ufać samemu nagłówkowi.
6. `dist/migrate.js`: nie wykonywać, nie usuwać i nie przyjmować za część wydania na podstawie samej obecności. W przyszłej autoryzowanej diagnostyce wyłącznie odczytowo porównać hash, metadane, manifest builda i oba możliwe entrypointy z odtwarzalnym buildem dokładnego SHA; wynik nieznany = STOP. `rsync --delete` usunął taki dodatkowy plik w lokalnej syntetycznej próbie, więc nie jest neutralny wobec niego.
7. Powrót do poprzednio zaakceptowanego artefaktu musi być przećwiczony tymi samymi bramkami i mieć osobny SHA, zgodność schematu i marker. Po ewentualnym osobno zatwierdzonym wykonaniu: `/healthz`, DB health, dokładny `X-SalonBW-Release`, syntetyczne smoke i monitoring błędów; rozbieżność = STOP i ocena powrotu.

**Stan:** brak gotowego wdrażalnego wariantu, zatwierdzonego mechanizmu znacznika, dowodu DB i wyjaśnienia pliku; `ROLLBACK_PREFLIGHT=BLOCKED`. Żadne z powyższego nie jest upoważnieniem do działania na produkcji.
