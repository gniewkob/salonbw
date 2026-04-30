# 08 — Target Information Architecture

## Docelowa nawigacja panelu

- Dashboard
- Kalendarz
- Wizyty
- Klienci
- Usługi
- Pracownicy
- Magazyn
- Sprzedaż / Kasa
- Komunikacja
- Raporty
- Ustawienia

## Mapa modułów

| Moduł | Route | Podstrony | Primary action | Secondary actions | Role access |
| --- | --- | --- | --- | --- | --- |
| Dashboard | `/dashboard` | KPI, alerts, day summary | Start day | open calendar, open tasks | admin, receptionist, employee |
| Kalendarz | `/calendar` | day/week, filters, drawer | `Nowa wizyta` | add block, quick status | admin, receptionist, employee(limited) |
| Wizyty | `/appointments` | list, queue, conflicts | `Finalizuj wizytę` | bulk confirm, reschedule | admin, receptionist, employee(limited) |
| Klienci | `/customers` | list, profile, notes, history | `Dodaj klienta` | tags/groups, communication | admin, receptionist, employee(limited) |
| Usługi | `/services` | categories, variants | `Dodaj usługę` | assign employees | admin, receptionist |
| Pracownicy | `/employees` | roster, permissions, schedules | `Dodaj pracownika` | timetable, performance | admin |
| Magazyn | `/warehouse` (aliasy do `/products` etc. w migracji) | products, deliveries, stocktaking | `Dodaj produkt` | dostawa, korekta | admin, receptionist |
| Sprzedaż / Kasa | `/sales` | new sale, history, returns | `Nowa sprzedaż` | cash report, reverse | admin, receptionist |
| Komunikacja | `/communication` | sms, email, templates, campaigns | `Wyślij wiadomość` | automate reminders | admin, receptionist |
| Raporty | `/reports` (alias `/statistics`) | revenue, staff, clients | `Generuj raport` | export CSV/PDF | admin, receptionist |
| Ustawienia | `/settings` | booking rules, branch, integrations | `Zapisz konfigurację` | role policies | admin |

## Role policy v1

- `admin`: pełen dostęp.
- `receptionist`: pełen dostęp operacyjny (kalendarz, wizyty, CRM, sprzedaż, magazyn bez ustawień krytycznych).
- `employee`: ograniczony (własny kalendarz/wizyty/wybrane dane klienta).
- `client`: poza panelem staff; online booking i samoobsługa.
