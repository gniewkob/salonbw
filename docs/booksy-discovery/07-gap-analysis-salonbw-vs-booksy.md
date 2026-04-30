# 07 — Gap Analysis: SalonBW vs Versum-like vs Booksy-like

| Moduł | Obecny SalonBW | Versum-like docs | Booksy-like target | Gap | Rekomendacja | Priorytet |
| --- | --- | --- | --- | --- | --- | --- |
| calendar | `/calendar` iframe + compat | copy-first runtime parity | natywny shared-shell calendar | bardzo duży | `calendar-next` + switch strategy | P0 |
| appointments | alias do kalendarza | event-first legacy actions | pełny lifecycle w drawerze | duży | appointment domain flow + status machine | P0 |
| customers CRM | solid base, rozproszone KPI | clone list/details | unified client hub | średni | redesign profilu + timeline | P0 |
| services | działa | zgodność funkcjonalna | tighter integration z appointment builder | średni | service selection UX + variants in appointment | P1 |
| employees | istnieje w settings/admin | role/time-table centric | operations-centric staffing | średni | role matrix + better schedule filters | P1 |
| timetables | mocne legacy coverage | schedule compat | native scheduling contracts | średni | ujednolicić z calendar API | P1 |
| warehouse | szeroki zakres route | Versum-parity orientacja | inventory integrated with POS | średni | przepiąć checkout do wizyty | P1 |
| sales/POS | istnieje `/sales/*` | oddzielny flow | checkout w kontekście appointment | duży | unified finalization modal | P0 |
| communication | działa (sms/email/newsletters) | route parity | customer-centric comm center | średni | timeline + template orchestration | P1 |
| statistics | wiele ekranów | clone route coverage | decision-oriented analytics | średni | KPI pod role + exports | P2 |
| settings | bogate, ale niespójne aliasy | legacy route parity | coherent settings IA | średni | uprościć routing i nazewnictwo | P1 |
| online booking | częściowo | mniej istotne w clone | rezerwacja integralna z kalendarzem | średni | source tracking + booking rules | P1 |

## Największe luki

1. Kalendarz poza `SalonShell`.
2. Brak jednego przepływu: wizyta -> płatność -> magazyn -> CRM history.
3. Duża zależność od warstwy compat (`/events`, `/graphql`, runtime shim).

## Rekomendacja nadrzędna

- Przenieść środek ciężkości z „parytetu route legacy” na „parytet operacyjny Booksy-like flow”.
- Zachować compat tylko jako ograniczony fallback.
