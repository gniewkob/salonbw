# SUMMARY — Booksy-like Discovery dla SalonBW

## 1. Co dziś jest największym problemem UX?

Największy problem to `calendar` jako pełnoekranowy `iframe` poza `SalonShell`, co rozbija spójność nawigacji, stanów i przepływów operacyjnych.

## 2. Co trzeba zrobić z kalendarzem?

Wdrożyć natywny `calendar-next` (React/FullCalendar) z day/week, filtrem pracowników, create/edit/drop/resize, walidacją konfliktów i statusami; potem przepiąć `/calendar` na native i zostawić `/calendar-legacy` jako fallback.

## 3. Co trzeba zrobić z wizytami?

Zbudować pełny lifecycle wizyty w drawerze: create, edit, status transitions, reschedule, cancel/no-show, complete i przejście do finalizacji płatności.

## 4. Co trzeba zrobić z CRM?

Przebudować klienta na hub pracy: profil + historia wizyt + historia sprzedaży + notatki/tagi/grupy + zgody + ostrzeżenia + historia komunikacji.

## 5. Co trzeba zrobić z magazynem i sprzedażą?

Spiąć finalizację wizyty z checkoutem POS, ruchem magazynowym i prowizją, aby jedno zamknięcie wizyty aktualizowało wszystkie domeny.

## 6. Co można zachować z obecnego repo?

- `SalonShell` i obecny system nawigacji,
- natywne API `calendar/appointments` i hooki React Query,
- istniejące moduły CRM, magazynu i sprzedaży jako baza domenowa.

## 7. Co należy przepisać?

- route `/calendar` (wyjście z iframe),
- warstwę embed runtime i część compat endpointów,
- appointment UX jako spójny drawer + status machine + checkout handoff.

## 8. Rekomendowany pierwszy sprint

`PanelShell + /calendar-next + appointment modal/drawer + podstawowy create/edit/drop flow + conflict validation + status badges`.

## 9. Rekomendowany drugi sprint

`Appointment completion/finalization -> POS + CRM timeline + multi-service appointments + role hardening (admin/receptionist/employee)`.

## 10. Jakie decyzje musi podjąć właściciel produktu?

1. Zakres MVP: czy split payment i tip są P1 czy P2.
2. Docelowy model sprzedaży: utrzymanie `warehouse_sales` vs nowy unified `sale`.
3. RBAC szczegółowo: granice uprawnień `employee` i `receptionist`.
4. Termin wyłączenia legacy `/api/calendar-embed` i compat `/events`.
5. Poziom Booksy parity: funkcjonalny vs funkcjonalno-wizualny.
