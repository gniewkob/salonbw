# Faza F — Transformacja panelu z Versum-clone do premium narzędzia

Data utworzenia: 2026-06-01
Ostatnia aktualizacja: 2026-06-03
Status: w trakcie realizacji (Tier 1-3 + dashboard + F5.1-F5.5 + F3a-c ukończone; F3d custom hooks deferred)
Następna faza po: `Faza E — Versum visual parity sprint` (zakończona)

## Progres wdrożenia (2026-06-03)

| Etap | Commit | Co zrobione |
|---|---|---|
| Tier 1 | `4ced8ff03` | snake/kebab settings duplicates — 5 par |
| Tier 2 | `0ba90796e` | -14 plików routes (admin/branches, invoices, event-reminders, product-orders, /employees, /admin/* duplikaty); ukryte orders/deliveries/suppliers/manufacturers z nav. **-2370 linii kodu.** |
| Tier 3 | `f70e8097f` | communication cleanup (-5 plików), settings semantic grouping (6 sekcji), admin po loginie → `/dashboard` |
| CI fix | `bd22c4654` | warm-up + retry-restart po Passenger reload — eliminuje "deploy success ale 500" |
| Dashboard | `da2267955` | low-stock alert section + "Nowa wizyta" primary CTA |
| F5.1-F5.3 | `658b8c7b5` | Versum #f4fbff stripes → neutral; .link_body i .btn-primary → brand silver |
| F5.4 | `e29e2477f` | table padding 7/10/6 → 10/14 (3 sites); td.link_body a color → #4a4a4a |
| F5.5 | `ee5aaf138` | .icon_link blue → neutral; nav-tabs hover → black; mini-chart bar → brand silver |
| F3a-c | `6912ab124` | calendar.tsx 2365 → 1851 (-514). Wyciągnięte: 14 typów + 3 stałe do `types/calendar-page.ts`, 4 normalize funkcje + 2 helpery do `utils/calendarNormalize.ts`, 5 query helperów do `utils/calendarQueryState.ts`. Dodatkowo: ReceptionFollowUpPanel zdedup'owany. |

**Łącznie:** ~-2900 linii kodu mniej, 9 commitów do produkcji w sesji 2026-06-01..03.

## Następne kroki (osobna sesja)

- **F3d calendar custom hooks** — wyciągnięcie 65 hooków (37× useState, 15× useEffect, 8× useMemo, 5× useRef) z `CalendarPage` do 11-13 custom hooków pogrupowanych po domenie. **Plan w `docs/FAZA_F_F3D_CALENDAR_HOOKS_PLAN.md`** — 13 kroków uporządkowanych od LOW do HIGH risk; customer alerts (grupa I) wymaga własnej sub-sesji.
- **F4 mobile mode** dla receptionistki — desktop-first → adaptive
- **F5 sprite icons → Heroicons** (194 unikalne sprite'y do migracji)
- **F2 dashboard polish** — widget "kto przychodzi w następne 2h"

Decyzje właściciela podjęte 2026-06-02:
- Karty podarunkowe — KEEP (sprzeda)
- Program lojalnościowy — KEEP (planuje wprowadzić)
- 1 lokalizacja — KILL multi-location
- Newsletter / email marketing — KEEP
- Zamówienia od dostawców — POZA panelem (HIDE flow)
- Faktury — zewnętrzne narzędzie (KILL /invoices)
- /notifications, /messages, /emails → CONSOLIDATE do /communication z taby
- Versum-compat zakończony — robimy własny system, bez 301 redirects do snake URL

## 1. Cel

Po zakończeniu Fazy E (1:1 parity z dump Versum dla wszystkich modułów `panel/calendar`, `panel/customers`, `panel/products`, `panel/statistics`, `panel/services`, `panel/communication`, `panel/settings`, `panel/extension`) panel jest funkcjonalnie pełen, ale:

- niesie ciężar 130 stron skopiowanych z Versum, w tym moduły o niskiej wartości dla pojedynczego salonu,
- ma duplikaty route'ów (snake_case + kebab-case) z migracji,
- ma monolityczne komponenty (kalendarz 2365 linii, drawer 1362 linii),
- ma rozproszone sekcje administracyjne (settings 36 podstron, statystyki 15, łączność 6),
- jest desktop-only, ignorując receptionistki na telefonie,
- wizualnie czyta się jako SaaS 2014, mimo że landing prezentuje markę premium 2026.

Celem Fazy F jest **świadome odejście od pełnej Versum-parity tam, gdzie Versum jest balastem**, przy zachowaniu warstwy danych i znanego userze flow.

Faza E była archeologią. Faza F jest urbanistyką.

## 2. Zasady nadrzędne

Ten plan podlega:

1. `docs/VERSUM_CLONING_STANDARD.md` — jako dziedzictwo, nie jako żywa reguła. Cloning jest zamknięty.
2. `Agent.md` (root) — operacyjne.
3. `docs/LANDING_DESIGN_DIRECTION.md` — dla spójności marki między landing a panel.
4. Niniejszy dokument — strategiczny kierunek panelu.

Najważniejsze zasady tej fazy:

- **"Czy Aleksandra otworzy tą stronę w tym tygodniu?"** — pytanie filtrujące każdy ruch. Jeśli nie — schowaj lub usuń.
- **Premium UX = restraint.** Mniej modułów lepiej pokazanych > wszystko po trochu.
- **Mobile-first dla receptionistki, desktop-first dla admina.** Te dwa profile mają osobne priorytety wyświetlania.
- **Versum-IA zostaje tam, gdzie działa.** Modernizujemy visual + IA tam, gdzie Versum boli.
- **Backwards-compat dla snake_case URLs przez 301.** Nigdy nie 404 dla starego linka.

## 3. Diagnoza wyjściowa (z audytu 2026-06-01)

Stan po Fazie E:

| Wskaźnik | Wartość | Ocena |
|---|---|---|
| Liczba pages w `apps/panel/src/pages` | 130 | Za dużo dla 1 salonu |
| Liczba components | 155 | Za dużo |
| Pages w `/settings/` | 36 | Labirynt |
| Pages w `/statistics/` | 15 | Rozproszone raporty |
| Pages w `/communication/` | 6 modułów | Duplikacja funkcji |
| `calendar.tsx` | 2365 linii | Monolith, bus factor risk |
| `AppointmentDrawer.tsx` | 1362 linii | Multi-responsibility |
| `admin/gift-cards/index.tsx` | 1431 linii | Over-engineering dla salonu |
| Duplikaty snake/kebab route'ów | 10 par | Dług z migracji |
| Media queries w salon-shell.css | 14 | Desktop-only mindset |
| Inline `style={{...}}` w panelu | 217 | Niska dojrzałość tokenów |

Mocne strony do utrzymania (z dzisiejszego sprintu):

- Persistent shell w `_app.tsx`
- Versum-native class names (Faza E)
- Touch targets 44px w `[role=dialog]` (dziś)
- Brand silver tokens (`--salon-*`)
- 79 test suites, 262 testy
- CI deploy verifier dla `@sentry/core` (dziś)
- Booking wizard po dzisiejszych poprawkach (premium-tier)

## 4. Workstreamy

Faza F dzieli się na **5 równoległych workstreamów**, każdy z własnym właścicielem decyzji i mierzalną definicją sukcesu. Można je realizować niezależnie i mergować osobno.

### Workstream F1 — Konsolidacja IA i sprzątanie route'ów

**Problem:** 36 podstron settings, 15 raportów statystyk, 6 modułów komunikacji. Plus 10 duplikatów snake/kebab.

**Zakres:**

- **F1.1 — Settings → 1 strona + tabs + search**
  - Wszystkie 36 podstron jako sekcje pod `/settings` z lewym sidebarem (jak macOS System Settings).
  - Globalne pole wyszukiwania na górze — Aleksandra wpisuje "godziny" → trafia do `timetable/branch`.
  - Konsolidacja semantycznie zgrupowanych podstron:
    - `customer_groups` + `customer_origins` + `extra_fields` → "Atrybuty klienta"
    - `data_protection` + `data_protection/logs` + `privacy` → "RODO"
    - `employees/[id]/*` → karty pracownika z taby (profil / historia eventów / prowizje / harmonogram)
  - Docelowo: ~10 sekcji zamiast 36 stron.
- **F1.2 — Statistics → dashboard + drill-down**
  - Główna strona `/statistics` jako dashboard z 4-6 KPI: przychód, wizyty, top usługa, top stylista, retention, no-show rate.
  - Pozostałe raporty jako drill-down z filtru, nie osobne URL-e.
  - Zachować pełne raporty pod `/statistics/<key>` dla deep-linkowania.
- **F1.3 — Communication → 1 sekcja, 4 zakładki**
  - `/communication` z zakładkami: **Auto** (przypomnienia, follow-up), **Manual** (jednorazowe SMS/email), **Templates**, **Log**.
  - Konsolidacja: `notifications`, `newsletters`, `messages`, `emails`, `event-reminders`, `predefined_messages`.
- **F1.4 — Sprzątanie duplikatów route'ów**
  - Kebab-case wins (modern, web standard).
  - Snake-case warianty → przekierowania 301 w `next.config.js`.
  - Usuwamy 10 zduplikowanych `.tsx` files.
  - Bezpieczne, bo żaden link zewnętrzny nie używa snake-case (potwierdzić grep w `landing` + `backend`).

**Definicja sukcesu:**

- Liczba pages w `pages/settings` ≤ 10 (z 36).
- Liczba pages w `pages/statistics` ≤ 1 dashboard + raporty.
- 0 duplikatów snake/kebab.
- Aleksandra znajduje "godziny otwarcia" w ≤ 5 sekund od loginu.

**Effort:** 2-3 sprinty.

**Dependency:** brak (czysty refactor).

### Workstream F2 — Dashboard jako home page

**Problem:** Aleksandra po loginie trafia do pustego kalendarza. Calendar = narzędzie, nie ekran startowy.

**Zakres:**

- Nowy `/dashboard` jako default po loginie (admin role).
- 4-6 paneli:
  - **Dziś:** ile wizyt, ile zarobione (z targetem dziennym), kto jest w salonie teraz
  - **Następne 2h:** lista wizyt z alertami (pierwsza wizyta klienta, no-show history, online_pending)
  - **Online_pending:** klienci czekający na akceptację rezerwacji online (jeden klik → akceptuj/odrzuć)
  - **7 dni:** trend wizyt, top usługa, top stylista
  - **Zapasy:** alerty końcących się produktów (link do `/products/stock-alerts`)
  - **Quick action:** "Nowa wizyta" — otwiera kalendarz z drawer od razu
- Mobile-friendly: każdy panel jako karta, w pionie, jeden CTA.

**Definicja sukcesu:**

- Aleksandra otwiera panel rano i w **30 sekund** wie wszystko co ważne.
- 0 osób narzeka, że "pusty kalendarz" jest pierwsza rzecz po loginie.
- Online_pending obsłużone z dashboardu bez przechodzenia do innej strony.

**Effort:** 1-2 sprinty.

**Dependency:** F4 (mobile mode) dla dashboardu mobilnego.

### Workstream F3 — Rozbicie monolitów

**Problem:** `calendar.tsx` 2365 linii, `AppointmentDrawer.tsx` 1362 linii, `gift-cards/index.tsx` 1431 linii. Wysoki bus factor, każda zmiana = ryzyko regresji w nie-pokrewnych częściach.

**Zakres:**

- **F3.1 — Calendar split przez role**
  - `/calendar/reception` (receptionistka — focus on follow-up + alerts)
  - `/calendar/staff` (stylista — focus on dziś + finalizacja)
  - `/calendar/admin` (Aleksandra — full view + zarządzanie)
  - Wspólne komponenty (CalendarView, AppointmentDrawer) zostają, ale każda strona ma własny entry point + state.
  - Zachować `/calendar?view=client` dla klienta (już istnieje).
- **F3.2 — AppointmentDrawer split**
  - `AppointmentDrawerCreate` (nowa wizyta — minimal form)
  - `AppointmentDrawerEdit` (edycja istniejącej — full form + history)
  - `AppointmentDrawerFinalize` (zakończenie wizyty — payments, products, tips)
  - Wspólny `AppointmentDrawerShell` jako kontener.
- **F3.3 — Admin gift-cards + loyalty audit**
  - Sprawdź telemetrię: ile razy używane w ostatnich 90 dniach.
  - Jeśli <10 użyć: feature flag → hide w UI, kod zostaje (legacy).
  - Jeśli regularnie używane: rozbij na mniejsze komponenty (każda funkcja jako osobny widok).

**Definicja sukcesu:**

- 0 plików > 600 linii w `apps/panel/src/pages`.
- 0 plików > 800 linii w `apps/panel/src/components`.
- Bus factor: nowy programista może zrozumieć jeden flow (np. nowa wizyta) w < 30 minut bez ładowania całego `calendar.tsx`.

**Effort:** 3-4 sprinty (calendar split = największy ruch).

**Dependency:** brak (czysty refactor, nie zmienia UX).

### Workstream F4 — Mobile mode dla receptionistki

**Problem:** Panel jest desktop-only. Receptionistka oddzwania klientowi z telefonu i nie może umówić wizyty.

**Zakres:**

- Breakpoint mobilny: `max-width: 768px`.
- **Kalendarz mobilny** — lista wizyt dnia (chronologicznie) zamiast widoku tygodnia.
- **Drawer pełnoekranowy na mobile** — slide-from-bottom, zamykane swipe-down.
- **FAB "Nowa wizyta"** na mobile zamiast button w secondary nav.
- **Customers list mobile** — uproszczona karta (avatar + name + telefon + tap-to-call).
- **Online_pending notifications** — push do PWA (lub przynajmniej widoczne badge w nav).
- **Settings ukryte** na mobile (Aleksandra robi to z desktopu, recepcja nie zmienia ustawień).
- **Communication ukryte** na mobile (admin task).

**Definicja sukcesu:**

- Receptionistka może umówić wizytę w panelu na iPhone w < 60 sekund.
- Kalendarz dnia czytelny bez horizontal scroll na 375px.
- Drawer otwiera się i zamyka jednym gestem, bez frustracji.
- 0 modułów bez mobile fallback.

**Effort:** 3-4 sprinty.

**Dependency:** F2 (dashboard mobilny musi powstać razem z desktopowym).

### Workstream F5 — Visual modernization (post-Faza E)

**Problem:** Po Fazie E panel pixel-perfect klonuje Versum 2014. Wasz landing 2026 wygląda jak inna firma.

**Zakres:**

- **F5.1 — Token system rozbudowa**
  - Obecnie: `--salon-accent`, `--salon-brand`, `--salon-bg`, `--salon-fg`.
  - Dodać: motion (duration-fast/medium/slow, easing-standard), elevation scale (1-5), radius scale, spacing scale (4/8/12/16/24/32/48).
  - Audit: 217 inline `style={{}}` w panelu → mapowanie na tokeny.
- **F5.2 — Lift Versum-color-palette do premium light theme**
  - `#f4fbff` (Versum blue striping w tabelach) → neutralne `#fafafa` lub `#f8f8f8`.
  - `#56aef0` (Versum button-blue) → silver brand color `var(--salon-accent)`.
  - PNG sprite icons → Heroicons (SVG, themable, używane już w landingu).
  - 11px font dla nagłówków tabel → 12px (czytelniejsze) lub konsystentny z systemem.
- **F5.3 — Whitespace + density audit**
  - Versum dense rows (7px padding) → premium dense (10-12px padding).
  - Tabel border-color z `#ddd` → `#e5e7eb` (subtelniej).
  - Section spacing 20px → 24px (8dp grid).
- **F5.4 — Microinteractions**
  - Hover states dla wszystkich row-actionable elements (50ms transition).
  - Press states (scale 0.97) dla buttons.
  - Focus rings unified (już zrobione w drugiej fazie).

**Definicja sukcesu:**

- Aleksandra nadal czuje "to jest Versum, znam to" (zero learning curve dla istniejących userów).
- Nowa receptionistka mówi "ten panel wygląda premium, jak Stripe Dashboard".
- 0 plików importujących Versum sprite PNG.
- Token coverage > 80% dla kolor / spacing / motion.

**Effort:** 4-6 sprintów (najszerszy workstream, najbezpieczniejszy do iteracji).

**Dependency:** brak strict, ale lepiej **po** F1 (mniej stron do modernizacji = szybciej).

## 5. Sekwencjonowanie

Rekomendowana kolejność:

```
Q3 2026  →  F1 (konsolidacja IA)       — fundament dla wszystkiego
Q3 2026  →  F2 (dashboard)              — szybki win dla owner UX
Q3-Q4    →  F3 (rozbicie monolitów)     — równolegle z F1 jako pre-req modernizacji
Q4 2026  →  F4 (mobile mode)             — wymaga F2 dashboard
Q4 2026 →  F5 (visual modernization)    — najlepiej po F1 (mniej do tokenizowania)
```

F1 i F2 mogą startować równolegle — niezależne stratego. F3 najlepiej zaraz po F1. F4 i F5 są długoterminowe, mogą się zazębiać.

## 6. Out of scope

Faza F **nie obejmuje**:

- Backendu (osobny roadmap, koordynacja przy F1.3 communication).
- Mobile native app (React Native / SwiftUI) — out of scope, mobile mode w PWA wystarczy.
- Wielojęzyczności panelu (panel zostaje po polsku — staff i admin to Polacy).
- Zmiany modelu danych (zachowujemy Versum schema, tylko UI evolves).
- Migracji z Bootstrap 5 na inną bibliotekę (Bootstrap wystarcza, nie ruszamy fundamentu).
- Calendar runtime (vendored Versum embed) — out of scope dla tej fazy, traktujemy jako black box.

## 7. Mierzalne efekty końca Fazy F

| Wskaźnik | Wartość docelowa | Pomiar |
|---|---|---|
| Liczba pages w `apps/panel/src/pages` | < 60 (z 130) | `find ... -name "*.tsx" \| wc -l` |
| Liczba pages w `pages/settings` | ≤ 10 (z 36) | jak wyżej |
| Liczba duplikatów snake/kebab | 0 | grep |
| Pliki > 600 linii w pages | 0 | `find + wc -l` |
| Pliki > 800 linii w components | 0 | jak wyżej |
| Czas do "wiem co dziś" po loginie (admin) | ≤ 30s | user test z Aleksandrą |
| Czas do umówienia wizyty (mobile, receptionistka) | ≤ 60s | user test |
| Token coverage w CSS | > 80% | audit script |
| Inline `style={{...}}` w panelu | < 50 (z 217) | grep |
| Receptionistka używa panelu na telefonie | TAK | user observation |

## 8. Decyzje strategiczne wymagające właściciela

Te punkty wymagają decyzji **Aleksandry / Gniewka** przed implementacją odpowiednich workstreamów:

### 8.1 — Telemetria użycia panelu

**Pytanie:** zbieramy metryki które route'y Aleksandra otwiera co tydzień? (Wymagane do F1.3 — decyzja keep/hide/kill gift-cards, loyalty, newsletters etc.)

**Opcje:**

- **A** — wdrożyć lightweight tracking (Plausible / Posthog self-hosted) w panel z prywatnością-first
- **B** — analiza logów Passenger (mniej granularna ale bez tracking infrastruktury)
- **C** — bez telemetrii, decyzje na podstawie założeń (ryzykowne dla F1.3)

**Rekomendacja:** A (1-2 dni setup, długoterminowy benefit).

### 8.2 — Co usuwamy vs co chowamy

**Pytanie:** gift-cards i loyalty (admin features rzadko używane) — kasujemy z kodu czy chowamy za feature flag?

**Rekomendacja:** chowamy za feature flag w F3.3. Kod zostaje dla audytu i awaryjnego włączenia. UI nie pokazuje linka w nav. Decyzja "kasujemy" wymaga 3 miesięcy zero użyć w telemetrii.

### 8.3 — Mobile mode: PWA czy responsive web?

**Pytanie:** czy installable PWA z push notifications dla online_pending, czy zwykły responsive web?

**Rekomendacja:** PWA. Push notifications dla online_pending dają reception istną przewagę (powiadomienie zamiast monitorowania).

### 8.4 — Versum-IA: gdzie świadomie odchodzimy

**Pytanie:** F5.2 lift Versum-color-palette do premium — czy zmiana ma być globalna, czy stopniowa (moduł po module)?

**Rekomendacja:** stopniowa, ale z jedną sesją "moodboard alignment" na początku F5 — zatwierdzamy nową paletę dla całego panelu, potem implementujemy.

### 8.5 — Co z `/extension` (sekcja "dodatki")?

**Pytanie:** sekcja `/extension` istnieje, ale nie jest jasne co tam jest. Czy to pole na przyszłe doczepianie włosów (z roadmapu landingu), czy Versum-legacy?

**Rekomendacja:** wyjaśnić; jeśli to placeholder na hair extensions service — zaplanować dedykowaną stronę zgodnie z `LANDING_DESIGN_DIRECTION.md` §6 (roadmap).

## 9. Powiązane dokumenty

- `docs/MASTER_PLAN_ROUTE_DRIVEN_UI_KIT.md` — poprzedni plan, dla Fazy E
- `docs/VERSUM_CLONE_PROGRESS.md` — co zostało skopiowane z Versum
- `docs/VERSUM_CLONING_STANDARD.md` — standard cloningu (zamknięty po Fazie E)
- `docs/LANDING_DESIGN_DIRECTION.md` — strategiczny kierunek landingu (równoległy)
- `docs/AGENT_EXECUTION_PLAYBOOK.md` — operacyjne
- `docs/AGENT_STATUS.md` — bieżący stan repo
- `Agent.md` (root) / `CLAUDE.md` — instrukcje agentów

## 10. Notatki dla agenta

- **Każdy workstream = osobny PR-bundle**, niezależny scope. Łatwiej rolować jeśli któraś decyzja okaże się błędna.
- **F1.4 (sprzątanie duplikatów route'ów) = pierwszy ruch.** Tani, bezpieczny, podzielony PR na 10 par. Dobry rozgrzewający warm-up dla całej fazy.
- **Telemetria (8.1) musi być wcześnie**, inaczej decyzje "keep/hide/kill" w F1 i F3.3 będą oparte na założeniach.
- **F5 (visual) nie jest pilne**, ale każdy ruch w F1/F2/F3 powinien używać nowych tokenów (gdy są zdefiniowane), żeby nie tworzyć długu w trakcie modernizacji.
- **F4 (mobile) musi być świadomy** — receptionistka jest realnym userem, mimo że pozornie panel = desktop tool. Pominięcie F4 = ślepa plamka.
