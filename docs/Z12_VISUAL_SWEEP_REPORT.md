# Z12 — Raport z przeglądu wizualnego panelu (E1.3)

_Data: 2026-07-22 · Run `e2e-visual-sweep.yml` #3 (`29955066964`), master `bc5201b` ·
Artefakt `visual-sweep-screenshots` (wygasa 2026-08-05) · realizacja
`docs/PROJECT_COMPLETION_PLAN.md` §E1._

## Pokrycie

- **164/164 zrzutów obecnych, 0 braków** → żadna trasa nie failowała sweepa.
  - admin: 76 tras × 2 viewporty (1366×768 + 390×844) = 152
  - client: 6 tras × 2 = 12
  - employee: **POMINIĘTY** — brak sekretów `E2E_EMPLOYEE_*` (owner; konto
    `test.pracownik@salon-bw.pl` istnieje).
- Brak plików zdegenerowanych/pustych (najmniejszy 10.7 KB = client-mobile
  `notifications`, prawidłowy sparse empty-state).
- Metoda: pełny odczyt WSZYSTKICH 12 zrzutów client + ~28 kluczowych zrzutów
  admina; pozostałe ~124 przejrzane przez arkusze stykowe (contact sheets,
  above-the-fold) pod kątem awarii renderu / pustych stron / przepełnień —
  brak anomalii strukturalnych.

## Werdykt: 🔴 BRAK — panel wizualnie gotowy do GO

Powierzchnia klienta czysta i on-brand (B&W, poprawny PL, sensowne empty-state,
brak h-scrolla na 390 px, FAB nie nachodzi). Codzienny sterownik admina
(kalendarz dzień/tydzień/miesiąc/recepcja, pulpit, powiadomienia z widoczną
akcją „OTWÓRZ WIZYTĘ", lista wizyt z inline „Potwierdź"/×) renderuje się
poprawnie; „Salon zamknięty w środę" + wyszarzenie non-business działają;
historyczne bugi 500 statystyk (usługi/prowizje) potwierdzone jako naprawione.

## 🟡 UX/design istotny — OBA NAPRAWIONE 2026-07-22

| # | Widok | Problem | Status |
|---|---|---|---|
| 1 | `calendar-reception` (dolny panel) | Empty-state „Brak wizyt na dziś" = ciemnoszary tekst na niemal czarnym tle → niski kontrast. Przyczyna: `.salonbw-reception-empty` miał tło `#161616`, a późniejszy przebieg normalizacji kolorów w `globals.css` nadpisał tekst h3/p na ciemny (`#212529`/`#6c757d`) bez ruszania tła. | ✅ `08155a0` — karta na jasną (`#fff` + jasna ramka), spójnie z pozostałymi empty-state; tekst na AA. Mobilka używała inline jasnych stylów — bez zmian. |
| 2 | `products` | Strona renderowała **wszystkie ~822 produkty bez paginacji** — fullPage zrzut 1366×71957 px (ogromny DOM). `services` paginuje 20/stronę. | ✅ `a627eb6` — paginacja klient-side na desktopie (20/stronę, 5/10/20/50/100), wzorzec z `services`; reset strony na filtr/szukanie, clamp przy skróceniu listy; mobilny infinite-scroll bez zmian. Test fail-first `warehouseProductsPage`. |

## 🎨 Kosmetyka — 3/4 NAPRAWIONE 2026-07-22, 1 świadomie pominięta

| # | Widok | Problem | Status |
|---|---|---|---|
| 1 | `/account` + panel-wide | Checkboxy/switche/radia renderowały się na NIEBIESKO — `.form-check-input:checked/:focus` używa SKOMPILOWANEGO `#0d6efd`, nie `--bs-primary`. | ✅ `7ebc617` — override na brand ink `#1a1a1a` w `salon-theme.css`. |
| 2 | `statistics` (raport finansowy) | Wykresy kołowe przy ZEROWYCH danych = pełne czarne koła (crash też przy pustej tablicy `data`). | ✅ `85338dd` — tekstowy empty-state „Brak danych do wykresu" gdy brak danych; test fail-first `statisticsPieChart`. |
| 3 | `statistics-commissions` | „0,00 **złbrutto**"/„złnetto" (brak spacji w `MoneyWithSuffix`). | ✅ `3bf7e5c` — dodana spacja → „0,00 zł brutto". |
| 4 | `/account`, `customer-card-history` | Natywne `<input type=date>` pokazują US `mm/dd/yyyy`. | ⏭️ **POMINIĘTE świadomie** — to format z locale przeglądarki/OS, nie da się rzetelnie wymusić bez własnego date-pickera; w PL przeglądarce pokaże `dd.mm.rrrr`. Nie warte kodu. |

## Poza zakresem wizualnym (dane/owner — nie bugi UI)

- **Residuum danych testowych** widoczne w `customers` (Codex QA, Codex
  Reschedule QA, E2E Klient Zmieniony), `sales-history` (AUDYT flow void/sprzedaż),
  `inventory` („w toku" stocktaking `I20260700001`) → **E4.2 (FK-safe cleanup)**.
- `stock-alerts`: **676 produktów „brak na stanie"** z 821 (import bez stanów) →
  świadomość ownera / import (E3).
- `settings-branch`: NIP/REGON puste → **E2.9 (owner)**.

## Następne kroki

- **Z12 zamknięte code-side:** oba 🟡 i 3/4 🎨 naprawione i wypchnięte na
  PR #1465; 🎨 #4 (locale natywnego date inputa) świadomie pominięte.
- Sweep `employee` do wykonania po dostarczeniu sekretów `E2E_EMPLOYEE_*` (owner).
- Reszta drogi do GO jest owner-gated: E2.2 hasło, E2.3 domena, E2.10 token IG,
  E3 import danych, E4 cleanup FK-safe + finalny live E2E 3 ról.
