# Niezawodność współpracy salon–klientka: przegląd i pierwsza naprawa

- **Data:** 2026-09-06
- **Agent:** Codex
- **Bazowy commit:** `67cb1ede`
- **Cel właściciela:** pewność, że cały proces działa niezawodnie.
- **Zakres:** przegląd kluczowego kodu, publiczne wejście do panelu, testy lokalne,
  weryfikacja infrastruktury i minimalna naprawa przypomnień. To nie jest pełny
  UAT ani zgoda na publiczny start.

## Finding

### P1 — potwierdzone rezerwacje online wypadają z przypomnień (naprawione w kodzie)

`AppointmentsService.updateStatus()` ustawia `confirmed` po akceptacji
rezerwacji `online_pending`. `AutomaticReminderService` wybierał tylko
`scheduled`: w cronie, ręcznym uruchomieniu oraz liczniku upcoming.
Dowód: trzy testy kontraktu zapytań do repozytorium najpierw FAIL (otrzymany
status wyłącznie `scheduled`), po naprawie PASS. Testy nie wysyłają wiadomości.
Kod: `backend/salonbw-backend/src/notifications/automatic-reminder.service.ts:166`.

### P1 — komunikacja po zmianie rezerwacji nie ma niezawodnego kanału zapasowego (otwarte)

`appointments.service.ts`: `updateStatus()` i `reschedule()` powiadamiają
klientkę przez WhatsApp; w tych ścieżkach brak zapasowego e-maila.
`cancel()` zapisuje status i log, bez wysłania klientce powiadomienia.
`notifications/whatsapp.service.ts:sendTemplate()` kończy się bez błędu, gdy
brakuje konfiguracji; po wyczerpaniu prób również nie zgłasza porażki wywołującemu.
Stan tokenów z 2026-08-07 jest historyczny — nie czytano dziś produkcyjnych sekretów.
Wniosek dotyczy kodu, nie jest dowodem konkretnej niedostarczonej wiadomości.

Dodatkowo `pages/auth/register.tsx` opisuje `emailConsent` i `smsConsent` jako
zgody marketingowe (domyślnie false), a `AutomaticReminderService` tymi samymi
polami blokuje przypomnienia. To niespójność znaczenia ustawień; nie zmieniano
zgód ani treści prawnych. Kryterium: osobno uzgodnione powiadomienia obsługowe
oraz marketing, testy obu ustawień, widoczny wynik dostarczenia/błędu.

### P1 — jednoczesne rezerwacje wymagają testu z prawdziwą bazą (ryzyko w kodzie)

`appointments.service.ts:179–196, 302–314`: sprawdzenie zajętości i zapis są
oddzielnymi operacjami. W przejrzanej ścieżce i migracjach brak blokady terminu
obejmującej oba kroki. Dwie prośby mogą odczytać wolny termin przed zapisem.
Nie przeprowadzono testu współbieżności na PostgreSQL; nie stwierdzono takiego
incydentu na produkcji. Kryterium: dwie klientki rezerwujące równocześnie jeden
slot dają dokładnie jedną rezerwację i jeden czytelny konflikt. Zachować świadome
nakładanie wizyt przez właścicielkę, dopuszczone ustawieniami kalendarza.

### P1 — finalizacja może pozostawić częściowo zapisane rozliczenie (ryzyko w kodzie)

`appointments.service.ts:1239–1354`: zakończenie wizyty i prowizja mają transakcję,
lecz sprzedaż produktów i zużycie materiałów następują po jej zatwierdzeniu.
Błąd sprzedaży może zostawić wizytę completed; błąd zużycia trafia do logu i nie
cofa finalizacji. Nie symulowano awarii bazy ani braków magazynowych na produkcji.
Kryterium: test awarii w każdym kroku oraz bezpieczne ponowienie bez podwójnej
sprzedaży, utraty receptury lub rozjechania stanu magazynu.

### P1 — brak samodzielnego odzyskiwania konta klientki (otwarte)

Sprawdzone na żywo `/auth/login`: logowanie i rejestracja, bez odzyskania hasła.
Przeszukanie panelu, landingu, współdzielonego API i modułu auth nie znalazło
przepływu klientki forgot/reset password. Reset przez administratora w ustawieniach
pracowników nie zastępuje odzyskania konta klientki. Kryterium: samodzielne
odzyskanie dostępu do tego samego konta z zachowaną historią wizyt; osobna zmiana
uwierzytelniania wymagająca uzgodnienia zgodnie z AGENTS.md.

### P2 — rozmowa przy wizycie wymaga odświeżenia (otwarte)

`apps/panel/src/components/messages/MessageThread.tsx:64–80, 132`: wiadomości
pobierane przy montowaniu/zmianie zależności i po własnym wysłaniu, bez pollingu
lub subskrypcji odpowiedzi drugiej strony. `appointments.service.ts:addMessage()`
tylko zapisuje wiadomość. Kod nie dowodzi, że odbiorca dowie się o niej poza
panelem. Kryterium: odpowiedź pojawia się w otwartym wątku bez przeładowania,
przełączanie wizyt nie pokazuje spóźnionych odpowiedzi z innego wątku.

### P2 — cykl przypomnień wymaga dalszego domknięcia (otwarte)

Cron wybiera godzinne okno około +24 h. Awaria w tym oknie nie daje trwałej
kolejki ponowień. `AppointmentsService` nie resetuje `reminderSent` przy zmianie
terminu: wcześniej przypomniana wizyta może nie dostać przypomnienia po przełożeniu.
Osobny `AutomaticMessagesService.processAppointmentReminders()` nadal filtruje
`scheduled`; znalezione wywołanie `processAllRules()` jest w kontrolerze, bez
podpiętego crona w kodzie. Nie mylić tego modułu z naprawionym automatem godzinowym.
Kryterium: kontrolowane ponowienie po awarii i przypomnienie nowego terminu,
bez dublowania między mechanizmami.

## Change

Minimalna poprawka `AutomaticReminderService`: wybór `scheduled` + `confirmed`
w trzech zapytaniach. Nadal wyklucza oczekujące, anulowane, zakończone i już
przypomniane wizyty. Dodane trzy testy regresyjne kontraktu zapytań.

`PROJECT_STATE.md` skrócony do aktualnego stanu: usunięte sprzeczne bieżące
stwierdzenia (np. jednocześnie 0 PR i zaległe PR-y, gotowy i brakujący push).
Historia wcześniejszych prac pozostaje w journalach i historii Git.

## Validation

- Bazowy panel: 95 suites, 378/378 testów PASS; typecheck PASS.
- Bazowy backend: 43 suites, 349/349 testów PASS; typecheck PASS.
- Regresja: 3/3 FAIL przed naprawą, 3/3 PASS po naprawie.
- Backend po zmianie: 44 suites, 352/352 testów PASS.
- Backend `pnpm exec tsc --noEmit`: PASS; `pnpm build`: PASS.
- Backend `pnpm lint`: 0 errors, 153 warnings. Polecenie repozytorium zawiera
  `--fix`; 69 zmian formatowania poza zakresem cofnięto po sprawdzeniu identycznego
  emitowanego JavaScript. Nie są częścią poprawki.
- Na żywo: `/healthz` status ok (database/smtp/instagram ok), panel HTTP 307,
  landing dev HTTP 200. SMTP health nie potwierdza dotarcia maila do telefonu.
- Przegląd publicznych ekranów login/register w przeglądarce; bez rejestracji
  kont, operacji na wizytach, czytania danych klientów ani testowych wysyłek.
- Repo przed zmianą czyste, HEAD zgodny z origin/master. 22 otwarte PR-y
  zależności. Poprzednie CI/Deploy dla bazowego SHA success z 2026-08-07.

## Rollout

Wdrożenie poprawki: oczekuje na wynik CI/Deploy. Nie potwierdzono jeszcze
faktycznej wysyłki przypomnienia dla potwierdzonej rezerwacji na produkcji.
Rollback kodu: revert commitu poprawki, standardowy deploy API; brak migracji.

## Follow-up

1. Agent: domknąć dostarczanie powiadomień i niezawodność zapisu rezerwacji;
   zacząć od testów awarii oraz testu dwóch równoczesnych zapisów na izolowanej bazie.
2. Owner + agent: uzgodnić znaczenie powiadomień obsługowych vs marketing oraz
   odzyskiwanie konta. Nie zmieniać po cichu zapisanych zgód klientów.
3. Agent: odporność finalizacji i wiadomości, następnie izolowany test całego
   procesu dla dwóch ról z kontrolowanymi odbiorcami.
4. Właścicielka: próba normalnego dnia na swoim telefonie — rezerwacja,
   potwierdzenie, wiadomość, przełożenie, anulowanie i finalizacja; odbiór alertów
   potwierdzony na urządzeniu. Wysyłki testowe wymagają wskazanych odbiorców i zgody.
5. Dopiero po zamknięciu P1 oraz próbie właścicielki: decyzja o miękkim starcie.
   Import, przełączenie domeny i publiczny start pozostają osobnymi decyzjami ownera.
