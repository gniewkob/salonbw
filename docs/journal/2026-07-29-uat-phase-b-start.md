# UAT faza B — start dnia i kalendarz

- **Data:** 2026-07-29
- **Agent:** Codex + owner
- **Commit(y):** `6ec58831`, `7925cc96`
- **PR:** brak

## Finding

Produkcja była gotowa do UAT, ale w pierwszym przebiegu kalendarza ujawniono:

- 🟡 zaimplementowany i działający widok `reception` był dostępny wyłącznie
  przez parametr URL; przełącznik pokazywał tylko Dzień/Tydzień/Miesiąc;
- pierwsze wdrożenie czwartego przycisku ściskało redundantny przycisk
  „Dzisiaj” na desktopie 1265 px i powodowało 20 px poziomego overflow na
  mobile 390 px;
- dataset syntetyczny ma cztery wizyty w środę, chociaż konfiguracja i komunikat
  kalendarza poprawnie wskazują środę jako dzień zamknięty.

## Change

Dodano „Recepcja” do istniejącego przełącznika `CalendarHeader`. Zmiana używa
istniejącego typu, handlera, styli i routingu; nie dodaje nowej logiki widoku
ani nie zmienia danych produkcyjnych. Na viewportach do 1439 px ukryto
redundantny przycisk „Dzisiaj”; centralny przycisk daty nadal wykonuje tę samą
akcję „Wróć do dziś”.

## Validation

- Produkcyjny preflight: API `ok`, baza `ok`, panel HTTP 307, landing HTTP 200,
  Sentry API ustawione.
- Logowanie z sekretem odczytanym z Keychain: `/dashboard`; pliki tymczasowe
  wyzerowane i usunięte bez wyświetlenia poświadczenia.
- Pulpit: najbliższe wizyty, obrót, niskie stany i 3 oczekujące rezerwacje;
  licznik powiadomień również 3; 0 błędów konsoli.
- Kalendarz: Dzień/Tydzień/Miesiąc pokazują właściwe zakresy. Bezpośredni
  `view=reception` pokazuje 4 wizyty do finalizacji i pełne szczegóły wizyty.
- Test `calendarHeader.test.tsx` najpierw failował brakiem przycisku Recepcja,
  po zmianie 1/1 test przeszedł.
- Panel: typecheck i lint — exit 0; build z aktywnym DSN — 113 stron, exit 0.
- Live po poprawce: kliknięcie Dzień → Recepcja ustawia `view=reception`.
  Desktop 1280 px ma `scrollWidth=innerWidth=1280`; mobile 390 px ma
  `scrollWidth=innerWidth=390`, a każdy z czterech trybów występuje dokładnie
  raz. Redundantny „Dzisiaj” jest ukryty; centralna data zachowuje akcję
  „Wróć do dziś”.

## Rollout

- Przycisk Recepcja: CI `30454397064`, deploy `30454396978` — success.
- Responsywność toolbaru: CI `30454936758`, deploy `30454935479` — success.
- API i baza po rolloutcie: `ok`.

## Follow-up

Po wdrożeniu właścicielka potwierdza użyteczność pulpitu i kalendarza, następnie
wykonujemy jeden oznaczony przepływ finansowo-magazynowy. Przed nim należy
zdecydować, czy syntetyczne wizyty w dni zamknięte poprawiamy w generatorze i
bieżącym datasetcie, czy pozostawiamy jako celowy test danych nietypowych.
