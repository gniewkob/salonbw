# Historia przygotowania do wizyty

- **Data:** 2026-09-09
- **Agent:** Codex
- **Commit(y):** bieżący commit + dokumentacja wyników wdrożenia
- **PR:** brak; master

## Finding

Właścicielka potrzebuje przed wizytą zobaczyć, co wykonano podczas ostatnich
farbowań i w jakich proporcjach, aby zaplanować długość zabiegu oraz przygotować
produkty. Dotychczas szuflada wizyty pokazywała receptury i zużycia jako dwie
oddzielne listy. Nie było wiadomo, do której wizyty, usługi i czasu należały.

Sekcja była dodatkowo ukryta dla statusów `online_pending` i `scheduled`, czyli
właśnie wtedy, gdy właścicielka potwierdza rezerwację i ustala długość terminu.
Test fail-first potwierdził brak sekcji przed potwierdzeniem. Drugi przypadek
wykazał, że dwa zapisy zużycia tej samej wizyty nadpisywały się w podglądzie:
farba znikała, gdy później zapisano oksydant.

## Change

- Bezpośrednio pod danymi klientki dodano kartę `Przygotowanie do wizyty`,
  dostępną także dla oczekującej rezerwacji online i wizyty zaplanowanej.
- Pięć ostatnich zakończonych wizyt pokazuje razem datę, usługę, czas
  zarezerwowany w kalendarzu, recepturę z proporcjami oraz zużyte materiały.
- Dane są łączone po identyfikatorze wizyty. Wszystkie zapisy zużycia jednej
  wizyty są zachowane, więc osobne wpisy farby i oksydantu nie nadpisują się.
- Braki są jawnie opisane jako `brak zapisu`; starsze receptury bez powiązanej
  wizyty pozostają dostępne w osobnej części.
- Pole nowej receptury podpowiada zapis odcieni, gramatury, proporcji i czasu
  działania. Zapis receptury pozostaje dozwolony dopiero od potwierdzonej
  wizyty, zgodnie z regułą API.
- API historii zwraca `durationMinutes` obliczone z początku i końca
  zarezerwowanego bloku. Etykieta `Czas w kalendarzu` odróżnia tę wartość od
  rzeczywistego czasu wykonania, którego system obecnie nie mierzy.

## Validation

- Fail-first: oczekująca rezerwacja online nie miała historii przygotowania —
  FAIL przed zmianą, PASS po zmianie.
- Fail-first: dwa zapisy materiałów jednej wizyty ukrywały pierwszą pozycję —
  FAIL przed agregacją, PASS po zmianie.
- Panel: 96 zestawów / 391 testów PASS; celowany komponent 18/18 PASS.
- Backend: 49 zestawów / 385 testów PASS; historia klientki 6/6 PASS.
- Typecheck obu aplikacji i build obu aplikacji PASS. Celowany lint panelu:
  0 błędów; backend: 0 błędów i 4 wcześniejsze ostrzeżenia w statystykach.
- Prawdziwy Chrome z lokalnym buildem i wyłącznie syntetycznymi danymi:
  oczekująca rezerwacja pokazała usługę, 120 minut, recepturę, farbę 40 g oraz
  oksydant 60 g na ekranie 1366 px i 390 px. Lighthouse accessibility 100/100.
- Zrzuty: `output/playwright/preparation-desktop.png` i
  `output/playwright/preparation-mobile-390.png`.
- Nie użyto kont ani danych klientek i nie wykonano żadnego zapisu produkcyjnego.

## Rollout

Commit `3dd5cb6f`: CI `34361230619` i Deploy `34361230613` zakończone
`success`. Produkcyjne `/healthz`: HTTP 200; database, smtp i instagram `ok`.
W uruchomionych artefaktach potwierdzono tekst karty przygotowania w panelu
oraz pole `durationMinutes` w API.

Prawdziwy Chrome otworzył produkcyjny panel z przechwyconymi, wyłącznie
syntetycznymi odpowiedziami API. Na 390 px karta pokazała usługę, 120 minut,
recepturę, farbę 40 g i oksydant 60 g; konsola miała 0 błędów. Nie logowano się
do konta i nie wysłano żadnego żądania danych ani zapisu do produkcyjnego API.
Zrzut: `output/playwright/preparation-production-mobile-390.png`.

Rollback: revert zmian w historii wizyt i szufladzie, następnie ponowne
wdrożenie API oraz panelu. Nie ma migracji ani masowej zmiany danych.

## Follow-up

W realnym UAT właścicielka otwiera jedną oczekującą wizytę koloryzacji i ocenia,
czy historia pozwala jej wybrać czas terminu oraz przygotować produkty. Osobną
decyzją produktową pozostaje ewentualne mierzenie rzeczywistego czasu zabiegu.
