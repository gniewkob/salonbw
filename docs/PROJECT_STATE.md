# Stan projektu SalonBW

**2026-10-26 · Codex · UAT dev i poprawka raportów między datami**
Zasady przekazania: [HANDOFF_PROTOCOL.md](HANDOFF_PROTOCOL.md).

## Decyzje i izolacja

- Owner: **Booksy i SalonBW utrzymywane ręcznie**, bez automatycznej
  synchronizacji i daty zakończenia Booksy. Świeży eksport dopiero przed
  kolejnym zatwierdzonym importem; snapshot 23.10 wystarcza do przygotowań.
- Produkcja salon-bw.pl / panel.salon-bw.pl / api.salon-bw.pl; dev ma własny
  landing/panel/API, bazę, sekrety i cookies dev_. Zapisy UAT tylko na dev,
  wyłącznie syntetyczne dane, outbound/SMS wyłączone. Brak PII produkcji w dev.
- Brak GO na kolejny import, szeroki merge/deploy produkcyjny lub zamknięcie
  Booksy. Każda z tych operacji ma osobną bramkę. Nie uruchamiać cleanupu/PHP
  ponownie; nie nadpisywać 19 zastanych zmian głównego checkoutu ownera.

## Zweryfikowane wyniki

- PHP fizycznie usunięte przez wcześniejszy Work (1663 pliki /77 MB),
  niezależnie potwierdzono brak starego public_html. #1520 dokumentuje operację.
- Cleanup prod wykonał 192 usunięcia fixture. Odczyt 18:12: 1047 klientek,
  10 109 wizyt i 144 opinie Booksy, dwa konta admina, zero zerwanych linków,
  pusty plan cleanupu; prywatny backup zweryfikowany, bez restore-drill.
  [Dowody](journal/2026-10-26-cleanup-execution-reconciliation.md).
- #1521 reconciliation: brak zapisu, wykrywanie driftu/kolizji/duplikatów;
  aliasy i linked overlaps poprawione. Ponowny importer dopisuje niepowiązane
  rekordy, nie synchronizuje już powiązanych. Ręczne kopie wymagają rozliczenia
  przed importem. Historyczny pomiar 26.10: 85 przyszłych confirmed (82+3
  anonimowe), 7 par nakładania; plan 91 obejmował także 9 przeszłych confirmed.
- #1522: naprawione pierwsze kliknięcie rejestracji i zachowanie serviceId;
  staging frontends 40370057437 SUCCESS, frontend landing 54671baf.
- #1523: cena wpisana ręcznie nie jest nadpisywana przez opóźniony cennik;
  staging panel 40375184914 SUCCESS, panel 1e030056, CI 40375126206 SUCCESS.
  UAT własnej fixture: completed, 225 należne /240 wpłata /15 tip /5 rabat;
  jedna sprzedaż (2 szt.), jedno zużycie (1 szt.), produkt 10→7, jedna receptura.
  Wcześniejsza wizyta UAT nietknięta. Manifesty fixture prywatnie lokalnie.
- Runtime API przed tą poprawką: dev 8aa1c7b8, prod 328d362f; health/database ok.
  Automatyczne Claude security review kończyło się błędem narzędzia (ostatnio
  HTTP400), bez ukończonego wyniku review; nie oznacza security PASS.

## W toku — odrębna poprawka raportów

- UAT wykazał 265 jako sumę dni wobec poprawnych 225 tygodniowo, gdy sprzedaż
  i wizyta mają inne daty. Poprawka potrąca od usług wszystkie towary powiązane
  z wizytą, a sprzedaż nadal grupuje po soldAt; bez zmiany polityki dat.
- Lokalnie 65 suites /536 PASS bez skipów (import, cleanup i rzeczywisty SQL),
  PG business flows 12/12, ops 20/20, build/typecheck PASS. Pierwsze CI
  zatrzymało wdrożenie na asercjach strefy czasu; poprawione testy UTC i
  Europe/Warsaw 16/16, pełny UTC 536/536 PASS. Nowe CI i staging API
  następnie odczyt tych samych fixture; brak kolejnych zapisów biznesowych.
  [Journal](journal/2026-10-26-statistics-cross-date-retail.md).

## Następne kroki i bramki

1. Domknąć CI/staging API i odbiór raportów: 40 towarów +185 usług =225.
2. Biznesowa akceptacja właścicielki pozostałych modułów i realnego odbioru
   powiadomienia (osobno uzgodniony odbiorca; wysyłki dev nadal wyłączone).
3. Przed kolejnym importem świeży eksport, rozliczenie ręcznych kopii,
   anonimowych/przeszłych confirmed i kolizji, plan/backup/GO właścicielki.
   Nie nadawać zgód i nie resetować ponownie haseł. Brak zgody na finał Booksy.

Prywatny plugin Web Design Intelligence poza zakresem. Stary dump Versum bez
importu; pominięty restore-drill nie jest dowodem odtwarzalności.
