# SALON-BW CLONE - ARCHITEKTURA I ROUTING
# Domena frontend: panel.salon-bw.pl
# Domena backend API: api.salon-bw.pl
# Baza wiedzy: pomoc.salon-bw.pl

---

## 1. DOMENY I INFRASTRUKTURA

### Produkcja
- Frontend: https://panel.salon-bw.pl
- Backend API: https://api.salon-bw.pl
- Baza wiedzy: https://pomoc.salon-bw.pl

### Staging
- Frontend: https://staging.panel.salon-bw.pl
- Backend API: https://staging.api.salon-bw.pl

### Dev
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

---

## 2. ROUTING MAP - FRONTEND

### Publiczne
```
/                                    → Login page
/register                            → Rejestracja salonu
/forgot-password                     → Reset hasła
```

### Authenticated (wymagane logowanie)
```
/{salon_slug}                        → Dashboard (Pulpit)
/{salon_slug}/calendar               → Kalendarz (widok domyślny: dzień)
/{salon_slug}/calendar?reset=1       → Kalendarz (reset filtrów)
/{salon_slug}/calendar/views         → Zarządzanie widokami kalendarza (custom views per rola)
/{salon_slug}/customers              → Lista klientów
/{salon_slug}/customers/new          → Formularz: Dodaj klienta
/{salon_slug}/customers/{id}         → Profil klienta (Karta klienta) - podsumowanie
/{salon_slug}/products               → Magazyn / Produkty (tab PRODUKTY)
/{salon_slug}/orders/new             → Magazyn / Dodaj sprzedaż (tab SPRZEDAŻ)
/{salon_slug}/usages/new             → Magazyn / Dodaj zużycie (tab ZUŻYCIE)
/{salon_slug}/deliveries/new         → Magazyn / Dodaj dostawę (tab DOSTAWY)
/{salon_slug}/product_orders         → Magazyn / Dodaj zamówienie (tab ZAMÓWIENIA)
/{salon_slug}/statistics/dashboard   → Statystyki / Raport finansowy
/{salon_slug}/communication          → Łączność / Wiadomości
/{salon_slug}/services               → Usługi / Lista usług
/{salon_slug}/settings               → Ustawienia (hub z ikonami)
/{salon_slug}/extension/             → Dodatki (marketplace)
/{salon_slug}/notification_center/notifications → Centrum powiadomień
/{salon_slug}/settings/employees/activity_logs  → Logi aktywności pracowników
/{salon_slug}/settings/employees/{id}           → Profil pracownika
/{salon_slug}/settings/partner/messages         → Poleć system
/{salon_slug}/helps/new              → Formularz kontaktowy (pomoc)
/{salon_slug}/signout                → Wyloguj (destroy session)
/todo/archives/                      → Archiwum zadań
```

### Query Parameters
```
Dashboard:
  ?period=month|week|last_31_days

Kalendarz:
  ?reset=1                           → reset filtrów
  ?date=2026-02-09                   → konkretna data
  ?employees[]=4272119               → filtr pracownika
  ?event=383700585                   → highlight wizyty
  ?event_service=438582539           → highlight usługi

Klienci:
  ?page=1&per_page=20
  ?search=Marzena
  ?sort=name_asc|name_desc|newest|oldest
  ?filter=today|recent|no_online

Statystyki:
  ?date=2026-02-07

Łączność:
  ?status=read|unread|all
  ?type=sms|email|all
  ?period=09.01.2026:07.02.2026

Activity Logs:
  ?user_id=4272118
  ?activity=signin|event_destroy
```

---

## 3. API ENDPOINTS - BACKEND (api.salon-bw.pl)

### Autentykacja
```
POST   /api/v1/auth/login              → Login (email + password)
POST   /api/v1/auth/logout             → Destroy session
POST   /api/v1/auth/refresh            → Refresh token
GET    /api/v1/auth/me                 → Current user info
POST   /api/v1/auth/forgot-password    → Request password reset
POST   /api/v1/auth/reset-password     → Set new password
```

### Dashboard
```
GET    /api/v1/salons/{id}/dashboard?period=month
       Response: {
         stats: { total_visits, new_customers, revenue, changes... },
         charts: { visits: [{date, value}], customers: [...], revenue: [...] },
         activity_logs: [...last 15],
         upcoming_appointments: [...next 7 days],
         tasks: [...pending]
       }
```

### Appointments (Wizyty)
```
GET    /api/v1/salons/{id}/appointments?date=&view=day|week|month&employees[]=
POST   /api/v1/salons/{id}/appointments
PATCH  /api/v1/salons/{id}/appointments/{id}
DELETE /api/v1/salons/{id}/appointments/{id}
GET    /api/v1/salons/{id}/appointments/{id}
```

### Calendar Views (Widoki kalendarza)
```
GET    /api/v1/salons/{id}/calendar_views
POST   /api/v1/salons/{id}/calendar_views
PATCH  /api/v1/salons/{id}/calendar_views/{id}
DELETE /api/v1/salons/{id}/calendar_views/{id}
```

### Customers (Klienci)
```
GET    /api/v1/salons/{id}/customers?page=&per_page=&search=&sort=&filter=
GET    /api/v1/salons/{id}/customers/{id}
POST   /api/v1/salons/{id}/customers
PATCH  /api/v1/salons/{id}/customers/{id}
DELETE /api/v1/salons/{id}/customers/{id}
GET    /api/v1/salons/{id}/customers/{id}/appointments
GET    /api/v1/salons/{id}/customers/{id}/messages
GET    /api/v1/salons/{id}/customers/{id}/photos
GET    /api/v1/salons/{id}/customers/{id}/files
GET    /api/v1/salons/{id}/customers/{id}/comments
GET    /api/v1/salons/{id}/customers/{id}/statistics
```

### Products (Magazyn - Produkty)
```
GET    /api/v1/salons/{id}/products?category=&type=towar|material
GET    /api/v1/salons/{id}/products/{id}
POST   /api/v1/salons/{id}/products
PATCH  /api/v1/salons/{id}/products/{id}
DELETE /api/v1/salons/{id}/products/{id}
GET    /api/v1/salons/{id}/products/export/excel
```

### Orders (Magazyn - Sprzedaż)
```
GET    /api/v1/salons/{id}/orders
GET    /api/v1/salons/{id}/orders/{id}
POST   /api/v1/salons/{id}/orders
GET    /api/v1/salons/{id}/orders/history
```

### Usages (Magazyn - Zużycie)
```
GET    /api/v1/salons/{id}/usages
POST   /api/v1/salons/{id}/usages
GET    /api/v1/salons/{id}/usages/history
```

### Deliveries (Magazyn - Dostawy)
```
GET    /api/v1/salons/{id}/deliveries
POST   /api/v1/salons/{id}/deliveries
GET    /api/v1/salons/{id}/deliveries/{id}
GET    /api/v1/salons/{id}/deliveries/drafts
GET    /api/v1/salons/{id}/deliveries/history
GET    /api/v1/salons/{id}/deliveries/low_stock
GET    /api/v1/salons/{id}/suppliers
POST   /api/v1/salons/{id}/suppliers
GET    /api/v1/salons/{id}/manufacturers
```

### Product Orders (Magazyn - Zamówienia)
```
GET    /api/v1/salons/{id}/product_orders
POST   /api/v1/salons/{id}/product_orders
GET    /api/v1/salons/{id}/product_orders/{id}
GET    /api/v1/salons/{id}/product_orders/drafts
GET    /api/v1/salons/{id}/product_orders/history
POST   /api/v1/salons/{id}/product_orders/{id}/send
```

### Services (Usługi)
```
GET    /api/v1/salons/{id}/services?category=&search=
GET    /api/v1/salons/{id}/services/{id}
POST   /api/v1/salons/{id}/services
PATCH  /api/v1/salons/{id}/services/{id}
DELETE /api/v1/salons/{id}/services/{id}
GET    /api/v1/salons/{id}/services/categories
POST   /api/v1/salons/{id}/services/categories
GET    /api/v1/salons/{id}/services/export/excel
```

### Statistics (Statystyki)
```
GET    /api/v1/salons/{id}/statistics/financial?date=
GET    /api/v1/salons/{id}/statistics/employees?date=
GET    /api/v1/salons/{id}/statistics/commissions?date=
GET    /api/v1/salons/{id}/statistics/cash_register?date=
GET    /api/v1/salons/{id}/statistics/tips?date=
GET    /api/v1/salons/{id}/statistics/services_report
GET    /api/v1/salons/{id}/statistics/client_retention
GET    /api/v1/salons/{id}/statistics/client_origin
GET    /api/v1/salons/{id}/statistics/product_report
GET    /api/v1/salons/{id}/statistics/work_time
GET    /api/v1/salons/{id}/statistics/export/excel?type=
```

### Messages (Łączność)
```
GET    /api/v1/salons/{id}/messages?status=&type=&period=
POST   /api/v1/salons/{id}/messages/send
POST   /api/v1/salons/{id}/messages/send_bulk
GET    /api/v1/salons/{id}/message_templates
POST   /api/v1/salons/{id}/message_templates
PATCH  /api/v1/salons/{id}/message_templates/{id}
DELETE /api/v1/salons/{id}/message_templates/{id}
```

### Tasks (Zadania)
```
GET    /api/v1/salons/{id}/tasks?status=pending|completed
POST   /api/v1/salons/{id}/tasks
PATCH  /api/v1/salons/{id}/tasks/{id}
DELETE /api/v1/salons/{id}/tasks/{id}
GET    /api/v1/salons/{id}/tasks/archives
```

### Notifications (Powiadomienia)
```
GET    /api/v1/salons/{id}/notifications?status=all|read|unread
PATCH  /api/v1/salons/{id}/notifications/{id}/read
GET    /api/v1/salons/{id}/notifications/alerts
```

### Employees (Pracownicy)
```
GET    /api/v1/salons/{id}/employees
GET    /api/v1/salons/{id}/employees/{id}
POST   /api/v1/salons/{id}/employees
PATCH  /api/v1/salons/{id}/employees/{id}
DELETE /api/v1/salons/{id}/employees/{id}
GET    /api/v1/salons/{id}/activity_logs?user_id=&activity=
```

### Settings (Ustawienia)
```
GET    /api/v1/salons/{id}/settings
PATCH  /api/v1/salons/{id}/settings
GET    /api/v1/salons/{id}/settings/work_schedules
PATCH  /api/v1/salons/{id}/settings/work_schedules
GET    /api/v1/salons/{id}/settings/opening_hours
PATCH  /api/v1/salons/{id}/settings/opening_hours
GET    /api/v1/salons/{id}/settings/online_booking
PATCH  /api/v1/salons/{id}/settings/online_booking
GET    /api/v1/salons/{id}/settings/billing
```

### Extensions (Dodatki)
```
GET    /api/v1/salons/{id}/extensions
GET    /api/v1/salons/{id}/extensions/{id}
PATCH  /api/v1/salons/{id}/extensions/{id}/toggle
```

### Search (Wyszukiwanie globalne)
```
GET    /api/v1/salons/{id}/search?q=
       Response: {
         results: [
           { id, title, type: "customer|service|employee|product", url, meta }
         ],
         total: 15
       }
```

---

## 4. ROLE I UPRAWNIENIA

### Role
| Rola | Kod | Opis |
|------|-----|------|
| Administrator | admin | Pełny dostęp, zarządzanie salonem, pracownikami, ustawieniami |
| Pracownik | employee | Swój kalendarz, odczyt klientów, odczyt usług |
| Recepcjonista | receptionist | Kalendarz wszystkich, klienci, rezerwacje, sprzedaż |

### Matryca Uprawnień
| Moduł | Admin | Pracownik | Recepcjonista |
|-------|-------|-----------|---------------|
| Dashboard (pełny) | ✅ | ❌ | ❌ |
| Dashboard (ograniczony) | ✅ | ✅ | ✅ |
| Kalendarz - wszystcy | ✅ | ❌ | ✅ |
| Kalendarz - swój | ✅ | ✅ | ✅ |
| Klienci - CRUD | ✅ | ❌ | ✅ |
| Klienci - odczyt | ✅ | ✅ | ✅ |
| Magazyn - CRUD | ✅ | ❌ | ❌ |
| Magazyn - sprzedaż | ✅ | ❌ | ✅ |
| Statystyki - pełne | ✅ | ❌ | ❌ |
| Statystyki - swoje | ✅ | ✅ | ❌ |
| Łączność | ✅ | ❌ | ✅ (odczyt) |
| Usługi - CRUD | ✅ | ❌ | ❌ |
| Usługi - odczyt | ✅ | ✅ | ✅ |
| Ustawienia | ✅ | ❌ | ❌ |
| Dodatki | ✅ | ❌ | ❌ |

---

## 5. HEADER - KOMPLETNA SPECYFIKACJA

### Layout
```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] [🏠] │ [🔍 Szukaj...]      │ [🔔7] [📋0] [❓Pomoc▼] [GB▼] │
└────────────────────────────────────────────────────────────────┘
```

### 5.1 Logo + Home
- Logo salon-bw (zastępuje "versum")
- Ikona domku 🏠 → link do /{salon_slug} (pulpit)

### 5.2 Global Search (Szukaj...)
- Placeholder: "Szukaj..."
- Autocomplete po min 2 znakach
- Przeszukuje: klientów (imię, nazwisko, telefon), usługi (nazwa), pracowników (imię), produkty (nazwa, SKU)
- Dropdown z wynikami pogrupowanymi po typie
- Enter lub click → redirect do obiektu
- Escape → zamknij

### 5.3 Powiadomienia (🔔)
- Ikona dzwonka
- Badge: czerwony z liczbą nieprzeczytanych (np. "7")
- Click → redirect do /notification_center/notifications
- Notification Center:
  - Filtr: Status wiadomości (Wszystkie wiadomości ▼)
  - Tabela: Tytuł | Treść | Typ | Data
  - Typy: "nowość w systemie" (niebieski badge)
  - Status: ● = nieodczytana (niebieska kropka), brak = odczytana
  - Click na wiersz → szczegóły powiadomienia

### 5.4 Zadania (📋)
- Ikona listy zadań
- Badge: zielony z liczbą (np. "0")
- Click → dropdown "Twoje zadania"
- Dropdown zawiera listę pending tasks
- Link do archiwum

### 5.5 Pomoc (❓)
- Tekst: "Pomoc ▼"
- Dropdown menu:
  1. 💬 Czat z konsultantem → otwiera chat widget (Freshchat lub custom)
  2. 📝 Formularz kontaktowy → /{salon_slug}/helps/new
  3. 📚 Baza wiedzy → https://pomoc.salon-bw.pl (external link)

### 5.6 User Menu (GB ▼)
- Avatar z inicjałami (w kółku, np. "GB")
- Click → dropdown:
  1. [Avatar] Gniewko Bodora / administrator (link → profil pracownika)
  2. --- separator ---
  3. 🎁 Poleć [Nazwa systemu] → /{salon_slug}/settings/partner/messages
  4. --- separator ---
  5. 🚪 Wyloguj → /{salon_slug}/signout

---

## 6. SIDEBAR - KOMPLETNA SPECYFIKACJA

### Layout
```
┌──────────────────────┐
│ 📅 kalendarz          │  ← ikona + tekst
│ 👥 klienci            │
│ 📦 magazyn            │
│ 📊 statystyki         │
│ 💬 łączność [140]     │  ← badge z liczbą nieprzeczytanych
│ 📋 usługi             │
│ 🔧 ustawienia         │
│ ⭐ dodatki             │
└──────────────────────┘
```

### Stany
- Default: ciemne tło, biały tekst
- Hover: lekki highlight
- Active: podświetlenie (jaśniejszy bg lub niebieski akcent)
- Badge: łączność wyświetla badge z liczbą nieprzeczytanych (np. [140])

### Responsywność
- Desktop: rozwinięty (~50px ikony only lub ~220px z tekstem)
- Mobile: ukryty, toggle hamburger menu

---

## 7. CHAT BOT - PLACEHOLDER

### Lokalizacja
- Prawy dolny róg ekranu
- Floating button (okrągły)
- Ikona: 💬 "Chat"

### Implementacja fazowa
1. Faza 1: Ikona + "Wkrótce" tooltip (placeholder)
2. Faza 2: Widget czatu z konsultantem (live support)
3. Faza 3: AI chatbot (rezerwacje, FAQ, status wizyty)

### Placeholder HTML
```html
<div id="chatbot-container" class="chatbot-floating">
  <button class="chatbot-trigger" aria-label="Chat">
    <svg><!-- chat icon --></svg>
    <span>Chat</span>
  </button>
  <!-- TODO: Phase 3 - AI Chatbot Component -->
</div>
```

---

## 8. BAZA DANYCH - PEŁNY SCHEMAT

### users
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  current_salon_id BIGINT,
  last_sign_in_at TIMESTAMP,
  sign_in_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### salons
```sql
CREATE TABLE salons (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  owner_id BIGINT REFERENCES users(id),
  phone VARCHAR(20),
  email VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  postal_code VARCHAR(10),
  logo_url VARCHAR(500),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  subscription_type VARCHAR(50) DEFAULT 'trial',
  subscription_status VARCHAR(50) DEFAULT 'active',
  timezone VARCHAR(50) DEFAULT 'Europe/Warsaw',
  currency VARCHAR(10) DEFAULT 'PLN',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### employees
```sql
CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  user_id BIGINT REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
  avatar_url VARCHAR(500),
  color VARCHAR(7) DEFAULT '#FF69B4',
  status VARCHAR(50) DEFAULT 'active',
  work_hours JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### customers
```sql
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  gender VARCHAR(20),
  notes TEXT,
  tags TEXT[],
  total_visits INT DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  last_visit_at TIMESTAMP,
  is_first_visit BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### services
```sql
CREATE TABLE services (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  duration_min INT,
  duration_max INT,
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  vat_rate DECIMAL(5,2) DEFAULT 23,
  popularity INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### appointments
```sql
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  customer_id BIGINT REFERENCES customers(id),
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  service_id BIGINT REFERENCES services(id),
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
  price DECIMAL(10,2),
  payment_method VARCHAR(50),
  payment_amount DECIMAL(10,2),
  notes TEXT,
  description TEXT,
  is_first_visit BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### products
```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  product_type VARCHAR(50) DEFAULT 'material',
  sku VARCHAR(100),
  barcode VARCHAR(100),
  unit VARCHAR(20) DEFAULT 'op.',
  quantity DECIMAL(10,2) DEFAULT 0,
  min_quantity DECIMAL(10,2) DEFAULT 0,
  purchase_price_net DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 23,
  supplier_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### suppliers
```sql
CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### orders (sprzedaż produktów)
```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  customer_id BIGINT REFERENCES customers(id),
  employee_id BIGINT REFERENCES employees(id),
  order_date DATE NOT NULL,
  total_gross DECIMAL(10,2) DEFAULT 0,
  total_net DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tip DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### order_items
```sql
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2),
  total_gross DECIMAL(10,2)
);
```

### deliveries (dostawy)
```sql
CREATE TABLE deliveries (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  invoice_number VARCHAR(100),
  delivery_date DATE,
  total_net DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### delivery_items
```sql
CREATE TABLE delivery_items (
  id BIGSERIAL PRIMARY KEY,
  delivery_id BIGINT NOT NULL REFERENCES deliveries(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit_price_net DECIMAL(10,2) NOT NULL,
  total_net DECIMAL(10,2)
);
```

### product_orders (zamówienia do dostawców)
```sql
CREATE TABLE product_orders (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### product_order_items
```sql
CREATE TABLE product_order_items (
  id BIGSERIAL PRIMARY KEY,
  product_order_id BIGINT NOT NULL REFERENCES product_orders(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'op.'
);
```

### tasks
```sql
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to_id BIGINT REFERENCES employees(id),
  assigned_to_type VARCHAR(50),
  priority INT DEFAULT 0,
  due_date DATE,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_datetime TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  created_by_id BIGINT REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### notifications
```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  title VARCHAR(255),
  message TEXT,
  notification_type VARCHAR(50) DEFAULT 'system',
  status VARCHAR(50) DEFAULT 'unread',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### activity_logs
```sql
CREATE TABLE activity_logs (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  user_id BIGINT NOT NULL REFERENCES employees(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### messages
```sql
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  customer_id BIGINT REFERENCES customers(id),
  message_type VARCHAR(50) DEFAULT 'sms',
  template_id BIGINT,
  subject VARCHAR(255),
  content TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### message_templates
```sql
CREATE TABLE message_templates (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  template_type VARCHAR(50) DEFAULT 'sms',
  variables TEXT[],
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### calendar_views
```sql
CREATE TABLE calendar_views (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  view_type VARCHAR(50) DEFAULT 'day',
  roles JSONB DEFAULT '[]',
  filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_by_id BIGINT REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### customer_photos
```sql
CREATE TABLE customer_photos (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  url VARCHAR(500) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### customer_files
```sql
CREATE TABLE customer_files (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  filename VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### customer_comments
```sql
CREATE TABLE customer_comments (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  employee_id BIGINT REFERENCES employees(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### extensions
```sql
CREATE TABLE extensions (
  id BIGSERIAL PRIMARY KEY,
  salon_id BIGINT NOT NULL REFERENCES salons(id),
  extension_type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'inactive',
  config JSONB DEFAULT '{}',
  activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```
