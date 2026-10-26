# Rejestracja z landingu zachowuje usługę i działa po jednym kliknięciu

- **Data:** 2026-10-26
- **Agent:** Codex
- **Gałąź:** codex/booking-registration-context-20261026
- **Baza:** #1519, `41cfd131ffea4b42dbd7d139afdd41e2274b99d8`

## Finding

Hosted UAT osobnej sesji odtworzył dwa defekty: pierwsze kliknięcie linku
rejestracji dodawało błąd e-maila zamiast nawigacji, a rejestracja gubiła
wybraną usługę. Fokusowany input na blur dodawał komunikat i przesuwał link
przed mouseup. Link rejestracji nie zawierał redirectTo; po rejestracji
panel zawsze wybierał stronę domyślną.

## Change

- BookingModal rezerwuje miejsce na błędy pól i zapobiega kolapsowi marginesu,
  bez zmiany walidacji. Link rejestracji zawiera wewnętrzny cel rezerwacji.
- Rejestracja klientki wraca do wskazanego booking/serviceId. Wspólny helper
  dopuszcza wyłącznie ścieżkę /booking z query, odrzuca cele zewnętrzne.
- Przełączanie login/register zachowuje cel booking. Pozostałe wejścia
  zachowują trasę domyślną dla roli. Brak zmian API/sesji/cookies/uprawnień.

## Validation

- RED: dwa testy linku i dwa powrotu po rejestracji nie przechodziły.
- GREEN: 26 testów celowanych (landing 2, panel 24).
- Pełny landing: 28 suites / 93 PASS. Panel: 102 suites / 433 PASS, z testem zachowania celu przy przejściu login → register.
- Typecheck obu aplikacji PASS. ESLint zmienionych plików PASS.
- Playwright lokalnie 1440/390: brak overflow; po korekcie marginesu link
  ma identyczne y przed/po blur, zachowuje redirectTo i pozwala na nawigację.
  Nawigacja testowa przechwycona przed docelową stroną; brak zapisu kont/wizyt.
- Lighthouse accessibility lokalnie 100/100.
- Świeża sesja bez wcześniejszego blur: pierwsze kliknięcie działa na 1440/390.
- Manualny CI `40369231707` zablokowany przez skan całej historii Gitleaks
  (26 historycznych findings, m.in. schedulerLicenseKey). Nie modyfikowano
  reguł ani allowlist; standardowe CI PR jest wymagane przed staging.
- Screenshoty prywatnie w lokalnym katalogu visualizations/salonbw-registration-fix.
- Nie kopiowano danych produkcyjnych; checkout ownera i sesji UAT nietknięte.

## Rollout

- PR #1522, zawiera #1519; bez merge/deploy produkcyjnego.
- CI `54671baf1a24445c2b0f22eb94dc1616046a7e84`, run `40369506043` SUCCESS:
  panel 433 PASS, backend 488 PASS, PostgreSQL business flows 12/12 PASS;
  standardowy Gitleaks i Security Audit PASS. Claude Review zakończony
  błędem narzędzia, nie ukończonym review.
- Deploy staging frontends `40370057437` SUCCESS. Odczyt __release.json
  obu hostów potwierdza dokładnie `54671baf`.
- Hostowany dev, Playwright 1440/390: pierwsze kliknięcie rejestracji działa;
  przejście login ↔ register zachowuje /booking?serviceId=12.
- Jedno nowe konto syntetyczne na dev; po rzeczywistej rejestracji powrót do
  wybranej usługi Strzyżenie grzywki i kroku dodatków (25 min / 30 zł).
  Brak ponownego wyboru usługi, brak overflow. Utworzono prywatny manifest
  fixture, bez danych w repo. Nie wysyłano formularza utworzenia wizyty;
  po teście baza dev nadal ma jedną wizytę z wcześniejszego UAT.
- Izolacja przed/po: APP_ENV=development, własna baza dev, outbound i SMS
  wyłączone. W przeglądarce zero zablokowanych prób zapisu na produkcję.
- Produkcja health 200/database ok i release `328d362f` bez zmian; dev API
  health 200/database ok, release `8aa1c7b8` bez zmian. Deploy tylko frontendów.
- Screenshoty i manifest fixture: lokalny prywatny katalog
  visualizations/2026/10/26/salonbw-registration-fix. Brak PII produkcji.

## Follow-up

Oba odtworzone defekty rejestracji zweryfikowane po fixie na dev.
Biznesowy UAT pozostałych modułów i dostarczenie powiadomień pozostają
odrębnymi bramkami. Konto syntetyczne oznaczone w prywatnym manifeście
do cleanupu wyłącznie na dev. Oba systemy utrzymywane ręcznie.
