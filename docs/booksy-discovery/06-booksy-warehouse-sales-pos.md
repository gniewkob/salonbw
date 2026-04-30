# 06 — Booksy-like Warehouse, Sales & POS

## Magazyn

| Workflow | Trigger | Kroki użytkownika | Dane wejściowe | Dane wyjściowe | Backend entity | Priorytet |
| --- | --- | --- | --- | --- | --- | --- |
| Katalog produktów | wejście w magazyn | browse/search/filter/edit | nazwa, SKU, kategoria, cena | zaktualizowany produkt | `Product`, `ProductCategory` | P1 |
| Dostawa | przyjęcie towaru | nowa dostawa -> pozycje -> zapis | supplier, items, qty, cost | stock increase + movement logs | `Delivery`, `DeliveryItem`, `ProductMovement` | P1 |
| Korekta stanu | błąd stanu | adjust inventory | productId, delta, reason | stock correction movement | `ProductMovement` | P1 |
| Inwentaryzacja | okresowa kontrola | open stocktaking -> count -> close | expected qty, counted qty | stocktaking report + corrections | `Stocktaking`, `StocktakingItem` | P2 |
| Alert niski stan | threshold breach | review alerts -> reorder | min level, current qty | alert status + order action | stock alerts DTO/services | P1 |

## Sprzedaż / POS

| Workflow | Trigger | Kroki użytkownika | Dane wejściowe | Dane wyjściowe | Backend entity | Priorytet |
| --- | --- | --- | --- | --- | --- | --- |
| Sprzedaż usługi | finalizacja wizyty | open checkout -> service lines -> payment | appointment/services/discount/tip | sale + payment + commission | `Appointment`, `Sale`, `Payment`, `Commission` | P0 |
| Sprzedaż produktu | sprzedaż retail | add product lines -> payment | product qty/unitPrice/discount | sale + stock movement | `WarehouseSale`, `WarehouseSaleItem`, `ProductMovement` | P0 |
| Sprzedaż mieszana | usługa + retail | combine service+product lines | appointment + products | unified receipt & accounting | `SaleItem` (target), current mixed retail entities | P1 |
| Zwrot / anulowanie | reklamacja | find sale -> reverse full/partial | saleId, reason, lines | reversal + stock return + audit | reverse-sale DTO/service | P1 |
| Raport kasowy | zamknięcie dnia | summary by method/employee | day range, filters | cash report | statistics/finance | P2 |

## Krytyczny flow integracyjny

`Appointment completed -> Finalization modal -> services/products -> payment -> stock movement -> sale record -> commission -> customer history`

### Problem
- Obecnie finalizacja wizyty i sprzedaż są funkcjonalnie dostępne, ale UX i kontrakty są rozdzielone.

### Target
- Jeden checkout flow osadzony w karcie wizyty.

### Moduły/pliki
- Frontend: `apps/panel/src/pages/calendar*`, `sales/*`, komponent checkout.
- Backend: `appointments/finalize`, `retail/*`, `warehouse/*`, `commissions/*`.

### Acceptance criteria
- Jedno zamknięcie wizyty automatycznie aktualizuje: płatność, magazyn, prowizję, historię klienta.
