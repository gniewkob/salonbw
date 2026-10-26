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

Osobny PR #1522 z bazą master, zawiera również commit #1519. Staging frontends dopiero po CI dokładnego SHA;
wyniki zostaną zapisane w PR. Produkcja, Booksy i import bez zmian.

## Follow-up

Potwierdzić na hostowanym dev pierwsze kliknięcie oraz zachowanie usługi
przez rejestrację/logowanie. Biznesowy UAT i dostarczenie powiadomień
pozostają odrębnymi bramkami. Oba systemy utrzymywane ręcznie.
