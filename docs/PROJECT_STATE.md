# Stan projektu SalonBW

**Aktualizacja: 2026-10-26 · Codex — Booksy reconciliation i legacy**
Zasady: [HANDOFF_PROTOCOL.md](HANDOFF_PROTOCOL.md).
Dowody: [journal](journal/2026-10-26-booksy-reconciliation-and-legacy-status.md).

## Cel i zakres

Jeden salon; właścicielka obsługuje kalendarz i klientki jako admin.
Priorytet: bezpieczne przejście z Booksy do własnego panelu.
**Migracja przyszłych rezerwacji / wyłączenie Booksy: NO-GO.**

## Gdzie jesteśmy

- Produkcja: `salon-bw.pl`, `panel.salon-bw.pl`, `api.salon-bw.pl`.
- Development: `dev.salon-bw.pl`, `dev-panel.salon-bw.pl`,
  `dev-api.salon-bw.pl`; własna baza, klucze, cookies, bramka i noindex.
  Dane syntetyczne; bez kopiowania produkcyjnych danych osobowych i wysyłek.
- Zapisy UAT tylko na dev. Produkcyjne karty i kalendarz tylko do odczytu.
- Zastane zmiany w `/Users/gniewkob/Repos/salonbw` pozostawiono bez zmian;
  bieżąca praca na osobnej gałęzi od `origin/master` (`0b1732e5`).

## Ostatnio zrobione

- **Legacy PHP fizycznie usunięte.** Work „Audit and retire legacy PHP landing”
  wykonał skrypt z `b8c3eb5c`: `public_html`, 1663 pliki / 77 MB. Dzisiejszy
  niezależny odczyt potwierdza brak katalogu i kopii `legacy-salon-bw-*`.
  Aktywny symlink i Next build istnieją. Trasy prawne i panel booking działają.
  Nie jest to dowód braku dowolnych innych prywatnych kopii na koncie.
- **PR #1519 i #1520 otwarte, niescalone.** CI obu success; automatyczny
  Claude review zakończył się błędem wykonania, nie wynikiem review.
  #1519 usuwa martwy checkbox Booksy i kieruje 404 do `/booking`; deploy
  frontendów na staging `40307194830` success. #1520 utrwala skrypt i
  dokumentację wykonanej operacji; merge nie jest potrzebny do ponownego
  kasowania. Nie uruchamiać operacji destrukcyjnej ponownie.
- **Read-only reconciliation produkcji, 2026-10-26.** Eksport dostępny lokalnie
  ma mtime 2026-10-23, 13 461 wierszy wizyt; brak potwierdzenia aktualności
  względem Booksy. Zawiera 85 przyszłych confirmed: 82 z klientką + 3 anonimowe.
  0 powiązanych z SalonBW, 0 aktywnych przyszłych wizyt w docelowej bazie,
  0 kolizji z celem, 0 powtórzonych ID; 7 par nakładania w źródle / 12 wizyt.
- **Plan istniejącego importera z blokadą zapisu PostgreSQL:** 1047 klientek
  już powiązanych, 0 nowych; 91 proposed appointments, 0 konfliktów importera,
  0 resetów haseł. Te 91 obejmuje 82 przyszłe + 9 przeszłych confirmed.
  Trzy anonimowe przyszłe są pomijane. Nie wykonano importu produkcyjnego.
- **Nowy raport agregatów:** jedna transakcja REPEATABLE READ READ ONLY,
  ROLLBACK, bez nazw, telefonów, notatek i ID w wyniku. Wykrywa brakujące
  powiązania, zmienione terminy/statusy i nakładanie; nigdy nie ogłasza GO.
  UAT uaktualniono do pracy zapisującej wyłącznie na dev.

## Fakty zweryfikowane / walidacja

- 2026-10-26: prod i dev API zgłaszają `328d362f`; publiczne legal routes 200,
  legacy booking kończy na logowaniu z zachowanym `/booking`. Bramki frontendów
  dev zwracają 401 bez danych dostępu. Publiczny health dev jest dostępny.
- Lokalny backend: 64 suites / 506 testów PASS przed dodaniem opcjonalnego
  testu PostgreSQL; raport: 19/19 PASS z pełnym import round trip na danych
  syntetycznych. Plan nie zapisał wizyty; apply + reapply zostawiły 1 wizytę;
  zgody false; anulowanie źródłowe wykazane jako drift. Regresja PostgreSQL kalendarza/przypomnień: 12/12 PASS. Build i typecheck PASS.
- Historyczna pełna regresja produkcyjna `40291708798`: 23/23 success;
  nie uruchamiano jej ponownie, bo testy mogą zapisywać na produkcji.
- Wcześniejsza akceptacja izolacji i domen:
  [journal](journal/2026-10-25-isolated-environments.md), PR #1516–#1518.

## Następny krok / zablokowane na ownerze

1. Pozyskać świeży eksport Booksy w zatwierdzonym prywatnym miejscu; ustalić
   datę i zakres kompletności, ponowić reconciliation na hoście danych.
2. Owner rozstrzyga 3 anonimowe wizyty, 9 przeszłych confirmed i 7 par
   nakładania z obecnego snapshotu; świeży eksport może zmienić te liczby.
3. Domknąć biznesowy UAT na dev i osobno potwierdzić odbiór powiadomienia
   przez zaakceptowanego odbiorcę. Wysyłki dev pozostają wyłączone.
4. Dopiero udokumentowane GO właścicielki pozwala przygotować końcowy plan
   zapisu/backup/import i odrębną decyzję o zakończeniu Booksy. Brak zgody
   na merge uruchamiający produkcyjny deploy lub na produkcyjny import.

## Utrzymane decyzje

- Stary zrzut Versum bez importu; restore-drill pominięty decyzją ownera
  (nie jest dowodem odtwarzalności). PHP nie jest ścieżką rollbacku.
- Import nie resetuje ponownie haseł i nie nadaje zgód. Prawdziwe dostarczenie
  wiadomości/resetu hasła wymaga potwierdzenia przez właściciela odbiorcy.
- Instagram: wcześniejsza rotacja i automat pozostają; pierwszy planowany
  przebieg 2026-11-01 wymaga kontroli. Prywatny plugin WDI poza tym zadaniem.
