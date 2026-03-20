# Architektura Sesji i Nawigacji (Versum Clone)

## Cel
Zapewnienie płynnych przejść między modułami (Kalendarz ↔ Klienci ↔ Magazyn) bez utraty sesji i zachowaniem SPA-like experience (PAJAX).

---

## 🏗️ Architektura Sesji

### 1. Warstwa HTTP (Cookies)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRZEGLĄDARKA                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ panel.salon-bw  │  │ api.salon-bw    │                  │
│  │ .pl             │  │ .pl             │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│  ┌────────▼────────────────────▼────────┐                  │
│  │   Cookies (domain=.salon-bw.pl)      │                  │
│  │   • accessToken  (httpOnly)          │                  │
│  │   • refreshToken (httpOnly)          │                  │
│  │   • XSRF-TOKEN   (readable)          │                  │
│  │   • sbw_auth     (flag)              │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

**Dlaczego `domain=.salon-bw.pl`?**
- Kropka na początku oznacza "shared across subdomains"
- `panel.salon-bw.pl` i `api.salon-bw.pl` widzą te same cookies
- Umożliwia to auth między frontendem a backendem

### 2. Warstwa Next.js (Middleware)

```typescript
// middleware.ts - uruchamia się przy KAŻDYM requeście

export function middleware(request: NextRequest) {
    // 1. Sprawdź czy są tokeny w cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const isAuthenticated = Boolean(accessToken || refreshToken);
    
    // 2. Jeśli nie ma tokenów → redirect do /auth/login
    if (!isAuthenticated && !isPublicRoute) {
        return NextResponse.redirect('/auth/login');
    }
    
    // 3. Pozwól na dostęp
    return NextResponse.next();
}
```

**Zachowanie:**
- Przy F5/odświeżeniu: Middleware sprawdza cookies przed załadowaniem strony
- Przy client-side nav: Middleware nie uruchamia się (tylko raz przy starcie)

### 3. Warstwa React (AuthContext)

```typescript
// AuthContext.tsx - zarządza stanem w aplikacji

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Przy starcie: sprawdź czy są tokeny i pobierz profil
    useEffect(() => {
        if (hasAuthHint()) {
            fetchProfile(); // GET /users/profile
        }
    }, []);
    
    // Przy zmianie route: stan pozostaje (context nie jest resetowany)
    // Next.js robi client-side navigation bez przeładowania
}
```

**Kluczowe:** AuthContext jest ustanawiany w `_app.tsx` jako najwyższy provider, więc przy przejściach między stronami (Link/router.push) stan jest zachowany.

---

## 🔄 Przejścia Między Modułami (PAJAX)

### Scenariusze

#### 1. Client-Side Navigation (Next.js Link)

```tsx
// components/versum/SalonBWMainNav.tsx
import Link from 'next/link';

<li className="clients">
    <Link href="/clients">
        <span>klienci</span>
    </Link>
</li>
```

**Co się dzieje:**
```
1. Użytkownik klika "klienci"
2. Next.js interceptuje kliknięcie (preventDefault)
3. PajaxLoader pokazuje loading bar
4. Next.js prefetchuje /clients (jeśli nie było)
5. URL zmienia się przez history.pushState
6. Tylko <main-content> jest wymieniane
7. AuthContext pozostaje bez zmian (użytkownik zalogowany)
8. PajaxLoader chowa loading bar
```

**Zalety:**
- ✅ Brak pełnego przeładowania strony
- ✅ Zachowany stan AuthContext
- ✅ Płynne animacje
- ✅ Szybkie (< 300ms)

#### 2. Full Page Reload (F5 / hard refresh)

**Co się dzieje:**
```
1. Przeglądarka wysyła request do Next.js
2. Middleware sprawdza cookies
3. Jeśli brak tokenów → redirect do /auth/login
4. Jeśli są tokeny → render strony
5. AuthContext inicjalizuje się i pobiera profil
6. Użytkownik widzi stronę (zalogowany)
```

#### 3. External Link / <a> tag

```tsx
// ❌ TAK NIE RÓB - powoduje pełne przeładowanie
<a href="/clients">klienci</a>

// ✅ UŻYWAJ Link z Next.js
<Link href="/clients">klienci</Link>
```

---

## 📊 Diagram Przepływu

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         PRZEJŚCIE KALENDARZ → KLIENCI                        │
└──────────────────────────────────────────────────────────────────────────────┘

UZYTKOWNIK
    │
    │ klikniecie "klienci"
    ▼
┌─────────────────┐
│ SalonBWMainNav   │
│ <Link href=...> │
└────────┬────────┘
         │
         │ event.preventDefault()
         │ router.push('/clients')
         ▼
┌─────────────────┐     ┌─────────────────┐
│  PajaxLoader    │────▶│  Loading Bar    │
│  (pokazany)     │     │  (animacja)     │
└────────┬────────┘     └─────────────────┘
         │
         │ Next.js Client-Side Routing
         ▼
┌─────────────────┐
│   /clients      │
│   (prefetched)  │
│   page.js       │
└────────┬────────┘
         │
         │ render bez przeładowania
         ▼
┌──────────────────────────────────────────────────┐
│              VERSUM SHELL (pozostaje)            │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Sidebar      │  │ Main Content (nowy)      │ │
│  │ (ten sam)    │  │                          │ │
│  │              │  │  CustomerListTable       │ │
│  │ • kalendarz  │  │  + CustomerSidebar       │ │
│  │ • klienci ✓  │  │                          │ │
│  │ • magazyn    │  │                          │ │
│  └──────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────┘
         │
         │ routeChangeComplete
         ▼
┌─────────────────┐
│  PajaxLoader    │
│  (ukryty)       │
└─────────────────┘

AuthContext: NIEZMIENIONY (użytkownik wciąż zalogowany)
Cookies: Bez zmian
Session: Zachowana
```

---

## 🔧 Konfiguracja Cookies (Backend)

```typescript
// auth.service.ts

private getCookieOptions(maxAge: number): CookieOptions {
    return {
        httpOnly: true,        // Nie dostępne z JS (bezpieczeństwo)
        secure: true,          // Tylko HTTPS w produkcji
        sameSite: 'lax',       // Ochrona CSRF
        domain: '.salon-bw.pl', // Shared across subdomains
        maxAge,                // Czas życia
        path: '/',            // Dostępne na całej domenie
    };
}
```

**Wymagane env variables:**
```bash
# .env.production
COOKIE_DOMAIN=.salon-bw.pl
NODE_ENV=production
```

---

## 🛡️ Bezpieczeństwo

### CSRF Protection

```typescript
// 1. Backend ustawia XSRF-TOKEN cookie
response.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false, // Frontend musi odczytać
});

// 2. Frontend wysyła w headerze
headers: {
    'X-XSRF-TOKEN': csrfToken,
}

// 3. Backend weryfikuje
```

### Token Refresh

```typescript
// Gdy accessToken wygasa (401)
const refresh = async () => {
    try {
        const authTokens = await apiRefreshToken();
        persistTokens(authTokens); // Nowe cookies
        await fetchProfile();
    } catch {
        logout(); // Refresh failed → wyloguj
    }
};
```

---

## 🧪 Testowanie

### 1. Sprawdź czy sesja działa między modułami

```bash
# 1. Zaloguj się w panelu
open https://panel.salon-bw.pl

# 2. Przejdź do Kalendarza
# 3. Przejdź do Klientów
# 4. Przejdź do Magazynu
# 5. Sprawdź czy wciąż jesteś zalogowany
```

### 2. Sprawdź cookies w DevTools

```
Application → Cookies → https://panel.salon-bw.pl

Oczekiwane:
☑ accessToken  (HttpOnly: ✓, Domain: .salon-bw.pl)
☑ refreshToken (HttpOnly: ✓, Domain: .salon-bw.pl)
☑ XSRF-TOKEN   (HttpOnly: ✗, Domain: .salon-bw.pl)
☑ sbw_auth     (HttpOnly: ✗, Domain: .salon-bw.pl)
```

### 3. Sprawdź PAJAX

```
Network → Filter: "_next/data"

Oczekiwane:
- Przy kliknięciu w link: request do _next/data/...
- Brak pełnego przeładowania strony (brak ładowania HTML)
```

### 4. Test pełnego przeładowania

```
1. Bądź na stronie /calendar
2. Naciśnij F5
3. Sprawdź czy:
   - Nie ma redirect do /auth/login
   - Strona ładuje się szybko
   - Użytkownik jest zalogowany
```

---

## 🐍 Możliwe Problemy

### Problem: "Wylogowuje przy przejściu między stronami"

**Przyczyny:**
1. ❌ Używanie zwykłego `<a>` zamiast `<Link>`
2. ❌ AuthContext resetuje się przy każdej zmianie route
3. ❌ Cookies nie mają prawidłowego domain
4. ❌ Middleware źle sprawdza tokeny

**Rozwiązania:**
1. ✅ Używaj `next/link` do wszystkich wewnętrznych linków
2. ✅ AuthProvider musi być w `_app.tsx` (poza Router)
3. ✅ Ustaw `COOKIE_DOMAIN=.salon-bw.pl` w backendzie
4. ✅ Sprawdź czy middleware widzi cookies

### Problem: "Flicker" - najpierw widzę login, potem dashboard

**Przyczyna:** AuthContext nie zdążył pobrać profilu przed renderem strony

**Rozwiązanie:**
```tsx
// W każdym komponencie strony
const { initialized, isAuthenticated } = useAuth();

if (!initialized) {
    return <Loading />; // Pokaż loader
}

if (!isAuthenticated) {
    return null; // Middleware i tak redirectuje
}
```

---

## 📋 Checklist

- [ ] Backend: `COOKIE_DOMAIN=.salon-bw.pl` ustawione w produkcji
- [ ] Backend: Wszystkie cookies używają tego samego domain
- [ ] Frontend: Wszystkie linki wewnętrzne używają `next/link`
- [ ] Frontend: AuthProvider w `_app.tsx` poza Router
- [ ] Frontend: Middleware sprawdza wszystkie tokeny
- [ ] Test: Przejście Kalendarz → Klienci zachowuje sesję
- [ ] Test: F5 na dowolnej stronie nie wylogowuje
- [ ] Test: PajaxLoader pokazuje się przy zmianie route
