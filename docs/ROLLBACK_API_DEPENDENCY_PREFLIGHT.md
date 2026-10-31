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
