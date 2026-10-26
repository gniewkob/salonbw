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

Osobny PR, baza master ze wskazanymi zależnościami #1519/#1522. Staging tylko
panelu po CI dokładnego SHA; wyniki odbioru zostaną dopisane do PR/journala.
Nie scalać automatycznie, bez produkcyjnego deploymentu lub importu Booksy.

## Follow-up

Po staging odtworzyć opóźnioną odpowiedź katalogu w przeglądarce i potwierdzić
40 zł bez nadpisania. Następnie skończyć finalizację własnej fixture z dodatkiem,
sprzedażą, zużyciem, rabatem i napiwkiem; zweryfikować historię/statystyki/stany.
Booksy i SalonBW pozostają utrzymywane ręcznie.
