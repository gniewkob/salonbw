# F4 — Mobile mode (receptionist-first)

Data utworzenia: 2026-06-03
Status: PLAN — pierwsza sesja realizacji za chwilę
Poprzednia faza: F3 calendar split (ZAKOŃCZONE, calendar.tsx 2365 → 1204)
Kontekst: po loginie `receptionist` ląduje na `/calendar` (postLoginRoute), ale panel jest desktop-only — sidebar 220px+ na sztywno, brak hamburgera, brak bottom sheet, ReceptionView zaprojektowane na 1280px+.

## 1. Cel

Aleksandra (recepcjonistka) ma codziennie używać panelu **z telefonu**: sprawdzić kto przychodzi, oznaczyć obecność, otworzyć kartę klienta z alertami CRM. Obecny panel:

- Sidebar `mainnav` (62px) + `sidenav` (220px) widoczne zawsze → na 375px ekranu zostaje ~90px na content.
- ReceptionView ma tabele z 6 kolumnami → horizontal scroll od 600px w dół.
- AppointmentQuickModal otwiera się jako Bootstrap modal centrowany → niski touch target na mobilkach.
- CalendarHeader filtry + view switcher zajmują 2 linie na desktopie, na 375px scrollują się poziomo.
- FAB jest OK (zaprojektowany jako mobile-first Versum-style).

Cel F4: **dla 375-414px viewport panel musi być użyteczny w tych 4 scenariuszach:**

1. Sprawdzenie listy dzisiejszych wizyt + statusu klienta (alert/no-show)
2. Otwarcie szczegółów wizyty + akcji (potwierdzona/no-show/anulowana)
3. Otwarcie karty klienta z bocznego menu
4. Stworzenie nowej wizyty (FAB)

## 2. Zasady nadrzędne

1. **Receptionist mobile = niezależny renderer.** Nie staramy się "responsiwnie skurczyć" desktopu — to zawsze będzie kompromis. Wykrywamy mobile, ładujemy uproszczony shell + uproszczone widoki.
2. **44pt touch targets** wszędzie (WCAG / Apple HIG).
3. **Bottom sheet > modal** dla wszystkich quick actions.
4. **Hamburger drawer > sidebar** dla nawigacji.
5. **Mobile view dla calendar = LIST**, nie grid. FullCalendar grid na 375px to niepotrzebny szum.
6. **Admin desktop nie zmienia się.** F4 dodaje warstwę mobile, nie rezygnuje z desktopu.
7. **Wszystko buduje na hookach F3.** ReceptionView mobile zużywa identyczne `useCustomerAlerts`, `useReceptionFilters` etc. Tylko warstwa prezentacji jest inna.

## 3. Architektura

### Wykrywanie mobile

Hook `useIsMobile()` — listener na `matchMedia('(max-width: 767px)')`. Zwraca boolean stable across re-renders.

### Mobile shell

Nowy `SalonShellMobile` (~150 linii) zamiast `SalonShell` dla mobile viewport:

- **Topbar:** hamburger + logo + notification icon + user avatar
- **Off-canvas drawer** dla głównej nawigacji (mainnav + sidenav scalone)
- **Bottom safe-area padding** dla iOS notch / home indicator
- **Brak sidebar'a** — content zajmuje 100vw

### Mobile views

| Page | Mobile renderer | Notatka |
|---|---|---|
| `/calendar` | `MobileReceptionListView` | Karty wizyt zamiast tabeli, scrollable |
| `/customers/[id]` | desktop view + responsive tweaks | Drugorzędne |
| Inne | desktop view (skalowane) | Receptionist używa rzadko |

### Bottom sheets

`MobileBottomSheet` component — drawer-from-bottom z handle + backdrop, używa `popover` API jeśli dostępne, fallback do CSS transform.

Używamy w:
- `AppointmentQuickModal` (mobile fallback)
- Filter selector (status/priority na ReceptionView mobile)

## 4. Plan kroków

### Faza F4.1 — Detekcja + Shell (LOW risk, foundational)
**Sesja: ~2h**

- F4.1.1: `useIsMobile()` hook w `apps/panel/src/hooks/useIsMobile.ts`
- F4.1.2: `SalonShellMobile` component — topbar + hamburger + content slot
- F4.1.3: `MobileNavDrawer` — off-canvas drawer z głównymi linkami (calendar/customers/services/settings/communication/statistics)
- F4.1.4: `_app.tsx` — gdy mobile, użyj `SalonShellMobile` zamiast `SalonShell`

Walidacja: na 375px viewport sidebar znika, hamburger otwiera drawer, klik w link nawiguje + zamyka drawer.

### Faza F4.2 — Mobile reception list (HIGH value, główny use case)
**Sesja: ~3h**

- F4.2.1: `MobileReceptionListView` — karty wizyt (czas, klient, usługa, status badge, alert badge)
- F4.2.2: Filter selector jako bottom sheet (status / priority / payment) — używa `useReceptionFilters`
- F4.2.3: Klik na kartę → bottom sheet z akcjami (otwórz szczegóły / potwierdź / no-show / anuluj)
- F4.2.4: `/calendar` na mobile — renderuje `MobileReceptionListView` zamiast `CalendarView` przy `currentView === 'reception'`

Walidacja: na 375px lista dzisiejszych wizyt scrolluje się płynnie, alert badge widoczny, klik otwiera bottom sheet.

### Faza F4.3 — AppointmentDrawer mobile (MED)
**Sesja: ~2h**

- F4.3.1: Drawer renderuje się full-screen na mobile (slide from right) zamiast bocznego panelu
- F4.3.2: Inputs touch-friendly (44px min height, font-size 16px żeby uniknąć iOS auto-zoom)
- F4.3.3: Save/Cancel buttons jako sticky footer

Walidacja: ręczne — edycja wizyty na mobile bez horizontal scroll, klawiatura iOS się nie zoomuje.

### Faza F4.4 — Touch target audit + polish (LOW risk)
**Sesja: ~1h**

- F4.4.1: Audit wszystkich `<button>` w `apps/panel/src/components/salon/` — min 44pt
- F4.4.2: Spacing audit — 8px gap między touch elements
- F4.4.3: `prefers-reduced-motion` respect we wszystkich animacjach drawer/sheet

Walidacja: Lighthouse Accessibility na mobile.

## 5. Co NIE jest częścią F4

- **Pełny mobile experience dla admina** — admin używa desktopu, mobile to nice-to-have.
- **PWA / instalacja na home screen** — odrębna faza F6 jeśli będzie potrzebna.
- **Push notifications** — wymaga backend, odrębne.
- **Offline mode** — nie potrzebne dla salonu w lokalu (zawsze online).
- **Calendar widok grid na mobile** — celowo NIE. Mobile = list view.
- **Customer search na mobile** — w F4 tylko widoczne wpisy `visibleCustomerIds`, full search w osobnej fazie.

## 6. Pitfalls

1. **iOS Safari `100vh` includes URL bar** — zawsze `100dvh` lub explicit calc.
2. **Touch events vs click events** — nie reimplementuj, użyj `onClick` (PointerEvents pod spodem).
3. **`-webkit-tap-highlight-color`** — wyłącz domyślny szary highlight, daj własny pattern feedback.
4. **`prefers-reduced-motion`** — drawer/sheet animacje muszą respektować.
5. **`useIsMobile` hydration mismatch** — SSR nie wie czy mobile. Strategia: initial render = desktop (false), useEffect po mount aktualizuje. Może powodować flicker. Mitigacja: `useLayoutEffect` + skeleton initial render LUB CSS-only mobile shell (preferowane).
6. **Drawer scroll-lock** — `body { overflow: hidden }` gdy drawer otwarty, restore on close.
7. **Bottom sheet keyboard interactions** — Escape zamyka, focus trap obowiązkowy.

## 7. Verification checklist (per krok)

- [ ] `pnpm eslint src --fix` → 0 errors
- [ ] `pnpm tsc --noEmit` → 0 errors
- [ ] `pnpm jest` → wszystkie istniejące testy PASS (49+ calendar tests, post-login routing, etc.)
- [ ] Dev server: viewport 375px (Chrome DevTools mobile) — feature działa
- [ ] Dev server: viewport 1440px (desktop) — nic się nie zepsuło
- [ ] Lighthouse Mobile A11y score ≥ 90 (po F4.4)

## 8. Pierwszy krok do realizacji

**F4.1.1: `useIsMobile()` hook** — ~30 linii, czysty utility, baza dla F4.1.2+. Plus 1 test jednostkowy mockujący `matchMedia`.

Po F4.1.1: F4.1.2 (`SalonShellMobile`) + F4.1.3 (`MobileNavDrawer`) razem (one sesja, jeden commit każdy).

## 9. Po F4

- F5 sprite icons → Heroicons (równolegle bezpieczne)
- F2 dashboard polish (po F4 buduje na mobile detection)
- Infra: warm-up gate refaktor (oddzielny tor)

## 10. Referencje

- Pattern catalog: `docs/UI_PATTERN_CATALOG.md`
- Versum offline dump (referencyjny dla list/sheet patterns)
- React hook patterns: F3 hooki w `apps/panel/src/hooks/calendar/` jako wzorzec
- iOS HIG Touch & Gestures: https://developer.apple.com/design/human-interface-guidelines/inputs/touchscreen-gestures
- Material Design Bottom Sheet: standard reference
