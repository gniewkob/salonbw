# Stan projektu SalonBW

**Aktualizacja: 2026-09-07 · Codex**
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

- Usunięto wyścig dwóch równoczesnych rezerwacji online na ten sam termin:
  zapis bez dozwolonego nakładania blokuje harmonogram osoby w transakcji,
  ponownie sprawdza konflikt i dopiero zapisuje. Test na izolowanym PostgreSQL
  reprodukuje 2 zapisy przed poprawką i 1 zapis + 1 konflikt po poprawce.
  Commit `5620f3b8`: CI `34104575891` i Deploy `34104575839` success;
  blokada potwierdzona w kodzie wykonywanym na API, health ok.
  [Journal 2026-09-07](journal/2026-09-07-concurrent-booking-guard.md).
- Za zgodą ownera naprawiono bramkę audytu CI i zaktualizowano 7 bibliotek,
  także w manifestach npm używanych na MyDevil. Audyt: 0 high/critical,
  6 moderate; 786 testów, typecheck, lint i buildy PASS. Commit `58177205`:
  CI `34100103831` i Deploy `34100103827` success; wersje runtime potwierdzone
  na API, panelu i landingu 2026-09-07. Szczegóły:
  [journal 2026-09-07](journal/2026-09-07-security-audit-gate-and-runtime-dependencies.md).
- Wdrożono w `67fcab0a` naprawę pomijania `confirmed` przez główny automat przypomnień:
  cron, ręczne uruchomienie i licznik. Trzy testy FAIL przed / PASS po naprawie.
- Panel: 378/378 testów; backend po poprawce: 352/352. Typecheck obu aplikacji
  i build backendu PASS. Backend lint: 0 błędów, 153 ostrzeżenia.
- CI `34053958164` i Deploy `34053958184`: success; poprawka potwierdzona
  w pliku wykonywanym na API. Health 2026-09-07: database/smtp/instagram ok.
  Dotarcie wiadomości na telefon pozostaje nieweryfikowane.

## Otwarte problemy i następny krok

**Bezpieczeństwo:** lokalny audyt 2026-09-07 po zatwierdzonej naprawie:
0 high/critical i 6 moderate. Usunięto `--ignore-unfixable` z bramki CI.
Pozostaje przegląd umiarkowanych podatności (`dompurify`, `@humanfs/node`, `qs`).

1. **P1 komunikacja:** potwierdzenie/przełożenie opiera się na WhatsApp bez
   e-mailowego fallbacku w tych ścieżkach; anulowanie bez wysyłki. Pola opisane
   jako zgody marketingowe sterują również przypomnieniami.
2. **P1 rozliczenie:** sprzedaż i zużycie materiałów następują po zatwierdzeniu
   finalizacji wizyty; trzeba sprawdzić awarie i bezpieczne ponowienie.
4. **P1 dostęp klientki:** brak samodzielnego odzyskiwania hasła.
5. **P2 ciągłość:** wątki wiadomości bez automatycznego odświeżania; przypomnienia
   bez trwałych ponowień i resetu po przełożeniu już przypomnianej wizyty.

**Następny krok:** testy awarii powiadomień i rozliczenia, minimalne naprawy,
następnie próba dwóch ról. Osobno objąć tą samą blokadą równoczesne przełożenie,
gdy ustawienie nakładania wizyt jest wyłączone.

## Fakty zweryfikowane

- 2026-09-07 po wdrożeniu: API `/healthz` HTTP 200; database, smtp, instagram: ok.
  Panel przekierowuje do logowania (HTTP 200), landing dev HTTP 200.
  To test infrastruktury,
  nie dowód dostarczenia wiadomości ani poprawności procesu biznesowego.
- 2026-09-06: formularze login/register dostępne w przeglądarce.
- 2026-09-06: bazowy SHA `67cb1ede`, lokalny master zgodny z origin/master; poprzednie
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
