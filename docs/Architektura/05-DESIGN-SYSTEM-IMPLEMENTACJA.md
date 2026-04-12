# SALON-BW CLONE - DESIGN SYSTEM, IMPLEMENTACJA, CHECKLIST

---

## 1. DESIGN SYSTEM

### 1.1 Kolory

#### Primary
- Primary Blue: #4A90E2 (przyciski, linki, active states)
- Primary Dark: #357ABD (hover)
- White: #FFFFFF (tło główne)
- Light Gray BG: #F5F5F5 (tło secondary)

#### Text
- Text Primary: #333333
- Text Secondary: #666666
- Text Muted: #999999
- Text Disabled: #CCCCCC

#### Status
- Success Green: #4CAF50 (aktywny, ↑ wzrost, pierwsza wizyta)
- Error Red: #F44336 (delete, error)
- Warning Orange: #FF9800 (warning, priorytet wysoki)
- Info Blue: #2196F3 (info)

#### Charts
- Chart Blue: #5DADE2 (gradient fill)
- Chart Green: #52C41A (revenue positive)
- Chart Pink: #FF69B4 (pracownik kolor domyślny)
- Chart Gray: #CCCCCC (inactive)

#### Calendar
- Appointment Default: #E0E0E0 (szary)
- Appointment Active: #FF69B4 (różowy - kolor pracownika)
- First Visit: #4CAF50 (zielony label)
- Special Event: #E91E63 (ciemnoróżowy/czerwony - zebranie etc.)
- Closed Day: transparent + tekst "salon nieczynny"
- Time Now Line: #2196F3 (niebieska linia)

#### Sidebar
- Sidebar BG: #4A4A4A (ciemny szary)
- Sidebar Text: #FFFFFF
- Sidebar Hover: rgba(255,255,255,0.1)
- Sidebar Active: #4A90E2

#### Badges
- Notification Badge: #F44336 (czerwony)
- Task Badge: #4CAF50 (zielony)
- Message Badge: #4A90E2 (niebieski)
- SMS Badge: #2196F3 (niebieski)

#### Priority Colors
- Normal (0): #999999 (szary)
- Medium (1): #FF9800 (żółty/pomarańczowy)
- High (2): #FF5722 (pomarańczowy)
- Critical (3): #F44336 (czerwony)

### 1.2 Typografia

Font Family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

#### Rozmiary
- H1 (tytuł strony): 24-28px, bold, #333
- H2 (sekcja): 18-20px, bold, #333
- H3 (podsekcja): 16px, bold, #333
- Body: 14px, regular, #333
- Small: 12px, regular, #666
- Label: 12px, bold, #666
- Badge: 11px, bold, white on color
- Stat Value: 32-36px, bold, #333
- Stat Change: 12px, regular, green/red

#### Line Height
- Headings: 1.3
- Body: 1.6
- Labels: 1.4

### 1.3 Spacing

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

### 1.4 Border & Shadows

#### Border Radius
- Small (inputs, buttons): 3px
- Medium (cards): 6px
- Large (dropdowns, modals): 8px
- Circle (avatars, badges): 50%

#### Borders
- Default: 1px solid #E0E0E0
- Active: 2px solid #4A90E2
- Error: 1px solid #F44336

#### Shadows
- Light: 0 1px 3px rgba(0,0,0,0.08)
- Card: 0 2px 8px rgba(0,0,0,0.1)
- Dropdown: 0 4px 12px rgba(0,0,0,0.15)
- Modal: 0 10px 25px rgba(0,0,0,0.2)

### 1.5 Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
- Wide: > 1440px

### 1.6 Layout Dimensions

- Header Height: 50px
- Sidebar Width (collapsed): 50px
- Sidebar Width (expanded): 220px
- Main Content Padding: 24px
- Card Padding: 16px
- Table Row Height: 48px
- Mini Calendar Width: 200px

### 1.7 Komponenty UI

#### Button Primary
- BG: #4A90E2, Color: white, Radius: 3px, Padding: 8px 16px
- Hover: #357ABD
- Active: #2E6DA4

#### Button Secondary
- BG: white, Border: 1px solid #4A90E2, Color: #4A90E2
- Hover: BG #F0F7FF

#### Button Danger
- BG: #F44336, Color: white

#### Input Field
- Border: 1px solid #CCC, Radius: 3px, Padding: 8px 12px
- Focus: Border #4A90E2, Shadow 0 0 0 3px rgba(74,144,226,0.1)
- Error: Border #F44336

#### Table
- Header BG: #F5F5F5, Border-bottom: 2px solid #DDD
- Row hover: rgba(74,144,226,0.05)
- Cell padding: 12px 16px
- Border-bottom: 1px solid #EEE

#### Card
- BG: white, Radius: 6px, Shadow: card, Padding: 16px

#### Badge
- Radius: 10px, Padding: 2px 8px, Font: 11px bold
- Red: BG #F44336
- Green: BG #4CAF50
- Blue: BG #4A90E2

#### Avatar (inicjały)
- Radius: 50%, Size: 32px, Font: 12px bold
- Kolory: per user (przypisany kolor pracownika)

#### Dropdown
- BG: white, Shadow: dropdown, Radius: 4px
- Item padding: 8px 16px
- Item hover: BG #F5F5F5
- Separator: 1px solid #EEE

#### Modal
- Overlay: rgba(0,0,0,0.5)
- BG: white, Radius: 8px, Shadow: modal
- Max-width: 600px
- Padding: 24px

---

## 2. IMPLEMENTACJA

### 2.1 Tech Stack

#### Frontend
- Framework: Next.js 14+ (React)
- Language: TypeScript
- Styling: Tailwind CSS + SCSS modules
- State: Zustand lub Redux Toolkit
- Forms: React Hook Form + Zod validation
- Charts: Chart.js + react-chartjs-2
- Calendar: FullCalendar (@fullcalendar/react)
- Date: date-fns lub dayjs
- HTTP: Axios
- Tables: TanStack Table
- i18n: next-intl (PL jako default)

#### Backend
- Framework: NestJS (Node.js) lub Ruby on Rails
- Language: TypeScript (NestJS) lub Ruby
- Database: PostgreSQL 15+
- ORM: Prisma (NestJS) lub ActiveRecord (Rails)
- Cache: Redis
- Auth: JWT + refresh tokens
- File Storage: AWS S3 lub MinIO
- SMS: Twilio lub SMSAPI.pl
- Email: SendGrid lub Mailgun
- PDF: Puppeteer lub wkhtmltopdf

#### Infrastructure
- Docker + Docker Compose
- Nginx (reverse proxy)
- Let's Encrypt (SSL)
- GitHub Actions (CI/CD)
- Monitoring: Sentry

### 2.2 Struktura Projektu (Frontend)

```
salon-bw-frontend/
├── public/
│   ├── icons/
│   └── images/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── forgot-password/
│   │   ├── [salonSlug]/
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── calendar/
│   │   │   │   ├── page.tsx
│   │   │   │   └── views/
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx    # Lista
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   ├── products/
│   │   │   │   └── page.tsx
│   │   │   ├── orders/
│   │   │   │   └── new/
│   │   │   ├── deliveries/
│   │   │   │   └── new/
│   │   │   ├── product-orders/
│   │   │   │   └── page.tsx
│   │   │   ├── statistics/
│   │   │   │   └── dashboard/
│   │   │   ├── communication/
│   │   │   │   └── page.tsx
│   │   │   ├── services/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   ├── extension/
│   │   │   │   └── page.tsx
│   │   │   └── notification-center/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── SearchInput.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── ActivityLogs.tsx
│   │   │   ├── UpcomingAppointments.tsx
│   │   │   ├── TasksSection.tsx
│   │   │   ├── TaskEditModal.tsx
│   │   │   └── MiniChart.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── MonthView.tsx
│   │   │   ├── WeekView.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── ReceptionView.tsx
│   │   │   ├── AppointmentBlock.tsx
│   │   │   ├── MiniCalendar.tsx
│   │   │   ├── EmployeeFilter.tsx
│   │   │   └── CalendarControls.tsx
│   │   ├── customers/
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerProfile.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   ├── CustomerSidebar.tsx
│   │   │   └── CustomerFilters.tsx
│   │   ├── products/
│   │   │   ├── ProductList.tsx
│   │   │   ├── SaleForm.tsx
│   │   │   ├── UsageForm.tsx
│   │   │   ├── DeliveryForm.tsx
│   │   │   ├── OrderForm.tsx
│   │   │   └── InventoryView.tsx
│   │   ├── statistics/
│   │   │   ├── FinancialReport.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── EmployeeTable.tsx
│   │   ├── communication/
│   │   │   ├── MessageList.tsx
│   │   │   ├── SendMessageForm.tsx
│   │   │   └── TemplateEditor.tsx
│   │   ├── services/
│   │   │   ├── ServiceList.tsx
│   │   │   └── ServiceForm.tsx
│   │   ├── settings/
│   │   │   └── SettingsHub.tsx
│   │   ├── extensions/
│   │   │   ├── ExtensionGrid.tsx
│   │   │   └── ExtensionCard.tsx
│   │   ├── notifications/
│   │   │   └── NotificationCenter.tsx
│   │   └── chatbot/
│   │       └── ChatBotPlaceholder.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSalon.ts
│   │   ├── usePermissions.ts
│   │   └── useSearch.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── appointments.ts
│   │   ├── customers.ts
│   │   ├── products.ts
│   │   ├── services.ts
│   │   ├── statistics.ts
│   │   └── messages.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── salonStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── models.ts
│   │   ├── api.ts
│   │   └── ui.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── permissions.ts
│   └── styles/
│       ├── globals.scss
│       └── variables.scss
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── Dockerfile
└── docker-compose.yml
```

### 2.3 Docker Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./salon-bw-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.salon-bw.pl
    depends_on:
      - backend

  backend:
    build: ./salon-bw-backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/salon_bw
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
      - SMS_API_KEY=your-sms-key
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=salon_bw
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs

volumes:
  postgres_data:
  redis_data:
```

---

## 3. CHECKLIST IMPLEMENTACJI 1:1

### FAZA 1: Core Setup (Tydzień 1)
- [ ] Inicjalizacja projektu frontend (Next.js + TypeScript)
- [ ] Inicjalizacja projektu backend (NestJS/Rails)
- [ ] Setup PostgreSQL + migracje bazy danych
- [ ] Setup Redis
- [ ] Docker compose configuration
- [ ] Autentykacja (login/logout/refresh)
- [ ] Role-based access control (admin/employee/receptionist)
- [ ] MainLayout (Header + Sidebar + Content)

### FAZA 2: Header & Navigation (Tydzień 1-2)
- [ ] Logo + link do pulpitu
- [ ] Global Search (autocomplete, wyniki pogrupowane)
- [ ] Notification bell + badge + Notification Center
- [ ] Tasks icon + badge + dropdown
- [ ] Help dropdown (czat, formularz, baza wiedzy)
- [ ] User Menu (profil, poleć, wyloguj)
- [ ] Sidebar z 8 modułami + badge łączność
- [ ] Responsive sidebar (collapse on mobile)
- [ ] Chat Bot placeholder (ikona w rogu)

### FAZA 3: Dashboard (Tydzień 2)
- [ ] Alert system (żółty banner + X zamknij)
- [ ] Info banner (turkusowy + CTA)
- [ ] Period selector (miesiąc/tydzień/31 dni)
- [ ] Statistics Cards (3 karty z wykresami)
- [ ] Line Charts (Chart.js)
- [ ] Activity Logs (lista z avatarami)
- [ ] Upcoming Appointments (pogrupowane po datach)
- [ ] Tasks Section (CRUD + modal edycji)
- [ ] Task priorities (4 levels z kolorami)
- [ ] Task reminders (date + time picker)
- [ ] Breadcrumbs

### FAZA 4: Kalendarz (Tydzień 3-4)
- [ ] Mini-kalendarz (sidebar z nawigacją)
- [ ] Employee filter (checkboxy z kolorami)
- [ ] Controls bar (prev/next/today/print/view switch)
- [ ] WIDOK DZIEŃ (timeline + appointment blocks)
- [ ] WIDOK TYDZIEŃ (7 kolumn + godziny)
- [ ] WIDOK MIESIĄC (grid z wizytami)
- [ ] WIDOK RECEPCJA (uproszczony dzień)
- [ ] Appointment Block (klient, usługa, cena, płatność)
- [ ] "pierwsza wizyta" label (zielony)
- [ ] Specjalne zdarzenia (zebranie - czerwony)
- [ ] Metody płatności na bloku (gotówka/karta)
- [ ] "salon nieczynny" label
- [ ] Niebieska linia czasu (live)
- [ ] Godziny pracy pracownika w nagłówku
- [ ] Numer tygodnia (tydz. X)
- [ ] Drag & drop wizyt
- [ ] Double-click → nowa wizyta
- [ ] Print PDF
- [ ] Custom Views (per rola)
- [ ] Button "widok ▲" toggle sidebar

### FAZA 5: Klienci (Tydzień 4-5)
- [ ] Lista klientów (tabela z ikonami)
- [ ] Sidebar filtry (grupy + kryteria)
- [ ] Search autocomplete
- [ ] Sortowanie kolumn
- [ ] Paginacja (per_page selector)
- [ ] Checkbox zaznaczanie
- [ ] Ikony: email, telefon, data, edycja
- [ ] "nie podano" placeholder
- [ ] Profil klienta - podsumowanie
- [ ] Profil klienta - dane osobowe
- [ ] Profil klienta - statystyki
- [ ] Profil klienta - historia wizyt
- [ ] Profil klienta - komentarze
- [ ] Profil klienta - komunikacja
- [ ] Profil klienta - galeria zdjęć
- [ ] Profil klienta - załączone pliki
- [ ] Avatar klienta (upload)
- [ ] Tagi/Grupy klienta
- [ ] Płeć
- [ ] Formularz dodaj/edytuj klienta
- [ ] Zaplanowane vs Zrealizowane wizyty

### FAZA 6: Magazyn (Tydzień 5-6)
- [ ] Tab PRODUKTY (tabela, kategorie, search)
- [ ] Kolumny: nazwa, kategoria, rodzaj, SKU, stan, cena
- [ ] Ikony szybkich akcji (🛒 sprzedaż, 📥 zużycie)
- [ ] Sidebar kategorie + zarządzanie
- [ ] Tab SPRZEDAŻ (formularz: produkty, klient, pracownik, data, rabat, napiwek, płatność)
- [ ] Tab ZUŻYCIE (formularz)
- [ ] Tab DOSTAWY (formularz: dostawca, faktura, data, pozycje)
- [ ] Tab DOSTAWY sidebar: wersje robocze, niski stan, dostawcy, producenci
- [ ] Tab ZAMÓWIENIA (formularz: dostawca, pozycje, wyślij)
- [ ] Tab ZAMÓWIENIA sidebar: wersje robocze, historia
- [ ] Tab INWENTARYZACJA
- [ ] Export Excel (produkty)
- [ ] Dodaj/edytuj/usuń produkt

### FAZA 7: Statystyki (Tydzień 6)
- [ ] Raport finansowy (summary + tabela pracowników)
- [ ] Pie Chart: metody płatności
- [ ] Pie Chart: udział pracowników
- [ ] Date picker z nawigacją
- [ ] Export Excel
- [ ] Print
- [ ] Sidebar: wszystkie typy raportów (10+)
- [ ] Tabela: Pracownik/Wizyty/Czas/Sprzedaż/Utarg/Procent

### FAZA 8: Łączność (Tydzień 7)
- [ ] Lista wiadomości (tabela)
- [ ] Filtry: status, typ, okres, rodzaj
- [ ] Wyślij wiadomość pojedynczą
- [ ] Wyślij wiadomość masową
- [ ] Szablony wiadomości (CRUD)
- [ ] Sidebar: kanały (Facebook, Twitter, Komentarze etc.)
- [ ] SMS gateway integration
- [ ] Email integration

### FAZA 9: Usługi (Tydzień 7)
- [ ] Lista usług (tabela sortowalna)
- [ ] Kolumny: nazwa, kategoria, czas, popularność, cena, VAT
- [ ] Search
- [ ] Kategorie (sidebar + zarządzanie)
- [ ] Dodaj/edytuj/usuń usługę
- [ ] Export Excel cennik

### FAZA 10: Ustawienia (Tydzień 8)
- [ ] Hub z 16 ikonami
- [ ] Grafiki pracy
- [ ] Dane salonu
- [ ] Godziny otwarcia
- [ ] Ustawienia kalendarza
- [ ] Pracownicy (CRUD + role)
- [ ] Ustawienia klientów
- [ ] Rezerwacja online
- [ ] Komentarze
- [ ] Łączność config
- [ ] Komunikacja z klientem
- [ ] Media społecznościowe
- [ ] Faktury i abonament
- [ ] Płatności
- [ ] Premium
- [ ] Inne ustawienia

### FAZA 11: Dodatki (Tydzień 8)
- [ ] Grid 7 dodatków
- [ ] Karta dodatku (ikona, tytuł, opis, status)
- [ ] Toggle aktywacja/dezaktywacja
- [ ] Strona szczegółów dodatku
- [ ] Marketing Automatyczny config

### FAZA 12: Chat Bot (Tydzień 9+)
- [ ] Placeholder ikona
- [ ] Live chat integration (Phase 2)
- [ ] AI chatbot (Phase 3)
- [ ] Rezerwacje przez chat
- [ ] FAQ automatyczne

### FAZA 13: Testing & QA (Tydzień 9-10)
- [ ] Unit tests (models, services)
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Performance testing
- [ ] Mobile responsive testing
- [ ] Cross-browser testing
- [ ] Role-based access testing

### FAZA 14: Deployment (Tydzień 10)
- [ ] Domain setup: panel.salon-bw.pl
- [ ] Domain setup: api.salon-bw.pl
- [ ] SSL certificates
- [ ] Docker production build
- [ ] CI/CD pipeline
- [ ] Monitoring (Sentry)
- [ ] Backup strategy
- [ ] Data migration from Versum

---

## SZACOWANY CZAS: ~10-12 tygodni (1 developer full-time)
## SZACOWANY CZAS: ~5-6 tygodni (2 developers full-time)
