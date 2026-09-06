# Stan projektu SalonBW

**Aktualizacja: 2026-09-06 · Codex**
Zasady: [HANDOFF_PROTOCOL.md](HANDOFF_PROTOCOL.md).
Historia: [docs/journal](journal/). Plan ogólny: [PROJECT_COMPLETION_PLAN.md](PROJECT_COMPLETION_PLAN.md).

## Cel i zakres

Jeden salon, właścicielka pracuje jako admin; pracownicy poza zakresem GO.
Klientka samodzielnie rezerwuje i uzgadnia wizyty, właścicielka obsługuje dzień
pracy, historię zabiegów i rozliczenie. Priorytet ownera z 2026-09-06:
**pewność, że cały proces działa niezawodnie**.

## Gdzie jesteśmy

Istnieje rozbudowany, działający system. Historyczne UAT z lipca przeszły,
ale obecny przegląd znalazł luki między modułami. **Brak podstaw do uznania
całego procesu za gotowy do szerokiego startu.**
Raport, dowody i kryteria akceptacji:
[journal 2026-09-06](journal/2026-09-06-reliability-audit-and-confirmed-reminders.md).

## Ostatnio zrobione

- Naprawiono lokalnie pomijanie `confirmed` przez główny automat przypomnień:
  cron, ręczne uruchomienie i licznik. Trzy testy FAIL przed / PASS po naprawie.
- Panel: 378/378 testów; backend po poprawce: 352/352. Typecheck obu aplikacji
  i build backendu PASS. Backend lint: 0 błędów, 153 ostrzeżenia.
- Wdrożenie tej poprawki oczekuje na końcowy wynik CI/Deploy; odbiór wiadomości
  na telefonie pozostaje nieweryfikowany w tej sesji.

## Otwarte problemy i następny krok

1. **P1 komunikacja:** potwierdzenie/przełożenie opiera się na WhatsApp bez
   e-mailowego fallbacku w tych ścieżkach; anulowanie bez wysyłki. Pola opisane
   jako zgody marketingowe sterują również przypomnieniami.
2. **P1 zapis wizyt:** sprawdzenie konfliktu i zapis nie są atomowe — potrzebny
   test dwóch równoczesnych rezerwacji na izolowanym PostgreSQL.
3. **P1 rozliczenie:** sprzedaż i zużycie materiałów następują po zatwierdzeniu
   finalizacji wizyty; trzeba sprawdzić awarie i bezpieczne ponowienie.
4. **P1 dostęp klientki:** brak samodzielnego odzyskiwania hasła.
5. **P2 ciągłość:** wątki wiadomości bez automatycznego odświeżania; przypomnienia
   bez trwałych ponowień i resetu po przełożeniu już przypomnianej wizyty.

**Następny krok agenta:** testy awarii powiadomień i równoczesnego rezerwowania,
minimalne naprawy, potem pełna próba dwóch ról i odbioru alertów.

## Fakty zweryfikowane 2026-09-06

- API `/healthz`: ok; database, smtp, instagram: ok. To test infrastruktury,
  nie dowód dostarczenia wiadomości ani poprawności procesu biznesowego.
- Panel: HTTP 307 do logowania, formularze login/register dostępne w przeglądarce.
- Landing dev: HTTP 200. Ról domen nie zmieniano.
- Bazowy SHA `67cb1ede`: lokalny master zgodny z origin/master; poprzednie
  CI i Deploy success (runy z 2026-08-07); 22 otwarte PR-y zależności.

## Zablokowane na ownerze / utrzymane decyzje

- Miękki start i udostępnienie klientkom, import danych oraz przełączenie
  landingu na salon-bw.pl wymagają odrębnych decyzji. Przy cutoverze obowiązuje
  checklista Meta z RELEASE_CHECKLIST.md.
- Trzeba uzgodnić znaczenie powiadomień obsługowych/marketingowych oraz zmianę
  uwierzytelniania dla odzyskiwania konta. Testy wysyłek: wskazani odbiorcy i zgoda.
- Restore-drill pominięty decyzją ownera 2026-08-06; nie uznawać tego za dowód
  odtwarzalności backupu. Przed realnymi danymi ponownie ocenić ten warunek.
- SMS/WhatsApp były nieskonfigurowane 2026-08-07; dziś nie sprawdzano sekretów.
  Push wdrożony wcześniej, ale odbiór na telefonie wymaga testu.
- Historyczny cleanup/dataset z 2026-08-06 nie jest dowodem aktualnej czystości
  bazy. Nie czytano i nie modyfikowano dziś danych klientów.
- Pozostałe decyzje: przegląd prawny, dane firmy, kategorie produktów,
  trwałość uploads — szczegóły i historyczne decyzje w planie/journalach.
