# Import klientek i historii wizyt z Booksy

- **Data:** 2026-10-23
- **Agent:** Claude Opus 5.5
- **Commit(y):** ten commit
- **PR:** gałąź `claude/przygotowany-plan-rp46za`

## Co dostarczono

- `backend/salonbw-backend/scripts/import-booksy.ts` (`pnpm import:booksy`):
  import `clients.csv` i `appointments.csv` z eksportu Booksy.
  Domyślnie wykonuje tylko plan, a zapis wymaga flagi `IMPORT_BOOKSY_APPLY=1`
  i odbywa się w jednej transakcji. Konflikty blokują zapis. Raport podaje
  same liczby, bez imion, telefonów i adresów e-mail.
- `src/import/booksy-import-planning.ts`: reguły importu z testami (13/13).
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
  (tylko personel).
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

- Aleksandra jest właścicielką i pracowniczką, więc wizyty „Aleksandra
  Bodora” idą na jej konto (produkcja: id 29, admin).

## Otwarte przed zapisem na produkcji

1. „Ola” (436 wizyt). Najpewniej to Aleksandra, bo usługi „… Ola” to jej
   cennik. Do potwierdzenia.
2. Byłe pracownice i „Solarium”. Brak flagi „konto archiwalne”: nowe konto
   pracownika pojawiłoby się w kalendarzu i na listach. Rekomendacja:
   przypisać wizyty do Aleksandry z dopiskiem oryginalnej osoby w notatce
   wewnętrznej. Statystyki per pracownik stracą wtedy podział, ale w salonie
   jednoosobowym to bez znaczenia.
3. 3261 wizyt bez klientki. Karta zbiorcza zachowuje obroty w statystykach,
   ale pojawia się na liście klientek. Bez flagi te wizyty są pomijane.
4. Przyszłe rezerwacje dopiero w dniu przejścia, z nowego eksportu.
5. `reviews.csv` (560 opinii) jest poza tym etapem. Opinie mają tylko imię
   i nazwisko, więc dopasowanie do klientki byłoby niepewne.

## Uruchomienie na produkcji (po wdrożeniu migracji)

Uruchomienie z katalogu API na serwerze (`dist/scripts` powstaje w buildzie;
produkcja nie ma `ts-node`), z plikami eksportu poza katalogiem aplikacji:

```
TZ=Europe/Warsaw IMPORT_BOOKSY_DIR=<katalog z eksportem> \
IMPORT_BOOKSY_STAFF_MAP='{"Aleksandra Bodora":29, ...}' \
node dist/scripts/import-booksy.js   # plan (bez zapisu)
```

Zapis (`IMPORT_BOOKSY_APPLY=1`) dopiero po:

- akceptacji planu przez ownera;
- świeżej kopii bazy (`pg_dump`).

Po zapisie usunąć pliki eksportu z serwera.

## Czego to nie dowodzi

- Nie było uruchomienia na produkcji. Liczby dopasowań usług i kont będą tam
  inne.
- Wygląd karty klientki w przeglądarce z tysiącem kart nie był oglądany,
  sprawdzono tylko API.
