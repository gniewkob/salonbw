# Ręczna cena finalizacji a opóźniony cennik — regresja UAT

- **Data:** 2026-10-26
- **Agent:** Codex
- **Baza:** PR #1522, `fa0bfd37` (zawiera #1519)

## Finding

UAT hostowanego dev na frontendzie 54671baf: wpisane 40 zł podczas pobierania
cennika zmieniło się na 30 zł po zakończeniu zapytania. Przerwano finalizację
przed zapisem. Efekt autoprefill nie odróżniał pola edytowanego od pustego.

## Change

onChange ręcznej ceny ustawia servicePrefilled=true. Późniejsze odpowiedzi
API nie nadpisują ceny użytkownika (także 0). Zamknięcie formularza resetuje
stan; następne otwarcie ponownie podpowiada cennik. Brak zmian API, schematu,
walidacji rabatu, uprawnień i zasad finalizacji.

## Validation

- Fail-first 2 FAIL / 6 PASS: ręczne 40 i 0 zastępowane przez 30.
- Po poprawce 8/8 PASS; testy sprawdzają wartość pola, payload w groszach
  oraz ponowne otwarcie z ceną cennikową.
- Pełny panel 102 suites / 435 PASS, typecheck PASS, scoped ESLint PASS.
- UAT dotychczas: tworzenie wizyty i przejście scheduled → in_progress PASS;
  cennik 30 zł, dodatkowa usługa 150 zł. Sprzedaż/zużycie jeszcze bez zapisu.
- Dev izolowany: osobna baza, zero niesyntetycznych adresów, outbound/SMS off.
  Utworzono jedną własną wizytę i jeden oznaczony produkt uniwersalny
  SYNTHETIC UAT Finalization (10 szt., 20 zł). Konto pochodzi z poprzedniej
  własnej fixture rejestracji. Prywatny manifest w lokalnym katalogu
  visualizations/2026/10/26/salonbw-finalization-uat. Dane nie trafiają do repo.
- Produkcja i wcześniejsza wizyta dev niezmienione. Błędu nie zapisano w DB.

## Rollout

- PR #1523; CI `1e03005654b09b44dcbed222e6579b7b6d172000`, run
  `40375126206` SUCCESS (panel 435, backend 488, PostgreSQL 12/12 PASS).
- Staging panel `40375184914` SUCCESS; metadata SHA 1e030056. Landing 54671baf
  i API dev 8aa1c7b8 pozostają bez zmian; brak produkcyjnego deployu.
- W hostowanym dev celowo wstrzymano odpowiedź /services/12, wpisano 40 zł,
  dopiero potem dopuszczono odpowiedź: pole pozostało 40. Regresja zamknięta.
- UAT finalizacji własnej fixture: base 40 + dodatkowa usługa 150 + sprzedaż
  2 × 20 − rabat 5 = należność 225; wpłata gotówką 240, napiwek 15.
  Użyto także 1 szt. materiału z tego samego produktu. POST finalize 201.
- Odczyt po zapisie i odświeżeniu: completed, paidAmount 240, tipAmount 15,
  discount 5, jedna dodatkowa usługa, notatka i zalecenia zgodne.
  Stan produktu 10 → 7, jeden dokument sprzedaży/2 szt., jeden dokument
  zużycia, jedna receptura powiązana z wizytą. Profil klientki: 1 zrealizowana.
  Pierwotna wizyta innej fixture nadal confirmed. Brak page errors.
- Układ mobilny 390 px bez poziomego overflow. Zmiana szerokości podczas
  edycji zamknęła niesaved modal (obserwacja UX, nie zapisano błędnych danych).
  Finalny formularz otwarto i zapisano od początku w układzie mobilnym.

## Follow-up

UAT raportów wykazał osobny defekt: wizyta 27.10, sprzedaż 26.10;
raport dnia 26 pokazuje 40 zł towarów, dnia 27 pokazuje 225 zł usług,
zaś tydzień poprawnie 225 zł razem. Suma dni 265 ≠ tydzień 225.
StatisticsService buduje mapę potrąceń produktów wyłącznie z zakresu soldAt,
więc nie odejmuje 40 zł od usługi poza datą sprzedaży. Poprawić oddzielnie
bez zmiany polityki dat i bez ponownej finalizacji fixture.
Biznesowy UAT całości nadal PARTIAL. Oba systemy utrzymywane ręcznie.
