# 01 — Current Panel Inventory

## Snapshot architektury

- Frontend panel: `apps/panel` (Next.js, React, TS).
- Backend: `backend/salonbw-backend` (NestJS, TypeORM).
- Kalendarz działa równolegle w dwóch światach:
  - legacy embed (`/calendar` + `/api/calendar-embed` + `versum-compat`),
  - natywne API/hooki (`/calendar/events`, `useCalendar`, `CalendarView.tsx`).

## Inwentarz modułów

| Moduł | Frontend route | Backend module | Status | Uwagi |
| --- | --- | --- | --- | --- |
| Calendar | `/calendar`, `/calendar/views/*` | `calendar`, `versum-compat`, `settings(calendar_views)` | mixed | `/calendar` to iframe; równolegle istnieją natywne endpointy i komponenty FC. |
| Appointments | alias `/appointments -> /calendar` | `appointments`, częściowo `calendar`, `versum-compat` | mixed | Core CRUD istnieje; UI appointments jako osobny moduł praktycznie nie istnieje (alias). |
| Customers / CRM | `/customers`, `/customers/[id]`, `/customers/[id]/edit` | `customers`, `statistics(customers)`, `newsletters`, `sms` | native | Silny moduł listy i profilu; brakuje docelowej spójności Booksy-like w historii i segmentacji premium. |
| Services | `/services`, `/services/new`, `/services/[id]` | `services`, `employee-services` | native | Działa domenowo; UX różni się od kalendarza i innych modułów. |
| Warehouse | `/products`, `/inventory`, `/orders`, `/deliveries`, `/stocktakings`, `/stock-alerts`, `/suppliers` | `products`, `warehouse`, `retail` | native | Funkcjonalność szeroka, ale rozproszona po route-ach legacy naming. |
| Sales / POS | `/sales`, `/sales/new`, `/sales/history/*` | `retail`, `warehouse_sales`, `commissions`, `invoices` | native/mixed | Istnieją przepływy sprzedaży; finalizacja wizyty do POS wymaga konsolidacji UX i kontraktu danych. |
| Communication | `/communication/*`, `/messages`, `/emails`, `/newsletters/new`, `/event-reminders` | `sms`, `emails`, `newsletters`, `automatic-messages`, `notifications` | native | Moduły są, ale brak jednego centrum komunikacji klienta. |
| Settings | `/settings/*`, `/admin/settings/*` | `settings`, `timetables`, `branches`, `users` | native/mixed | Dużo aliasów i duplikatów tras (`snake_case` + `kebab-case`). |

## Dodatkowe obserwacje

- `SalonShell` jest już obecny i używany przez większość stron panelu.
- `calendar` jest głównym wyjątkiem UX (pełnoekranowy `iframe` poza shell).
- Backend posiada już encje pod CRM/magazyn/POS, ale kontrakty endpointów są częściowo „Versum-compat-first”.
