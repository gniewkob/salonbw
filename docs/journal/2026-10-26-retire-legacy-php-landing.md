# Bezpowrotne wycofanie starego landingu PHP/CodeIgniter

- **Data:** 2026-10-26
- **Agent:** ChatGPT
- **Gałąź:** `codex/retire-legacy-php-landing-20261026`
- **PR:** do utworzenia
- **Status:** kod operacyjny i dokumentacja przygotowane; fizyczne usunięcie z MyDevil **NIE WYKONANE** (brak SSH / aktywnego MyDevil operatora w tej sesji)

## Finding

- Podczas cutover 2026-10-25/26 `salon-bw.pl` przeniesiono na Next.js.
  Dowód: `docs/journal/2026-10-25-isolated-environments.md`,
  produkcyjne CI/Deploy, i 23/23 testy regresji.
- Pozostawiono stary `~/domains/salon-bw.pl/public_html` i prywatne archiwum jako możliwość rollbacku do PHP.
- Owner wprost wycofał tę decyzję: CodeIgniter i PHP nie będą dalej używane; stary landing i kopie mogą zostać bezpowrotnie usunięte.
- Aktywny kod Next.js jest w `~/apps/nodejs/salonbw_prod`; domena ma `public_nodejs` wskazujący na ten katalog.
- Utrzymane w Next.js stare trasy `/start`, `/kontakt`, `/modals/rezerwacja` itp. to przekierowania 301 SEO, **nie uruchamianie starego PHP**. Pozostają konieczne po usunięciu plików.
- Oprócz konkretnych backupów nazwanych `~/backups/legacy-salon-bw-*` lokalizacja „prywatnego archiwum” nie jest dokładnie opisana w dokumentacji. Skrypt nie usuwa dowolnych archiwów nieznanej lokalizacji.

## Change

- Dodano `scripts/mydevil/retire-legacy-php-landing.sh` (FreeBSD /bin/sh):
  - `--audit`: odczyt symlinków, zdrowia produkcji, podpisu CodeIgniter, wielkości `public_html` i zdefiniowanych archiwów; bez zapisu;
  - `--execute`: po tych samych bramkach kasuje **wyłącznie** prawdziwy katalog `~/domains/salon-bw.pl/public_html` rozpoznany jako CodeIgniter oraz backupy `~/backups/legacy-salon-bw-*`.
  - Odrzuca nieznane symlinki i ścieżki, nie usuwa `public_nodejs`, konfiguracji WWW, certyfikatów, DNS, bazy danych, poczty, API, panelu i dev.
- Zmieniono aktualne runbooki `AGENTS.md`, `Agent.md`, `DEPLOYMENT_MYDEVIL.md`, `PROJECT_STATE.md`, `RELEASE_CHECKLIST.md`: **rollback PHP zabroniony; rollback wyłącznie do poprzedniego release Next.js**.
- Historyczny `DOMAIN_CUTOVER_PLAN.md` jest oznaczony jako superseded, bez usuwania jego historii.

## Validation

- W repo wykonano statyczny przegląd dostępnych kontraktów deploy i odwołań do starego PHP.
- **NIE TESTOWANO** uruchomienia skryptu na serwerze, gdyż bieżąca sesja nie ma SSH ani MyDevil operatora.
- Przed uruchomieniem `--execute`: przejrzeć `--audit`, rzeczywistą zawartość katalogu, cel symlinku i odpowiedź publicznych URL (Next.js `/ /privacy /policy /data-deletion`).
- Po usunięciu: bezpośredni smoke produkcji, 301 adresów PHP, `/booking` → panel, galeria, logowanie i przyjmowanie rezerwacji, certyfikaty, brak danych PHP w publicznym docroot.
- Skrypt nie usuwa/nie zmienia danych historycznych klientek ani deduplikacji importu Booksy.

## Rollout

**PENDING (host access unavailable).** Do wykonania na MyDevil na zatwierdzonej wersji skryptu:

```sh
# Przez terminal posiadający dotychczasowy alias SSH 'devil',
# z checkoutu repo z tą gałęzią (nie uruchamiać z niezaufanego ZIP).
ssh devil /bin/sh -s -- --audit < scripts/mydevil/retire-legacy-php-landing.sh
ssh devil /bin/sh -s -- --execute < scripts/mydevil/retire-legacy-php-landing.sh
```

Skrypt jest idempotentny dla usuniętego `public_html` i backupów.
Pozostałe prywatne kopie **poza rozpoznanym prefixem** wymagają osobnej,
precyzyjnej inwentaryzacji; nie usuwać całego `~/backups`.

## Follow-up

1. Uzyskać dostęp MyDevil, wykonać najpierw `--audit`, następnie `--execute` na potwierdzonej lokalizacji.
2. Udokumentować listę usuniętych ścieżek i wyniki live-smoke. Jeżeli prywatne archiwum znajduje się gdzie indziej, zinwentaryzować je osobno przed usunięciem.
3. Sprawdzić, czy stara baza MySQL była dedykowana wyłącznie CodeIgniter; dopiero po potwierdzeniu zależności zdecydować o jej usunięciu.
4. NIE usuwać przekierowań 301 ani historycznego pochodzenia danych Booksy.
