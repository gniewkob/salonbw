# F3d — CalendarPage custom hooks extraction plan

Data utworzenia: 2026-06-03
Status: PLAN — do realizacji w osobnej sesji
Poprzednia faza: F3a-c (`6912ab124`) — pure types/utils extracted
Plik docelowy: `apps/panel/src/pages/calendar.tsx` (obecnie 1851 linii)
Cel: zredukować `CalendarPage` z ~1750 linii do ~400 linii orkiestracji, hookami przejmując state + fetch + side-effects.

## 1. Mapa hooków (stan po F3a-c)

`CalendarPage` zawiera **65 hooków**:

| Typ | Liczba |
|---|---|
| `useRef` | 5 |
| `useState` | 37 |
| `useMemo` | 8 |
| `useEffect` | 15 |

Grupowane po domenie odpowiedzialności:

| Grupa | Hooki | Risk | Linie (przybliżenie) |
|---|---|---|---|
| A — Calendar view state | 7× useState (currentDate, currentView, employeeMode, clientMode, employeeArchiveMode, selectedEmployeeIds, queryStateReady) + 1× useEffect (URL ↔ state sync) | LOW | ~80 |
| B — Reception filters | 4× useState (statusFilter, paymentFilter, alertFilter, priorityFilter) | LOW | ~20 |
| C — Now-tick ticker | 1× useState (`receptionNowTick`) + 1× useEffect (setInterval 60s) | LOW | ~15 |
| D — Deep link guard | 1× useState (deepLinkError) + 1× useRef (handledDeepLinkAppointmentIdRef) + 1× useEffect (deep link resolve) | LOW | ~40 |
| E — Reception insights | 5× useState (loading/error/summary/byAction/byDay) + 1× useEffect (fetch) | MED | ~80 |
| F — Reception follow-up candidates | 3× useState (loading/error/candidates) + 1× useState (actionStateByKey) + 1× useEffect (fetch) + handler (capture action) | MED | ~120 |
| G — Follow-up audit | 3× useState (loading/error/summary) + 1× useEffect (fetch) | MED | ~70 |
| H — Cancellation requests | 3× useState (loading/error/list) + actionStateById + 1× useEffect (fetch) + handlers (approve/deny) | MED | ~110 |
| I — Customer alerts batch | 1× useState (severityById) + 2× useState (statsError, retryToken) + 2× useRef (cache, pendingFetches) + 1× useRef (visibleIds) + 2-3× useEffect (visibility-driven batch fetch) | **HIGH** | ~180 |
| J — Actions accounting | 3× useState (receptionActionsOnAlerts, persistedActionsOnAlerts, persistedActionsTotal) + 2× useEffect (reset on view change, persisted load) | MED | ~70 |
| K — Drawer + quickModal | 2× useState (drawer, quickModal) + handlers (open/close/save) | MED | ~150 |
| L — Mount tracking | 1× useRef (isMountedRef) + 1× useEffect (set false on unmount) | LOW | ~10 |
| M — Memoized views | 8× useMemo (appointmentsById, receptionAppointments, employeeAppointments, clientAppointments, clientFutureAppointments, clientArchivedAppointments, receptionDailySummary, visibleCustomerIds) | LOW (czyste pochodne) | ~250 |

Razem ~1200 linii state + side-effects (reszta to JSX render).

## 2. Założenia bezpieczeństwa (READ FIRST)

**Te zasady są krytyczne — nie można ich obejść.**

1. **Każda grupa = osobny commit + deploy.** Nigdy nie łącz dwóch grup w jeden commit. Jeśli kalendarz przestanie działać w sesji, łatwiej cofnąć jeden commit niż rozplątać 5 zmieszanych refaktoryzacji.
2. **Testy `calendarPage.test.tsx` + `calendarMap.test.ts` + `receptionUtils.test.ts` muszą zielenić po KAŻDYM kroku.** Te 49 testów to siatka bezpieczeństwa wprowadzona w F3a-c.
3. **Zachowaj sygnatury propsów do `ReceptionView` / `ReceptionInsightsPanel` / `ReceptionFollowUpPanel` / `ReceptionFollowUpAuditPanel`.** Te komponenty nie zmieniają się — tylko źródło state.
4. **`isMountedRef` zostaje w hookach.** Każdy fetch hook musi mieć własny cancellation flag (już istnieje wzorzec `let cancelled = false; return () => { cancelled = true }`).
5. **Nie zmieniaj kolejności useEffect.** React kolejność deklaracji = kolejność wywołań. Jeśli przeniesiesz `useEffect A` przed `useEffect B`, może zmienić się timing renderów. Hooki zachowują wewnętrzny porządek; widoczna zmiana ma być tylko w call order na poziomie `CalendarPage`.
6. **`apiFetch` z `useAuth()` przekazujemy do hooków jako parametr.** Każdy hook fetch dostanie `apiFetch` w `params` zamiast wywoływać `useAuth()` wewnątrz (zapobiega podwójnemu subscribe + ułatwia testy mockując).
7. **Domyślnie wszystkie wartości mogą być undefined w fazie ładowania.** Stan startowy musi być identyczny po refaktorze (np. `null` vs `[]` vs `0`).

## 3. Kolejność wdrożenia (od najmniejszego ryzyka)

### Krok 1 — `useReceptionNowTick` (Grupa C)
**Risk:** LOW. Pure side-effect, brak interakcji z innymi hookami.

```ts
// apps/panel/src/hooks/calendar/useReceptionNowTick.ts
export function useReceptionNowTick(active: boolean): number {
    const [tick, setTick] = useState(() => Date.now());
    useEffect(() => {
        if (!active) return;
        const id = window.setInterval(() => setTick(Date.now()), 60_000);
        return () => window.clearInterval(id);
    }, [active]);
    return tick;
}
```

Użycie: `const receptionNowTick = useReceptionNowTick(currentView === 'reception');`

**Walidacja:** `pnpm test calendarPage` + ręczna inspekcja w devtools że re-render dzieje się co 60s gdy `currentView === 'reception'`.

### Krok 2 — `useReceptionFilters` (Grupa B)
**Risk:** LOW. Czysty UI state bez side-effects.

```ts
// apps/panel/src/hooks/calendar/useReceptionFilters.ts
export interface ReceptionFiltersState {
    statusFilter: string;
    paymentFilter: string;
    alertFilter: boolean;
    priorityFilter: boolean;
}
export interface ReceptionFiltersActions {
    setStatusFilter: (v: string) => void;
    setPaymentFilter: (v: string) => void;
    setAlertFilter: (v: boolean) => void;
    setPriorityFilter: (v: boolean) => void;
    resetAll: () => void;
}
export function useReceptionFilters(): ReceptionFiltersState & ReceptionFiltersActions { ... }
```

**Walidacja:** Filter toggle musi nadal zmieniać widoczne wiersze w `ReceptionView`. `pnpm test calendarPage`.

### Krok 3 — `useCalendarUrlSync` (Grupa A)
**Risk:** LOW-MED. URL ↔ state ↔ defaults — łatwo o regression na initial mount.

Zwraca state + setters + queryStateReady. **Kluczowe:** zachować dokładnie tę samą logikę `deriveCalendarQueryState`.

```ts
// apps/panel/src/hooks/calendar/useCalendarUrlSync.ts
export interface CalendarViewMode {
    currentDate: Date;
    currentView: CalendarViewType;
    employeeMode: boolean;
    clientMode: boolean;
    employeeArchiveMode: boolean;
    selectedEmployeeIds: number[];
    queryStateReady: boolean;
}
```

**Walidacja:**
- Wejście na `/calendar?view=week&date=2026-05-01&employeeIds=1,2` musi ustawić identyczny stan początkowy.
- Zmiana widoku musi zaktualizować URL (router.replace).
- Test: `pnpm test calendarPage` + ręczny test 4 wariantów URL.

### Krok 4 — Wspólny `useReceptionFetch` helper (PRE-WORK dla 5-8)
**Risk:** LOW (sam helper) — ALE krok 5-8 polegają na nim.

Generyczny hook redukujący duplikację we wszystkich fetch flows:

```ts
// apps/panel/src/hooks/calendar/useReceptionFetch.ts
interface UseReceptionFetchParams<T> {
    enabled: boolean;
    url: string | null;
    apiFetch: ApiFetchFunction;
    normalize: (raw: unknown) => T;
    initialData: T;
    resetData: T;  // when disabled
}
interface UseReceptionFetchResult<T> {
    loading: boolean;
    error: boolean;
    data: T;
    refresh: () => void;  // bumps retry token internally
}
```

**Walidacja:** Brak — używany w 5-8.

### Krok 5 — `useReceptionInsights` (Grupa E)
**Risk:** MED. Pierwszy prawdziwy fetch hook.

Wkład: `apiFetch`, `currentDate`, `currentView`, retry token.
Output: `{ loading, error, summary, byAction, byDay }`.

**Walidacja:**
- Wchodząc na `view=reception` musi wystartować fetch.
- Wychodząc — wartości muszą wrócić do default.
- Network mock: `pnpm test` + bookmark test scenariusza w MSW jeśli istnieje.

### Krok 6 — `useReceptionFollowUp` (Grupa F)
**Risk:** MED. Dodatkowo musi obsłużyć `actionStateByKey` + `onCaptureFollowUpAction` handler.

Output: `{ loading, error, candidates, actionStateByKey, captureAction }`.

**Walidacja:** Klik na "kontaktowano" musi nadal zmienić badge.

### Krok 7 — `useFollowUpAudit` (Grupa G)
**Risk:** MED. Najprostszy z 3 fetch hooków (read-only audit).

Output: `{ loading, error, summary }`.

### Krok 8 — `useCancellationRequests` (Grupa H)
**Risk:** MED. Fetch + 2 mutacje (approve/deny) ze stanem `actionStateById`.

Output: `{ loading, error, requests, actionStateById, approve, deny }`.

### Krok 9 — `useActionsAccounting` (Grupa J)
**Risk:** MED. Cross-domain: zlicza akcje z follow-up i cancellation hooks. Możliwe że trzeba zostawić to w `CalendarPage` jako lokalne useState dopóki nie wprowadzimy event-busa.

**Decyzja w sesji:** czy ekstrahować, czy zostawić w page.

### Krok 10 — `useDeepLinkResolver` (Grupa D)
**Risk:** LOW-MED. Konsumuje `router.query.appointmentId`, otwiera drawer, czyści URL.

### Krok 11 — `useAppointmentDrawer` (Grupa K)
**Risk:** MED. Najbardziej UI-orchestracja — open/close/save/delete drawer + quickModal.
Może zawierać callbacki mutacji `useCalendarMutations`.

### Krok 12 — `useCustomerAlerts` (Grupa I) — **OSTATNI Z PREMEDYTACJĄ**
**Risk:** HIGH. Najwięcej refów, cache między fetch, batch-by-visibility, retry token, error states.

Plan podziału na sub-kroki:
1. **12a** — Wyciągnięcie cache + pending fetches do hooków jako Map struktury.
2. **12b** — Wyciągnięcie batch fetch logic.
3. **12c** — Integracja z visibility (visibleCustomerIds → trigger batch).
4. **12d** — Error/retry handling.

Każdy sub-krok = osobny commit + tests + deploy.

### Krok 13 — Memoized views (Grupa M)
**Risk:** LOW (są to czyste pochodne) ale zostawiamy do końca, żeby zmniejszyć powierzchnię diff w pośrednich krokach.

Możliwe wyciągnięcie do `useMemo` wewnątrz custom hooka `useAppointmentLanes` lub po prostu zostawienie w `CalendarPage` (czyste pochodne nie wymagają hookification).

**Decyzja w sesji:** wartość ekstrakcji vs. ryzyko vs. zysk czytelności.

## 4. Konwencje techniczne

- Lokalizacja: `apps/panel/src/hooks/calendar/use*.ts` (nowy katalog).
- Każdy hook eksportowany jako named export.
- Typy state/actions deklarowane jako `interface` w tym samym pliku, eksportowane.
- Zero zależności krzyżowych między hookami w Kroku 1-3 (najmniej ryzyka).
- `useReceptionFetch` to jedyny "framework" hook — reszta to thin wrappers.
- Każdy hook **musi** mieć test jednostkowy w `apps/panel/src/__tests__/hooks/calendar/`. Nawet 1-2 podstawowe scenariusze — chronią przed regression w trakcie kolejnych kroków.

## 5. Pitfalls do uniknięcia (znane antywzorce)

1. **Nie wywołuj `useAuth()` wewnątrz fetch hooków.** Przekaż `apiFetch` parametrem. (Inaczej każdy hook subskrybuje na nowo AuthContext → re-render storm.)
2. **Nie używaj `useEffect` z pustą tablicą do "didMount"** — to jest deprecated wzorzec; React StrictMode wywoła go dwa razy. Jeśli potrzebujesz mount-only logic, użyj `isMountedRef` + checki.
3. **Nie wprowadzaj `useReducer`** dla tego refaktoru. Już 65 hooków = nadmierna abstrakcja; jeśli przepiszesz cluster na reducer, narobisz drugi level zmiany. Zostań przy `useState` per pole.
4. **Nie ekstrahuj `useMemo` zbyt agresywnie.** Pochodne z 1-2 zależnościami trzymaj w page. `useMemo` ma narzut — to nie zawsze wygrana.
5. **`isMountedRef` ma sens TYLKO** dla async po unmount. Większość hooków nie potrzebuje go bo `let cancelled = false` w useEffect cleanup wystarczy.
6. **Customer alerts (grupa I) ma race condition risk.** Refy `pendingCustomerAlertFetchesRef` + `customerAlertCacheRef` muszą żyć w hooku z tym samym lifecycle co `useEffect`. Nie używaj `useState` z Map — Map mutowane przez ref będzie szybsze i nie wymusza re-renderu.
7. **Pre-commit lint check musi przejść.** ESLint `react-hooks/exhaustive-deps` złapie 90% błędów. Nie wyciszaj go żeby pojechać szybciej.

## 6. Verification strategy per krok

Każdy commit musi pasować TEN sam checklist:

- [ ] `pnpm eslint src --fix` → 0 errors
- [ ] `pnpm tsc --noEmit` → 0 errors
- [ ] `pnpm test calendarPage calendarEventClick calendarMap receptionUtils receptionTelemetry --silent` → 49 testów PASS
- [ ] `pnpm dev` w lokalnym panelu — otworzyć `/calendar`, zmienić widok, kliknąć appointment, otworzyć drawer, zapisać zmianę (każda zmiana state używanego przez przeniesiony hook musi działać tak jak przed refaktorem)
- [ ] Bezpośrednio na produkcji po deployu — `https://panel.salon-bw.pl/calendar` musi się załadować, kalendarz renderować, klikalność appointmentów działać

## 7. Estymacja sesji

- **Sesja minimalna (Kroki 1-3):** ~2h, daje ~115 linii out, buduje ufność w pattern.
- **Sesja pełna (Kroki 1-11):** ~6-8h, daje ~700 linii out. Pomija Krok 12 (customer alerts).
- **Krok 12 (customer alerts):** osobna sesja z dedicated planem na 4 sub-kroki — ~3-4h.
- **Krok 13 (memo views):** 30 min, jeśli decyzja "tak". Inaczej zostawiamy.

## 8. Rollback strategy

Jeżeli refaktor sprawi że produkcja przestanie działać:

1. `git revert <commit-sha>` na ostatnim refaktor commicie.
2. `git push origin master` — push-triggered deploy odbuduje stary stan.
3. **NIE** odpalaj `gh workflow run` ręcznie — pamiętaj o [[no-double-deploy-dispatch]].
4. Każdy commit = mały blast radius (1 grupa hooków), więc revert nie cofa innych zmian.

## 9. Po co to robimy

Krótko: ułatwić utrzymanie, otworzyć drogę do F4 mobile mode.

**Konkretne korzyści:**

- Custom hooki testowalne w izolacji (Jest mock + `renderHook`).
- `CalendarPage` przestaje być monolitem 1851 linii — staje się 400-liniowym agregatorem.
- F4 (mobile receptionist) wymaga uproszczenia: tylko `useReceptionFilters` + `useReceptionInsights` + `useReceptionFollowUp` — bez wszystkiego naraz.
- Bus factor: jeden bug w drawer logic nie wymusza czytania 1800 linii kontekstu.

## 10. Referencje

- F3a-c commit: `6912ab124` (extract types + utils)
- Plik: `apps/panel/src/pages/calendar.tsx`
- Testy bezpieczeństwa: `apps/panel/src/__tests__/calendar*.test.ts*`
- Memory: [[no-double-deploy-dispatch]] dla deploy strategy
- Faza F roadmapa: `docs/FAZA_F_PANEL_MODERNIZATION.md`
