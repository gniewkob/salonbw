# 13 — Open Questions

## Product

| Pytanie | Typ |
| --- | --- |
| Czy MVP obejmuje tylko 1 oddział (`branch`) czy multi-branch od razu? | blocking |
| Czy moduł `Wizyty` ma być osobnym route od sprintu 1 czy aliasem do kalendarza? | non-blocking |

## UX

| Pytanie | Typ |
| --- | --- |
| Drawer czy modal jako domyślny wzorzec edycji wizyty? | blocking |
| Czy month view jest wymagany w MVP? | non-blocking |

## Backend

| Pytanie | Typ |
| --- | --- |
| Czy tworzymy nowe encje `AppointmentService` i `AppointmentStatusHistory` od razu? | blocking |
| Czy finalizacja wizyty ma używać istniejących `warehouse_sales` czy nowego zunifikowanego `sale` modelu? | blocking |

## Data migration

| Pytanie | Typ |
| --- | --- |
| Jak migrujemy historię statusów ze stanu legacy (bez pełnego audit trail)? | non-blocking |
| Czy mapowanie `source` dla starych wizyt ma użyć wartości domyślnej `import`? | non-blocking |

## Permissions

| Pytanie | Typ |
| --- | --- |
| Dokładny zakres ograniczeń `employee` (czy może edytować cudze wizyty)? | blocking |
| Czy receptionist może zarządzać magazynem pełnozakresowo? | non-blocking |

## Payments

| Pytanie | Typ |
| --- | --- |
| Czy split payment i tip są P1 czy P2? | blocking |
| Czy wymagany jest paragon/faktura z checkoutu w MVP? | non-blocking |

## Warehouse

| Pytanie | Typ |
| --- | --- |
| Czy inwentaryzacja pełna jest potrzebna od razu czy po MVP? | non-blocking |
| Czy low-stock alerty mają automatycznie tworzyć draft zamówienia? | nice-to-have |

## Notifications

| Pytanie | Typ |
| --- | --- |
| Czy przypomnienia SMS/email są częścią P0 czy dopiero P2? | non-blocking |
| Czy komunikacja WhatsApp jest w scope tej migracji? | nice-to-have |

## Booksy parity

| Pytanie | Typ |
| --- | --- |
| Jaki poziom parity: funkcjonalny 1:1 czy UX-inspirowany z lokalnymi uproszczeniami? | blocking |
| Czy implementujemy również publiczny booking funnel redesign w tym samym programie? | non-blocking |

## Versum legacy

| Pytanie | Typ |
| --- | --- |
| Jaki jest deadline całkowitego wyłączenia `/api/calendar-embed`? | blocking |
| Jak długo utrzymujemy compat endpointy `/events` i `/graphql`? | blocking |
