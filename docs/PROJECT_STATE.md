# Stan projektu SalonBW

**Aktualizacja: 2026-10-25 · Codex — audyt UAT i środowisk**
Protokół: [HANDOFF_PROTOCOL.md](HANDOFF_PROTOCOL.md). Historia:
[docs/journal](journal/). Wynik bieżącego audytu:
[journal 2026-10-25](journal/2026-10-25-uat-repository-audit.md).

## Cel i zakres

Jeden salon, właścicielka pracuje jako admin; pracownicy poza zakresem GO.
Klientka rezerwuje i uzgadnia wizyty; właścicielka obsługuje dzień pracy,
historię zabiegów i rozliczenie. Priorytet: niezawodność całego procesu.

## Gdzie jesteśmy

**UAT właścicielki w toku; regresja produkcyjna po aktualizacji E2E ponownie
zielona; cutover domeny NO-GO do zamknięcia bramek.**
Landing jest na `dev.salon-bw.pl`, panel na `panel.salon-bw.pl`, backend na
`api.salon-bw.pl`; domena główna nadal obsługuje legacy PHP.
Plan: [DOMAIN_CUTOVER_PLAN.md](DOMAIN_CUTOVER_PLAN.md), aktualizacja §0.

## Ostatnio zrobione

- **Kontynuacja 2026-10-25:** owner zatwierdził synchronizację sekretów E2E
  po własnej zmianie hasła oraz utworzenie odrębnego konta admina. Obie
  operacje wykonane z ukrytym wprowadzeniem haseł, bez ich ujawniania.
  Nowego osobistego konta nie przypisano do CI. Ustalono różnicę między
  blokadą 15 min a CAPTCHA po 3 błędach w 30 min; nie usuwano historii prób.
  [Journal](journal/2026-10-25-uat-hours-and-admin-followup.md).
- **Regresja odzyskana:** `40187848395` success, 23/23 po wygaśnięciu CAPTCHA.
  Nie resetowano haseł istniejących kont ani historii prób logowania.
- **Poprawki godzin lokalnie:** wspólny grafik widoku i JSON-LD, godziny
  pobierane serwerowo (home ISR 60 s, kontakt SSR), zamknięty tydzień nie
  wraca do godzin zapasowych, niedziela nie jest zamykana na sztywno,
  CTA nie podaje fałszywych godzin, najbliższy termin ma Europe/Warsaw.
  87 testów landingu PASS, lint/typecheck/build PASS; po wyrównaniu lokalnych
  zależności do lockfile Next 15.5.28. Kod nie jest jeszcze wdrożony.
  Ponownie na tym lockfile: panel 408/408, backend 454/454 PASS.
  Lighthouse accessibility home/kontakt/katalog: 100/100/100 lokalnie.
- **Audyt 2026-10-25:** publiczne godziny home/contact zgodne z jedynym
  rezerwowalnym grafikiem Aleksandry; 60 usług w 4 kategoriach w SSR ma
  identyczne ID/ceny/czasy jak publiczne API. Health database/SMTP/Instagram
  OK. 11 tras publicznych dev zwraca 200 i noindex.
- **Integralność importu, odczyt 2026-10-25:** 10 179 wizyt, 0 odwróconych
  przedziałów i 0 brakujących relacji. Powiązania Booksy: 1047 klientek,
  10 109 wizyt, 144 opinie. 5 przyszłych importowanych wizyt jest anulowanych;
  brak aktywnych przyszłych rezerwacji w tej kontroli. Nie uzgodniono ponownie
  każdego rekordu z eksportem źródłowym.
- **Testy lokalne:** landing 78/78, panel 408/408, backend 454/454; typecheck
  wszystkich trzech PASS. Build landingu PASS z jawnym API produkcyjnym.
  ESLint landing/panel PASS; backend bez autofix ma 68 błędów formatowania
  i 151 ostrzeżeń. Audit high: exit 0 z istniejącym wyjątkiem.
- **Skrypt deployu przygotowany:** `scripts/deploy-environment.sh`, podgląd
  domyślny, wykonanie przez `--execute`; development tylko landing, produkcja
  all lub pojedynczy cel. Sprawdza mapowanie, CORS, CI dokładnego SHA.
  Testy 9/9 bez prawdziwego dispatchu; brak zmian hostingu i workflow deployu.
- **Decyzja ownera 2026-10-25:** zaplanować od razu osobne dev-panel/dev-api
  z osobną bazą i bez wysyłki do klientek; nie utworzono ich jeszcze.
- **Wcześniejsza Faza 0 domeny:** dwa lokalne commity `0471e718`, `7ef5a6c6`
  przygotowują przekierowania legacy/www i linki panelu z konfiguracji.
  Nie są jeszcze wypchnięte; zastane zmiany planu zachowano.
- **Instagram 2026-10-24:** token odnowiony, live health dziś OK; automat
  odświeżania ma pierwszy planowany przebieg 2026-11-01. Po cutoverze
  musi obejmować także katalog produkcyjnego landingu.
- **Import Booksy 2026-10-23:** zapisany z backupem i bez konfliktów; stary
  zrzut Versum pozostaje bez importu (decyzja ownera). Szczegóły i wcześniejsza
  regresja 23/23: [journal](journal/2026-10-23-uat-readiness-after-booksy-import.md).

## Otwarte problemy i następny krok

**Regresja:** runy `40185627675` i `40187173666` zatrzymały się na setupie
admina. Owner zmienił hasło; sekrety E2E zaktualizowano po jego zgodzie.
Oczekiwano na naturalne wygaśnięcie CAPTCHA; po odczytowym potwierdzeniu
progu poniżej 3 prób uruchomiono `40187848395`: **success**.

1. **Przed publikacją:** zwalidować CI i wdrożyć lokalne poprawki godzin,
   JSON-LD, niedzieli i strefy najbliższego terminu. Do deployu obecny runtime
   nadal zawiera błędy opisane w audycie.
2. **CORS:** runtime dopuszcza dev/panel; Origin domeny głównej zwraca 500.
   Workflow pobiera `FRONTEND_URL` z sekretu; zmienna repo/environment sama
   nie zmieni runtime. Zmiana wymaga kontrolowanego wdrożenia i regresji auth.
3. **Izolacja dev:** obecne staging API/panel trafia do tych samych aplikacji
   co produkcja. Nie używać `staging target=all` jako środowiska testowego.
   Osobne domeny wymagają osobnej bazy, kluczy, sesji, wysyłki i resolvera.
4. **UAT:** pełny zapis rezerwacji/finalizacja/powiadomienia/upload i DST
   wymagają odbioru właścicielki oraz testów na wskazanych kontach lub
   izolowanej bazie. 16 testów kalendarza w Europe/Warsaw przechodzi; to nie
   zamyka historycznego zgłoszenia DST ani wszystkich granic zmiany czasu.
5. **Przed miękkim startem:** świeży eksport Booksy i kontrolowany import
   aktywnych przyszłych wizyt. Dawna liczba 91 nie jest aktualnym zleceniem
   importu; ustalić nową na świeżym eksporcie. Bez resetu haseł klientek.

**Następny krok:** przegląd i wdrożenie poprawki godzin, zamknięcie UAT oraz
preflight izolacji dev. Dopiero potem okno cutoveru, backup/rollback PHP,
rozdzielenie resolvera i ręczna promocja zaakceptowanego SHA.

## Fakty zweryfikowane

- **2026-10-25:** lokalny master `7ef5a6c6`, origin/master `ffb931f2`;
  CI `40130153868` i Deploy `40130153901` success dla origin/master.
  Nie zakładać wspólnego SHA wszystkich selektywnie wdrażanych aplikacji.
- **2026-10-25:** MyDevil potwierdza PHP na domenie głównej, Node.js na
  dev/panel/API; SSH potwierdza ich istniejące symlinki. Nie sprawdzono
  odtwarzalności backupu ani pełnych limitów zasobów.
- **2026-10-25:** grafiki: pn/pt 09–16, wt/czw 12–19, sob 09–13, śr/nd wolne.
- **2026-10-25:** świeża regresja panelu `40185627675`: failure logowania
  admina technicznego; klientka zalogowana. Nie mylić z wcześniejszym
  zielonym runem 39998664590. Kontynuacja po zgodzie ownera:
  `40187848395` — success; to aktualna zielona bramka regresji.

## Zablokowane na ownerze / utrzymane decyzje

- Akceptacja UAT, okna i wyłączenia starej strony; szeroki start to osobna
  decyzja. Nie wysyłać testowych wiadomości do prawdziwych klientek.
- Dane prawne, biznesowe i mapa starych usług → nowych URL-i wymagają odbioru.
  Meta: privacy/policy/data-deletion zmienić dopiero po publicznym 200 na
  domenie głównej, bez polegania na przekierowaniach.
- Provisioning dev: zatwierdzić dokładne hosty/ścieżki i sekrety po preflight;
  proponowane nazwy `dev-panel.salon-bw.pl`, `dev-api.salon-bw.pl`.
- Restore-drill wcześniej pominięty decyzją ownera; nie uznawać samego pliku
  backupu za dowód odtwarzalności. Ocenić przed cutoverem i kolejnym importem.
- Historyczne magazyny/dokumenty syntetyczne nie są uzgodnieniem finansów.
  Test fizycznego odbioru push/SMS/email i upload/thumbnail pozostaje bramką.
