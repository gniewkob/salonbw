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

### Z1. ✅ DONE 2026-07-09 (`b8daaa0` + remap `3e6becc`) — Addon-picker pogrupowany

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

### Z2. ✅ DONE 2026-07-09 (`8c0ca98` + fix type=text `e3106c7`, potwierdzony E2E na prodzie) — Combobox-ARIA omniboksu

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

### Z3. ✅ DONE 2026-07-09 (`6b3d457`; 22/22 na prodzie po deployu 2026-07-10) — Specy regresyjne Playwright

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

### Z7. ✅ DONE 2026-07-11 — Klient: szczegóły wizyty w wysuwanym panelu bocznym (redesign UX)

**Motywacja (feedback ownera, 2026-07-10, cytat):** „nie podoba mi się lista
wizyt i te rozwijane treści; jak próbuję dodać wiadomość do usługi jako
klient, to ląduję gdzieś nie wiadomo gdzie i muszę szukać pola wpisywania.
Nie wiem, czy nie lepiej modale albo jak w Booksy z wyjeżdżającym z boku
panelem". Stan obecny (`apps/panel/src/pages/visits.tsx`): DWA poziomy
rozwijania inline (wiersz `openVisitId` → wewnątrz drugi toggle
`messagesOpen` z `MessageThread`), zero zarządzania focusem po kliknięciu.

**DECYZJA PROJEKTOWA (podjęta — nie rewidować):** wysuwany panel z prawej
(wzorzec Booksy), NIE modal. Uzasadnienie: treść jest długa (notatki +
porównanie terminów + akcje + wątek wiadomości) — modale w tym projekcie
służą krótkim potwierdzeniom; panel trzyma kontekst listy na desktopie
i jest spójny ze staffowym `AppointmentDrawer`; na mobile (≤767px) panel
staje się pełnoekranowym arkuszem.

**Zakres:**
- Nowy komponent `apps/panel/src/components/client/VisitDetailsPanel.tsx`:
  prawy slide-in (desktop ~480px szer., overlay-backdrop, body scroll-lock),
  pełny ekran na mobile. Zawartość: nagłówek (usługa+data+status), `VisitNotes`,
  `RescheduleChangeNotice`, `ClientAppointmentActions`, `MessageThread`
  (bez drugiego poziomu rozwijania — wątek widoczny od razu, textarea na dole).
- Semantyka: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
  (nagłówek panelu), ESC zamyka, focus trap (wzorzec z ConfirmModal).
- **Zarządzanie focusem (sedno skargi):** otwarcie → focus na nagłówku
  panelu; przycisk „Napisz wiadomość"/„Odpowiedz" → focus PROSTO na
  textarea (scrollIntoView jeśli trzeba); wysłanie wiadomości → focus
  zostaje w textarea, lista wiadomości doscrollowana do nowego wpisu;
  zamknięcie (ESC/X/backdrop) → focus wraca na wiersz, który panel otworzył.
- `/visits`: wiersze stają się zwykłymi, klikalny „Szczegóły" otwiera panel;
  USUNĄĆ inline-expand (`openVisitId`-rozwijanie i `messagesOpen`).
  Deep-link `?visitId=N` otwiera panel (zachować obecny kontrakt URL).
- `ClientDashboard`: „Szczegóły wizyty" / „Załatw teraz" kierują do
  `/visits?visitId=N` (panel otworzy się sam) — bez zmian kontraktu.
- Brand: czerń/biel/srebro, animacja transform 0.2-0.3s (respektować
  prefers-reduced-motion), zero niebieskiego.
- CSS: nowe klasy `visit-details-panel*` w dedykowanym `visit-details-panel.css` (nie w dużym salon-shell.css); mobile-first.

**Akceptacja:** testy jednostkowe: (a) otwarcie panelu z wiersza i przez
`?visitId`, (b) focus na nagłówku po otwarciu, (c) focus na textarea po
„Napisz wiadomość", (d) powrót focusu po zamknięciu, (e) akcje
(anuluj/akceptuj) działają z panelu; istniejące testy visitsPage
zaktualizowane świadomie (zmiana UX jest celowa — wolno zmienić asercje
rozwijania na asercje panelu); pełna suita panelu zielona; specy Playwright
`visits-client.spec.ts` zaktualizowane pod nowy wzorzec (sekcje list bez
kwot — bez zmian; dodać: klik „Szczegóły" → dialog widoczny).

### Z8. 🟡 Część A DONE 2026-07-11 (branch `claude/sonnet-execution-z7-z9-je0rkj`) — Wizualno-funkcjonalny sweep WSZYSTKICH widoków per rola (screenshoty z CI)

**Cel ownera:** przejście ścieżek jak każda rola + ocena wizualna i
funkcjonalna każdego widoku. Sandbox agenta NIE ma kredencjali prod —
dlatego zrzuty robi CI (sekrety E2E_* już są), a agent przegląda artefakty.

**Część A — nowy workflow + spec (read-only!):**
- `apps/panel/tests/e2e/visual-sweep.spec.ts` + workflow
  `e2e-visual-sweep.yml` (TYLKO `workflow_dispatch`, nie na push — sweep
  jest wolny). Wzorce logowania/skip-guard z `tests/e2e/regression/`.
- Dla ról admin i client (employee gdy sekret istnieje), dla viewportów
  1366×768 i 390×844: odwiedź każdą trasę z listy, poczekaj na settle
  (domcontentloaded + brak spinnera), asercje minimalne: brak
  „Application error", brak „Nie masz uprawnień" (poza trasami celowo
  zablokowanymi), jest `<h1>`; fullpage screenshot →
  `screenshots/<rola>/<viewport>/<trasa>.png`; upload całości jako artifact
  (`if: always()`).
- Lista tras — client: /dashboard, /visits, /booking, /account,
  /notifications, /helps/new. Admin: /dashboard, /calendar (day/week/
  month/reception), /appointments, /customers (+ karta pierwszego klienta,
  wszystkie taby), /services (+ karta), /products, /inventory, /orders/
  history, /deliveries/history, /manufacturers, /suppliers, /stock-alerts,
  /sales/history, /sales/gift-cards, /loyalty, /communication/{templates,
  mass,campaigns,automatic}, /statistics (+ podstrony), /reviews, /invoices,
  /settings (+ wszystkie podstrony z SettingsNav), /notifications, /helps/new.
- ŻADNYCH mutacji: tylko nawigacja, otwieranie tabów/paneli read-only.

**Część B — raport z przeglądu:**
- Uruchom workflow (dispatch), pobierz artifact, obejrzyj KAŻDY screenshot.
- Znaleziska spisz do `.claude/rules/active-context.md` (Backlog) w trzech
  koszykach: 🔴 bug funkcjonalny / 🟡 UX (w tym: gdzie ląduje focus po
  akcji, spójność wzorców modal-vs-panel-vs-inline, nadmiarowe kroki) /
  🎨 wizualny (odstępy, kontrast, resztki niebieskiego, ucięte teksty,
  h-scroll na 390px). Każde znalezisko: trasa + rola + viewport + screenshot.
- NIE naprawiaj w tym zadaniu niczego poza oczywistymi literówkami —
  najpierw pełna lista, potem priorytetyzacja z ownerem/leadem.

**Akceptacja:** workflow zielony na dispatch; artifact zawiera komplet
zrzutów; wpis w active-context z listą znalezisk (może być „brak uwag"
per widok, ale każdy widok ODHACZONY).

### Z9. ✅ DONE 2026-07-11 — Audyt „gdzie ląduje użytkownik po akcji" (focus/scroll) w panelu klienta

Uogólnienie skargi ownera z Z7 na pozostałe akcje klienta („rozważ
podobne rzeczy"). Dla każdej akcji sprawdź i napraw, z testem:
- wysłanie wiadomości w `MessageThread` (także po Z7): scroll listy do
  nowej wiadomości, focus zostaje w textarea, textarea wyczyszczona;
- „Akceptuj nowy termin": po sukcesie focus na zaktualizowanym statusie
  wiersza / toast z `role=status`; bez skoku strony do góry;
- anulowanie przez ConfirmModal: focus wraca do wiersza (nie do body);
- kreator rezerwacji: zmiana kroku → focus na nagłówku kroku (sprawdzić,
  czy działa po zmianach Z1); SuccessScreen → focus na komunikacie (jest —
  zweryfikować testem, jeśli brak);
- formularz pomocy /helps/new: po wysłaniu focus na potwierdzeniu;
- błędy API: `role=alert` jest — sprawdzić, czy elementy błędów są
  doscrollowane do widoku przy submit z dołu strony.

**Akceptacja:** każdy punkt ma test jednostkowy (istniejący lub nowy);
naprawy czysto frontendowe; pełna suita zielona.

### Z10. ✅ DONE 2026-07-11 (`e1a5d2f` Z10a-c + `56de8af` Z10d) — Fixy po review Fable (Z7/Z9) — PRZED merge PR #1419

**Kontekst:** review brancha `claude/sonnet-execution-z7-z9-je0rkj` znalazł
3 realne bugi i paczkę drobnych. Wszystkie fixy czysto frontendowe, na TYM
SAMYM branchu. Kolejność podzadań = priorytet. Dla Z10a-Z10c obowiązuje
rytuał „test najpierw failuje, potem fix" (wzorzec z Z9).

**Z10a — kolizja VisitDetailsPanel × ConfirmModal (nakładające się dialogi).**
Przy anulowaniu ConfirmModal otwiera się NAD panelem; oba komponenty mają
NIEZALEŻNE `document.addEventListener('keydown')`, bez koordynacji:
1. ESC w modalu zamyka OBA dialogi — handler panelu
   (`VisitDetailsPanel.tsx` ~:117) nie wie o modalu i woła `onClose()`.
2. Shift+Tab w modalu WYRYWA focus za modal: trap panelu ma warunek
   `!root.contains(document.activeElement)` (~:133-140) — focus w modalu
   nie jest w panelu, więc panel przechwytuje zdarzenie i fokusuje SIEBIE.
3. Scroll-lock przecieka: ConfirmModal przy zamknięciu ustawia
   `body.style.overflow = ''` mimo że panel wciąż jest otwarty.

Fix:
- Nowy prop `suspended?: boolean` na `VisitDetailsPanel` — gdy `true`,
  keydown handler panelu NIE robi NIC (ani ESC, ani trap); w `visits.tsx`
  przekazać `suspended={confirmCancelId !== null}`.
- `ConfirmModal`: zapamiętać `body.style.overflow` sprzed otwarcia i
  przywracać TĘ wartość przy zamknięciu (nie gołe `''`). ConfirmModal jest
  współdzielony — zmiana bezpieczna dla wszystkich call-sites.

Testy (visitsPage): (a) ESC przy otwartym ConfirmModal zamyka TYLKO modal —
dialog panelu zostaje w drzewie; (b) po zamknięciu modala (Anuluj) kolejny
ESC zamyka panel (zawieszenie się cofa).

**Z10b — focus po anulowaniu ginie po refetchu (test maskował bug).**
`cancelVisit` (visits.tsx ~:301) robi `closeVisit()` → panel przywraca
focus na „Szczegóły" wiersza → `load()` przenosi wizytę do sekcji
„Anulowane i nieodbyte" → wiersz REMOUNTUJE się w innej sekcji → element
z focusem znika z DOM → focus na `<body>`. Test „cancels a visit…"
przechodzi TYLKO dlatego, że mock `/dashboard/client/visits` zwraca te
same dane po PATCH (wizyta nie zmienia sekcji). Poprawny wzorzec jest w
teście accept (flaga `accepted` zmienia odpowiedź fixture po akcji).

Fix:
- Po udanym cancel zapamiętać id w ref (np. `pendingFocusVisitIdRef`);
  w efekcie po aktualizacji `visits` sfokusować przycisk „Szczegóły"
  wiersza `#visit-{id}` (już w nowej sekcji); gdy wiersza brak — nagłówek
  strony. Restore panelu (synchroniczny, na stary przycisk) jest ok —
  nasz refocus przychodzi PO refetchu i wygrywa.
- Test: przepisać mock jak w accept (po PATCH fixture zwraca wizytę 1 ze
  statusem `cancelled`), asercja `toHaveFocus()` na „Szczegóły" w NOWEJ
  sekcji. Test MUSI failować przed fixem — sprawdzić.

**Z10c — auto-scroll wątku psuje otwarcie panelu.**
`MessageThread.tsx` ~:73-77 scrolluje `bottomRef.scrollIntoView` przy
KAŻDYM załadowaniu wiadomości. Przed Z7 wątek montował się dopiero po
jawnym rozwinięciu przez użytkownika — scroll był pożądany. Po Z7 wątek
montuje się OD RAZU przy otwarciu panelu → wizyta z ≥1 wiadomością
natychmiast odjeżdża do dołu sekcji „Wiadomości", walcząc z focusem na
nagłówku (góra panelu: data/status/akcje).

Fix: NIE scrollować przy pierwszym niepustym załadowaniu (ref
`initialLoadDoneRef`); scrollować przy KOLEJNYCH zmianach listy (w tym po
własnej wysyłce). `focusCompose()` bez zmian (jawny scroll na życzenie).
Test: mount z istniejącymi wiadomościami NIE woła `scrollIntoView`
(spy na `HTMLElement.prototype.scrollIntoView`); po wysłaniu — woła.

**Z10d — drobne (jedna paczka, jeden commit):**
1. Deep-link `?visitId=N`: `triggerRef` łapie `<body>` → przy zamknięciu
   fallback: gdy trigger to body/null, sfokusuj „Szczegóły" wiersza
   `#visit-{id}`.
2. `MessageThread.sendMessage`: `focusPendingRef.current = true` przenieść
   do `finally` (PRZED `setSending(false)`) — refocus także po błędzie
   (teraz tylko sukces; przy błędzie focus ląduje na body, bo przycisk
   był disabled).
3. Overlay panelu: zamykać na `onMouseDown` zamiast `onClick` —
   zaznaczanie tekstu w panelu zakończone ruchem myszy nad overlayem nie
   może zamykać panelu (mousedown wewnątrz + mouseup na overlayu = click
   na overlayu). Odpowiednio `stopPropagation` na mousedown panelu.
4. CSS: `.visit-details-panel__section:first-of-type` to MARTWA reguła
   (pierwszym divem-siostrą jest `__meta`, więc żaden `__section` nie jest
   first-of-type) — pierwsza sekcja ma niechciany border-top. Fix:
   modifier `visit-details-panel__section--flush` nadany w JSX pierwszej
   sekcji + reguła `--flush { padding-top: 0; border-top: 0; }`; martwą
   regułę usunąć.

**Akceptacja Z10:** pełna suita panelu zielona; nowe/przepisane testy
Z10a-Z10c failują przed fixem (zweryfikować świadomie); tsc+eslint czyste;
wpis w active-context po każdym commicie.

### Z11. Fixy spec Z8 PRZED pierwszym dispatchem (`visual-sweep.spec.ts`)

**Kontekst:** review przewiduje CZERWONY pierwszy run sweepa z powodu
timeoutów — naprawić na tym samym branchu, zanim PR się zmerguje i ktoś
odpali dispatch.

1. **Timeouty testów card-tabs:** „customer card tabs" / „service card
   tabs" robią 8+ nawigacji z `settle()` (do 16 s każda) + fullpage
   screenshoty w JEDNYM teście — domyślne 30 s NIE wystarczy. Fix:
   `test.setTimeout(240_000)` na początku każdego z tych 4 testów;
   testy per-trasa: `test.setTimeout(60_000)`.
2. **Login w `beforeAll` bez timeoutu:** `loginAs` przy 429 czeka 35 s
   backoffu, a hook ma domyślne 30 s. Fix: `test.setTimeout(180_000)` na
   początku KAŻDEGO `beforeAll` (dokładnie wzorzec z `auth.setup.ts` —
   tam jest komentarz wyjaśniający).
3. **Zrzut PRZED asercjami:** w `visitAndShoot` i pętlach card-tabs
   najpierw `screenshot`, POTEM `assertHealthy` — inaczej trasa, która
   failuje, nie zostawia zrzutu w artefakcie (a zrzut jest tu
   deliverablem do przeglądu; trace to za mało).
4. **Negatywne asercje odporne na strict mode:**
   `expect(page.getByText('…')).not.toBeVisible()` rzuca strict-mode
   violation przy >1 dopasowaniu — zamienić na
   `await expect(page.getByText('…')).toHaveCount(0)`.
5. (Opcjonalnie) reużyć sesję admina w describe card-tabs (zapis
   `storageState` po pierwszym loginie admina) zamiast drugiego
   logowania — mniej obciążenia throttle 5/min.

**Akceptacja Z11:** `playwright test tests/e2e/visual-sweep.spec.ts
--project=desktop-1366 --list` nadal = 158; tsc czyste; workflow BEZ
zmian; wpis w active-context. Po merge PR #1419: dispatch → artifact →
przegląd zrzutów → raport (Z8 Część B wg treści zadania Z8).

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

- [x] Z1–Z3 zrobione i WDROŻONE na prod (deploy `29115624410` 2026-07-10, E2E 22/22 run `29116104855`; bloker SSH zamknięty)
- [x] Z7 — szczegóły wizyty klienta w panelu bocznym (DONE 2026-07-11, branch `claude/sonnet-execution-z7-z9-je0rkj`)
- [x] Z8 Część A — spec+workflow gotowe (DONE 2026-07-11); [ ] Część B — dispatch + przegląd zrzutów + raport w Backlogu (po merge PR #1419)
- [x] Z10 — fixy po review Fable (Z7/Z9: kolizja dialogów, focus po cancel, auto-scroll wątku, drobne) — DONE 2026-07-11
- [ ] Z11 — fixy spec Z8 (timeouty, zrzut przed asercjami, strict-mode) — PRZED pierwszym dispatchem
- [x] Z9 — audyt focus/scroll po akcjach klienta (DONE 2026-07-11, branch `claude/sonnet-execution-z7-z9-je0rkj`)
- [ ] Import danych prod wykonany i zweryfikowany (Z4, po wsadzie)
- [ ] Faza 4 ownera: backup + hasło + domena (+ opcjonalnie SMSAPI/Sentry/OAuth)
- [ ] Live E2E 3 ról na czystej bazie (Opus + owner)
- [ ] Finalny wpis „stan na start" w active-context
