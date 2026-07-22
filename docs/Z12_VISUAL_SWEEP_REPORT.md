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

## 🟡 UX/design istotny

| # | Widok | Problem |
|---|---|---|
| 1 | `calendar-reception` (dolny panel) | Empty-state „Brak wizyt na dziś" = ciemnoszary tekst na niemal czarnym tle → niski kontrast (graniczny WCAG). Oba viewporty. |
| 2 | `products` | Strona renderuje **wszystkie ~822 produkty bez paginacji** — fullPage zrzut ma **1366×71957 px** (ogromny DOM, wolny render). Dla porównania `services` paginuje 20/stronę. |

## 🎨 Kosmetyka (→ ETAP 5)

| # | Widok | Problem |
|---|---|---|
| 1 | `/account` (client) | Checkboxy zgód renderują się natywnie na NIEBIESKO — łamie ścisłe B&W. Użyć `accent-color`/custom. |
| 2 | `/account`, `customer-card-history` | Natywne `<input type=date>` pokazują US `mm/dd/yyyy` (locale przeglądarki CI). Kosmetyczne. |
| 3 | `statistics` (raport finansowy) | Wykresy kołowe przy ZEROWYCH danych = pełne czarne koła („Udział metod płatności"/„Udział pracowników") → wygląda jak pusty blob. Monochromia jest zamierzona — problem tylko dla zera; rozważyć empty-state tekstowy. |
| 4 | `statistics-commissions`, raport finansowy | Brak spacji: „0,00 **złbrutto**"/„złnetto" → powinno być „0,00 zł brutto". |

## Poza zakresem wizualnym (dane/owner — nie bugi UI)

- **Residuum danych testowych** widoczne w `customers` (Codex QA, Codex
  Reschedule QA, E2E Klient Zmieniony), `sales-history` (AUDYT flow void/sprzedaż),
  `inventory` („w toku" stocktaking `I20260700001`) → **E4.2 (FK-safe cleanup)**.
- `stock-alerts`: **676 produktów „brak na stanie"** z 821 (import bez stanów) →
  świadomość ownera / import (E3).
- `settings-branch`: NIP/REGON puste → **E2.9 (owner)**.

## Następne kroki

- 🟡 #1 (kontrast recepcji) i #2 (paginacja `products`) — kandydaci do fixu W1/W2
  (rytuał fail-first / realne kliknięcie) przed lub tuż po GO.
- 🎨 #1–#4 → backlog ETAP 5 (P2/P3).
- Sweep `employee` do wykonania po dostarczeniu sekretów `E2E_EMPLOYEE_*` (owner).
