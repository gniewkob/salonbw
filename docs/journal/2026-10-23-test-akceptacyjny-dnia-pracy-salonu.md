# Test akceptacyjny dnia pracy salonu w przeglądarce

- **Data:** 2026-10-22 – 2026-10-23
- **Agent:** Claude Opus 5.5
- **Commit(y):** `9610246` … `58036eb` (11 poprawek) + ten wpis
- **PR:** gałąź `claude/przygotowany-plan-rp46za`

## Cel

Owner przed dostarczeniem danych historycznych i hypercare chciał
potwierdzenia, że **obsługa salonu działa**. Kryterium: każdy krok dnia pracy
przechodzi realnymi kliknięciami w przeglądarce, na prawdziwej bazie, bez
dotykania produkcji ani danych klientek.

## Jak

Lokalny stos możliwie wierny produkcji:

- PostgreSQL 16, schemat zbudowany **wyłącznie migracjami** (`dist/src/migrate`,
  ta sama ścieżka co deploy), strefa czasowa bazy i API `Europe/Warsaw`;
- backend zainstalowany **tak jak deploy** (`npm install --omit=dev`), co
  ujawniło, że produkcja jedzie na Express 5.2.1 / platform-express 11.2.7, a
  nie na wersjach z lockfile'a monorepo;
- panel zbudowany produkcyjnie (`next build` + `next start`) z proxy `/api`
  (jak na produkcji, inaczej CSP blokuje zapytania);
- lokalna skrzynka SMTP przechwytująca każdy mail, żeby sprawdzać treść
  i adresatów;
- Chromium sterowany przez Playwright, desktop 1366 i telefon 390×844.

Konta: właścicielka (admin, jedyny personel — jak na produkcji, z 60
usługami Booksy i grafikiem), klientki rejestrowane przez formularz,
klientka „telefoniczna" i klientka „z importu" zakładane przez panel.

## Przebieg i wynik

| Krok | Wynik |
|---|---|
| Rejestracja klientki (zgody RODO/regulamin) | ✅ po poprawce 1 i 2 |
| Kreator: usługa → wariant → dodatek → termin → uwagi → potwierdzenie | ✅ |
| Alert do salonu o nowej rezerwacji (mail) + potwierdzenie dla klientki | ✅ |
| Kalendarz właścicielki, szczegóły wizyty z uwagami i dodatkiem | ✅ po poprawce 3 |
| Potwierdzenie rezerwacji → mail do klientki | ✅ |
| Wiadomości salon ↔ klientka, baner „Akcja wymagana", fokus w polu | ✅ |
| Przełożenie przez salon → akceptacja jednym kliknięciem przez klientkę | ✅ po poprawce 4 |
| Dodanie produktów do magazynu przez panel | ✅ |
| Finalizacja: karta, rabat, dodatek z rezerwacji, sprzedaż, materiał, zalecenia, receptura, napiwek | ✅ po poprawce 6 |
| Stany magazynowe, ruchy, zużycie przypisane do klientki i wizyty | ✅ |
| Klientka widzi zalecenia, **nie** widzi kwot, notatki ani receptury | ✅ |
| Ocena wizyty → widoczna u właścicielki | ✅ |
| „Umów ponownie" → przy kolejnej wizycie: receptura, czas, materiały | ✅ |
| Łączne wydatki klientki | ✅ po poprawce 5 |
| Anulowanie przez klientkę → termin wraca do puli | ✅ |
| …i salon się o tym dowiaduje | ✅ po poprawce 7 |
| Zapis telefoniczny nowej i istniejącej klientki | ✅ po poprawce 8 i 9 |
| Zajęty termin znika z oferty dla innych | ✅ |
| Odrzucenie rezerwacji, anulowanie, no-show przez salon | ✅ po poprawce 10 |
| Klientka z importu wchodzi pierwszy raz → ustawia hasło → loguje się | ✅ po poprawce 11 |
| Rezerwacja z telefonu 390 px: bez poziomego scrolla, przycisk 44 px | ✅ |
| Statystyki: utarg 309, usługi 220 + towar 89, napiwek 21, wpływy 330 | ✅ |

## Poprawki (11, każda z testem napisanym najpierw i zweryfikowana w przeglądarce)

1. `9610246` — fałszywy błąd RODO przesuwał checkbox regulaminu o 53 px
   w trakcie kliknięcia; klientka nie mogła zaznaczyć regulaminu.
2. `9435837` — **żadna migracja nie tworzyła `refresh_tokens` ani
   `login_attempt`**. Baza odbudowana z migracji (nowe środowisko, odtworzenie
   po awarii) nie pozwalała nikomu się zalogować. Migracja jest no-opem tam,
   gdzie tabele istnieją.
3. `ed6191f` — szczegóły wizyty gubiły uwagi klientki (np. alergia) i dodatki
   z rezerwacji online; zapis komentarza mógł je skasować, a dodatek nie
   trafiał na rachunek.
4. `785c498` — przełożenie wizyty skracało ją do długości samej usługi
   (115 → 80 min), więc w „zwolnione" 35 min mogła się zapisać kolejna osoba.
5. `b597249` — produkty sprzedane przy wizycie liczone podwójnie w wydatkach
   klientki (330 zł pokazywane jako 419 zł).
6. `90f6065` — zużycie materiału zapisywane jako „30 op." zamiast „30 ml";
   materiały dało się „sprzedać" klientce.
7. `ab0fc7d` — **salon nie dostawał żadnego powiadomienia, gdy klientka
   odwołała wizytę.** Teraz mail + push, jak przy nowej rezerwacji.
8. `732469e` — hasło klientek zakładanych przez salon zapisywane jawnym
   tekstem i zwracane w odpowiedzi API. Teraz hash losowego sekretu.
9. `7595783` — przy jedynej osobie w salonie formularz nowej wizyty wymagał
   ręcznego wyboru pracownika, a przycisk był nieaktywny bez wyjaśnienia.
10. `607fc7d` — „Odrzuć rezerwację" (obok „Potwierdź"), „Anuluj wizytę"
    i „No-show" działały jednym kliknięciem; teraz pytają.
11. `58036eb` — klientka z importu przy rejestracji dostawała „Email already
    exists" bez wskazówki. Teraz polski komunikat i link do ustawienia hasła
    z wpisanym mailem.

Testy po wszystkim: **backend 421/421, panel 404/404**, tsc, eslint i
prettier czyste.

## Czego ten test nie dowodzi

- **Dostarczenia** maili na prawdziwe skrzynki i pusha na telefon —
  sprawdzone są treść i adresaci w lokalnej skrzynce; produkcyjne SMTP
  odpowiada (`healthz smtp ok`), ale dotarcie wymaga testu na wskazany adres.
- Zachowania na **danych produkcyjnych** (821 produktów, typy produktów,
  dotychczasowe klientki) — baza testowa była czysta.
- Widoków wyłącznie dla roli „pracownik" — poza zakresem GO.
- SMS/WhatsApp — nieskonfigurowane, celowo pominięte.

## Do decyzji ownera

- **Jawne hasła istniejących klientek na produkcji** (założonych wcześniej
  przez salon). Martwe — nie da się nimi zalogować — ale to jawny tekst
  w kolumnie haseł. Wymiana na hash to migracja zmieniająca wiersze klientek:
  wg protokołu po kopii zapasowej i za zgodą.
- **Restore-drill** — pominięty decyzją z 2026-08-06; poprawka 2 pokazuje,
  że odtworzenie bazy z migracji dotąd by nie działało. Warto sprawdzić przed
  importem.
- **Strefa czasowa:** godziny wiadomości są poprawne tylko, gdy Postgres i
  proces API mają tę samą strefę. Lokalnie rozjazd dawał przesunięcie o 2 h.
  Na produkcji do potwierdzenia jednym spojrzeniem na godzinę nowej wiadomości.

## Follow-up

- Przenieść ten przebieg do repo jako powtarzalny test Playwright na lokalnym
  stosie i wpiąć do CI (dziś istniejące testy przeglądarkowe są martwe od
  29.07 — zmienione hasło admina w sekrecie GitHub).
- Ożywić 41 testów integracyjnych backendu (padają na DI `PinoLogger`).
