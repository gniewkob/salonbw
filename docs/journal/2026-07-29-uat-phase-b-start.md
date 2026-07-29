# UAT faza B — start dnia i kalendarz

- **Data:** 2026-07-29
- **Agent:** Codex + owner
- **Commit(y):** ten commit
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

## Rollout

Oczekuje na commit, CI, deploy oraz desktop/mobile live-verify.

## Follow-up

Po wdrożeniu właścicielka potwierdza użyteczność pulpitu i kalendarza, następnie
wykonujemy jeden oznaczony przepływ finansowo-magazynowy. Przed nim należy
zdecydować, czy syntetyczne wizyty w dni zamknięte poprawiamy w generatorze i
bieżącym datasetcie, czy pozostawiamy jako celowy test danych nietypowych.
