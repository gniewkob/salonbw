# Powiadomienia prowadzące do właściwej rozmowy

- **Data:** 2026-09-09
- **Agent:** Codex
- **Commit(y):** bieżący commit + dokumentacja wyników wdrożenia
- **PR:** brak; master

## Finding

Zapis wiadomości nie tworzył zauważalnej akcji poza otwartym wątkiem. Klientka
widziała liczbę nowych wiadomości na dashboardzie, ale akcja mogła prowadzić do
najbliższej wizyty zamiast do rozmowy, której dotyczyła wiadomość. Właścicielka
nie dostawała powiadomienia ani licznika po odpowiedzi klientki; licznik przy
dzwonku uwzględniał wyłącznie oczekujące rezerwacje online.

Testy fail-first potwierdziły błędny link klientki, brak obu powiadomień oraz
brak wspólnego licznika spraw wymagających reakcji. Użyto wyłącznie danych
syntetycznych.

## Change

- Dashboard klientki zwraca identyfikator najnowszej rozmowy, w której salon
  napisał ostatni, a akcja prowadzi do `/visits?visitId=<id>`.
- Feed powiadomień pokazuje klientce ostatnią wiadomość salonu, a pracownikowi
  ostatnią wiadomość klientki. Zawiera nazwę usługi i strony rozmowy, ale nie
  ujawnia treści wiadomości.
- Akcja pracownika prowadzi do `/calendar?appointmentId=<id>`.
- Nowy licznik pracownika sumuje oczekujące rezerwacje online i rozmowy, w
  których ostatnia wiadomość pochodzi od klientki. Ten sam licznik jest używany
  w widoku komputerowym i mobilnym; oczekujące rezerwacje pracownika pozostają
  ograniczone do jego wizyt.
- Remisy czasu wiadomości rozstrzyga identyfikator rekordu, aby wynik był
  deterministyczny także przy równoczesnym zapisie.

## Validation

- Fail-first: test linku klientki, dwa testy feedu oraz test licznika były FAIL
  przed zmianą i PASS po zmianie.
- Izolowany PostgreSQL 16: 2 zestawy / 8 testów PASS, w tym rzeczywiste zapytanie
  wybierające ostatnią stronę rozmowy przy identycznych znacznikach czasu.
- Backend: 49 zestawów / 385 testów PASS; panel: 96 zestawów / 390 testów PASS.
- Typecheck i build obu dotkniętych aplikacji PASS; celowany lint czysty.
- Prawdziwa przeglądarka z lokalnym buildem i syntetycznym profilem admina:
  licznik `3` na komputerze i 390 px, neutralny opis bez treści wiadomości,
  dokładny link `/calendar?appointmentId=77`, konsola bez błędów.
- Nie logowano się do konta produkcyjnego, nie odczytywano danych klientek i nie
  wysyłano wiadomości.

## Rollout

Commit `d1438170` wdrożono: Deploy `34327643747` success. CI `34327643732`
zakończyło się failure wyłącznie na audycie nowych podatności zależności; skan
sekretów, panel, backend, buildy i PostgreSQL były zielone. Remediacja zależności
jest opisana w osobnym journalu z 2026-09-09. Ponowny rollout z tym samym kodem:
commit `fa82015c`, CI `34330204469` i Deploy `34330204518` success. W artefakcie
produkcyjnego API potwierdzono `actionable-count` i typ
`appointment_message_action`; endpoint bez sesji zwraca 401. Nie logowano się
do kont klientek ani nie wywoływano zapisu wiadomości.

Rollback: przywrócić poprzednie wersje kontrolera powiadomień, dashboardu oraz
hooków i komponentów licznika. Nie ma migracji bazy ani operacji na danych.

## Follow-up

Wykonać jeden spójny syntetyczny test całego cyklu: rezerwacja, akceptacja,
wiadomość w obie strony, przełożenie, anulowanie i finalizacja z rozliczeniem.
