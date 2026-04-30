# 10 — Target Domain Model

## Tabela encji

| Entity | Purpose | Key fields | Relations | Existing in repo? | Missing fields | Migration needed |
| --- | --- | --- | --- | --- | --- | --- |
| User | konto systemowe | id, email, role | Employee, Client | Tak (`users`) | granular permissions | Tak (RBAC v1 matrix) |
| Employee | pracownik salonu | userId, displayName, active | User, Timetable, Services | Częściowo | dedicated profile fields | Tak |
| Client | klient salonu | name, phone, email | Appointments, Sales, Notes | Tak (`customers` na bazie user/customer entities) | `noShowCount`, `totalSpent` cache | Tak |
| Service | usługa | name, duration, price | Category, Variant, EmployeeService | Tak | source/visibility flags | Niska |
| ServiceCategory | grupowanie usług | name, sortOrder | Service[] | Tak | none critical | Niska |
| ServiceVariant | wariant usługi | duration, price | Service | Tak | richer pricing policy | Średnia |
| EmployeeService | przypisanie usługi do pracownika | employeeId, serviceId | Employee, Service | Tak | overrides per variant | Średnia |
| Appointment | wizyta | patrz sekcja niżej | Client, Employee, AppointmentService, Sale | Tak | source/payment/audit fields | Wysoka |
| AppointmentService | linia usług w wizycie | appointmentId, serviceId, duration, price | Appointment, Service, Employee | Nie (target) | full entity | Wysoka |
| AppointmentStatusHistory | historia statusów | appointmentId, from, to, by, at | Appointment, User | Nie | full entity | Wysoka |
| TimeBlock | blokada czasu | employeeId, start, end, type | Employee | Tak (`time_blocks`) | reason taxonomy | Średnia |
| Timetable | grafik | employeeId, dateRange | TimetableSlot, Exception | Tak | unify with calendar filters | Średnia |
| TimetableSlot | slot grafiku | dayOfWeek, from, to | Timetable | Tak | none critical | Niska |
| TimetableException | wyjątek grafiku | date, type, note | Timetable | Tak | standard reason enum | Niska |
| Product | produkt magazynowy | name, sku, unitPrice, qty | Category, Supplier, Movements | Tak | barcode uniqueness policy | Średnia |
| ProductCategory | kategoria produktu | name | Product[] | Tak | none critical | Niska |
| Supplier | dostawca | name, contact | Deliveries | Tak | payment terms | Niska |
| StockMovement | ruch magazynowy | productId, delta, reason | Product, Sale/Delivery | Tak (`product_movements`) | stricter source linking | Średnia |
| Delivery | przyjęcie dostawy | supplierId, date | DeliveryItem[] | Tak | approval state | Niska |
| DeliveryItem | pozycja dostawy | deliveryId, productId, qty, cost | Delivery, Product | Tak | none critical | Niska |
| Sale | sprzedaż | appointmentId?, clientId?, employeeId?, total | SaleItem, Payment | Częściowo (`warehouse_sales`/`retail`) | unified sale model | Wysoka |
| SaleItem | pozycja sprzedaży | type, refId, qty, price, discount | Sale | Częściowo | service+product unified type | Wysoka |
| Payment | płatność | saleId, method, amount, tip | Sale | Częściowo | partial/split payment support | Średnia |
| Commission | prowizja | employeeId, source, amount | Sale/Appointment | Tak | appointment-service granularity | Średnia |
| MessageTemplate | szablon komunikacji | channel, content | SmsLog/EmailLog | Tak (`sms`) | versioning | Niska |
| SmsLog | log sms | clientId, templateId, status | Client | Tak | delivery provider metadata | Niska |
| CustomerNote | notatki klienta | customerId, text, type | Client | Tak | warning severity | Średnia |
| CustomerTag | tag klienta | customerId, tag | Client | Tak | usage analytics | Niska |
| CustomerGroup | segment klientów | name, criteria? | Client[] | Tak | dynamic segment rules | P2 |

## Appointment — target fields

`clientId`, `employeeId`, `branchId`, `startTime`, `endTime`, `status`, `source`, `internalNote`, `clientNote`, `price`, `discount`, `finalPrice`, `paymentStatus`, `createdBy`, `updatedBy`, `cancelledAt`, `cancellationReason`, `noShowReason`

## AppointmentService — target fields

`appointmentId`, `serviceId`, `variantId`, `employeeId`, `duration`, `price`, `sortOrder`

## Sale / SaleItem / Payment — target support

- sale linked to appointment,
- sale linked to client,
- sale linked to employee,
- services sold,
- products sold,
- payment method,
- discount,
- tip,
- stock movements,
- commission calculation.
