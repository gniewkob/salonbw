# Implementacja PAJAX w Panelu salon-bw.pl

## Co to jest PAJAX?

PAJAX (Push-State AJAX) to technika ładowania stron bez pełnego przeładowania przeglądarki. Versum używa jej do:
- Szybkiego przełączania między modułami
- Zachowania stanu nawigacji
- Płynnych animacji przejść

## Jak to działa w Versum?

```javascript
// Versum używa jquery-pjax
$(document).pjax('[data-pjax] a', '#pjax-container')
```

Gdy klikasz link:
1. Zatrzymuje domyślne przeładowanie
2. Ładuje nową treść przez AJAX
3. Zmienia URL przez pushState
4. Wymienia tylko `#main-content`

## Jak to działa w Naszym Panelu (Next.js)?

Next.js ma wbudowany **Client-Side Routing** który działa identycznie jak PAJAX:

```typescript
// components/versum/VersumMainNav.tsx
import Link from 'next/link';

<Link href="/clients">
    <span>klienci</span>
</Link>
```

### Zalety Next.js vs PAJAX:

| Feature | PAJAX (Versum) | Next.js (Nasz panel) |
|---------|----------------|---------------------|
| Prefetching | Manualny | Automatyczny |
| Code Splitting | Brak | Automatyczny |
| Loading States | Manualne | `loading.tsx` |
| Error Boundaries | Brak | `error.tsx` |
| SSR | Częściowy | Pełny |

## Aktualna Struktura

```
VersumShell (layout)
├── VersumTopbar (navbar górny)
├── Sidebar (lewy)
│   ├── VersumMainNav (8 modułów)
│   └── VersumSecondaryNav (contextowy)
└── MainContent (main)
    └── page content (ładowany dynamicznie)
```

## Konfiguracja PAJAX-like w Next.js

### 1. Link Prefetching (MAMY ✅)

```typescript
// next.config.mjs
module.exports = {
    experimental: {
        // Włącza prefetching dla wszystkich Linków
        optimisticClientCache: true,
    },
}
```

### 2. Loading States (MAMY ✅)

```typescript
// app/calendar/loading.tsx
export default function Loading() {
    return <div className="pjax-loading">Ładowanie...</div>;
}
```

### 3. Page Transitions (DO DODANIA)

```typescript
// components/PageTransition.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, [pathname]);
    
    return (
        <div className={`page-transition ${isLoading ? 'loading' : ''}`}>
            {isLoading && <div className="pjax-loader" />}
            {children}
        </div>
    );
}
```

## Porównanie Struktury HTML

### Versum (oryginał)
```html
<div class="main-container" id="main-container">
    <div class="sidebar hidden-print" id="sidebar">
        <div class="mainnav" id="mainnav">
            <ul class="nav">
                <li class="calendar"><a href="/calendar">...</a></li>
                <li class="clients active"><a href="/customers">...</a></li>
                <!-- ... -->
            </ul>
        </div>
    </div>
    <div class="main-content" id="main-content" role="main">
        <!-- Tylko to się zmienia przy PAJAX -->
    </div>
</div>
```

### Nasz Panel (Next.js)
```tsx
// Identyczna struktura!
<div id="versum-shell-root">
    <VersumTopbar />
    <div className="main-container" id="main-container">
        <div className="sidebar hidden-print" id="sidebar">
            <VersumMainNav />  {/* Sticky, nie przeładowuje się */}
            <VersumSecondaryNav />  {/* Kontekstowy dla modułu */}
        </div>
        <div className="main-content" id="main-content" role="main">
            {children}  {/* Tylko to się zmienia */}
        </div>
    </div>
</div>
```

## Brakujące Elementy (Do Implementacji)

### 1. Global Loading Indicator

```typescript
// hooks/usePajaxLoading.ts
import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function usePajaxLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 100);
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);
    
    return isLoading;
}
```

### 2. Płynne Przejścia (CSS)

```css
/* styles/pjax-transitions.css */
.main-content {
    opacity: 1;
    transition: opacity 150ms ease-in-out;
}

.main-content.loading {
    opacity: 0.7;
}

.pjax-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #008bb4, transparent);
    animation: pjax-loading 1s infinite;
    z-index: 9999;
}

@keyframes pjax-loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
```

### 3. Prefetching na Hover

```typescript
// components/PrefetchLink.tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrefetchLink({ href, children, ...props }) {
    const router = useRouter();
    
    return (
        <Link
            href={href}
            onMouseEnter={() => router.prefetch(href)}
            {...props}
        >
            {children}
        </Link>
    );
}
```

## Testowanie PAJAX

### 1. Sprawdź czy działa:
1. Otwóć DevTools → Network
2. Kliknij w link w nawigacji
3. Powinieneś zobaczyć:
   - Brak pełnego przeładowania strony
   - Request `_next/data/...` (JSON z danymi)
   - Tylko `main-content` się zmienia

### 2. Sprawdź prefetching:
1. Najedź na link w nawigacji
2. W Network powinien pojawić się prefetch

## Podsumowanie

Nasz panel **już używa PAJAX** przez Next.js Client-Side Routing:
- ✅ Automatyczny prefetching
- ✅ Code splitting per page
- ✅ Zachowanie stanu sidebaru
- ✅ Szybkie przejścia

Co dodać dla 100% zgodności z Versum:
- [ ] Global loading indicator
- [ ] Płynne animacje przejść
- [ ] Optimistic UI updates
