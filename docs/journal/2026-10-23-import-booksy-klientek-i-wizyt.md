# Import klientek, historii wizyt i opinii z Booksy

- **Data:** 2026-10-23
- **Agent:** Claude Opus 5.5
- **Commit(y):** ten commit
- **PR:** gałąź `claude/przygotowany-plan-rp46za`

## Co dostarczono

- `backend/salonbw-backend/scripts/import-booksy.ts` (`pnpm import:booksy`):
  import `clients.csv`, `appointments.csv` i (opcjonalnie) `reviews.csv`
  z eksportu Booksy.
  Domyślnie wykonuje tylko plan, a zapis wymaga flagi `IMPORT_BOOKSY_APPLY=1`
  i odbywa się w jednej transakcji. Konflikty blokują zapis. Raport podaje
  same liczby, bez imion, telefonów i adresów e-mail.
- `src/import/booksy-import-planning.ts`: reguły importu z testami (19/19).
- Migracja `1762610000000-CreateImportSourceLinks`: tabela
  `import_source_links` zapisuje, który rekord panelu powstał z której karty
  lub rezerwacji w Booksy. Ponowne uruchomienie na nowszym eksporcie dogrywa
  tylko nowości, więc przy przejściu wystarczy to samo polecenie.

## Reguły

- **Hasła.** Każda importowana klientka dostaje bcrypt-hash losowego
  sekretu, czyli hasło, którym nie da się zalogować. Flaga
  `IMPORT_BOOKSY_RESET_CLIENT_PASSWORDS=1` robi to samo dla wszystkich kont
  klientek, także założonych wcześniej, i unieważnia ich sesje
  (`authVersion+1`). Tak brzmi decyzja ownera z 2026-10-23.
- **Zgody.** Żadna zgoda nie jest ustawiana, bo eksport ich nie zawiera
  (same zera).
- **E-mail.** Booksy zapisuje brak adresu jako tekst „None” (588 kart).
  Brak adresu albo adres powtórzony na kilku kartach daje adres zastępczy
  `booksy.<karta>@import.local.invalid`. Wspólny prawdziwy adres trafia do
  karty z największą liczbą wizyt. Karta jest łączona z istniejącym kontem
  klientki po adresie e-mail, a w drugiej kolejności po telefonie, gdy jest
  jednoznaczny.
- **Notatki.** `business_note` trafia do notatki wewnętrznej wizyty, której
  klientka nie widzi. Notatka tajna i czarna lista trafiają do opisu karty
  (tylko personel). Gdy karta łączy się z kontem, które już istnieje, notatka
  jest dopisywana pod dotychczasowym opisem, a nie go zastępuje (uwaga
  z recenzji Codex; sprawdzone lokalnie na koncie z własną notatką).
- **Usługi.** Najpierw dopasowanie po nazwie do istniejącej usługi
  (aktywnej, a w drugiej kolejności nieaktywnej). Gdy go nie ma, powstaje
  nieaktywna usługa historyczna (bez rezerwacji online) o oryginalnej nazwie,
  z medianą ceny i czasu.
- **Statusy.** Finished → zrealizowana (kwota: `final_price`, a gdy jej brak,
  `price`; metoda płatności nieznana). Cancelled i Declined → anulowana,
  z powodem. No-show → nieobecność. Confirmed (przyszłe) są importowane
  tylko z `IMPORT_BOOKSY_INCLUDE_FUTURE=1`. Przeszłe wizyty mają
  `reminderSent=true`, więc nie wywołają wysyłki przypomnień.
- **Pracownicy.** Wizyta trafia do konta personelu o tej samej nazwie albo
  według `IMPORT_BOOKSY_STAFF_MAP`. Pracownik bez przypisania blokuje zapis.
  Gdy wizyta trafia do innej osoby niż w Booksy, notatka wewnętrzna dostaje
  dopisek „Wykonała (Booksy): …”.
- **Opinie.** Booksy podaje tylko imię i co najwyżej inicjał nazwiska.
  Opinia jest importowana tylko wtedy, gdy dokładnie jedna klientka o tym
  imieniu (i inicjale) miała zakończoną wizytę w ciągu 3 dni przed
  wystawieniem opinii. Opinia trafia wtedy do tej wizyty, z klientką
  i pracownikiem wziętymi z wizyty. Jedna opinia na wizytę; wizyta już
  oceniona w panelu nie dostaje drugiej. Odpowiedzi salonu (62) nie są
  przenoszone, bo panel nie ma na nie pola. Klucz opinii w
  `import_source_links` to skrót SHA-256, więc nie zawiera imion.
- **Strefa czasowa.** Skrypt wymaga `TZ=Europe/Warsaw`. Godziny z Booksy to
  czas lokalny salonu, a kolumny są typu `timestamp` bez strefy.

## Liczby z rzeczywistego eksportu (lokalnie)

| | |
|---|---|
| Klientki | 1047 kart: 456 z prawdziwym e-mailem, 591 z zastępczym (w tym 3 ze wspólnym adresem); 26 kart dzieli telefon; 7 z notatką |
| Wizyty | 13 461: 10 305 zrealizowanych, 3059 anulowanych, 3 nieobecności, 94 przyszłe |
| Wizyty bez klientki | **3261** (karta „null”, brak imienia i telefonu; prawie wszystkie z historii Versum). Import tylko z `IMPORT_BOOKSY_ANONYMOUS=1` na jedną zbiorczą kartę |
| Notatki salonu | 1560 wizyt |
| Usługi | 88 nazw historycznych; lokalnie 11 dopasowanych, 77 historycznych. Na produkcji część „… Ola” powinna trafić w 81 dezaktywowanych starych usług — pokaże to plan |
| Opinie | 560; **144 podpięte** pod wizytę, 413 bez pewnego dopasowania, 3 drugie do tej samej wizyty |
| Pracownicy w Booksy | Aleksandra Bodora 11 394, „Ola” 436, cztery byłe pracownice łącznie 1505 (684/403/396/22), „Solarium” 126 — imiona byłych pracownic celowo poza repo, plan je wypisuje |

Lokalny zapis z flagami ANONYMOUS, INCLUDE_FUTURE i RESET trwał 73 s.
Sprawdzono:

- godziny trzech losowych wizyt zgadzają się 1:1 z CSV;
- 0 haseł zapisanych jawnym tekstem;
- przyszłe wizyty nie są oznaczone jako przypomniane;
- ponowny plan: wszystko „already imported”, 0 do utworzenia;
- przez API (`/customers/:id/statistics`, `/events-history`) karta klientki
  pokazuje 310 wizyt od 2018 roku z wydatkami.

## Decyzje ownera (2026-10-23)

- Aleksandra jest właścicielką i pracowniczką. Wizyty „Aleksandra
  Bodora”, „Ola”, byłych pracownic i „Solarium” idą na jej konto
  (produkcja: id 29). Prawdziwego wykonawcę zachowuje dopisek w notatce
  wewnętrznej.
- **Wizyty bez klientki (3261) nie są importowane.** Sprawdzono, czy coś je
  łączy z klientkami: karta, `customer_id`, telefon i nazwisko są puste, imię
  ma 2 z 3261. W 975 notatkach szukano imion i nazwisk oraz telefonów
  klientek z eksportu, pewne dopasowanie dało się uzyskać dla 2 wizyt. Bez
  wartości, więc `IMPORT_BOOKSY_ANONYMOUS` zostaje wyłączone.
- Przyszłe rezerwacje idą w finalnym imporcie po przejściu na produkcję
  (`IMPORT_BOOKSY_INCLUDE_FUTURE=1` na świeżym eksporcie). Pierwszy import
  ich nie zawiera.
- Opinie bez osobnego etapu: importowane tylko z pewnym powiązaniem
  z klientką.

## Przebieg zgodny z produkcją (lokalnie)

Na bazie przywróconej sprzed importu, z flagami jak na produkcji (mapa
pracowników, reset haseł, bez wizyt bez klientki i bez przyszłych):

- plan i zapis: 1047 klientek, 10 109 wizyt (8302 zrealizowane, 1804
  anulowane, 3 nieobecności), 144 opinie (średnio 5,0), 0 konfliktów;
- każda opinia ma tę samą klientkę co jej wizyta, żadna wizyta nie ma dwóch
  opinii, żadna importowana opinia nie jest starsza niż jej wizyta;
- ponowny plan: 0 klientek, 0 wizyt i 0 opinii do utworzenia.

Na produkcji konto Aleksandry nazywa się inaczej niż lokalnie, więc dopisek
„Wykonała (Booksy)” pojawi się tylko przy wizytach innych osób niż
„Aleksandra Bodora”. Lokalnie był przy wszystkich.

## Uruchomienie na produkcji (po wdrożeniu migracji)

Uruchomienie z katalogu API na serwerze (`dist/scripts` powstaje w buildzie;
produkcja nie ma `ts-node`), z plikami eksportu poza katalogiem aplikacji:

```
TZ=Europe/Warsaw IMPORT_BOOKSY_DIR=<katalog z eksportem> \
IMPORT_BOOKSY_RESET_CLIENT_PASSWORDS=1 \
IMPORT_BOOKSY_STAFF_MAP='{"Aleksandra Bodora":29,"Ola":29,"Solarium":29, <byłe pracownice>:29}' \
node dist/scripts/import-booksy.js   # plan (bez zapisu)
```

Zapis (`IMPORT_BOOKSY_APPLY=1`) dopiero po:

- akceptacji planu przez ownera;
- świeżej kopii bazy (`pg_dump`).

Po zapisie usunąć pliki eksportu z serwera.

## Wykonanie na produkcji (2026-10-23, ok. 17:20 CEST)

Plan i zapis na `devil`, z flagami: `TZ=Europe/Warsaw`, reset haseł, mapa
7 nazw pracowników z Booksy na id 29, bez wizyt anonimowych i bez przyszłych.
Owner zaakceptował plan i reset wszystkich 21 kont klientek (w tym konta
testowego CI, któremu hasło odnowi sam).

- Kopia bazy przed zapisem: `~/db-backups/pre-booksy-import-20261023-172109.dump`
  (`pg_dump -Fc`, 1,08 MB, 82 tabele z danymi). `~/backups` należy do roota
  (kopie hostingu), więc kopia trafiła do osobnego katalogu.
- Plan = zapis: 1047 klientek, 10 109 wizyt (8302 zrealizowane, 1804
  anulowane, 3 nieobecności), 144 opinie, 0 konfliktów. Usługi: 11
  dopasowanych do aktywnych, 40 do nieaktywnych, 37 nowych historycznych.
  91 przyszłych potwierdzonych wizyt pominiętych.
- Baza przed → po: klientki 21 → 1068, wizyty 70 → 10 179, opinie 2 → 146,
  usługi 141 → 178 (aktywnych i bookowalnych online dalej 60). Różnice
  zgadzają się z planem co do sztuki.
- Kontrole: 0 kont klientek bez hasha bcrypt, 0 opinii z inną klientką niż
  wizyta, 0 wizyt z dwiema opiniami, wszystkie importowane wizyty na id 29,
  zakres 2017-09 → 2027-01. Jedyne wizyty w przyszłości (6) są anulowane.
  `/healthz` 200.
- Ponowny plan: 0 klientek, 0 wizyt, 0 opinii i 0 usług do utworzenia.
- Pliki eksportu usunięte z serwera (`~/booksy-export`).

Do zrobienia: hasło konta testowego CI (owner), finalny import przyszłych
rezerwacji z `IMPORT_BOOKSY_INCLUDE_FUTURE=1` na świeżym eksporcie przy
przejściu z Booksy, obejrzenie karty klientki i listy klientów w przeglądarce
przy ~1000 kartach.

## Czego to nie dowodzi

- Wygląd panelu z tysiącem kart klientek nie był oglądany w przeglądarce.
- Wygląd karty klientki w przeglądarce z tysiącem kart nie był oglądany,
  sprawdzono tylko API.
