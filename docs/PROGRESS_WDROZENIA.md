# Postęp Wdrożenia SalonBW (Versum Clone)

> Ostatnia aktualizacja: 2026-01-30

## Stan Ogólny

| Faza | Status | Postęp |
|------|--------|--------|
| Faza 1: MVP | ✅ Ukończona | 100% |
| Faza 2: Core Business | ✅ Ukończona | ~95% |
| Faza 3: Advanced | ✅ Ukończona | ~95% |
| Faza 4: Enterprise | 🟡 W trakcie | ~25% |

> **Ważne:** Cały „Versum clone” (dashboard, kalendarz, CRM, magazyn, komunikacja, ustawienia) działa **wyłącznie** w **panelu** (`apps/panel`, `panel.salon-bw.pl`).  
> `dev.salon-bw.pl` (`apps/landing`) to **tylko wizytówka** + CTA do panelu — nie dodajemy tam logiki dashboardu.

---

## Faza 1: MVP

### ✅ Uwierzytelnianie
- [x] Login/logout
- [x] Role użytkowników (Admin, Employee, Receptionist, Client)
- [x] JWT authentication
- [x] Role guards na endpointach
- [x] Frontend AuthContext

### ✅ Moduł Kalendarz
#### Backend
- [x] CalendarModule z CalendarService
- [x] TimeBlock entity (urlopy, przerwy, szkolenia)
- [x] CalendarController z endpointami:
  - `GET /calendar/events` - pobieranie zdarzeń
  - `GET /calendar/time-blocks` - pobieranie blokad
  - `POST /calendar/time-blocks` - tworzenie blokad
  - `PATCH /calendar/time-blocks/:id` - aktualizacja
  - `DELETE /calendar/time-blocks/:id` - usuwanie
  - `GET /calendar/conflicts` - sprawdzanie konfliktów
- [x] Appointment entity rozszerzone o:
  - `internalNote`, `reservedOnline`, `reminderSent`, `tags`
  - `paymentMethod`, `paidAmount`, `tipAmount`, `discount`
  - `finalizedAt`, `finalizedBy`, `cancelledAt`, `cancellationReason`
- [x] Endpoint `PATCH /appointments/:id/reschedule`

#### Frontend
- [x] CalendarHeader (nawigacja dat, przełącznik widoków)
- [x] CalendarSidebar (mini kalendarz, filtr pracowników)
- [x] CalendarView (główny komponent z FullCalendar)
- [x] EventCard (karta wizyty)
- [x] useCalendar hook
- [x] Strona /calendar
- [x] Permission `nav:calendar` dla employee/receptionist/admin

#### Migracje
- [x] `1710010000000-CreateTimeBlocksTable`
- [x] `1710011000000-AddAppointmentCalendarFields`

### ✅ Moduł Klienci (CRM)
#### Backend
- [x] CustomersModule
- [x] CustomerGroup entity + join table
- [x] CustomerNote entity z typami (general, warning, preference, medical, payment)
- [x] CustomerTag entity + join table
- [x] CustomersService z:
  - Zaawansowane filtrowanie (płeć, wiek, wydatki, grupy, tagi, zgody)
  - CRUD klientów, grup, notatek, tagów
- [x] CustomerStatisticsService (statystyki, historia)
- [x] 3 kontrolery: CustomersController, CustomerGroupsController, CustomerTagsController
- [x] User entity rozszerzony o pola CRM:
  - `firstName`, `lastName`, `birthDate`, `gender`
  - `address`, `city`, `postalCode`, `description`
  - `smsConsent`, `emailConsent`, `gdprConsent`, `gdprConsentDate`
  - `createdAt`, `updatedAt`

#### Frontend
- [x] CustomerSidebar (grupy, tagi, filtry zaawansowane)
- [x] CustomerCard z zakładkami
- [x] CustomerSummaryTab (KPI, ulubione usługi/pracownicy)
- [x] CustomerPersonalDataTab (edytowalny formularz)
- [x] CustomerStatisticsTab (wykresy, rankingi)
- [x] CustomerHistoryTab (historia wizyt z paginacją)
- [x] CustomerNotesTab (notatki z typami, przypinanie)
- [x] CustomerConsentsTab (zgody RODO)
- [x] useCustomers hook (pełne API z apiFetch)
- [x] Strona /clients (przeprojektowana w stylu CRM)

#### Migracje
- [x] `1710012000000-AddUserCRMFields`
- [x] `1710013000000-CreateCustomerCRMTables`

### ✅ Moduł Usługi

#### Backend

- [x] Service entity rozszerzony o:
  - `priceType` (fixed/from)
  - `categoryId`, `categoryRelation`
  - `isActive`, `onlineBooking`, `sortOrder`
  - `createdAt`, `updatedAt`
- [x] ServiceCategory entity (hierarchia kategorii):
  - Samoreferencyjna relacja parent/children
  - `color`, `sortOrder`, `isActive`
- [x] ServiceVariant entity (warianty cenowe/czasowe):
  - `name`, `duration`, `price`, `priceType`
  - `sortOrder`, `isActive`
- [x] EmployeeService entity (przypisanie pracowników):
  - `customDuration`, `customPrice`, `commissionOverride`
  - `isActive`
- [x] ServiceCategoriesService z:
  - Hierarchiczne drzewo kategorii
  - Wykrywanie cykli w hierarchii
  - Reorderowanie z aktualizacją sortOrder
- [x] ServiceVariantsService (CRUD wariantów per usługa)
- [x] EmployeeServicesService (przypisania z bulk operations)
- [x] 4 kontrolery:
  - ServiceCategoriesController (`/service-categories`)
  - ServiceVariantsController (`/services/:id/variants`)
  - EmployeeServicesController (`/employee-services`)
  - ServicesController (rozszerzony o filtrowanie)

#### Frontend

- [x] ServiceCategoryTree (drzewo kategorii z expand/collapse)
- [x] ServiceList (tabela usług z toggle aktywności)
- [x] ServiceFormModal (formularz tworzenia/edycji usługi)
- [x] CategoryFormModal (formularz kategorii z color picker)
- [x] ServiceVariantsModal (zarządzanie wariantami)
- [x] useServicesAdmin hook (pełne API)
- [x] Strona /admin/services
- [x] Link w AdminSidebarMenu

#### Migracje Usług

- [x] `1710014000000-CreateServicesEnhancementTables`

### ✅ Podstawowe Ustawienia

#### Backend Ustawień

- [x] SettingsModule zarejestrowany w app.module.ts
- [x] BranchSettings entity:
  - `companyName`, `displayName`, `nip`, `regon`
  - `street`, `buildingNumber`, `apartmentNumber`, `postalCode`, `city`, `country`
  - `phone`, `phoneSecondary`, `email`, `website`
  - `facebookUrl`, `instagramUrl`, `tiktokUrl`, `logoUrl`
  - `primaryColor`, `currency`, `locale`, `timezone`
  - `defaultVatRate`, `isVatPayer`, `receiptFooter`, `invoiceNotes`, `invoicePaymentDays`
  - `gdprDataRetentionDays`, `gdprConsentText`
- [x] CalendarSettings entity:
  - `defaultView`, `timeSlotDuration`, `defaultStartTime`, `defaultEndTime`
  - `showWeekends`, `weekStartsOn`, `showEmployeePhotos`, `showServiceColors`, `compactView`
  - `allowOverlappingAppointments`, `minAppointmentDuration`, `maxAppointmentDuration`
  - `bufferTimeBefore`, `bufferTimeAfter`
  - `minBookingAdvanceHours`, `maxBookingAdvanceDays`, `allowSameDayBooking`
  - `cancellationDeadlineHours`, `allowClientReschedule`, `rescheduleDeadlineHours`
  - `reminderEnabled`, `reminderHoursBefore`, `secondReminderEnabled`, `secondReminderHoursBefore`
  - `autoMarkNoshowAfterMinutes`, `noshowPenaltyEnabled`, `statusColors`
- [x] OnlineBookingSettings entity (konfiguracja panelu klienta)
- [x] SettingsService z auto-init (domyślne wartości przy pierwszym pobraniu)
- [x] SettingsController z endpointami:
  - `GET /settings` - wszystkie ustawienia
  - `GET/PUT /settings/branch` - dane firmy
  - `GET/PUT /settings/calendar` - ustawienia kalendarza
  - `GET/PUT /settings/online-booking` - rezerwacje online

#### Frontend Ustawień

- [x] Types: BranchSettings, CalendarSettings, OnlineBookingSettings, UpdateBranchSettingsRequest, UpdateCalendarSettingsRequest, UpdateOnlineBookingSettingsRequest
- [x] useSettings hooks (useBranchSettings, useCalendarSettings, useSettingsMutations)
- [x] Strona /admin/settings/company (6 zakładek: Dane firmy, Adres, Kontakt, Social, Podatki, RODO)
- [x] Strona /admin/settings/calendar (4 zakładki: Wyświetlanie, Rezerwacje, Przypomnienia, Anulowanie)
- [x] Linki w AdminSidebarMenu

#### Migracje Ustawień

- [x] `1710020000000-CreateSettingsTables`

---

## Faza 2: Core Business

### ✅ Finalizacja Wizyt

#### Backend Finalizacji
- [x] PaymentMethod enum (cash, card, transfer, online, voucher)
- [x] FinalizeAppointmentDto z walidacją
- [x] ProductSaleItemDto (upselling produktów)
- [x] Metoda `finalizeAppointment` w AppointmentsService:
  - Transakcyjna aktualizacja statusu, płatności
  - Tworzenie prowizji za usługę
  - Integracja z RetailService dla sprzedaży produktów
  - WhatsApp follow-up notification
  - Audit logging
- [x] Endpoint `POST /appointments/:id/finalize`
- [x] Autoryzacja: Admin, Employee (własne), Receptionist

#### Frontend Finalizacji
- [x] Types: PaymentMethod, AppointmentStatus, FinalizeAppointmentRequest
- [x] FinalizationModal z:
  - Wybór metody płatności (5 opcji)
  - Rabat i napiwek w PLN
  - Product picker (upselling)
  - Podsumowanie z kalkulacją totalu
  - Notatka opcjonalna
- [x] Eksport z calendar/index.ts

### ✅ Magazyn Rozszerzony

#### Backend Magazynu

- [x] WarehouseModule zarejestrowany w app.module.ts
- [x] Supplier entity (dostawcy z NIP, kontaktem)
- [x] Delivery/DeliveryItem entities (dostawy z workflow)
- [x] Stocktaking/StocktakingItem entities (inwentaryzacja)
- [x] ProductMovement entity (historia zmian stanów)
- [x] SuppliersService (CRUD z audit logging)
- [x] DeliveriesService (draft→receive→cancel workflow)
- [x] StocktakingService (inwentaryzacja z różnicami)
- [x] 3 kontrolery REST: Suppliers, Deliveries, Stocktaking
- [x] Product entity rozszerzony o: sku, barcode, minQuantity, productType, purchasePrice, defaultSupplierId, trackStock

#### Frontend Magazynu

- [x] Types: Supplier, Delivery, Stocktaking, ProductMovement
- [x] useWarehouse hook (pełne API)
- [x] SuppliersTab (CRUD dostawców)
- [x] DeliveriesTab (lista dostaw, tworzenie, przyjmowanie)
- [x] StocktakingTab (lista inwentaryzacji, workflow)
- [x] Strona /admin/warehouse z zakładkami
- [x] Permission `nav:warehouse` dla admin
- [x] Link w AdminSidebarMenu

#### Migracje Magazynu

- [x] `1710015000000-CreateWarehouseTables`

### ✅ Grafiki Pracy

#### Backend Grafików

- [x] TimetablesModule zarejestrowany w app.module.ts
- [x] Timetable entity (harmonogram tygodniowy):
  - `employeeId`, `name`, `description`
  - `validFrom`, `validTo`, `isActive`
  - Relacja do TimetableSlot
- [x] TimetableSlot entity (sloty dzienne):
  - `dayOfWeek` (0=Pon, 6=Nie)
  - `startTime`, `endTime`, `isBreak`, `notes`
- [x] TimetableException entity (wyjątki):
  - `type` (day_off, vacation, sick_leave, training, custom_hours, other)
  - `date`, `title`, `reason`
  - `customStartTime`, `customEndTime`, `isAllDay`
  - `isPending`, `approvedBy`, `approvedAt` (workflow zatwierdzania)
- [x] TimetablesService z:
  - CRUD grafików i slotów
  - CRUD wyjątków z zatwierdzaniem
  - `getAvailability()` - kalkulacja dostępności pracownika
- [x] TimetablesController z endpointami:
  - `GET /timetables` - lista grafików
  - `GET /timetables/:id` - szczegóły grafiku
  - `POST /timetables` - tworzenie grafiku
  - `PATCH /timetables/:id` - aktualizacja
  - `DELETE /timetables/:id` - usuwanie
  - `GET /timetables/:id/exceptions` - wyjątki
  - `POST /timetables/:id/exceptions` - dodanie wyjątku
  - `PATCH /timetables/exceptions/:id` - edycja wyjątku
  - `DELETE /timetables/exceptions/:id` - usunięcie
  - `POST /timetables/exceptions/:id/approve` - zatwierdzenie
  - `GET /timetables/employees/:id/availability` - dostępność

#### Frontend Grafików

- [x] Types: Timetable, TimetableSlot, TimetableException, EmployeeAvailability
- [x] useTimetables hook (pełne API)
- [x] TimetableEditor (edytor grafiku tygodniowego z przerwami)
- [x] ExceptionModal (dodawanie/edycja wyjątków)
- [x] ExceptionsList (lista wyjątków z zatwierdzaniem)
- [x] Strona /admin/timetables
- [x] Link w AdminSidebarMenu

#### Migracje Grafików

- [x] `1710016000000-CreateTimetablesTables`

### ✅ SMS i Powiadomienia

#### Backend SMS

- [x] SmsModule zarejestrowany w app.module.ts
- [x] MessageTemplate entity:
  - `type` (appointment_reminder, confirmation, cancellation, birthday_wish, follow_up, marketing, custom)
  - `channel` (sms, email, whatsapp)
  - `content` z obsługą zmiennych {{client_name}}, {{date}}, {{time}} itp.
  - `isDefault`, `isActive`, `availableVariables`
- [x] SmsLog entity:
  - `status` (pending, sent, delivered, failed, rejected)
  - `externalId`, `partsCount`, `cost`
  - Relacje: recipientUser, appointment, template, sentBy
- [x] SmsService z:
  - SMSapi.pl integration (configurable)
  - Template CRUD z default template per type
  - `sendSms`, `sendBulkSms`, `sendFromTemplate`
  - `sendAppointmentReminder`
  - Variable substitution for appointments
  - History & statistics
- [x] SmsController z endpointami:
  - `GET/POST/PUT/DELETE /sms/templates`
  - `POST /sms/send`, `POST /sms/send-bulk`
  - `POST /sms/send-from-template`
  - `POST /sms/appointments/:id/reminder`
  - `GET /sms/history`, `GET /sms/stats`

#### Frontend SMS

- [x] Types: MessageTemplate, SmsLog, SmsStats, TemplateType, MessageChannel
- [x] useSms hook (templates, history, stats, mutations)
- [x] TemplatesList (lista szablonów z typami i statusami)
- [x] TemplateModal (tworzenie/edycja z variable insertion)
- [x] SmsComposer (wysyłanie z wyborem szablonu)
- [x] SmsHistory (historia z paginacją)
- [x] Strona /admin/communications (tabs: send, templates, history)
- [x] Link w AdminSidebarMenu

#### Migracje SMS

- [x] `1710017000000-CreateSmsTables` (z domyślnymi szablonami)

---

## Faza 3: Advanced

### ✅ Statystyki i Raporty

#### Backend Statystyk

- [x] StatisticsModule zarejestrowany w app.module.ts
- [x] StatisticsService z:
  - `getDashboard()` - KPI: dziś/tydzień/miesiąc przychody, wizyty, nowi klienci
  - `getRevenueChart()` - wykres przychodów z grupowaniem (dzień/tydzień/miesiąc)
  - `getEmployeeRanking()` - ranking pracowników (przychody, wizyty, napiwki, oceny)
  - `getServiceRanking()` - ranking usług (rezerwacje, przychody, średnia cena)
  - `getClientStats()` - statystyki klientów (nowi, powracający, top klienci)
  - `getCashRegister()` - raport kasowy dzienny (transakcje, sumy per metoda płatności)
  - `getTipsSummary()` - podsumowanie napiwków per pracownik
  - `resolveDateRange()` - helper dla zakresów dat
- [x] StatisticsController z endpointami:
  - `GET /statistics/dashboard` - główne KPI
  - `GET /statistics/revenue` - wykres przychodów
  - `GET /statistics/employees` - ranking pracowników
  - `GET /statistics/services` - ranking usług
  - `GET /statistics/clients` - statystyki klientów
  - `GET /statistics/register` - raport kasowy
  - `GET /statistics/tips` - napiwki
- [x] DTOs: DateRange, GroupBy, DashboardStats, RevenueDataPoint, EmployeeStats, ServiceStats, ClientStats, CashRegisterSummary, TipsSummary

#### Frontend Statystyk

- [x] Types: DateRange (const enum), GroupBy (const enum), DashboardStats, RevenueDataPoint, EmployeeStats, ServiceStats, ClientStatsData, CashRegisterSummary, CashRegisterEntry, TipsSummary
- [x] useStatistics hooks:
  - `useDashboardStats()` - główne KPI z auto-refresh
  - `useRevenueChart()` - wykres z filtrami
  - `useEmployeeRanking()` - ranking pracowników
  - `useServiceRanking()` - ranking usług
  - `useClientStats()` - statystyki klientów
  - `useCashRegister()` - raport kasowy
  - `useTipsRanking()` - napiwki
- [x] Komponenty:
  - KpiCard (karta KPI z trendem i ikoną)
  - RevenueChart (wykres słupkowy z Recharts)
  - EmployeeRanking (tabela z medalami, ocenami)
  - ServiceRanking (tabela z progress bars)
  - DateRangeSelector (wybór zakresu dat)
  - CashRegister (raport kasowy z podsumowaniem)
- [x] Strona /admin/statistics (tabs: Dashboard, Pracownicy, Usługi, Kasa)
- [x] Link w AdminSidebarMenu
- [x] Recharts zainstalowany

### 🟡 Pełny Magazyn

#### ✅ Alerty Stanów Magazynowych

##### Backend Alertów

- [x] StockAlertsService z:
  - `getLowStockProducts()` - produkty poniżej minQuantity
  - `getCriticalStockProducts()` - produkty ze stanem 0 lub <25% minQuantity
  - `getStockAlerts()` - pełny raport z podsumowaniem i sugestiami zamówień
  - `getReorderSuggestionsBySupplierId()` - sugestie dla konkretnego dostawcy
  - `getStockSummary()` - statystyki (total, tracked, low, out of stock, healthy)
  - Priorytetyzacja: critical/high/medium/low
  - Kalkulacja sugerowanych ilości zamówień (150% minQuantity)
  - Szacowanie kosztów zamówień
- [x] StockAlertsController z endpointami:
  - `GET /stock-alerts` - pełny raport alertów
  - `GET /stock-alerts/low-stock` - lista produktów z niskim stanem
  - `GET /stock-alerts/critical` - produkty krytyczne
  - `GET /stock-alerts/summary` - podsumowanie stanów
  - `GET /stock-alerts/suppliers/:id/reorder` - sugestie dla dostawcy

##### Frontend Alertów

- [x] Types: LowStockProduct, ReorderSuggestion, StockAlertsSummary, StockAlertsResponse, StockSummary, StockAlertPriority
- [x] useStockAlerts hooks (pełne API z auto-refresh)
- [x] StockAlertsTab (karty KPI, filtrowanie, grupowanie po dostawcach)
- [x] Zakładka "Alerty" w /admin/warehouse (nowy domyślny widok)

#### ⬜ Rozszerzenia Magazynu (Opcjonalne)

- [ ] Zaawansowana inwentaryzacja z korektami
- [ ] Automatyczne powiadomienia email o niskim stanie
- [ ] Eksport sugestii zamówień do CSV

### ✅ Newslettery i Automatyczne Wiadomości

#### ✅ Backend Automatycznych Wiadomości

- [x] AutomaticMessagesModule zarejestrowany w app.module.ts
- [x] AutomaticMessageRule entity:
  - `trigger` enum: appointment_reminder, appointment_confirmation, appointment_cancellation, follow_up, birthday, inactive_client, new_client, review_request
  - `channel` enum: sms, email, whatsapp
  - `offsetHours` - czas przed/po zdarzeniu (np. -24 = 24h przed)
  - `inactivityDays` - dla trigger inactive_client
  - `sendWindowStart`, `sendWindowEnd` - okno czasowe wysyłki
  - `templateId` - opcjonalne powiązanie z szablonem
  - `content` - własna treść z zmiennymi
  - `serviceIds`, `employeeIds` - filtrowanie po usługach/pracownikach (JSON)
  - `requireSmsConsent`, `requireEmailConsent` - sprawdzanie zgód
  - `isActive`, `sentCount`, `lastSentAt`
- [x] AutomaticMessagesService z:
  - CRUD reguł
  - `processRule()` - przetwarzanie pojedynczej reguły
  - `processAllRules()` - przetwarzanie wszystkich aktywnych
  - `substituteVariables()` - podmiana {{client_first_name}}, {{service_name}} itp.
  - `findEligibleAppointments()` - znajdowanie wizyt dla reminders
  - `findEligibleBirthdays()` - klienci z urodzinami dziś
  - `findInactiveClients()` - klienci bez wizyty X dni
  - Integracja z SmsService (actor opcjonalny dla system messages)
- [x] AutomaticMessagesController z endpointami:
  - `GET /automatic-messages` - lista reguł
  - `GET /automatic-messages/:id` - szczegóły reguły
  - `POST /automatic-messages` - tworzenie
  - `PUT /automatic-messages/:id` - aktualizacja
  - `DELETE /automatic-messages/:id` - usuwanie
  - `PATCH /automatic-messages/:id/toggle` - włączanie/wyłączanie
  - `POST /automatic-messages/process` - manualne przetworzenie wszystkich
  - `POST /automatic-messages/:id/process` - manualne przetworzenie jednej

#### ✅ Frontend Automatycznych Wiadomości

- [x] Types: AutomaticMessageRule, AutomaticMessageTrigger, CreateAutomaticMessageRuleRequest, UpdateAutomaticMessageRuleRequest, ProcessAutomaticMessagesResult
- [x] useAutomaticMessages hook (pełne API)
- [x] AutomaticRulesList (lista reguł z kolorami triggerów, akcjami)
- [x] AutomaticRuleModal (tworzenie/edycja z wstawianiem zmiennych)
- [x] Zakładka "Automatyczne" w /admin/communications

#### ✅ Migracje Automatycznych Wiadomości

- [x] `1710018000000-CreateAutomaticMessageRulesTable` (z domyślnymi regułami)

#### ✅ Newslettery

##### Backend Newsletterów

- [x] NewslettersModule zarejestrowany w app.module.ts
- [x] Newsletter entity:
  - `name`, `subject` - identyfikacja
  - `status` enum: draft, scheduled, sending, sent, partial_failure, failed, cancelled
  - `channel` enum: email, sms
  - `content` - treść wiadomości (HTML dla email)
  - `recipientFilter` - JSON z filtrami odbiorców (groups, tags, gender, hasVisitSince, hasConsent)
  - `recipientIds` - konkretne ID użytkowników (opcjonalne)
  - `totalRecipients`, `sentCount`, `deliveredCount`, `openedCount`, `failedCount` - statystyki
  - `scheduledAt`, `sentAt`, `completedAt` - daty
  - `sendingStartedAt`, `lastError` - monitoring
  - `createdById` - audyt
- [x] NewsletterRecipient entity:
  - `status` enum: pending, sent, delivered, opened, clicked, bounced, failed
  - `sentAt`, `deliveredAt`, `openedAt`, `clickedAt` - tracking
  - `failureReason`, `externalId` - debug
  - Relacje: newsletter, user
- [x] NewslettersService z:
  - CRUD newsletterów
  - `previewRecipients()` - podgląd odbiorców na podstawie filtrów
  - `getRecipientsCount()` - liczba pasujących odbiorców
  - `send()` - wysyłka (natychmiastowa lub zaplanowana)
  - `cancelScheduled()` - anulowanie zaplanowanych
  - `duplicate()` - duplikowanie newslettera
  - `getNewsletterRecipients()` - lista odbiorców ze statusami
  - `getStats()` - globalne statystyki
- [x] NewslettersController z endpointami:
  - `GET /newsletters` - lista newsletterów
  - `GET /newsletters/stats` - statystyki
  - `POST /newsletters/preview-recipients` - podgląd odbiorców
  - `GET /newsletters/:id` - szczegóły
  - `POST /newsletters` - tworzenie
  - `PUT /newsletters/:id` - aktualizacja
  - `DELETE /newsletters/:id` - usuwanie
  - `POST /newsletters/:id/duplicate` - duplikowanie
  - `POST /newsletters/:id/send` - wysyłka
  - `POST /newsletters/:id/cancel` - anulowanie
  - `GET /newsletters/:id/recipients` - odbiorcy

##### Frontend Newsletterów

- [x] Types: Newsletter, NewsletterStatus, NewsletterChannel, NewsletterRecipient, RecipientStatus, RecipientFilter, RecipientPreview, NewsletterStats, CreateNewsletterRequest, UpdateNewsletterRequest
- [x] useNewsletters hooks:
  - `useNewsletters()` - lista newsletterów
  - `useNewsletter(id)` - pojedynczy newsletter
  - `useNewsletterStats()` - statystyki
  - `useNewsletterRecipients(id, status?)` - odbiorcy z filtrowaniem
  - `useNewsletterMutations()` - create, update, delete, duplicate, send, cancel, previewRecipients
- [x] Komponenty:
  - NewslettersList (lista ze statusami, statystykami, akcjami)
  - NewsletterEditorModal (tworzenie/edycja z variable insertion, recipient filtering)
- [x] Zakładka "Newslettery" w /admin/communications
- [x] Integracja z RecipientFilter (grupy, tagi, płeć, wizyty, zgody)

##### Migracje Newsletterów

- [x] `1710019000000-CreateNewslettersTables`

---

## Faza 4: Enterprise

### ✅ Multi-location

#### Backend Multi-location

- [x] BranchesModule zarejestrowany w app.module.ts
- [x] Branch entity:
  - `name`, `slug` (unique), `description`
  - `phone`, `email`, `street`, `buildingNumber`, `postalCode`, `city`, `country`
  - `latitude`, `longitude` (geolokalizacja)
  - `logoUrl`, `coverImageUrl`, `primaryColor`
  - `workingHours` (JSON z godzinami dla każdego dnia)
  - `timezone`, `currency`, `locale`
  - `status` enum: active, inactive, suspended
  - `onlineBookingEnabled`, `bookingUrl`
  - `ownerId` - właściciel salonu
  - `sortOrder`
- [x] BranchMember entity (przypisanie pracowników do salonów):
  - `branchId`, `userId`
  - `branchRole` - rola w danym salonie
  - `isPrimary` - główny salon pracownika
  - `canManage` - czy może zarządzać salonem
  - `isActive`
- [x] BranchesService z:
  - CRUD salonów
  - Zarządzanie członkami (add, update, remove)
  - `getUserBranches()` - salony użytkownika
  - `getUserPrimaryBranch()` - główny salon
  - `canUserAccessBranch()`, `canUserManageBranch()` - autoryzacja
  - `getCrossBranchStats()` - statystyki międzysalonowe
  - Auto-generowanie slug z nazwy
- [x] BranchesController z endpointami:
  - `GET /branches` - lista salonów
  - `GET /branches/my` - moje salony
  - `GET /branches/my/primary` - główny salon
  - `GET /branches/:id` - szczegóły
  - `GET /branches/slug/:slug` - po slug (booking)
  - `POST /branches` - tworzenie
  - `PUT /branches/:id` - aktualizacja
  - `DELETE /branches/:id` - dezaktywacja
  - `GET/POST/PUT/DELETE /branches/:id/members` - zarządzanie członkami
  - `GET /branches/stats/cross-branch` - statystyki

#### Frontend Multi-location

- [x] Types: Branch, BranchMember, BranchStatus, WorkingHours, CreateBranchRequest, UpdateBranchRequest, AddBranchMemberRequest, CrossBranchStats
- [x] useBranches hooks:
  - `useBranches()` - lista salonów
  - `useBranch(id)` - szczegóły salonu
  - `useBranchBySlug()` - po slug
  - `useMyBranches()` - moje salony
  - `useMyPrimaryBranch()` - główny salon
  - `useBranchMembers(branchId)` - członkowie
  - `useCrossBranchStats()` - statystyki
  - `useBranchesMutations()` - create, update, delete, addMember, updateMember, removeMember
- [x] Strona /admin/branches:
  - Lista salonów z kartami (nazwa, miasto, status, kontakt)
  - Modal tworzenia/edycji salonu
  - Zakładka "Pracownicy w salonach" z tabelą członków
- [x] Link w AdminSidebarMenu

#### Migracje Multi-location

- [x] `1710021000000-CreateBranchesTables`

### ⬜ Karty Podarunkowe
- [ ] GiftCard entity
- [ ] Sprzedaż/realizacja

### ⬜ Program Lojalnościowy
- [ ] LoyaltyProgram entity
- [ ] Points system

### ⬜ Integracje
- [ ] Booksy sync
- [ ] Facebook
- [ ] JPK export
- [ ] Google Calendar

---

## Zgodność z Versum UX

| Moduł | Zgodność UI | Uwagi |
|-------|-------------|-------|
| Kalendarz | 🟢 90% | CalendarSidebar, EventCard, FinalizationModal |
| Klienci | 🟢 90% | Zgodne z templates |
| Usługi | 🟢 85% | Kategorie, warianty, przypisania pracowników |
| Magazyn | 🟢 80% | Dostawcy, dostawy, inwentaryzacja |
| Finalizacja | 🟢 85% | PaymentMethod, tips, discounts, product upselling |
| Grafiki | 🟢 85% | Edytor tygodniowy, wyjątki, zatwierdzanie |
| Komunikacja | 🟢 85% | SMS, szablony, historia, automatyczne wiadomości |
| Statystyki | 🟢 85% | Dashboard, wykresy, rankingi, raport kasowy |
| Ustawienia | 🟢 85% | Firma, kalendarz, online booking |

---

## Technologie

### Używane (zgodne z Versum)
- ✅ NestJS (backend)
- ✅ TypeORM + PostgreSQL
- ✅ React Query (state management)
- ✅ Tailwind CSS
- ✅ FullCalendar
- ✅ date-fns (lokalizacja pl)

### Do dodania
- ⬜ React Hook Form + Zod (walidacja)
- ✅ Recharts (wykresy) - ADDED
- ⬜ react-beautiful-dnd (drag & drop)
- ⬜ shadcn/ui (komponenty)
- ⬜ Redis (cache)
- ⬜ Bull/BullMQ (kolejki SMS/email)

---

## Notatki

### Paleta kolorów Versum
```css
--color-primary: #25B4C1
--color-primary-hover: #1f9ba8
--color-success: #28a745
--color-warning: #ffc107
--color-danger: #dc3545
```

### Priorytetowe funkcje do implementacji

1. ~~Moduł Usługi (kategorie + warianty)~~ ✅ DONE
2. ~~Magazyn rozszerzony (suppliers, deliveries, stocktaking)~~ ✅ DONE
3. ~~Finalizacja wizyt (PaymentMethod, FinalizationModal)~~ ✅ DONE
4. ~~Grafiki pracy~~ ✅ DONE
5. ~~SMS przypomnienia~~ ✅ DONE
6. ~~Statystyki i raporty~~ ✅ DONE
7. ~~Automatyczne wiadomości (reminders, birthday wishes)~~ ✅ DONE
8. ~~Alerty niskiego stanu magazynowego~~ ✅ DONE
9. ~~Newslettery (WYSIWYG editor)~~ ✅ DONE

---

*Dokument aktualizowany automatycznie podczas implementacji.*
