# Instrukcja dla Agenta AI: Budowa Systemu Zarządzania Salonem Beauty

## 1. Przegląd Projektu

### 1.1 Cel
Stworzenie kompleksowego systemu SaaS do zarządzania salonami kosmetycznymi, fryzjerskimi i beauty. System ma być multi-tenant (wielu klientów na jednej instancji) z pełnym panelem administracyjnym.

### 1.2 Nazwa Robocza
**SalonManager** (lub inna nazwa brandowa)

### 1.3 Główni Użytkownicy
- **Właściciele salonów** - pełny dostęp do wszystkich funkcji
- **Pracownicy** - ograniczony dostęp (kalendarz, klienci, usługi)
- **Recepcja** - zarządzanie wizytami bez dostępu do statystyk finansowych
- **Klienci** - panel rezerwacji online (osobna aplikacja/widok)

### 1.4 Kluczowy podział aplikacji (ważne)
- **`dev.salon-bw.pl` (`apps/landing`)** – **tylko wizytówka** (strony publiczne: oferta, galeria, kontakt) + CTA prowadzące do panelu.
- **`panel.salon-bw.pl` (`apps/panel`)** – **pełny klon Versum**: logowanie/rejestracja, dashboard, kalendarz, CRM, magazyn, komunikacja, ustawienia itd.
- **Zasada obowiązkowa:** jeśli jakakolwiek funkcja dashboardu została zrobiona na dev, **musi zostać przeniesiona do panelu**, a z dev usunięta.

---

## 2. Architektura Techniczna

### 2.1 Stack Technologiczny (Rekomendowany)

```
Backend:
├── Framework: Next.js 14+ (App Router) lub NestJS
├── ORM: Prisma
├── Baza danych: PostgreSQL
├── Cache: Redis
├── Queue: Bull/BullMQ (dla wysyłki SMS/email)
├── Auth: NextAuth.js lub własne JWT + OAuth
└── API: REST + GraphQL (opcjonalnie)

Frontend:
├── Framework: React 18+ / Next.js
├── State: Zustand lub Redux Toolkit
├── UI: Tailwind CSS + Headless UI lub shadcn/ui
├── Forms: React Hook Form + Zod
├── Calendar: FullCalendar lub własny komponent
└── Charts: Recharts lub Chart.js

Infrastruktura:
├── Hosting: Vercel / Railway / AWS
├── CDN: Cloudflare
├── Email: Resend / SendGrid
├── SMS: Twilio / SMSapi.pl
└── Payments: Stripe / Przelewy24
```

### 2.2 Struktura Multi-Tenant

```
/[subdomain]/                    # Każdy salon ma własną subdomenę
├── /calendar                    # Kalendarz wizyt
├── /customers                   # Baza klientów
├── /products                    # Magazyn produktów
├── /services                    # Katalog usług
├── /statistics                  # Statystyki i raporty
├── /communication               # SMS, email, newslettery
├── /settings                    # Ustawienia salonu
└── /extension                   # Dodatki i rozszerzenia
```

> **Uwaga:** Powyższa struktura dotyczy **panelu** (aplikacji dashboardowej). Dev to wyłącznie wizytówka i nie powinien zawierać tych ścieżek.

### 2.3 Schemat Bazy Danych (Kluczowe Encje)

```prisma
// Organizacja multi-tenant
model Branch {
  id            String   @id @default(cuid())
  subdomain     String   @unique
  name          String
  address       String?
  phone         String?
  email         String?
  timezone      String   @default("Europe/Warsaw")
  currency      String   @default("PLN")
  isVatPayer    Boolean  @default(false)
  subscriptionPlan SubscriptionPlan @default(BASIC)

  // Relacje
  employees     Employee[]
  customers     Customer[]
  services      Service[]
  products      Product[]
  events        Event[]
  categories    Category[]
  settings      BranchSettings?
}

// Pracownicy
model Employee {
  id            String   @id @default(cuid())
  branchId      String
  branch        Branch   @relation(fields: [branchId], references: [id])

  email         String
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  role          EmployeeRole @default(EMPLOYEE)
  calendarColor String   @default("color1")
  hasCalendar   Boolean  @default(true)
  avatar        String?

  // Relacje
  events        Event[]
  commissions   Commission[]
  timetables    Timetable[]
}

enum EmployeeRole {
  ADMIN
  MANAGER
  EMPLOYEE
  RECEPTIONIST
}

// Klienci
model Customer {
  id            String   @id @default(cuid())
  branchId      String
  branch        Branch   @relation(fields: [branchId], references: [id])

  firstName     String?
  lastName      String?
  email         String?
  phone         String?
  gender        Gender?
  birthDate     DateTime?
  description   String?  @db.Text

  // Marketing
  smsConsent    Boolean  @default(false)
  emailConsent  Boolean  @default(false)
  gdprConsent   Boolean  @default(false)

  // Relacje
  events        Event[]
  groups        CustomerGroup[]
  notes         CustomerNote[]
  tags          Tag[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

// Usługi
model Service {
  id            String   @id @default(cuid())
  branchId      String
  branch        Branch   @relation(fields: [branchId], references: [id])

  name          String
  description   String?
  duration      Int      // minuty
  price         Decimal  @db.Decimal(10, 2)
  priceType     PriceType @default(FIXED)
  categoryId    String?
  category      ServiceCategory? @relation(fields: [categoryId], references: [id])

  isActive      Boolean  @default(true)
  onlineBooking Boolean  @default(true)

  // Relacje
  variants      ServiceVariant[]
  employees     Employee[]
  eventServices EventService[]
}

// Produkty (Magazyn)
model Product {
  id            String   @id @default(cuid())
  branchId      String
  branch        Branch   @relation(fields: [branchId], references: [id])

  name          String
  sku           String?
  barcode       String?
  description   String?

  // Ceny
  purchasePrice Decimal? @db.Decimal(10, 2)
  sellingPrice  Decimal  @db.Decimal(10, 2)
  vatRate       Decimal  @default(23) @db.Decimal(5, 2)

  // Stan magazynowy
  quantity      Decimal  @default(0) @db.Decimal(10, 3)
  minQuantity   Decimal? @db.Decimal(10, 3)
  unit          String   @default("szt")

  // Typ
  productType   ProductType @default(PRODUCT)
  categoryId    String?
  category      ProductCategory? @relation(fields: [categoryId], references: [id])

  isActive      Boolean  @default(true)
}

enum ProductType {
  PRODUCT   // Towar do sprzedaży
  SUPPLY    // Materiał do usług
  UNIVERSAL // Oba
}

// Wizyty/Eventy
model Event {
  id            String   @id @default(cuid())
  branchId      String
  branch        Branch   @relation(fields: [branchId], references: [id])

  customerId    String?
  customer      Customer? @relation(fields: [customerId], references: [id])
  employeeId    String
  employee      Employee @relation(fields: [employeeId], references: [id])

  // Czas
  startTime     DateTime
  endTime       DateTime
  allDay        Boolean  @default(false)

  // Status
  status        EventStatus @default(PENDING)
  finalized     Boolean  @default(false)
  canceled      Boolean  @default(false)

  // Rezerwacja online
  reservedOnline Boolean @default(false)
  reminderSent   Boolean @default(false)

  // Płatność
  totalPrice    Decimal? @db.Decimal(10, 2)
  paymentMethod PaymentMethod?
  paidAt        DateTime?

  description   String?  @db.Text
  internalNote  String?  @db.Text

  // Relacje
  services      EventService[]
  products      EventProduct[]
  tags          Tag[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum EventStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELED
  NO_SHOW
}

enum PaymentMethod {
  CASH
  CARD
  TRANSFER
  ONLINE
  VOUCHER
}
```

---

## 3. Moduły Funkcjonalne

### 3.1 MODUŁ: Kalendarz (Priorytet: KRYTYCZNY)

#### Funkcjonalności:
```
├── Widoki kalendarza
│   ├── Dzienny (domyślny)
│   ├── Tygodniowy
│   ├── Miesięczny
│   └── Lista (agenda)
│
├── Zarządzanie wizytami
│   ├── Tworzenie wizyty (modal/popup)
│   │   ├── Wybór klienta (autocomplete + możliwość dodania nowego)
│   │   ├── Wybór pracownika
│   │   ├── Wybór usług (multi-select z sumowaniem czasu i ceny)
│   │   ├── Wybór daty i godziny (drag & drop na kalendarzu)
│   │   ├── Notatki/opis
│   │   └── Tagi (np. "rez. online", "pierwsza wizyta")
│   │
│   ├── Edycja wizyty
│   │   ├── Przeciąganie (zmiana godziny)
│   │   ├── Rozciąganie (zmiana długości)
│   │   └── Edycja szczegółów
│   │
│   ├── Finalizacja wizyty
│   │   ├── Potwierdzenie usług
│   │   ├── Dodanie produktów (sprzedaż)
│   │   ├── Wybór metody płatności
│   │   └── Generowanie paragonu/faktury
│   │
│   └── Anulowanie wizyty
│       ├── Powód anulowania
│       └── Wysyłka SMS/email
│
├── Przypomnienia
│   ├── SMS przed wizytą (konfigurowalne: 24h, 2h, itp.)
│   ├── Email przed wizytą
│   └── Push notification (opcjonalnie)
│
├── Widoki pracowników
│   ├── Filtrowanie po pracownikach
│   ├── Widok "wszystkich" vs "wybranego"
│   └── Zapisywane widoki (custom views)
│
└── Blokady czasu
    ├── Urlopy
    ├── Przerwy
    └── Szkolenia
```

#### Komponenty UI:
```tsx
// Główne komponenty kalendarza
<CalendarView>
  <CalendarHeader>
    <DateNavigation />      // Nawigacja między datami
    <ViewSwitcher />        // Przełącznik widoków
    <EmployeeFilter />      // Filtr pracowników
    <PrintButton />         // Drukowanie grafiku
  </CalendarHeader>

  <CalendarSidebar>
    <MiniCalendar />        // Mały kalendarz do nawigacji
    <EmployeeList />        // Lista pracowników z checkboxami
    <ViewManager />         // Zarządzanie zapisanymi widokami
  </CalendarSidebar>

  <CalendarGrid>
    <TimeColumn />          // Kolumna z godzinami
    <EmployeeColumns>       // Kolumny pracowników
      <EventCard />         // Karta wizyty (draggable)
      <BlockedTime />       // Zablokowany czas
    </EmployeeColumns>
  </CalendarGrid>
</CalendarView>

<EventModal>               // Modal tworzenia/edycji wizyty
  <CustomerSelect />       // Autocomplete klienta
  <ServiceMultiSelect />   // Wybór usług
  <TimeSlotPicker />       // Wybór czasu
  <NotesInput />           // Notatki
  <TagsSelect />           // Tagi
  <ActionButtons />        // Zapisz/Anuluj
</EventModal>
```

### 3.2 MODUŁ: Klienci (CRM)

#### Funkcjonalności:
```
├── Lista klientów
│   ├── Wyszukiwanie (imię, nazwisko, telefon, email)
│   ├── Filtry zaawansowane
│   │   ├── Płeć
│   │   ├── Wiek
│   │   ├── Grupy klientów
│   │   ├── Skorzystali z usług
│   │   ├── Kupili produkty
│   │   ├── Wydali w salonie (zakres kwot)
│   │   ├── Data dodania
│   │   ├── Mają wizytę w okresie
│   │   ├── Nie mieli wizyty od X dni
│   │   └── Zgody RODO
│   │
│   ├── Grupy predefiniowane
│   │   ├── Wszyscy klienci
│   │   ├── Umówieni na dzisiaj
│   │   ├── Ostatnio dodani
│   │   └── Nie rezerwują online
│   │
│   └── Grupy własne (edytowalne)
│
├── Karta klienta
│   ├── Podsumowanie
│   │   ├── Podstawowe dane
│   │   ├── Ostatnia wizyta
│   │   ├── Następna wizyta
│   │   ├── Liczba wizyt
│   │   └── Suma wydatków
│   │
│   ├── Dane osobowe
│   │   ├── Imię, nazwisko
│   │   ├── Telefon, email
│   │   ├── Adres
│   │   ├── Data urodzenia
│   │   ├── Płeć
│   │   └── Pola własne (extra fields)
│   │
│   ├── Statystyki
│   │   ├── Wykres wydatków w czasie
│   │   ├── Najczęściej wybierane usługi
│   │   ├── Ulubiony pracownik
│   │   └── Średnia wartość wizyty
│   │
│   ├── Historia wizyt
│   │   ├── Lista wszystkich wizyt
│   │   ├── Szczegóły każdej wizyty
│   │   └── Filtrowanie po dacie
│   │
│   ├── Zakupy produktów
│   ├── Notatki (timeline)
│   ├── Zgody (RODO)
│   └── Opinie
│
├── Akcje masowe
│   ├── Eksport do Excel
│   ├── Wysyłka SMS
│   ├── Wysyłka email
│   ├── Dodaj do grupy
│   └── Usuń z grupy
│
└── Ankiety zdrowotne (opcjonalnie)
```

#### Komponenty UI:
```tsx
<CustomersModule>
  <CustomersSidebar>
    <CustomerSearch />
    <CustomerGroups>
      <PredefinedGroups />   // Wszyscy, Dzisiaj, Ostatnio dodani
      <CustomGroups />       // Własne grupy
    </CustomerGroups>
    <FilterCriteria />       // Filtry zaawansowane
  </CustomersSidebar>

  <CustomersContent>
    <CustomersList>          // Lista z paginacją
      <CustomerRow />        // Wiersz klienta
    </CustomersList>

    // LUB (przy wybranym kliencie)

    <CustomerCard>
      <CustomerTabs>
        <SummaryTab />
        <PersonalDataTab />
        <StatisticsTab />
        <VisitHistoryTab />
        <NotesTab />
      </CustomerTabs>
    </CustomerCard>
  </CustomersContent>
</CustomersModule>
```

### 3.3 MODUŁ: Magazyn (Produkty)

#### Funkcjonalności:
```
├── Produkty
│   ├── Lista produktów
│   │   ├── Wyszukiwanie
│   │   ├── Filtrowanie po kategorii
│   │   ├── Filtrowanie po typie (towar/materiał)
│   │   └── Sortowanie
│   │
│   ├── Karta produktu
│   │   ├── Dane podstawowe
│   │   ├── Ceny (zakupu, sprzedaży)
│   │   ├── Stan magazynowy
│   │   ├── Historia zmian stanu
│   │   └── Statystyki sprzedaży
│   │
│   └── Kategorie (drzewo hierarchiczne)
│
├── Sprzedaż (Orders)
│   ├── Nowa sprzedaż (bez wizyty)
│   ├── Lista sprzedaży
│   └── Szczegóły sprzedaży
│
├── Zużycie (Use)
│   ├── Rejestracja zużycia materiałów
│   ├── Powiązanie z wizytą
│   └── Historia zużycia
│
├── Dostawy (Deliveries)
│   ├── Przyjęcie dostawy
│   │   ├── Wybór dostawcy
│   │   ├── Lista produktów + ilości
│   │   ├── Ceny zakupu
│   │   └── Numer faktury/WZ
│   │
│   └── Historia dostaw
│
├── Zamówienia do dostawców
│   ├── Tworzenie zamówienia
│   ├── Na podstawie stanów minimalnych
│   └── Historia zamówień
│
├── Inwentaryzacja
│   ├── Nowa inwentaryzacja
│   ├── Wprowadzanie stanów rzeczywistych
│   ├── Raport różnic
│   └── Zatwierdzenie (korekta stanów)
│
└── Alerty
    ├── Niski stan magazynowy
    └── Produkty poniżej minimum
```

### 3.4 MODUŁ: Statystyki

#### Funkcjonalności:
```
├── Dashboard
│   ├── Przychody (dziś/tydzień/miesiąc)
│   ├── Liczba wizyt
│   ├── Nowi klienci
│   ├── Powracający klienci (%)
│   ├── Średnia wartość wizyty
│   └── Top usługi/produkty
│
├── Statystyki pracowników
│   ├── Przychody per pracownik
│   ├── Liczba wizyt
│   ├── Średnia ocena
│   └── Porównanie okresów
│
├── Statystyki usług
│   ├── Najpopularniejsze usługi
│   ├── Przychody z usług
│   └── Trendy
│
├── Statystyki klientów
│   ├── Źródła pozyskania
│   ├── Retencja
│   └── Wartość życiowa (LTV)
│
├── Raporty kasowe
│   ├── Stan kasy
│   ├── Historia operacji
│   └── Zamknięcie dnia
│
├── Napiwki
│   ├── Suma napiwków
│   └── Per pracownik
│
└── Eksporty (Excel)
    ├── Raport finansowy
    ├── Raport kasowy
    ├── Lista dostaw
    ├── Raport magazynowy
    └── Usługi per pracownik
```

### 3.5 MODUŁ: Komunikacja

#### Funkcjonalności:
```
├── Wiadomości SMS
│   ├── Pojedyncze (do klienta)
│   ├── Masowe (do grupy/filtra)
│   ├── Historia wysłanych
│   └── Szablony wiadomości
│
├── Newslettery (Email)
│   ├── Kreator newslettera
│   ├── Szablony
│   ├── Planowanie wysyłki
│   └── Statystyki (open rate, click rate)
│
├── Wiadomości automatyczne
│   ├── Przypomnienie o wizycie
│   ├── Życzenia urodzinowe
│   ├── Podziękowanie po wizycie
│   ├── Zaproszenie do rezerwacji (nie było X dni)
│   └── Własne reguły
│
├── Przypomnienia o wizytach
│   ├── Konfiguracja czasu (24h, 2h przed)
│   ├── Treść SMS
│   ├── Treść email
│   └── Włącz/wyłącz per typ
│
└── Social Media (opcjonalnie)
    ├── Publikowanie postów
    └── Integracja FB/Instagram
```

### 3.6 MODUŁ: Usługi

#### Funkcjonalności:
```
├── Katalog usług
│   ├── Lista usług
│   ├── Kategorie (branże)
│   └── Sortowanie (drag & drop)
│
├── Usługa
│   ├── Nazwa
│   ├── Opis
│   ├── Czas trwania
│   ├── Cena (stała/od)
│   ├── Warianty usługi
│   ├── Przypisani pracownicy
│   ├── Dostępność online
│   └── Prowizje
│
└── Warianty usług
    ├── Np. "Strzyżenie damskie - krótkie/średnie/długie"
    └── Różne ceny i czasy
```

### 3.7 MODUŁ: Ustawienia

#### Funkcjonalności:
```
├── Dane firmy
│   ├── Nazwa, adres, NIP
│   ├── Logo
│   ├── Dane kontaktowe
│   └── Godziny otwarcia
│
├── Pracownicy
│   ├── Lista pracowników
│   ├── Dodawanie/edycja
│   ├── Uprawnienia (role)
│   ├── Logi aktywności
│   └── Prowizje
│
├── Grafik pracy
│   ├── Harmonogram tygodniowy
│   ├── Wyjątki (urlopy, dni wolne)
│   ├── Szablony grafików
│   └── Podsumowanie godzin
│
├── Kalendarz
│   ├── Domyślny widok
│   ├── Przedziały czasowe (15/30/60 min)
│   ├── Godziny pracy
│   └── Kolory pracowników
│
├── Panel klienta (rezerwacje online)
│   ├── Włącz/wyłącz
│   ├── Dostępne usługi
│   ├── Dostępni pracownicy
│   ├── Wyprzedzenie rezerwacji
│   ├── Wygląd (logo, kolory)
│   └── Powiadomienia
│
├── Płatności
│   ├── Metody płatności
│   ├── Konfiguracja terminala
│   ├── Stawki VAT
│   └── Integracja z kasą fiskalną
│
├── SMS
│   ├── Własny nadawca
│   ├── Szablony
│   └── Konfiguracja bramki
│
├── RODO / Ochrona danych
│   ├── Zgody do zbierania
│   ├── Logi dostępu
│   └── Eksport/usunięcie danych
│
└── Subskrypcja
    ├── Aktualny plan
    ├── Historia płatności
    └── Zmiana planu
```

---

## 4. Wzorce UI/UX

### 4.1 Layout Główny

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVBAR (fixed top)                                              │
│ ┌─────────┬──────────────────────────────┬───────────────────┐ │
│ │  LOGO   │     Global Search            │ Help │ User Menu │ │
│ └─────────┴──────────────────────────────┴───────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────┬─────────────────────────────────────────────────┐  │
│ │         │                                                 │  │
│ │ SIDEBAR │              MAIN CONTENT                       │  │
│ │ (mainnav│                                                 │  │
│ │  icons) │  ┌───────────────────────────────────────────┐  │  │
│ │         │  │ SIDENAV (contextual, per module)          │  │  │
│ │ kalendarz  │                                           │  │  │
│ │ klienci │  │  - Filtry                                 │  │  │
│ │ magazyn │  │  - Kategorie                              │  │  │
│ │ statyst.│  │  - Grupy                                  │  │  │
│ │ łączność│  │                                           │  │  │
│ │ usługi  │  └───────────────────────────────────────────┘  │  │
│ │ ustawien│                                                 │  │
│ │         │  ┌───────────────────────────────────────────┐  │  │
│ │ ─────── │  │                                           │  │  │
│ │ dodatki │  │           CONTENT AREA                    │  │  │
│ │         │  │                                           │  │  │
│ └─────────┴──┴───────────────────────────────────────────┘  │  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Paleta Kolorów

```css
:root {
  /* Primary */
  --color-primary: #25B4C1;        /* Główny kolor brandowy */
  --color-primary-hover: #1f9ba8;
  --color-primary-light: #e6f7f9;

  /* Status */
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-danger: #dc3545;
  --color-info: #17a2b8;

  /* Neutrals */
  --color-text: #333333;
  --color-text-muted: #666666;
  --color-border: #e0e0e0;
  --color-bg: #f5f5f5;
  --color-bg-white: #ffffff;

  /* Calendar colors (dla pracowników) */
  --color1: #4A90D9;
  --color2: #7B68EE;
  --color3: #FF6B6B;
  --color4: #4ECDC4;
  --color5: #FFA07A;
  --color6: #98D8C8;
  --color7: #F7DC6F;
  --color8: #BB8FCE;
  --color9: #85C1E9;
  --color10: #F8B500;
}
```

### 4.3 Typografia

```css
body {
  font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  line-height: 1.4;
}

h1 { font-size: 24px; font-weight: 600; }
h2 { font-size: 20px; font-weight: 600; }
h3 { font-size: 18px; font-weight: 600; }
h4 { font-size: 16px; font-weight: 600; }

.text-small { font-size: 12px; }
.text-muted { color: var(--color-text-muted); }
```

### 4.4 Komponenty Wspólne

```tsx
// Button variants
<Button variant="primary">Zapisz</Button>
<Button variant="secondary">Anuluj</Button>
<Button variant="danger">Usuń</Button>
<Button variant="outline">Dodaj</Button>

// Form inputs
<Input label="Imię" required />
<Select label="Pracownik" options={employees} />
<DatePicker label="Data" />
<TimePicker label="Godzina" />
<Textarea label="Opis" />
<Checkbox label="Zgoda marketingowa" />

// Feedback
<Alert type="success">Zapisano pomyślnie</Alert>
<Alert type="error">Wystąpił błąd</Alert>
<Toast message="Operacja zakończona" />

// Data display
<Badge variant="success">Aktywny</Badge>
<Badge variant="warning">Oczekuje</Badge>
<Table columns={columns} data={data} />
<Pagination total={100} perPage={20} />

// Overlays
<Modal title="Nowa wizyta" onClose={handleClose}>
  <ModalContent />
</Modal>
<Dropdown items={items} />
<Tooltip content="Pomoc">?</Tooltip>
```

---

## 5. API Endpoints (REST)

### 5.1 Struktura

```
/api/v1/{branch_subdomain}/
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   └── GET  /me
│
├── /calendar
│   ├── GET    /events?date=&employee_id=
│   ├── POST   /events
│   ├── PUT    /events/:id
│   ├── DELETE /events/:id
│   ├── POST   /events/:id/finalize
│   └── POST   /events/:id/cancel
│
├── /customers
│   ├── GET    /              (list + filters)
│   ├── GET    /:id
│   ├── POST   /
│   ├── PUT    /:id
│   ├── DELETE /:id
│   ├── GET    /:id/events
│   ├── GET    /:id/statistics
│   └── POST   /:id/notes
│
├── /services
│   ├── GET    /
│   ├── GET    /:id
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
│
├── /products
│   ├── GET    /
│   ├── GET    /:id
│   ├── POST   /
│   ├── PUT    /:id
│   ├── DELETE /:id
│   └── GET    /low-stock
│
├── /orders (sprzedaż)
│   ├── GET    /
│   ├── POST   /
│   └── GET    /:id
│
├── /deliveries
│   ├── GET    /
│   ├── POST   /
│   └── GET    /:id
│
├── /employees
│   ├── GET    /
│   ├── GET    /:id
│   ├── POST   /
│   ├── PUT    /:id
│   └── GET    /:id/timetable
│
├── /statistics
│   ├── GET    /dashboard
│   ├── GET    /employees
│   ├── GET    /services
│   ├── GET    /customers
│   └── GET    /register
│
├── /communication
│   ├── POST   /sms
│   ├── POST   /email
│   ├── GET    /messages
│   └── GET    /templates
│
└── /settings
    ├── GET    /branch
    ├── PUT    /branch
    ├── GET    /customer-panel
    └── PUT    /customer-panel
```

---

## 6. Fazy Implementacji

### FAZA 1: MVP (4-6 tygodni)
```
✅ Uwierzytelnianie (login, role)
✅ Kalendarz (podstawowy widok, CRUD wizyt)
✅ Klienci (lista, karta, CRUD)
✅ Usługi (lista, CRUD)
✅ Podstawowe ustawienia
```

### FAZA 2: Core Business (4-6 tygodni)
```
✅ Finalizacja wizyt z płatnościami
✅ Produkty i magazyn (podstawowy)
✅ Pracownicy z grafikiem
✅ Przypomnienia SMS
✅ Panel rezerwacji online (basic)
```

### FAZA 3: Advanced (4-6 tygodni)
```
✅ Statystyki i raporty
✅ Pełny magazyn (dostawy, zużycie, inwentaryzacja)
✅ Newslettery
✅ Wiadomości automatyczne
✅ System opinii
```

### FAZA 4: Enterprise (ongoing)
```
✅ Multi-location (wiele salonów)
✅ Karty podarunkowe
✅ Program lojalnościowy
✅ Integracje (Booksy, FB, księgowość)
✅ Aplikacja mobilna
```

---

## 7. Wskazówki dla Agenta

### 7.1 Priorytety
1. **Kalendarz jest NAJWAŻNIEJSZY** - to serce systemu
2. **Responsywność** - system musi działać na tabletach w salonie
3. **Szybkość** - operacje muszą być natychmiastowe
4. **Offline-first** (opcjonalnie) - podstawowe funkcje bez internetu

### 7.2 Code Quality
- TypeScript wszędzie
- Testy jednostkowe dla logiki biznesowej
- E2E testy dla krytycznych ścieżek (rezerwacja wizyty, finalizacja)
- Walidacja formularzy (Zod)
- Error handling z sensownymi komunikatami

### 7.3 Security
- Weryfikacja uprawnień na każdym endpoint
- Rate limiting
- Sanityzacja inputów
- Szyfrowanie danych wrażliwych
- Audit log dla ważnych operacji

### 7.4 Performance
- Lazy loading modułów
- Virtualizacja długich list
- Caching (Redis)
- Optymalizacja zapytań DB (indeksy, eager loading)
- CDN dla statycznych zasobów

---

## 8. Przykładowe User Stories

```gherkin
Feature: Rezerwacja wizyty
  Scenario: Recepcjonistka rezerwuje wizytę dla klienta
    Given jestem zalogowana jako recepcjonistka
    And otwieram kalendarz na dzień 2026-01-25
    When klikam na wolny slot o 10:00 u Aleksandry
    Then otwiera się modal nowej wizyty
    When wpisuję "Kowal" w pole klienta
    And wybieram "Anna Kowalska" z podpowiedzi
    And wybieram usługę "Strzyżenie damskie"
    And klikam "Zapisz"
    Then wizyta pojawia się w kalendarzu
    And klient otrzymuje SMS z potwierdzeniem

Feature: Finalizacja wizyty
  Scenario: Pracownik finalizuje wizytę z płatnością
    Given mam otwartą wizytę klienta
    When klikam "Finalizuj"
    Then widzę podsumowanie (usługi, cena)
    When dodaję produkt "Szampon Wella" do sprzedaży
    And wybieram płatność "Karta"
    And klikam "Zakończ i wydrukuj paragon"
    Then wizyta zostaje oznaczona jako zakończona
    And generuje się paragon
    And stan magazynowy szamponu zmniejsza się o 1
```

---

## 9. Zasoby Referencyjne

### Katalog `/dump`
Zawiera ~23 000 stron HTML z oryginalnego systemu Versum - wykorzystaj jako referencję dla:
- Struktury URL i routingu
- Layoutu i komponentów UI
- Nazewnictwa pól i encji
- Przepływów użytkownika

### Katalog `/static_preview/templates`
Zawiera oczyszczone szablony HTML z wyekstrahowanymi stylami - wykorzystaj jako:
- Bazę dla komponentów React
- Referencję stylów CSS
- Ikony SVG (sprites)

---

*Dokument przygotowany jako instrukcja dla agenta AI do implementacji systemu typu Versum.*
*Wersja: 1.0 | Data: Styczeń 2026*
