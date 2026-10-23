# Decyzje ownera przed importem danych historycznych

- **Data:** 2026-10-23
- **Agent:** Claude Opus 5.5
- **Commit(y):** ten commit (tylko dokumentacja)
- **PR:** gałąź `claude/przygotowany-plan-rp46za`

## Kontekst

Po teście akceptacyjnym dnia pracy (PR #1509, `54adc5d`, deploy `39922258629`
success, 2026-10-23 08:15 UTC) zostały trzy otwarte punkty przed importem.
Owner rozstrzygnął je 2026-10-23.

## Decyzje

1. **Test dostarczenia alertu o rezerwacji** — owner wykona go później sam
   (próbna rezerwacja online i jej odwołanie jako klientka, sprawdzenie maila
   i telefonu). Pozostaje otwarty, ale nie blokuje prac agentów.
2. **Restore-drill — pominięty.** Owner polega na automatycznych kopiach bazy
   wykonywanych przez MyDevil. Nie wracać do tego punktu jako blokera.
   Zapis rzetelności: kopie nie były przez nas odtwarzane, więc ich
   odtwarzalność jest niepotwierdzona. Od `54adc5d` sam łańcuch migracji
   buduje kompletny schemat (wcześniej brakowało tabel logowania), co
   zmniejsza ryzyko przy odbudowie.
3. **Hasła przy imporcie: reset dla wszystkich.** Decyzja o szczegółach
   zapadnie przy imporcie, ale wymóg jest stały: **żadna importowana ani
   wcześniej założona przez salon klientka nie zachowuje dotychczasowego
   hasła**; każda ustawia własne przez odzyskiwanie hasła.

## Stan, który ma znaczenie dla punktu 3

- **Skrypt importu klientek jeszcze nie istnieje.** W
  `backend/salonbw-backend/scripts/` są tylko `import-services.ts` i
  `import-products.ts`.
- Konta zakładane przez salon dostają od `54adc5d` bcrypt-hash losowego
  sekretu (`CustomersService.create`) — nie da się ich użyć do logowania.
  Import klientek powinien użyć tego samego mechanizmu, nie własnego.
- Klientki założone przez salon **przed** `54adc5d` mają w bazie produkcyjnej
  jawny, martwy ciąg w kolumnie haseł. Reset z punktu 3 powinien je objąć.
- Droga klientki jest gotowa i sprawdzona w przeglądarce: rejestracja na
  istniejący adres → polski komunikat i link → odzyskiwanie hasła z wpisanym
  adresem → mail → nowe hasło → logowanie → pulpit z historią.

## Weryfikacja produkcji po #1509

2026-10-23 ~08:16 UTC: `api/healthz` 200 — `database` i `smtp` ok,
`instagram` error (wygasły token, po stronie ownera). Panel 307 bez sesji,
`/auth/register` i `/auth/forgot-password` 200, landing dev 200.

## Eksporty z Versum dostarczone 2026-10-23

Owner przekazał pięć plików eksportu (nie trafiły do repo — dane salonu).
Przegląd struktury, bez wypisywania danych osobowych:

| Plik | Zawartość | Do importu |
|---|---|---|
| Baza produktów (03.02.2026) | 821 produktów: ceny netto/brutto, VAT, stany, jednostka zużycia, rozmiar opakowania, SKU, kod kreskowy | tak |
| Popularność usług, prowizje, napiwki | zestawienia z jednego dnia (05.02.2026) | nie — raporty |
| Powracalność klientów | liczby zbiorcze per pracownik, bez listy klientek | nie |

**Nie ma listy klientek ani historii wizyt** — import klientek nadal nie ma
danych wejściowych.

Plan importu produktów (`pnpm import:products`, tryb bez zapisu) na tym
pliku, po konwersji xlsx → CSV (skrypt od remediacji `xlsx` przyjmuje tylko
CSV; kody kreskowe są w pliku tekstem, więc nie tracą cyfr):
`productsCreate: 821, conflicts: []`; pominięte: 28 sekcji producentów,
28 powtórzonych nagłówków, 84 „nieprawidłowe" — wszystkie 84 to **całkowicie
puste wiersze** rozdzielające sekcje, więc żaden produkt nie ginie.

821 to dokładnie liczba aktywnych produktów na produkcji odnotowana w czerwcu,
więc ten plik został **najpewniej już zaimportowany**. Plan był liczony na
lokalnej bazie testowej, nie na produkcji — potwierdzenie wymaga uruchomienia
planu na produkcji. Ponowny import domyślnie **nie nadpisuje stanów**
(`IMPORT_PRODUCTS_REPLACE_STOCK=1` trzeba ustawić jawnie), co ma znaczenie,
bo stany w pliku pochodzą z 03.02.2026.
