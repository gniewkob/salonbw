# Plan wykonawczy: dokończenie panelu SalonBW (dla agenta Sonnet)

_Stan na 2026-07-09, master `3ccfd66`. Autor: sesja review Fable/Opus._

Ten dokument jest KOMPLETNĄ instrukcją dla agenta wykonawczego (Sonnet).
Zadania są uszeregowane, samodzielne i mają jawne kryteria akceptacji.
**Nie improwizuj poza zakresem zadania.** Gdy coś jest niejasne lub wymaga
decyzji — zapisz pytanie w `.claude/rules/active-context.md` (sekcja Backlog)
i przejdź do następnego zadania.

---

## 0. Rytuał startu KAŻDEJ sesji (obowiązkowy)

1. `git pull origin master` — **owner pracuje równolegle na masterze**
   (stream Gniewkob/Codex). Jeśli od ostatniego wpisu w active-context
   pojawiły się commity, których nie ma w dokumentacji — przeczytaj ich
   diffy zanim zaczniesz cokolwiek zmieniać (mogą dotykać tych samych plików).
2. Przeczytaj TOP 3 wpisy w `.claude/rules/active-context.md` (Current focus).
3. Sprawdź status ostatniego deployu:
   `Deploy (MyDevil)` na masterze musi być `success` — jeśli `failure`,
   diagnoza deployu ma pierwszeństwo przed nową pracą.
4. `pnpm install --frozen-lockfile` jeśli świeży kontener.

## 0a. Rytuał zakończenia każdego zadania (obowiązkowy)

1. `npx prettier --write <zmienione pliki>` + `npx eslint <zmienione>` +
   `npx tsc --noEmit` w odpowiednim pakiecie.
2. Testy: panel `cd apps/panel && pnpm test` (300+ musi przejść),
   backend `cd backend/salonbw-backend && pnpm test` (242+ musi przejść).
   **Testów nie wycofujemy ani nie skipujemy** (reguła ownera).
3. Commit na branchu `claude/design-salon-landing-page-thY4G`, push,
   ff-merge do master, push master. Gdy push odrzucony (równoległy stream):
   `git fetch`, `git rebase origin/master`, testy PO rebase, dopiero push.
4. **Natychmiast** dopisz wpis do `.claude/rules/active-context.md`
   (co zrobione, co znalezione, co dalej) + `git add -f .claude/...`
   (katalog jest w .gitignore — wymaga `-f`).

---

## 1. Twarde reguły projektu (łamanie = odrzucenie pracy)

- **UI wyłącznie po polsku.** Żadnych angielskich stringów w panelu/landingu.
- **Zakaz niebieskiego.** `.btn-primary`/`.btn-outline-primary` mają
  ZASZYTY niebieski Bootstrapa (retune `--bs-primary` ich NIE zmienia) —
  używaj `btn-dark`/`btn-outline-dark`/`btn-secondary` albo `PanelButton`.
  Brand: czerń/biel/srebro wg `.claude/skills/salonbw-brand/`.
- **Każda mutacja ma `onError` z toastem.** Zero cichych błędów.
- **`type="button"`** na każdym buttonie nie-submit (PanelButton ma default).
- **Modale:** `role="dialog"` + `aria-modal` + `aria-labelledby` + ESC +
  focus trap. NIGDY klasa `modal fade` bez `.show` — w BS5 to opacity:0
  (niewidoczny modal!). Wzorzec: inline `style={{display:'block', opacity:1}}`.
- **Daty lokalne:** NIGDY `toISOString().slice(0,10)` — używaj
  `apps/panel/src/utils/date.ts` (`toISODateLocal`/`todayISODate`).
- **Backend DTO:** globalny `ValidationPipe(forbidNonWhitelisted)` —
  KAŻDE pole wysyłane przez panel MUSI być w DTO z dekoratorem, inaczej 400.
  Numeryczne query-paramy wymagają `@Type(() => Number)`.
- **Encje TypeORM:** kolumna o typie TS `Date | null` lub union MUSI mieć
  jawne `type:` w `@Column` — inaczej API NIE WSTAJE
  (`ColumnTypeUndefinedError`; ta klasa położyła deploy 3 razy).
  Po każdej zmianie encji: `pnpm build && node dist/src/main.js` na moment
  lokalnie albo przynajmniej pełny `tsc` + świadomość ryzyka.
- **Nowa wartość `LogAction`** = OBOWIĄZKOWA migracja
  `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS '...'`.
- **Migracje:** FK-safe, idempotentne (`IF NOT EXISTS`), z `down()`.
  Deploy odpala je automatycznie na prod — migracja destrukcyjna wymaga
  wcześniejszej zgody ownera zapisanej w active-context.
- **Nowe repo w konstruktorze serwisu** = aktualizacja mocków w
  `test-context.ts` / fixtures.
- **Klient NIE widzi cen** (paidAmount/tipAmount/discount/internalNote
  nigdy w projekcjach klienckich — sprawdzaj DTO przy każdej zmianie).
- **`appointments.notes` NIE ISTNIEJE** (kolumna usunięta 2026-07-09).
  Pola strukturalne: `clientComment`, `staffRecommendations`,
  `onlineAddonsSummary`, `onlineTotalDurationMinutes`,
  `onlineDurationNeedsVerification`. `internalNote` = prywatne staffu.

---

## 2. Zadania do wykonania (kolejność = priorytet)

### Z1. Addon-picker kreatora rezerwacji pogrupowany jak krok 1 (P3, panel)

**Problem:** krok „Dodatki" w `apps/panel/src/pages/booking.tsx` dostaje
SUROWĄ listę usług — płaskie warianty Booksy („Botoks – włosy krótkie/
średnie/długie") widnieją jako 3 osobne dodatki, podczas gdy krok 1 grupuje
je w jedną usługę z wariantami (`normalizeServicesForBooking`).

**Zakres:**
- W `AddonStep` (w `booking.tsx`) użyj tej samej normalizacji co krok 1:
  pokazuj reprezentanta grupy („od X zł"), a po wyborze grupy z wariantami —
  pozwól wybrać wariant zgodny z długością włosów wybraną w kroku wariantu
  głównej usługi (jeśli grupa ma warianty) albo pojedynczą usługę wprost.
  Jeżeli pełne odwzorowanie wariantów w dodatkach okaże się zbyt złożone,
  DOPUSZCZALNE minimum: grupuj po `baseName` i wybieraj wariant
  odpowiadający wariantowi głównej usługi; gdy brak dopasowania — pokaż
  podlistę wariantów tej grupy.
- Wyklucz z listy dodatków całą grupę głównej usługi (już jest — utrzymaj).
- Payload `addonServiceIds` MUSI zawierać REALNE id usług płaskich
  (backend waliduje `isActive`+`onlineBooking`; max 5).

**Akceptacja:** test jednostkowy w `bookingPage.test.tsx` pokrywający:
(a) dodatki pogrupowane — brak duplikatów bazowej nazwy na liście,
(b) wybór dodatku z grupy wariantowej mapuje się na poprawne `serviceId`,
(c) istniejące testy przechodzą bez modyfikacji asercji payloadu.

### Z2. Combobox-ARIA dla omniboksu (P3, panel)

**Plik:** `apps/panel/src/components/salon/SalonGlobalSearch.tsx`.

**Zakres:** pełna semantyka WAI-ARIA combobox:
- input: `role="combobox"`, `aria-expanded`, `aria-controls="omnibox-listbox"`,
  `aria-activedescendant` wskazujący aktywny wynik (id per wynik),
- kontener wyników: `role="listbox"` + `id="omnibox-listbox"`,
- nagłówki grup (`Klienci`/`Pracownicy`/`Produkty`): `role="presentation"`
  (lub `group` z `aria-label`), wyniki: `role="option"` + unikalne `id` +
  `aria-selected`,
- highlight klawiaturą i hover nie mogą się rozjeżdżać: przy `onMouseEnter`
  ustawiaj `searchActive` na index wyniku (przywróć zgubiony handler).

**Akceptacja:** test jednostkowy (nowy lub rozszerzony) sprawdzający role
i `aria-activedescendant` przy nawigacji strzałkami; `pnpm test` zielone.

### Z3. Playwright: specy regresyjne dla nowych flow (read-only, CI)

**Katalog:** `tests/e2e/regression/` (wzorce już istnieją, workflow
`e2e-playwright-regression.yml`; sekrety E2E_* w CI). **WYŁĄCZNIE odczyt** —
żadnych mutacji na prod (skip-guard jak w istniejących specach).

**Zakres — dodaj specy renderu (bez tworzenia danych):**
1. `/visits` jako klient: sekcje Nadchodzące/Odbyte renderują się,
   brak jakichkolwiek kwot (asercja negatywna na `zł` w wierszach wizyt
   — poza cenami usług w kreatorze).
2. `/booking`: krok 1 pokazuje pogrupowane usługi (karta z „od ... zł"
   i licznikiem wariantów), stepper 4 kroków widoczny.
3. Topbar staff: dzwonek renderuje badge tylko gdy count>0; omnibox
   otwiera listbox po 2+ znakach (po Z2 — sprawdź role=listbox).
4. Karta klienta (admin): hero z avatarem-lub-inicjałami renderuje się,
   taby in-page przełączają się bez nawigacji.

**Akceptacja:** `npx playwright test` lokalnie w trybie skip (bez env
credentials specy muszą się SKIPOWAĆ, nie failować); CI run zielony.

### Z4. Import danych produkcyjnych (ZABLOKOWANE — czeka na wsad ownera)

**NIE ZACZYNAJ bez wsadu.** Gdy owner dostarczy dane (eksport z Booksy/
Versum), przygotuj migrację importu wg tych wymogów:
- `clientComment`/`staffRecommendations` wypełniaj BEZPOŚREDNIO z danych
  źródłowych — kolumny `notes` nie ma, back-parser się nie uruchomi.
- Wzorzec FK-safe: dynamiczny `DO`-block po `information_schema`
  (przykłady: `1761020000000-CleanupE2eTestArtifacts`,
  `1761310000000` final cleanup).
- `users.role` to natywny enum — INSERT wymaga `$n::"users_role_enum"`.
- Idempotencja po naturalnym kluczu (email/telefon), NIE po nazwie
  (lekcja: seed-migration-dirty-catalog).
- Przed migracją na prod: przetestuj na lokalnym pg (docker) na kopii schematu.

### Z5. Sprzątanie residuum magazynowego (opcjonalne, za zgodą ownera)

Migracja FK-safe usuwająca: produkty testowe AUDYT/test/flow (nieaktywne),
stocktaking #1 (draft „SMOKE TEST"), dostawy #8/#9, zamówienia #1-2,
sprzedaż #9 (voided). **Najpierw zapytaj ownera w active-context/rozmowie**
— pozycje mają historię księgową.

### Z6. Bieżący nadzór nad streamem ownera (stałe zadanie)

Przy każdej sesji: jeśli na masterze są nieudokumentowane commity ownera —
zrób przegląd ich diffów pod kątem: (a) nowych kolumn encji bez `type:`
(klasa boot-crash), (b) pól DTO niewhitelistowanych a wysyłanych przez
panel (klasa 400/forbidNonWhitelisted), (c) `modal fade` bez `.show`,
(d) angielskich stringów, (e) niebieskich klas, (f) brakujących testów.
Znalezione bugi: fix + wpis do active-context (wzorzec: sesje 07-08/07-09).

---

## 3. Zadania POZA zakresem Sonneta (nie ruszać)

| Zadanie | Dlaczego poza zakresem | Kto |
|---|---|---|
| Live E2E na prod (staff-confirm, finalizacja z dodatkami, rejestracja) | wymaga realnych kredencjali/sesji staff na prod + osądu przy mutacjach na żywej bazie | Opus/Fable z ownerem |
| `UPLOADS_DIR` na MyDevil (avatary a deploy) | wymaga SSH `vetternkraft@s0.mydevil.net` | owner / Opus |
| Backup bazy, zmiana hasła admina, `SMSAPI_TOKEN`, decyzja o domenie, Sentry DSN, klucze Google OAuth | zadania właściciela (Faza 4 planu 10/10) | owner |
| Rozdzielenie semantyki zgód marketing-vs-transakcyjne | zmiana modelu danych, wymaga decyzji ownera | owner + Opus |
| Migracje destrukcyjne | wymagają zgody ownera | Opus |

---

## 4. Mapa wiedzy (gdzie co jest)

- **Stan projektu / dziennik:** `.claude/rules/active-context.md` (ZAWSZE
  aktualizuj po commicie; `git add -f`).
- **Plan nadrzędny:** `docs/PANEL_10_10_PLAN.md` (statusy faz).
- **Brand/design:** `.claude/skills/salonbw-brand/SKILL.md`.
- **Architektura shell/nav:** sekcja „Panel layout architecture" w
  active-context (persistent shell, useSetSecondaryNav, /calendar poza shellem).
- **Deploy:** push na master → GitHub Actions `Deploy (MyDevil)` (buduje,
  wgrywa, ODPALA MIGRACJE). Panel/landing/api wybierane po ścieżkach.
  Deploy NIE uruchamia testów jednostkowych — CI (osobny workflow) tak.
- **Konta testowe:** e2e.client.0628 (CI Playwright), „Test tesr" (54,
  konto ownera), Aleksandra (29, admin+stylistka). NIE usuwać.
- **Kluczowe endpointy klienta:** `/dashboard/client`, `/dashboard/client/visits`,
  `/appointments/:id/messages`, `/accept-reschedule`, `/reviews` (POST z
  appointmentId), `/services/online-booking`, `/calendar/available-slots`.

## 5. Definicja ukończenia projektu (checklista GO)

- [ ] Z1–Z3 zrobione i wdrożone (CI zielone, deploy success)
- [ ] Import danych prod wykonany i zweryfikowany (Z4, po wsadzie)
- [ ] Faza 4 ownera: backup + hasło + domena (+ opcjonalnie SMSAPI/Sentry/OAuth)
- [ ] Live E2E 3 ról na czystej bazie (Opus + owner)
- [ ] Finalny wpis „stan na start" w active-context
