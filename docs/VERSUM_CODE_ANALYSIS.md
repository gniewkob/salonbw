# Analiza Kodu Źródłowego: Versum vs Nasz Panel

**Data:** 2026-02-06  
**Metoda:** Analiza HTML/CSS/JS + porównanie z naszym kodem

---

## 🔍 Struktura HTML/CSS Versum

### 1. Framework CSS
- **Bootstrap 3** (klasy: `row`, `col-sm-4`, `navbar`, `table`, `dropdown-menu`)
- **Font:** Open Sans (Google Fonts) + Lato
- **Custom CSS:** `new-ui-*.css`, `responsive-*.css` z CDN

### 2. Layout Główny

```html
<div class="main-container" id="main-container">
  <div class="sidebar hidden-print" id="sidebar">
    <div class="mainnav" id="mainnav">
      <ul class="nav" e2e-main-nav="">
        <li class="calendar" tooltip="kalendarz">
          <a href="/salonblackandwhite/calendar?reset=1">
            <div><svg class="svg-calendar-nav"><use xlink:href="#svg-calendar-nav"></use></svg></div>
            <span>kalendarz</span>
          </a>
        </li>
        <!-- ... pozostałe moduły -->
      </ul>
    </div>
  </div>
  <div class="main-content" id="main-content" role="main">
    <!-- Content -->
  </div>
</div>
```

### 3. Nawigacja Główna (8 elementów)

| Moduł | Klasa CSS | Ikona SVG |
|-------|-----------|-----------|
| Kalendarz | `calendar` | `svg-calendar-nav` |
| Klienci | `customers` | `svg-customers-nav` |
| Magazyn | `stock` | `svg-stock-nav` |
| Statystyki | `statistics` | `svg-statistics-nav` |
| Łączność | `communication` | `svg-communication-nav` |
| Usługi | `services` | `svg-services-nav` |
| Ustawienia | `settings` | `svg-settings-nav` |
| Dodatki | `extensions` | `svg-extensions-nav` |

### 4. Sidebar w Module Klientów

**WERSUM - Lista klientów:**
```html
<!-- LEWY SIDEBAR -->
<div class="sidebar-content">
  <h4>Grupy klientów</h4>
  <ul>
    <li><a href="#">wszyscy klienci</a></li>
    <li><a href="#">Umówieni na dzisiaj</a></li>
    <li><a href="#">Ostatnio dodani</a></li>
    <li><a href="#">Nie rezerwują online</a></li>
    <li><a href="#">więcej</a></li>
  </ul>
  
  <h4>Wybierz kryteria</h4>
  <ul>
    <li><a href="#">skorzystali z usług</a></li>
    <li><a href="#">mają wizytę w salonie</a></li>
    <li><a href="#">obsługiwani przez pracowników</a></li>
    <li><a href="#">więcej</a></li>
  </ul>
</div>

<!-- GŁÓWNA TREŚĆ -->
<div class="main-content">
  <!-- Breadcrumbs -->
  <ul class="breadcrumbs">
    <li><a href="/salonblackandwhite/customers">Klienci</a></li>
    <li>/ Lista klientów</li>
  </ul>
  
  <!-- Toolbar -->
  <div class="actions">
    <input type="text" placeholder="wyszukaj klienta">
    <button class="button-dropdown">nazwisko: od A do Z</button>
    <a href="/salonblackandwhite/customers/new" class="button button-blue">Dodaj klienta</a>
  </div>
  
  <!-- Tabela -->
  <table>
    <thead>
      <tr>
        <th><input type="checkbox"> zaznacz wszystkich (0)</th>
        <th>Nazwa</th>
        <th>Telefon</th>
        <th>Ostatnia wizyta</th>
      </tr>
    </thead>
    <tbody>
      <!-- Wiersze z klientami -->
    </tbody>
  </table>
  
  <!-- Paginacja -->
  <div class="pagination">
    Pozycje od 1 do 20 z 785 | na stronie
    <select><option>20 wyników</option></select>
    <input type="text" value="1"> z 40
    <a href="?page=2">→</a>
  </div>
</div>
```

### 5. Karta Klienta (Szczegóły)

**WERSUM - Zakładki:**
```html
<div class="customer-card-sidebar">
  <h4>Karta klienta</h4>
  <div class="customer-name">Marzena Adamska</div>
  <ul class="nav-tabs">
    <li class="active"><a href="?tab_name=summary">podsumowanie</a></li>
    <li><a href="?tab_name=personal_data">dane osobowe</a></li>
    <li><a href="?tab_name=statistics">statystyki</a></li>
    <li><a href="?tab_name=events_history">historia wizyt</a></li>
    <li><a href="?tab_name=opinions">komentarze</a></li>  <!-- BRAKUJE U NAS -->
    <li><a href="?tab_name=communication_preferences">komunikacja</a></li>
    <li><a href="?tab_name=gallery">galeria zdjęć</a></li>
    <li><a href="?tab_name=files">załączone pliki</a></li>
  </ul>
</div>

<!-- Główna treść zakładki "podsumowanie" -->
<div class="customer-summary">
  <h2>Marzena Adamska</h2>
  <div class="contact-info">
    <a href="tel:+48691433821">+48 691 433 821</a>
    <span>email: nie podano</span>
    <div class="groups">
      <strong>należy do grup:</strong> RODO, Sylwester, WRACAM  <!-- BRAKUJE U NAS -->
    </div>
    <div class="description">
      <strong>opis:</strong> brak opisu
      <a href="#">edytuj opis</a>  <!-- BRAKUJE U NAS -->
    </div>
    <span>płeć: Kobieta</span>
    <span>data dodania: 23.08.2017</span>
  </div>
  
  <!-- Wizyty -->
  <div class="visits-section">
    <div class="upcoming">
      <h4>zaplanowane wizyty: 1</h4>
      <!-- lista wizyt -->
    </div>
    <div class="completed">
      <h4>zrealizowane wizyty: 24</h4>
      <!-- lista wizyt -->
    </div>
  </div>
</div>
```

---

## 📊 Porównanie: Versum vs Nasz Panel

### ✅ CO MAMY (Gotowe)

#### 1. Kalendarz (90%)
- ✅ Vendored calendar z Versum działa
- ✅ Wszystkie widoki (miesiąc/tydzień/dzień/recepcja)
- ✅ Finalizacja i no-show
- ⚠️ Pixel parity - do przetestowania

#### 2. Klienci - Backend (100%)
- ✅ CRUD klientów
- ✅ Grupy klientów (API: `GET /customer-groups`)
- ✅ Tagi klientów (API: `GET /customer-tags`)
- ✅ Notatki (API: `GET /customers/:id/notes`)
- ✅ Statystyki (API: `GET /customers/:id/statistics`)
- ✅ Historia wizyt (API: `GET /customers/:id/events-history`)

#### 3. Klienci - Frontend (60%)
- ✅ CustomerCard z zakładkami
- ✅ CustomerSidebar (dynamiczne grupy z API!)
- ✅ Hooki: `useCustomerGroups`, `useCustomerTags`
- ❌ **NIEUŻYWANE** w liście klientów!

---

### ❌ CZEGO BRAKUJE

#### 1. Grupy Klientów w Liście
**Problem:** `ClientsSidebar` (używany w `/clients`) ma tylko statyczne grupy:
```typescript
const navItems = [
    { id: 'all', label: 'Wszyscy klienci' },
    { id: 'recent', label: 'Ostatnio dodani' },
    { id: 'vip', label: 'Klienci VIP' },
];
```

**Rozwiązanie:** Zamienić na `CustomerSidebar` który już pobiera grupy z API:
```typescript
const { data: groups } = useCustomerGroups();
```

#### 2. Zakładka "Komentarze"
**WERSUM:** `komentarze` (wskazuje na `?tab_name=opinions`)
**NASZ PANEL:** `Notatki` (`CustomerNotesTab`)

To jest ta sama funkcjonalność, tylko inna nazwa. **Do zmiany nazwy** lub dodania aliasu.

#### 3. Wyświetlanie Grup w Karcie Klienta
**WERSUM:**
```html
<div class="groups">
  <strong>należy do grup:</strong> RODO, Sylwester, WRACAM
</div>
```

**NASZ PANEL:** Brak wyświetlania grup w `CustomerSummaryTab`

**Rozwiązanie:** Dodać sekcję grup w podsumowaniu klienta.

#### 4. Link "Edytuj opis"
**WERSUM:** `<a href="#">edytuj opis</a>`
**NASZ PANEL:** Brak

**Rozwiązanie:** Dodać inline editing dla opisu klienta.

---

## 🔧 Zadania do Wykonania

### Priorytet 1 (Ten tydzień)

1. **Integracja Grup w Liście Klientów**
   ```typescript
   // W pages/clients/index.tsx
   // Zmienić:
   import ClientsSidebar from '@/components/clients/ClientsSidebar';
   // Na:
   import CustomerSidebar from '@/components/customers/CustomerSidebar';
   ```

2. **Wyświetlanie Grup w Karcie Klienta**
   ```typescript
   // W CustomerSummaryTab dodać:
   <div className="form-group">
     <label className="control-label">Grupy</label>
     <div className="control-content">
       {customer.groups?.map(g => g.name).join(', ') || 'Brak'}
     </div>
   </div>
   ```

3. **Dodanie endpointu `groups` do Customer API**
   Sprawdzić czy `GET /customers/:id` zwraca grupy klienta.

### Priorytet 2 (Następny tydzień)

4. **Zmiana nazwy "Notatki" → "Komentarze"**
   Lub dodanie aliasu dla zgodności z Versum.

5. **Edycja Opisu Inline**
   Dodać komponent `EditableDescription` do CustomerSummaryTab.

---

## 📋 Endpointy API - Mapowanie

| Funkcja | Versum URL | Nasz API | Status |
|---------|------------|----------|--------|
| Lista klientów | `/customers` | `GET /customers` | ✅ |
| Szczegóły klienta | `/customers/:id` | `GET /customers/:id` | ✅ |
| Grupy klientów | - | `GET /customer-groups` | ✅ |
| Tagi klientów | - | `GET /customer-tags` | ✅ |
| Statystyki | - | `GET /customers/:id/statistics` | ✅ |
| Historia wizyt | - | `GET /customers/:id/events-history` | ✅ |
| Notatki | - | `GET /customers/:id/notes` | ✅ |

---

## 🎯 Podsumowanie

Nasz backend jest **w pełni gotowy** - ma wszystko czego potrzeba (grupy, tagi, notatki, statystyki).

Nasz frontend ma **niekonsekwencję UI**:
- `CustomerSidebar` (dla szczegółów) - używa dynamicznych grup z API ✅
- `ClientsSidebar` (dla listy) - ma tylko statyczne grupy ❌

**Jedna zmiana** (podmiana komponentu sidebaru) rozwiąże 80% różnic w module Klientów!
