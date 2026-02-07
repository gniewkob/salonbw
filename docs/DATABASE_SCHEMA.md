# Struktura bazy danych SalonBW

## Porównanie z Versum

Nasza baza danych zawiera **51 encji** odwzorowujących funkcjonalność systemu Versum.

## Główne moduły

### 1. Użytkownicy i uprawnienia
| Encja | Opis | Odpowiednik Versum |
|-------|------|-------------------|
| `users` | Klienci, pracownicy, administratorzy | users |
| `branches` | Oddziały/salony | branches |
| `branch_members` | Przynależność do oddziałów | branch_users |

### 2. Usługi i kalendarz
| Encja | Opis | Odpowiednik Versum |
|-------|------|-------------------|
| `services` | Usługi oferowane przez salon | services |
| `service_categories` | Kategorie usług | service_categories |
| `service_variants` | Warianty usług | service_variants |
| `appointments` | Wizyty klientów | appointments |
| `timetables` | Grafiki pracy pracowników | timetables |
| `timetable_slots` | Sloty grafików | timetable_entries |
| `timetable_exceptions` | Wyjątki w grafikach | timetable_exceptions |
| `time_blocks` | Bloki czasowe (urlopy) | time_blocks |

### 3. Magazyn i produkty
| Encja | Opis | Odpowiednik Versum |
|-------|------|-------------------|
| `products` | Produkty w magazynie | products |
| `product_categories` | Kategorie produktów | product_categories |
| `warehouse_sales` | Sprzedaż produktów | product_sales |
| `warehouse_usage` | Zużycie wewnętrzne | product_usage |
| `deliveries` | Dostawy produktów | deliveries |
| `product_movements` | Ruchy magazynowe | inventory_movements |
| `suppliers` | Dostawcy | suppliers |
| `stocktaking` | Inwentaryzacja | stocktaking |

### 4. Płatności i finanse
| Encja | Opis | Odpowiednik Versum |
|-------|------|-------------------|
| `commissions` | Prowizje pracowników | commissions |
| `commission_rules` | Reguły prowizji | commission_rules |
| `gift_cards` | Karty podarunkowe | gift_cards |
| `gift_card_transactions` | Transakcje kart | gift_card_transactions |
| `invoices` | Faktury | invoices |
| `loyalty_balances` | Salda punktów lojalnościowych | loyalty_balances |
| `loyalty_transactions` | Transakcje punktowe | loyalty_transactions |

### 5. Marketing i komunikacja
| Encja | Opis | Odpowiednik Versum |
|-------|------|-------------------|
| `sms_logs` | Historia SMS/email | sms_logs |
| `message_templates` | Szablony wiadomości | message_templates |
| `automatic_message_rules` | Reguły automatyczne | automatic_message_rules |
| `newsletters` | Newslettery | newsletters |
| `chat_messages` | Wiadomości czatu | chat_messages |

### 6. CRM
| Encja | Opis | Odpowiednik Versum |
|-------|------|-------------------|
| `customer_groups` | Grupy klientów | customer_groups |
| `customer_tags` | Tagi klientów | customer_tags |
| `customer_notes` | Notatki o klientach | customer_notes |
| `reviews` | Opinie/recenzje | reviews |
| `formulas` | Formuły farbowania | formulas |

## Kluczowe relacje

```
users (1) ----< (N) appointments
users (1) ----< (N) commissions
users (1) ----< (N) warehouse_sales

services (1) ----< (N) appointments
services (1) ----< (N) service_variants
services (1) ----< (N) commissions

appointments (1) ----< (N) commissions
appointments (1) ----< (N) reviews

products (1) ----< (N) warehouse_sales
products (1) ----< (N) product_movements

branches (1) ----< (N) branch_members
```

## Indeksy dla wydajności

- `idx_appointments_calendar` - (startTime, endTime, employeeId)
- `idx_appointments_client` - (clientId, startTime)
- `idx_appointments_employee` - (employeeId, startTime)
- `idx_appointments_status` - (status)
- `idx_appointments_finalized` - (finalizedAt)

## Enumy

### Role użytkowników
- `client` - klient
- `employee` - pracownik
- `receptionist` - recepcjonista
- `admin` - administrator

### Statusy wizyt
- `scheduled` - zaplanowana
- `confirmed` - potwierdzona
- `in_progress` - w trakcie
- `completed` - zakończona
- `cancelled` - anulowana
- `no_show` - nieobecność

### Metody płatności
- `cash` - gotówka
- `card` - karta
- `transfer` - przelew
- `online` - online
- `voucher` - voucher

## Porównanie liczby tabel

| System | Liczba tabel |
|--------|-------------|
| **SalonBW** | 51 encji |
| Versum (szacowana) | ~45-50 tabel |

Nasza struktura jest **w pełni kompatybilna** z funkcjonalnością Versum.
