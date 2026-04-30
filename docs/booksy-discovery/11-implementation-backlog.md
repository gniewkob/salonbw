# 11 — Implementation Backlog

## Epic 1 — Panel shell unification

| ID | Epic | Task | Description | Files likely affected | Backend needed | Priority | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E1-01 | Panel shell | Layout audit | Zidentyfikować wyjątki poza `SalonShell` | `apps/panel/src/pages/*`, `components/salon/*` | No | P0 | Lista wyjątków + plan usunięcia |
| E1-02 | Panel shell | Target `PanelShell` contract | Zamrozić API shella i page header | `components/salon/SalonShell.tsx` | No | P0 | Wszystkie nowe moduły używają jednego kontraktu |
| E1-03 | Panel shell | Calendar route under shell | Podpiąć `calendar-next` pod shell | `pages/calendar-next.tsx` (new), calendar components | No | P0 | `/calendar-next` renderuje shell + content |
| E1-04 | Panel shell | Remove layout exceptions | Ujednolicić toolbar/header/container | calendar/customers/sales pages | No | P1 | Spójny spacing i states |

## Epic 2 — Native calendar replacement

| ID | Epic | Task | Description | Files likely affected | Backend needed | Priority | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E2-01 | Native calendar | Create `/calendar-next` | Nowy route obok legacy | `apps/panel/src/pages/calendar-next.tsx` | No | P0 | Route dostępny tylko dla staff |
| E2-02 | Native calendar | Reuse/refactor `CalendarView` | Uporządkować FC config pod Booksy-like | `components/calendar/CalendarView.tsx` | No | P0 | Day/week + multi employee |
| E2-03 | Native calendar | Connect calendar API | Podłączyć `/calendar/events` i time blocks | `hooks/useCalendar.ts` | Yes | P0 | Dane ładują się dla zakresu i filtrów |
| E2-04 | Native calendar | Employee filters | Filtrowanie single/multi | calendar sidebar/filter components | No | P0 | Filtr zmienia event set bez reload |
| E2-05 | Native calendar | Appointment drawer | Create/edit modal/drawer | new `components/calendar/AppointmentDrawer.tsx` | Yes | P0 | Slot click otwiera create flow |
| E2-06 | Native calendar | DnD + resize | Re-schedule i resize z walidacją | calendar view + mutations | Yes | P0 | Konflikt blokuje zapis bez `force` |
| E2-07 | Native calendar | Status colors | Mapowanie status->token | calendar event renderer | No | P0 | Wszystkie statusy czytelne |
| E2-08 | Native calendar | Stabilization switch | Przełączenie menu z legacy | navigation + route aliases | No | P1 | `/calendar` -> native, `/calendar-legacy` działa |

## Epic 3 — Appointment workflow

| ID | Epic | Task | Description | Files likely affected | Backend needed | Priority | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E3-01 | Appointments | Create flow | Klient/usługa/pracownik/czas | calendar drawer + appointments API | Yes | P0 | Wizyta tworzona z slotu |
| E3-02 | Appointments | Edit flow | Edycja pełna + quick actions | drawer + status actions | Yes | P0 | Edycja bez opuszczania kalendarza |
| E3-03 | Appointments | Status flow | Status machine + transitions | backend appointment status | Yes | P0 | Niedozwolone przejścia blokowane |
| E3-04 | Appointments | Finalize flow | Zakończenie wizyty + checkout entry | appointment+sales integration | Yes | P1 | `completed` może przejść do POS |
| E3-05 | Appointments | Multi-service | Wiele usług w jednej wizycie | new entity + UI lines | Yes | P1 | 2+ usługi z sumą czasu/ceny |
| E3-06 | Appointments | Quick client create | Inline create klienta | drawer + customers API | Yes | P1 | Nowy klient bez opuszczania flow |

## Epic 4 — CRM Booksy-like

| ID | Epic | Task | Description | Files likely affected | Backend needed | Priority | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E4-01 | CRM | Clients list redesign | Toolbar/filters/bulk actions | `pages/customers/index.tsx`, components/customers | No | P0 | Szybkie wyszukiwanie i filtracja |
| E4-02 | CRM | Client profile redesign | Zakładki profil/wizyty/sprzedaż/notatki | customer detail pages/components | Yes | P0 | Jedno miejsce pracy z klientem |
| E4-03 | CRM | Notes/tags/groups | Ujednolicenie CRUD i bulk | customers module | Yes | P1 | Działa masowe tagowanie |
| E4-04 | CRM | Consents/preferences | zgody i preferencje usług/pracownika | customers/settings entities | Yes | P1 | Widoczne i audytowalne consenty |
| E4-05 | CRM | Warning system | no-show/debt/allergy flags | customer notes + calendar badge | Yes | P1 | Ostrzeżenie widoczne też w kalendarzu |

## Epic 5 — Warehouse and POS

| ID | Epic | Task | Description | Files likely affected | Backend needed | Priority | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E5-01 | Warehouse/POS | Product catalog UX | Uspójnienie list i edycji produktów | products pages/components | No | P1 | Spójna lista z search/filter |
| E5-02 | Warehouse/POS | Stock levels & movements | Widok ruchów i korekt | warehouse pages + APIs | Yes | P1 | Każda zmiana stanu audytowalna |
| E5-03 | Warehouse/POS | Deliveries flow | Przyjęcia dostaw | deliveries pages + service | Yes | P1 | Dostawa aktualizuje stock |
| E5-04 | Warehouse/POS | Appointment->Sale finalization | checkout z poziomu wizyty | calendar drawer + retail APIs | Yes | P0 | Finalizacja wizyty tworzy sprzedaż |
| E5-05 | Warehouse/POS | Payment methods | cash/card/mixed/tip | POS components + payment model | Yes | P1 | Pełna rejestracja płatności |
| E5-06 | Warehouse/POS | Cash report & commissions | raport dzienny + prowizje | reports + commissions | Yes | P2 | Raport zgodny z danymi sprzedaży |

## Epic 6 — Booksy-like UX polish

| ID | Epic | Task | Description | Files likely affected | Backend needed | Priority | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E6-01 | UX polish | Unified buttons/tables | Ujednolicenie component variants | shared UI components | No | P1 | Brak lokalnych wyjątków stylu |
| E6-02 | UX polish | Unified modals/drawers | Kontrakty modal/drawer | shared UI components | No | P1 | Taki sam UX interakcji |
| E6-03 | UX polish | Unified filters | Jeden model filtrów | toolbar/filter primitives | No | P1 | Obsługa keyboard + reset |
| E6-04 | UX polish | Status badges | Design tokens statusów | shared badge component | No | P1 | Statusy spójne cross-module |
| E6-05 | UX polish | Responsive behavior | kluczowe ekrany mobilne/tablet | calendar/customers/sales | No | P2 | Brak overflow blockerów |
| E6-06 | UX polish | Fast search/shortcuts | global quick open | topbar/search components | No | P2 | Otwieranie klienta/wizyty <3 akcje |
