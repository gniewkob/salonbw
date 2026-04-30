# 04 — Booksy-like Calendar & Appointments (Target for SalonBW)

## 4.1 Widoki kalendarza

| Widok | Układ | Kolumny | Godziny | Pracownicy | Wizyty | Akcje | Filtry | UX notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Day | Time grid 1 dzień | czas + pracownicy | 15-min slots, start/end configurable | 1..N | kolorowe bloki | create/edit/drop/resize | pracownik, status, źródło | główny widok operacyjny |
| Week | Time grid 7 dni | dni tygodnia x pracownicy | agregacja tygodnia | 1..N | skondensowane karty | bulk move, quick open | pracownik, usługa | do planowania obłożenia |
| Month | siatka dni | dni miesiąca | all-day summary | per day load | skrótowe liczniki | open day drilldown | status | P1, nie blokuje MVP |
| Employee | focus mode | jeden pracownik | pełna doba pracy | 1 | szczegóły wizyt | szybka edycja | usługa/status | dla indywidualnej pracy stylisty |
| Multi-employee | reception mode | kilku pracowników | pełna doba pracy | N | cross-staff schedule | drag między kolumnami | pracownik/status | kluczowe dla recepcji |
| Reception / salon | globalny overview | cały salon | dynamiczne | N + zasoby | konflikty/overlaps widoczne | quick create / triage | branch/employee | tryb dyspozytorski |
| Mobile / responsive | list+mini-grid | uproszczone | okna czasu | 1..N | short cards | confirm/reschedule | status/date | minimalny P1 |

## 4.2 Appointment card/block

| Element | Booksy behavior | SalonBW current | Target SalonBW |
| --- | --- | --- | --- |
| Widok bez kliknięcia | klient + usługa + czas + kolor statusu | różne warianty (legacy/natywny) | stały zestaw: klient/usługa/godzina/status/pracownik/cena/source-icon |
| Po kliknięciu | quick panel + pełna karta | legacy screen_data lub różne modale | prawy drawer: `Szczegóły`, `Historia`, `Płatność`, `Komunikacja` |
| Status | badge + kolor + akcje | statusy są, ale niespójne UX | jednolita maszyna statusów i badge tokens |
| Cena/płatność | widoczna i edytowalna | częściowo rozproszone | checkout-aware karta wizyty |
| Ostrzeżenia | np. no-show risk / note | częściowo notatki | warning chips (no-show, allergy, debt, VIP) |
| Quick actions | confirm/arrive/complete/no-show | część akcji przez legacy | skróty w karcie + menu akcji |

## 4.3 Tworzenie wizyty (target flow)

`Calendar slot click -> Appointment drawer/modal -> client/service/employee/time -> validation -> save -> calendar refresh`

Kroki docelowe:
1. Klik slotu (lub CTA „Nowa wizyta”).
2. Pre-fill czasu i pracownika.
3. Wybór klienta (search + inline quick-create).
4. Wybór 1..N usług.
5. Automatyczna kalkulacja czasu i ceny (możliwość ręcznej korekty).
6. Walidacja konfliktów (`/calendar/conflicts`).
7. Zapis.
8. Natychmiastowy refresh kalendarza + toast.
9. Obsługa anulowania draftu bez side effects.

Wymagane warianty P1:
- nowy klient inline,
- multi-service,
- manual override czasu,
- source: `manual | online | phone | import`.

## 4.4 Edycja wizyty

- Click block -> quick preview -> open full drawer.
- Drag & drop: zmiana czasu/kolumny pracownika.
- Resize: zmiana czasu zakończenia.
- Zmiana usługi/pracownika/statusu/płatności/notatek.
- Akcje końcowe: cancel, no-show, reschedule, complete, finalize sale.

## 4.5 Docelowe statusy wizyt

| Status | Znaczenie | Kto ustawia | Widoczność w kalendarzu | Kolor | Akcje dostępne |
| --- | --- | --- | --- | --- | --- |
| `draft` | robocza, niezapisana finalnie | admin/receptionist/employee | dashed/low emphasis | gray-400 | edit, discard, confirm |
| `booked` | zapisana | system/użytkownik | standard | blue-500 | confirm, reschedule, cancel |
| `confirmed` | potwierdzona | staff/system | standard+check | teal-500 | arrive, reschedule, cancel |
| `arrived` | klient na miejscu | staff | high emphasis | indigo-500 | in_progress, cancel |
| `in_progress` | usługa trwa | employee/receptionist | active stripe | amber-500 | complete, no_show(blocked) |
| `completed` | usługa wykonana | staff/system | completed style | green-600 | finalize payment, receipt |
| `cancelled` | anulowana | staff/client(policy) | crossed/disabled | gray-500 | restore(reschedule) |
| `no_show` | klient nie przyszedł | staff | warning | red-600 | reschedule, charge policy |
| `rescheduled` | przeniesiona | system | link do nowej wizyty | violet-500 | open linked appointment |

## 4.6 Wymagania dla nowego kalendarza

### P0
- natywny `/calendar` bez `iframe`,
- pełny `SalonShell`,
- day/week,
- employee filter,
- create/edit/drop/resize,
- conflict validation,
- time blocks,
- statusy,
- loading/empty/error.

### P1
- multi-service,
- quick client create,
- quick completion,
- payment z wizyty,
- history log,
- client notes,
- color modes (employee/service/status),
- export/print day.

### P2
- sms/email reminders,
- waitlist,
- recurring,
- online booking rules,
- resources (room/station).

## Rekomendacja wdrożeniowa

- Nie rozwijać further legacy iframe.
- Uruchomić `calendar-next` i przeprowadzić controlled beta.
- Po parytecie P0 przepiąć `/calendar` na natywny widok.
