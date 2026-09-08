# Trwałe ponowienia przypomnień po awarii i przełożeniu

- **Data:** 2026-09-08
- **Agent:** Codex
- **Commit(y):** `e8bfda79` + dokumentacja wyników
- **PR:** brak; master

## Finding

Główny automat wybierał tylko godzinne okno około planowanego czasu wysyłki.
Po awarii SMTP/SMS następny cron przesuwał okno i nie wracał do niedostarczonego
przypomnienia. Dwie ścieżki przełożenia wizyty zachowywały `reminderSent=true`,
więc nowy termin mógł już nie dostać przypomnienia.

Ręcznie uruchamiany `AutomaticMessagesService` korzystał z tego samego znacznika
bez wspólnej blokady, obejmował tylko `scheduled` i uznawał log SMS ze statusem
`failed` za sukces. Monitoring głównego automatu klasyfikował awarię dostawcy
jako zwykłe pominięcie.

Testy fail-first odtworzyły każdy z tych przypadków. Nie odczytywano ani nie
modyfikowano danych produkcyjnych i nie wysłano prawdziwej wiadomości.

## Change

- Okno automatu obejmuje wszystkie niewysłane wizyty od teraz do końca
  planowanego okna, więc późniejszy cron podnosi zaległą próbę.
- Baza zapisuje liczbę oraz czas ostatniej próby. Warunkowy `UPDATE` działa jak
  15-minutowa dzierżawa i blokada ponowienia; główny i ręczny mechanizm używają
  tej samej funkcji.
- Sukces SMS jest uznawany wyłącznie dla statusu `sent` lub `delivered`.
  Awaria wszystkich dostępnych kanałów jest raportowana jako błąd.
- Obie ścieżki przełożenia zerują sukces, czas wysłania, liczbę i czas prób.
  Po akceptacji nowego terminu wizyta ponownie trafia do właściwego okna.
- Migracja dodaje dwa pola stanu próby i indeks dla niewysłanych wizyt.
  `REMINDER_RETRY_MINUTES` pozwala zmienić domyślne 15 minut bez obowiązkowej
  konfiguracji produkcji.

## Validation

- Fail-first: 5 początkowych testów FAIL; kolejne testy osobno wykazały błędny
  sukces SMS, trzy niespójności starszego mechanizmu i złą klasyfikację awarii.
- Testy celowane po zmianie: 3 zestawy / 55 testów PASS.
- Pełny backend: 48 zestawów / 382 testy PASS; typecheck i build PASS.
- ESLint zmienionych źródeł: 0 błędów; 8 istniejących ostrzeżeń w starszym
  module reguł automatycznych.
- Izolowany PostgreSQL 16: 5/5 PASS — cykl migracji, dotychczasowe blokady
  rezerwacji/przełożenia oraz dwa równoległe procesy przypomnienia; dokładnie
  jeden proces wysłał, licznik prób wyniósł 1.

## Rollout

Commit `e8bfda79` wdrożono z wynikiem success: CI `34203689053` i Deploy
`34203689078`. Produkcyjne `/healthz` potwierdziło stan `ok` bazy, SMTP i
Instagrama. W wykonywanym artefakcie API potwierdzono atomowe zwiększanie
`reminderAttemptCount`. Weryfikacja była wyłącznie odczytowa: nie uruchomiono
wysyłki ani nie odczytano danych klientek.

Rollback: preferowany jest forward fix. `down` migracji usuwa wyłącznie nowy
licznik i czas próby, ale przed użyciem na produkcji wymaga kopii danych.

## Follow-up

Dodać automatyczne odświeżanie otwartego wątku wiadomości o wizycie, z ochroną
przed pokazaniem odpowiedzi z poprzednio wybranej wizyty.
