# F3d kroki 9-12 — plan dokończenia CalendarPage hooks extraction

Data utworzenia: 2026-06-03
Status: PLAN — do realizacji w osobnej sesji
Poprzedni dokument: `docs/FAZA_F_F3D_CALENDAR_HOOKS_PLAN.md` (ogólny plan F3d)
Realizacja F3d 1-8: zakończona deploy'em `bc3d89f4c` (2026-06-03)
Plik docelowy: `apps/panel/src/pages/calendar.tsx` (po F3d 1-8: **1559 linii**, 9 useState / 9 useEffect / 8 useMemo / 5 useRef)

## 1. Stan zastany — co zostało w CalendarPage

| Co | Liczba | Lokalizacja w calendar.tsx |
|---|---|---|
| `useRef` | 5 | linie 120-126 (isMountedRef, visibleCustomerIdsRef, handledDeepLinkAppointmentIdRef, customerAlertCacheRef, pendingCustomerAlertFetchesRef) |
| `useState` | 9 | customerAlertSeverityById (127); deepLinkError (140); customerAlertStatsError + customerAlertStatsRetryToken (141-144); receptionActionsOnAlertsCount + persisted{OnAlerts,Total}Count (145-150); drawer + quickModal (180-194) |
| `useEffect` | 9 | telemetry config, ticker, accounting resets, alerts batch, deep link, etc. |
| `useMemo` | 8 | appointmentsById, receptionAppointments, employeeAppointments, clientAppointments (×3), receptionDailySummary, visibleCustomerIds |

**Grupy do ekstrakcji:**

| Grupa | Hooki | Risk |
|---|---|---|
| J — Actions accounting | 3× useState + 2× useEffect (reset + persisted fetch) | MED |
| D — Deep link resolver | 1× useState + 1× useRef + 1× useEffect (resolve + open drawer) | MED |
| K — Drawer + quickModal | 2× useState + handlery (open/close/save) + integracja z useCalendarMutations | MED |
| I — Customer alerts | 3× useState + 3× useRef + 2-3× useEffect (visibility batch + retry + error) | **HIGH** |

Razem ~400 linii state + side-effects do wyekstrahowania. Po F3d 9-12 oczekiwany rozmiar CalendarPage: **~600-700 linii** (~17-19% oryginału).

## 2. Lekcje z F3d 1-8 — zastosować

Wzorce sprawdzone na 8 commitach do produkcji:

1. **Destructure z rename** — zachowuje istniejące nazwy w JSX, zero-diff w 1000+ liniach renderu:
   ```ts
   const { loading: cancellationRequestsLoading, ... } = useCancellationRequests(...);
   ```
2. **Pomijaj setters, których page nie używa** — `setEmployeeMode`/`setClientMode` w F3d 3 były tylko dla URL sync, page ich nie wywołuje → poza destructure.
3. **Cross-hook coordination przez callback prop** — `onAfterCancel: () => void refetch()` w F3d 8 zamiast importowania `useCalendar` do `useCancellationRequests`.
4. **Framework hook (`useReceptionFetch`) nie pasuje gdy data jest mutowalna** — F3d 8 (cancellation removes items on success) używa plain useState+useEffect.
5. **Lint --fix po każdym usunięciu kodu** — prettier często wymaga drobnych poprawek formatowania na duże delete'y.
6. **Czyść dead imports natychmiast po commit** — F3d 5/7/8 wymagały usunięcia typów/normalize funkcji z importów (powtarzający się pattern).
7. **Hook order matters — useRouter w hooku + useRouter w page** — działa ale każde wywołanie subskrybuje router context. Dla deep link resolver (F3d 10) trzymaj page jako source of router.
8. **typeof guard dla refs `next/dynamic`** — pamiętaj o lekcji `dynamic-lazy-ref-guard` (memory). Jeśli wprowadzasz nowe `dynamic()`, guard już na starcie.
9. **Verification per krok:** `pnpm eslint --fix && pnpm tsc --noEmit && pnpm jest calendarPage calendarEventClick calendarMap receptionUtils receptionTelemetry` = 49 testów PASS minimum.
10. **Push deploy serial queue jest OK** — 3-4 push'e pod rząd MyDevil obsłuży serialnie; nie używaj `gh workflow run` dispatch (memory `no-double-deploy-dispatch`).

## 3. Krok F3d 9 — `useActionsAccounting`

**Risk:** MED. Cross-domain — liczy akcje z wielu źródeł (follow-up POSTy, persistedActionsTotalCount z `/reception/operational-summary`).

**Stan do przeniesienia:**

```ts
const [receptionActionsOnAlertsCount, setReceptionActionsOnAlertsCount] = useState(0);
const [persistedActionsOnAlertsCount, setPersistedActionsOnAlertsCount] = useState<number | null>(null);
const [persistedActionsTotalCount, setPersistedActionsTotalCount] = useState<number | null>(null);

useEffect(() => {
    setReceptionActionsOnAlertsCount(0);
}, [currentDate, currentView, selectedEmployeeIds]);

useEffect(() => {
    if (currentView !== 'reception') {
        setPersistedActionsOnAlertsCount(null);
        setPersistedActionsTotalCount(null);
        return;
    }
    // ... fetch /reception/operational-summary?date=...
}, [apiFetch, currentDate, currentView]);
```

**Use cases:**
- `setReceptionActionsOnAlertsCount` jest wywoływany przez `trackReceptionAction` po każdej follow-up akcji (zwiększa licznik o 1)
- `persisted*` to baseline z backendu — łączy się z runtime counter dla aktualnej liczby

**Sygnatura hooka:**

```ts
export function useActionsAccounting(params: {
    enabled: boolean;            // currentView === 'reception'
    currentDate: Date;
    selectedEmployeeIds: number[]; // do reset triggera
    apiFetch: ApiFetchFn;
}): {
    runtimeOnAlertsCount: number;     // receptionActionsOnAlertsCount
    persistedOnAlertsCount: number | null;
    persistedTotalCount: number | null;
    incrementRuntime: () => void;     // increment by 1 (callable from telemetry)
};
```

**Pitfall:** funkcja `trackReceptionAction` jest globalna (telemetry), nie wywoła `incrementRuntime`. Trzeba albo przeprojektować integrację (page robi to ręcznie), albo passować callback do `configureReceptionTelemetryTransport`. Prosto: pozostaw `incrementRuntime` w API hooka i wywołuj z page tam gdzie `trackReceptionAction` był wywoływany.

**Walidacja:** liczniki w `receptionDailySummary` muszą mieć identyczne wartości jak przed; testy `calendarPage.test.tsx` snapshot logiki summary.

## 4. Krok F3d 10 — `useDeepLinkResolver`

**Risk:** LOW-MED. Resolvuje `?appointmentId=N` z URL, fetchuje appointment, otwiera drawer.

**Stan do przeniesienia:**

```ts
const handledDeepLinkAppointmentIdRef = useRef<number | null>(null);
const [deepLinkError, setDeepLinkError] = useState<string | null>(null);

useEffect(() => {
    const appointmentIdParam = Array.isArray(router.query.appointmentId)
        ? router.query.appointmentId[0]
        : router.query.appointmentId;
    // ... resolve + fetch + setDrawer({ open: true, mode: 'edit', appointment })
}, [router.query.appointmentId, appointmentsById, apiFetch]);
```

**Kluczowe coupling:** hook otwiera drawer (`setDrawer`). To znaczy F3d 10 i F3d 11 (drawer) są **powiązane**.

**Decyzja architektoniczna:** zrób F3d 11 PIERWSZY (drawer hook), potem F3d 10 (deep link). Wtedy deep link resolver przyjmuje `openDrawerForEdit(appointment)` callback z `useAppointmentDrawer`.

**Zmiana kolejności w roadmapie:** F3d 10 staje się F3d 11 (po drawer'ze).

**Sygnatura:**

```ts
export function useDeepLinkResolver(params: {
    appointmentsById: Map<number, Appointment>;
    apiFetch: ApiFetchFn;
    routerQuery: ParsedUrlQuery;
    onResolved: (appointment: Appointment) => void; // calls drawer.openForEdit
}): {
    error: string | null;   // deepLinkError
    dismissError: () => void;
};
```

**Pitfall:** `handledDeepLinkAppointmentIdRef` (ref) zapamiętuje że obsłużono dany id — żeby nie odtwarzać drawer'a po `router.replace`. To **musi** zostać w hooku (lifecycle = lifecycle hooka).

**Walidacja:** ręczny test — wejście na `/calendar?appointmentId=123` musi otworzyć drawer w trybie edit dla tego appointmentu.

## 5. Krok F3d 11 — `useAppointmentDrawer`

**Risk:** MED. Najwięcej UI-orchestracji. Drawer otwiera/zamyka/save/delete + quickModal.

**Stan do przeniesienia:**

```ts
const [drawer, setDrawer] = useState<DrawerState>({ open: false, mode: 'create', appointment: null });
const [quickModal, setQuickModal] = useState<{...}>(null);
// + 5-10 handlerów: openForCreate, openForEdit, close, save, delete, reschedule (uses useCalendarMutations.rescheduleAppointment)
```

**Sygnatura:**

```ts
export interface AppointmentDrawerHook {
    drawer: DrawerState;
    quickModal: ...;
    openForCreate: (slot: { startTime: Date; endTime: Date; employeeId?: number; serviceId?: number; clientId?: number; clientName?: string }) => void;
    openForEdit: (appointment: Appointment) => void;
    close: () => void;
    openQuickModal: (...) => void;
    closeQuickModal: () => void;
}

export function useAppointmentDrawer(params: {
    rescheduleAppointment: ReturnType<typeof useCalendarMutations>['rescheduleAppointment'];
    onAfterSave?: () => void; // page passes void refetch()
}): AppointmentDrawerHook;
```

**Pitfalls:**
- Drawer ma **9 sub-handlerów** w obecnym kodzie (search `setDrawer({` i `setQuickModal({` w calendar.tsx). Ekstraktuj każdy jako method na hook return. Nie inlinuj wszystkiego — page powinna wywoływać `drawer.openForEdit(appointment)` zamiast `setDrawer({...})`.
- Drawer save → reschedule → refetch. Coupling z useCalendarMutations + useCalendar. Rozwiązanie: hook przyjmuje `rescheduleAppointment` i `onAfterSave`, page wstrzykuje oba.
- Mode `'create'` vs `'edit'` zostaje w `DrawerState` — to OK, hook tylko enkapsuluje setters.

**Walidacja:**
- Klik na pusty slot kalendarza → drawer open w trybie 'create' z prefilled slot data.
- Klik na appointment → drawer open w trybie 'edit'.
- Zapisz zmiany → drawer close + refetch.
- Drag-and-drop appointment → reschedule + refetch.

## 6. Krok F3d 12 — `useCustomerAlerts` (HIGH risk, 4 sub-kroki)

**Risk:** **HIGH.** Najwięcej refów, cache, retry token, batch-by-visibility, race conditions.

**Stan do przeniesienia (linie ~127-150 + 5 useEffects + 3 useRef):**

```ts
const customerAlertCacheRef = useRef<Record<number, AlertSeverity | null>>({});
const pendingCustomerAlertFetchesRef = useRef<Set<number>>(new Set());
const visibleCustomerIdsRef = useRef<number[]>([]);

const [customerAlertSeverityById, setCustomerAlertSeverityById] = useState<ReceptionAlertSeverityByCustomerId>({});
const [customerAlertStatsError, setCustomerAlertStatsError] = useState(false);
const [customerAlertStatsRetryToken, setCustomerAlertStatsRetryToken] = useState(0);

// + visibleCustomerIds useMemo
// + 2-3 useEffect (visibility tracking + batch fetch + retry)
```

### Sub-kroki

#### F3d 12a — Wyciągnij cache + pending fetches refs do hooka
- Hook szkielet z 3× useRef + 1× useState (severityById)
- API: `getSeverityFor(customerId)`, `markPending(id)`, `markResolved(id)`, `setSeverity(id, severity)`
- Walidacja: cache pre-warm + retrieval działają jak przed; brak fetch logic jeszcze

#### F3d 12b — Wyciągnij batch fetch logic
- Dodaj useEffect który czyta `visibleCustomerIds` (passed in), filtruje przeciw cache+pending, batchuje fetch
- Walidacja: scrolling przez reception list nadal triggeruje fetch dla nowych customer ids; duplikaty nie są fetched

#### F3d 12c — Integracja z visibility
- Hook przyjmuje `visibleCustomerIds: number[]` (z page useMemo)
- Page przekazuje tą listę
- Walidacja: zmiana widoku z reception na day powinna nie triggerować fetchów (visibleCustomerIds = [])

#### F3d 12d — Error + retry handling
- Dodaj `setStatsError(true/false)` po fetch failure
- Expose `refresh()` callback (retryToken++)
- Walidacja: po backend down + recovery, klik "Retry" musi re-fetchować

**Sygnatura końcowa:**

```ts
export interface CustomerAlertsHook {
    severityById: ReceptionAlertSeverityByCustomerId;  // pełna mapa dla rendering
    statsError: boolean;
    retry: () => void;
}

export function useCustomerAlerts(params: {
    enabled: boolean;                    // currentView === 'reception'
    visibleCustomerIds: number[];        // batch trigger
    apiFetch: ApiFetchFn;
}): CustomerAlertsHook;
```

**Pitfalls:**
1. **`customerAlertCacheRef` mutacja po unmount** — jeśli useEffect cleanup nie czyści `pendingCustomerAlertFetchesRef`, ref state przeżyje unmount (testy w StrictMode złapią to).
2. **Race condition: visible IDs zmieniają się szybko** — debouncing lub `cancelled` flag obowiązkowo.
3. **State `severityById` vs cache ref** — które jest sourcem? Cache jest source-of-truth (perf), state jest snapshot dla render. Hook synchronizuje przez setSeverity.
4. **`hasCustomerAlert` (receptionUtils)** używa severity map jako parametr — nie zmieniaj jego sygnatury, hook po prostu zwraca pełną mapę.

**Walidacja per sub-krok:**
- 12a: testy `calendarPage` nadal PASS, severity map ma identyczne wartości po mount
- 12b: dev tools network panel → nie więcej duplicate requests
- 12c: zmiana widoku reception → day → reception nie triggeruje refetchu już znanych ID
- 12d: simulate backend error → error indicator + retry button działa

## 7. Kolejność realizacji (zmieniona względem F3D_CALENDAR_HOOKS_PLAN.md)

Stara kolejność: 9 → 10 → 11 → 12
**Nowa kolejność (po wykryciu coupling deep-link ↔ drawer):**

| Sesja | Krok | Estymacja |
|---|---|---|
| Sesja A | F3d 9 (accounting) | ~45 min |
| Sesja A | F3d 11 (drawer) | ~1.5h |
| Sesja A | F3d 10 (deep link) — wymaga drawer hooka | ~45 min |
| Sesja A | doc commit + bilans | ~10 min |
| **Sesja B (osobna)** | F3d 12a-d (customer alerts) | ~3-4h |

**Sesja A wykonalna w jednym podejściu**, jeśli ma czas (~3-4h). Sesja B koniecznie osobno — customer alerts mają cache state że trudniej zdebugować w pośpiechu.

## 8. Verification checklist (per krok, ten sam co w F3d 1-8)

- [ ] `pnpm eslint src/hooks/calendar/<new>.ts src/pages/calendar.tsx --fix` → 0 errors
- [ ] `pnpm tsc --noEmit` → 0 errors
- [ ] `pnpm jest calendarPage calendarEventClick calendarMap receptionUtils receptionTelemetry --silent` → **49 testów PASS**
- [ ] Czyste dead imports w `calendar.tsx` (powtarzający się gotcha z F3d 5-8)
- [ ] Commit + push (push-triggered deploy)
- [ ] Watcher na deploy + curl health check `panel.salon-bw.pl/` + `/calendar`
- [ ] **(F3d 11 only)** ręczny smoke test drawer w dev mode: open create/edit/close
- [ ] **(F3d 10 only)** smoke test deep link: `/calendar?appointmentId=N` otwiera drawer
- [ ] **(F3d 12 only)** smoke test alerts: scroll reception list, sprawdź network panel

## 9. Rollback strategy

Identyczna jak w F3d 1-8: każdy krok = 1 commit. `git revert <sha>` cofa tylko ten krok. **Nie używaj `gh workflow run`** (memory `no-double-deploy-dispatch`) — push samego revertu wystarczy do redeployu.

Jeśli F3d 12 sub-krok wyrządzi szkody na produkcji: revert + pauza 5 minut + nowy plan. **Customer alerts mają największy blast radius bo widoczne dla recepcji w real-time.**

## 10. Po F3d 12 — co dalej

Po dokończeniu F3d 9-12, `CalendarPage` zostanie tylko z:
- Orkiestracja (calls hooks, passes data do `<CalendarView>`, `<ReceptionView>` etc.)
- 8 `useMemo` views (czyste pochodne — niskie ryzyko, niska wartość ekstrakcji)
- JSX render (~1000 linii — większość, którą trudno wyciąć bez tworzenia presenter components)

**Opcja F3d 13** (memo views) — niska wartość. Sugeruję NIE robić bez konkretnej potrzeby. `useMemo` z 1-2 zależnościami nie zyskuje na ekstrakcji.

**Następne fazy (poza F3d):**
- F4 — Mobile mode (receptionist) — wymaga F3d done, bo używa stable hook API
- F5 sprite icons → Heroicons — niezależne od F3d
- F2 dashboard polish — niezależne

## 11. Referencje

- Plik główny: `apps/panel/src/pages/calendar.tsx` (head: `e823d2742`)
- Hooki F3d 1-8: `apps/panel/src/hooks/calendar/` (9 plików)
- Plan ogólny F3d: `docs/FAZA_F_F3D_CALENDAR_HOOKS_PLAN.md`
- Faza F roadmapa: `docs/FAZA_F_PANEL_MODERNIZATION.md`
- Memory: `dynamic-lazy-ref-guard`, `no-double-deploy-dispatch`, `gh-run-watch-exit-code-lies`
