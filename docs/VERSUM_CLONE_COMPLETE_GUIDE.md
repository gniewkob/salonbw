# Kompletny Przewodnik: Klonowanie Versum

## 📊 Aktualny Stan Projektu

### ✅ Zaimplementowane

#### Backend (NestJS + TypeORM)
- [x] **CustomerGroup Entity** - grupy klientów (RODO, Sylwester, WRACAM)
- [x] **CustomerTag Entity** - tagi klientów
- [x] **ManyToMany relacje** - klienci ↔ grupy, klienci ↔ tagi
- [x] **Pełne REST API** - CRUD + dodawanie/usuwanie członków
- [x] **DTOs i walidacja** - CreateCustomerGroupDto, UpdateCustomerGroupDto

#### Frontend (Next.js 15)
- [x] **Hooki React Query** - useCustomerGroups, useCreateCustomerGroup, itp.
- [x] **Komponent CustomerSidebar** - dynamiczne grupy z API
- [x] **Komponent CustomerSummaryTab** - szczegóły klienta
- [x] **VersumShell** - główny layout zgodny z Versum
- [x] **VersumMainNav** - 8 modułów z ikonami SVG
- [x] **VersumSecondaryNav** - kontekstowa nawigacja (ClientsNav z grupami)
- [x] **PAJAX Loader** - globalny loading indicator
- [x] **AuthContext** - session persistence przy przejściach między modułami
- [x] **Middleware** - ochrona routów na poziomie Next.js

#### Architektura Sesji (PAJAX)
- [x] **Cookies** - `domain=.salon-bw.pl` (shared across subdomains)
- [x] **Client-side routing** - Next.js Link bez przeładowania strony
- [x] **Token refresh** - automatyczne odświeżanie accessToken
- [x] **CSRF protection** - XSRF-TOKEN header

### 🔧 Do Zakończenia

#### Kluczowe (Wymagane)
- [ ] **Grupy w szczegółach klienta** - wyświetlanie "należy do grup: RODO, Sylwester, WRACAM"
- [ ] **Zarządzanie grupami w UI** - dodawanie/usuwanie klientów z grup w szczegółach

#### Następne Moduły
- [ ] **Magazyn (Produkty)** - struktura jak w Versum
- [ ] **Usługi** - lista usług z kategoriami
- [ ] **Statystyki** - dashboard z wykresami
- [ ] **Łączność** - email/SMS do klientów

---

## 🏗️ Architektura Versum (Do Odtworzenia)

### Layout (HTML Structure)

```html
<!-- Top Bar (zawsze widoczna) -->
<header class="navbar navbar-fixed-top">
    <div class="navbar-inner">
        <a class="brand" href="/">VERSUM</a>
        <div class="btn-toolbar pull-right">
            <!-- User menu, notifications, help -->
        </div>
    </div>
</header>

<!-- Main Container -->
<div class="main-container" id="main-container">
    
    <!-- Sidebar (sticky, nie przeładowuje się przy PAJAX) -->
    <div class="sidebar hidden-print" id="sidebar">
        <!-- Main Navigation (8 modułów) -->
        <div class="mainnav" id="mainnav">
            <ul class="nav">
                <li class="calendar"><a href="/calendar">kalendarz</a></li>
                <li class="customers active"><a href="/customers">klienci</a></li>
                <li class="stock"><a href="/stock">magazyn</a></li>
                <li class="statistics"><a href="/statistics">statystyki</a></li>
                <li class="communication"><a href="/communication">łączność</a></li>
                <li class="services"><a href="/services">usługi</a></li>
                <li class="settings"><a href="/settings">ustawienia</a></li>
                <li class="extensions"><a href="/extensions">dodatki</a></li>
            </ul>
        </div>
        
        <!-- Secondary Navigation (kontekstowa dla modułu) -->
        <div class="secondarynav" id="secondarynav">
            <!-- Dynamiczna zawartość - zależy od aktywnego modułu -->
            <!-- Dla klientów: grupy, tagi, kryteria -->
        </div>
    </div>
    
    <!-- Main Content (zmienia się przy PAJAX) -->
    <div class="main-content" id="main-content" role="main">
        <!-- Tu ładuje się treść strony -->
    </div>
</div>
```

### Nasza Implementacja (Next.js)

```tsx
// _app.tsx - główna aplikacja
export default function MyApp({ Component, pageProps }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>        {/* ← Zachowany przy nawigacji */}
                <ToastProvider>
                    <VersumSvgSprites />
                    <RouteProgress />
                    <Component {...pageProps} />
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

// VersumShell - layout każdej strony
export default function VersumShell({ children, role }) {
    return (
        <div id="versum-shell-root">
            <PajaxLoader />           {/* ← Global loading bar */}
            <VersumTopbar />
            <div className="main-container" id="main-container">
                <div className="sidebar" id="sidebar">
                    <VersumMainNav />     {/* ← 8 modułów */}
                    <VersumSecondaryNav /> {/* ← Kontekstowa */}
                </div>
                <div className="main-content" id="main-content">
                    {children}            {/* ← Tylko to się zmienia */}
                </div>
            </div>
        </div>
    );
}
```

---

## 🔐 Architektura Sesji (ZACHOWANA PRZY PRZEJŚCIACH)

### Warstwy Bezpieczeństwa

```
┌─────────────────────────────────────────────────────────────┐
│  1. MIDDLEWARE (Next.js)                                    │
│     Sprawdza cookies przy każdym requeście                  │
│     Redirect do /auth/login jeśli brak tokenów              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  2. AUTH CONTEXT (React)                                    │
│     Zarządza stanem użytkownika                             │
│     Pobiera profil przy starcie                             │
│     PERSISTED przy client-side navigation                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  3. COOKIES (.salon-bw.pl)                                  │
│     accessToken  (httpOnly, secure)                         │
│     refreshToken (httpOnly, secure)                         │
│     XSRF-TOKEN   (readable, CSRF protection)                │
│     sbw_auth     (flag, wskazuje że jest sesja)             │
└─────────────────────────────────────────────────────────────┘
```

### Przejście Między Modułami (PAJAX)

```
KALENDARZ → KLIENCI
     │
     │ Użytkownik klika "klienci"
     │
     ▼
┌────────────────────────────┐
│  1. PajaxLoader pokazany   │
│     (niebieski pasek)      │
└────────────┬───────────────┘
             │
             │ next/link interceptuje
             │ router.push('/clients')
             │
             ▼
┌────────────────────────────┐
│  2. Client-side routing    │
│     (bez przeładowania!)   │
│                            │
│     • AuthContext: ZACHOWANY│
│     • Cookies: bez zmian   │
│     • Session: ZACHOWANA   │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  3. PajaxLoader ukryty     │
│     routeChangeComplete    │
└────────────────────────────┘
```

---

## 🔄 PAJAX (Push-State AJAX)

### Jak to działa w Versum:

```javascript
// Versum używa jquery-pjax
$(document).pjax('[data-pjax] a', '#pjax-container');
```

### Jak to działa w Next.js (Nasz panel):

```typescript
// Next.js ma wbudowany client-side routing
import Link from 'next/link';

<Link href="/clients">
    klienci
</Link>

// Automatycznie:
// ✅ Prefetching na hover
// ✅ Code splitting
// ✅ Zachowanie stanu (sesja)
// ✅ Szybkie przejścia
```

### Konfiguracja

```typescript
// hooks/usePajaxLoading.ts
export function usePajaxLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 150);
        return () => clearTimeout(timer);
    }, [pathname]);
    
    return isLoading;
}
```

---

## 👥 Moduł Klienci (Szczegóły)

### Struktura Sidebaru (ClientsNav)

```
📁 GRUPY KLIENTÓW                         [+ dodaj]
├── 👥 wszyscy klienci              ← active
├── 📅 Umówieni na dzisiaj
├── 🕐 Ostatnio dodani
└── 🚫 Nie rezerwują online

─── Dynamiczne grupy z API ───
🔴 RODO (45)
🟠 Sylwester (12)
🟢 WRACAM (8)
[+ więcej]

📋 WYBIERZ KRYTERIA
├── ✓ skorzystali z usług
├── mają wizytę w salonie
└── obsługiwani przez pracowników

🏷️ TAGI
[tag1] [tag2] [tag3] ...
```

### API Grup

```typescript
// Entity
@Entity('customer_groups')
class CustomerGroup {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    name: string;
    
    @Column({ nullable: true })
    description: string;
    
    @Column({ default: '#008bb4' })
    color: string;
    
    @ManyToMany(() => User, user => user.groups)
    @JoinTable()
    members: User[];
}

// Endpoints
GET    /customer-groups              ← lista grup
POST   /customer-groups              ← tworzenie
PUT    /customer-groups/:id          ← edycja
DELETE /customer-groups/:id          ← usuwanie
POST   /customer-groups/:id/members  ← dodaj członków
DELETE /customer-groups/:id/members/:customerId ← usuń
```

### Hooki React Query

```typescript
// useCustomers.ts

export function useCustomerGroups() {
    return useQuery({
        queryKey: ['customer-groups'],
        queryFn: () => api.get('/customer-groups'),
    });
}

export function useCreateCustomerGroup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/customer-groups', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-groups'] });
        },
    });
}
```

---

## 📋 Lista Zadań

### Sprint 1: Grupy Klientów ✅ (GOTOWE)
- [x] Backend API dla grup
- [x] Entity CustomerGroup z relacją ManyToMany
- [x] Hooki React Query
- [x] ClientsNav z dynamicznymi grupami
- [x] Session persistence przy przejściach
- [x] PAJAX loading indicator
- [ ] Wyświetlanie grup w CustomerSummaryTab
- [ ] Dodawanie/usuwanie klientów z grup w UI

### Sprint 2: Magazyn (Produkty)
- [ ] Entity Product, Category, Stock
- [ ] API CRUD dla produktów
- [ ] Lista produktów z filtrowaniem
- [ ] Zarządzanie stanem magazynowym
- [ ] Historia ruchów magazynowych

### Sprint 3: Usługi
- [ ] Entity Service, ServiceCategory
- [ ] API dla usług
- [ ] Lista usług z cenami
- [ ] Kategorie usług

### Sprint 4: Statystyki
- [ ] Dashboard z wykresami
- [ ] Statystyki klientów
- [ ] Statystyki finansowe
- [ ] Export danych

### Sprint 5: Łączność
- [ ] Szablony email/SMS
- [ ] Wysyłka masowa
- [ ] Historia komunikacji
- [ ] Automatyczne powiadomienia

---

## 🔗 Dokumentacja

- `docs/VERSUM_CLONE_ANALYSIS.md` - Analiza struktury Versum
- `docs/VERSUM_CODE_ANALYSIS.md` - Analiza kodu Versum
- `docs/PAJAX_IMPLEMENTATION.md` - Implementacja PAJAX
- `docs/CUSTOMER_GROUPS_IMPLEMENTATION.md` - Grupy klientów
- `docs/SESSION_ARCHITECTURE.md` - Architektura sesji (NOWE!)

---

## 💡 Wskazówki

### Debugowanie Sesji

```javascript
// W konsoli przeglądarki na panel.salon-bw.pl

// 1. Sprawdź czy cookies są ustawione
document.cookie
// Oczekiwane: "accessToken=...; refreshToken=...; sbw_auth=1"

// 2. Sprawdź czy XSRF-TOKEN jest dostępny (nie httpOnly)
const csrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
console.log('CSRF:', csrf);

// 3. Przejdź między modułami i sprawdź czy nie wylogowuje
// Kalendarz → Klienci → Magazyn
```

### Testowanie API

```bash
# Zdobądź token
curl -X POST https://api.salon-bw.pl/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}' \
  -c cookies.txt

# Pobierz grupy
curl https://api.salon-bw.pl/customer-groups \
  -b cookies.txt
```

---

## 🎯 Cel Końcowy

> **100% zgodności z Versum** - użytkownik nie powinien widzieć różnicy między naszym panelem a Versum (oprócz logo).

### Metryki Sukcesu:
- ✅ Czas ładowania strony < 1s
- ✅ Czas przejścia między modułami < 300ms
- ✅ Sesja zachowana przy przejściach (nie wylogowuje)
- ✅ Wszystkie funkcje Versum dostępne
- ✅ Identyczny UI/UX
- ✅ Płynne animacje PAJAX
