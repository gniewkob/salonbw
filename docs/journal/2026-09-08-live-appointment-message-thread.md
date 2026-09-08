# Automatyczne odświeżanie rozmowy przy wizycie

- **Data:** 2026-09-08
- **Agent:** Codex
- **Commit(y):** `76060b82` + dokumentacja wyników
- **PR:** brak; master

## Finding

Otwarty wątek pobierał wiadomości tylko po wejściu do wizyty i po własnej
wysyłce. Odpowiedź drugiej strony pozostawała niewidoczna do ponownego otwarcia
widoku. Dodatkowo opóźnione pobranie dla poprzednio wybranej wizyty mogło
nadpisać rozmowę aktualnej wizyty, a szkic mógł przejść między wątkami.

Testy fail-first odtworzyły brak automatycznego odświeżenia, nadpisanie przez
spóźnioną odpowiedź oraz przeniesienie szkicu. Użyto wyłącznie danych
syntetycznych.

## Change

- Otwarty wątek odświeża się w tle co 15 sekund, tylko gdy karta jest widoczna.
- Ciche odświeżenie nie zasłania rozmowy stanem ładowania i po przejściowym
  błędzie próbuje ponownie w kolejnym cyklu bez powtarzających się komunikatów.
- Numer żądania i identyfikator wizyty blokują spóźnione wyniki pobierania oraz
  wysyłki z poprzednio otwartego wątku.
- Zmiana wizyty czyści szkic, a zakończenie starej wysyłki nie może wyczyścić
  nowego szkicu.
- Niezmieniona lista nie powoduje ponownego renderowania ani przewijania;
  własna wysyłka zachowuje dotychczasowe przewinięcie i fokus pola tekstowego.

## Validation

- Fail-first: 2 testy FAIL dla odświeżenia i spóźnionego pobrania; osobny test
  FAIL dla szkicu przenoszonego między wizytami.
- Testy komponentu po zmianie: 16/16 PASS.
- Pełny panel: 96 zestawów / 387 testów PASS; lint, typecheck i build PASS.
- Prawdziwa przeglądarka z lokalnym buildem i syntetycznym profilem klientki:
  pusty otwarty wątek po 15 sekundach pokazał odpowiedź salonu i zmienił akcję
  na „Odpowiedz”; desktop i 390 px czytelne, konsola 0 błędów/ostrzeżeń.
- Nie logowano się do konta produkcyjnego i nie odczytywano danych klientek.

## Rollout

Commit `76060b82` wdrożono z wynikiem success: CI `34206361010` i Deploy
`34206361081`. Produkcyjne logowanie odpowiada HTTP 200, a chronione `/visits`
poprawnie przekierowuje bez sesji (HTTP 307). W publicznie serwowanym bundle
`/visits` potwierdzono warunek widocznej karty i interwał `15e3`. Nie logowano
się do kont klientek ani nie wywoływano endpointu wiadomości.

Rollback: przywrócić poprzednią wersję `MessageThread`; nie ma migracji bazy ani
zmiany kontraktu API.

## Follow-up

Sprawdzić i domknąć zauważalność nowej wiadomości, gdy wątek jest zamknięty:
powiadomienie i klikalna akcja powinny prowadzić klientkę lub właścicielkę
bezpośrednio do właściwej wizyty.
