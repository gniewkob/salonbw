# Web-push: powiadomienie o nowej rezerwacji na telefon

- **Data:** 2026-08-07
- **Agent:** Claude (właściciel: „Ok zrób" — po rekomendacji integracji)
- **Commit:** `26cc095f`
- **Zamyka:** lukę z E2.11 — jeden kanał alertu o rezerwacji

## Finding

Alert o nowej rezerwacji online docierał do salonu **jednym kanałem —
mailem** (WhatsApp do pracownika zależy od jego telefonu, zgody i
konfiguracji API, więc nie liczy się jako niezawodny drugi kanał).
Właściciel sam oznaczył to wcześniej jako ryzyko biznesowe: nieodebrana
rezerwacja to realna strata.

Infrastruktura web-push **istniała, ale nic jej nie używało**:
`PushService` miał komplet (VAPID, zapis subskrypcji, wysyłka z
dezaktywacją wygasłych endpointów na 410/404) i **zero wywołań** w całym
kodzie, a panel nie miał Service Workera. Klucze VAPID nie były ustawione
na produkcji.

## Change

**Backend** (`appointments.service.ts`):
- push wysyłany przy rezerwacji własnej klientki, obok istniejącego maila;
  non-fatal — nieudany push nie może cofnąć rezerwacji, którą klientka już
  złożyła;
- odbiorcy przez nowe `bookingAlertRecipientIds()`: przypisany pracownik
  **plus wszyscy admini**. Właścicielka pracuje jako `admin` (rola
  „pracownik" jest poza zakresem GO), więc wysyłka wyłącznie do
  przypisanego pracownika pomijałaby ją, gdyby wizyta trafiła na kogoś
  innego;
- payload deep-linkuje wprost na `/appointments?status=online_pending`.

**Panel:**
- `public/sw.js` — worker **wyłącznie** do powiadomień, świadomie bez
  cache'owania (panel wymaga świeżych danych; nietrafiony cache
  pokazywałby nieaktualny kalendarz). Klik podnosi istniejącą kartę i
  przenawiguje, zamiast otwierać kolejną przy każdym powiadomieniu;
- `PushNotificationsCard` na `/account` — subskrypcja jest
  per-urządzenie, więc UI mówi to wprost („na tym urządzeniu"). Rozróżnia
  `denied` od `default`, bo przy `denied` przeglądarka **nie pokaże już
  promptu** i przycisk „Włącz" byłby ślepy — wtedy kieruje do ustawień
  przeglądarki. Osobny komunikat dla iPhone'a (push działa tylko po
  dodaniu do ekranu głównego);
- logika w czystych funkcjach (`utils/webPush.ts`), bo
  `ServiceWorker`/`PushManager`/`Notification` nie istnieją w jsdomie.

**Produkcja:** wygenerowana para kluczy VAPID (to keypair generowany
samodzielnie, nie poświadczenie zewnętrznej usługi), wprowadzona przez
`scripts/safe-update-api-env.sh` — klucz prywatny przez `stdin`, nigdy w
widocznym outpucie, lokalna kopia usunięta po użyciu.

## Validation

- Backend 342/342, panel 378/378, `tsc` czysty, `lint` 0 błędów.
- Testy czystych helperów zweryfikowane **mutacyjnie** (rytuał fail-first
  nie zadziałał wprost, bo pliki są nowe/nieśledzone i `git stash` ich nie
  obejmuje): usunięcie konwersji base64url→base64 oraz zrównanie `denied`
  z `default` — **oba mutanty złapane**.
- Nowe testy backendu: push leci przy rezerwacji klientki (odbiorcy
  zawierają przypisanego pracownika, deep-link na `online_pending`) i
  **nie** leci, gdy wizytę zakłada personel.
- **Produkcja:** `sw.js` serwowany (HTTP 200, `application/javascript`);
  `/push/vapid-public-key` odpowiada 401 zamiast 404 (moduł wpięty);
  log API: **`[PushService] Push notifications configured successfully`**;
  `/healthz` ok po restarcie.

## Rollout

Na `master`, wdrożone (deploy `success`). Klucze VAPID w produkcyjnym
`.env` (backupy `.env.bak.safe-update.*`).

## Follow-up

1. **Nie zweryfikowano klikaniem w przeglądarce** — po wielokrotnych
   logowaniach w tej sesji zadziałała ochrona przed bruteforce
   (`CAPTCHA required` na `/auth/login`, hasło jest poprawne). Zabezpieczenie
   ustępuje samo. **Do sprawdzenia przy następnej okazji:** wejść na
   `/account` → sekcja „Powiadomienia na telefon" → „Włącz na tym
   urządzeniu" → zaakceptować prompt → złożyć testową rezerwację jako
   klientka i potwierdzić, że powiadomienie faktycznie przychodzi na
   telefon. To jedyny krok, który realnie domyka E2.11.
2. Push celowo obejmuje wyłącznie **nową rezerwację online**. Kolejni
   kandydaci (anulowanie przez klientkę, akceptacja przełożonego terminu,
   nowa wiadomość w wątku) to prosty dopisek — `PushService.broadcastNotification`
   jest już podpięte i przetestowane.
3. Przy okazji naprawione dwie rzeczy, które ta zmiana obnażyła:
   mock `usersRepository` w `test-context` miał tylko `findOne`, więc
   `find()` rzucało, a non-fatalny catch to połykał (test przechodził mimo
   niewysłanego pusha); `accountPage.test` asertował `mock.calls[0]`,
   zakładając, że pierwsze wywołanie to PATCH profilu — teraz szuka
   wywołania po endpoincie i metodzie.
4. `pnpm lint --fix` w backendzie przeformatowuje ~68 niezwiązanych plików
   (migracje, `csrf.middleware`, `reception.service`) — commitowany stan
   repo nie odpowiada aktualnej konfiguracji prettiera. Zmiany wycofane,
   żeby nie zaśmiecać diffu i nie konfliktować ze strumieniem Codexa, ale
   **rozjazd zostaje** i kiedyś warto go zamknąć jednym osobnym commitem.
