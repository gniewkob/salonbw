# Szczegółowa Analiza Versum - Panel Klienci

> Analiza przeprowadzona na żywo na https://panel.versum.com/salonblackandwhite/customers
> Data: 2026-02-06

---

## 📸 Zrzuty Ekranu

| Widok | Plik |
|-------|------|
| Lista klientów | `output/playwright/versum-customers-list.png` |
| Szczegóły klienta | `output/playwright/versum-customer-details.png` |
| Rozwinięte grupy | `output/playwright/versum-groups-expanded.png` |
| Filtrowanie po grupie RODO | `output/playwright/versum-rodo-filter.png` |

---

## 🏗️ Struktura Layoutu

### Główny Podział

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER (navbar-fixed-top)                                                   │
│ ├─ Logo "versum" + salon name "salonblackandwhite"                         │
│ ├─ Search "Szukaj..."                                                       │
│ ├─ Notification bell (7)                                                    │
│ ├─ Messages (0)                                                             │
│ ├─ Help "Pomoc"                                                             │
│ └─ Language "GB"                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SIDEBAR                          MAIN CONTENT                              │
│  ┌─────────────────┐             ┌─────────────────────────────────────┐   │
│  │ MAIN NAV        │             │ BREADCRUMBS                         │   │
│  │ • kalendarz     │             │ Klienci / Lista klientów            │   │
│  │ • klienci ✓     │             │                                     │   │
│  │ • magazyn       │             │ TOOLBAR                             │   │
│  │ • statystyki    │             │ [wyszukaj] [sort]    [Dodaj klienta]│   │
│  │ • łączność (140)│             │                                     │   │
│  │ • usługi        │             │ CONTENT                             │   │
│  │ • ustawienia    │             │ ...                                 │   │
│  │ • dodatki       │             │                                     │   │
│  └─────────────────┘             └─────────────────────────────────────┘   │
│  ┌─────────────────┐                                                        │
│  │ SECONDARY NAV   │                                                        │
│  │ (contextowa)    │                                                        │
│  │               │                                                        │
│  │ GRUPY KLIENTÓW│                                                        │
│  │ • wszyscy     │                                                        │
│  │ • Umówieni... │                                                        │
│  │ • Ostatnio... │                                                        │
│  │ • Nie rezerw. │                                                        │
│  │ • więcej ↓    │                                                        │
│  │               │                                                        │
│  │ WYBIERZ       │                                                        │
│  │ KRYTERIA      │                                                        │
│  │ • skorzystali │                                                        │
│  │ • mają wizytę │                                                        │
│  │ • obsługiwani │                                                        │
│  │ • więcej ↓    │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Kluczowe Elementy Sidebar

#### 1. Grupy Klientów (Sekcja)

```
GRUPY KLIENTÓW
├── wszyscy klienci              ← podświetlony (główny widok)
├── Umówieni na dzisiaj
├── Ostatnio dodani
├── Nie rezerwują online
└── więcej                       ← rozwija wszystkie grupy
```

**Po kliknięciu "więcej":**
```
GRUPY KLIENTÓW
├── wszyscy klienci
├── Umówieni na dzisiaj
├── Ostatnio dodani
├── Nie rezerwują online
├── Nioxin                       ← dodatkowe grupy
├── WRACAM
├── RODO
├── Sylwester
├── Podwyżka 1.06.2021
├── Kobiety wszystkie
└── Kobiety Ola

[dodaj/edytuj/usuń]              ← zarządzanie grupami
```

#### 2. Kryteria Wyszukiwania (Sekcja)

```
WYBIERZ KRYTERIA
├── skorzystali z usług
├── mają wizytę w salonie
├── obsługiwani przez pracowników
└── więcej                       ← rozwija dodatkowe kryteria
```

---

## 📋 Tabela Klientów

### Struktura Wiersza

```
┌────────┬──────────────────────┬────────────────────┬───────────────────┬────────┐
│ ☑️      │ Imię Nazwisko        │ Telefon            │ Ostatnia wizyta   │ Akcje  │
├────────┼──────────────────────┼────────────────────┼───────────────────┼────────┤
│ ☑️      │ Marzena Adamska      │ 📧 📞 +48 691...   │ 10.01.2026 11:00 │ ✏️     │
│ ☑️      │ Piotr Adamski        │ 📧 📞 +48 601...   │ 23.01.2026 10:45 │ ✏️     │
│ ☑️      │ Alinka Anczok        │ 📧 📞 +48 511...   │ 18.12.2025 17:30 │ ✏️     │
└────────┴──────────────────────┴────────────────────┴───────────────────┴────────┘
```

### Szczegóły Kolumn

| Kolumna | Zawartość | Uwagi |
|---------|-----------|-------|
| Checkbox | `zaznacz wszystkich (0)` | Główny checkbox + licznik zaznaczonych |
| Imię i nazwisko | Link do szczegółów | Niebieski kolor, podkreślenie na hover |
| Telefon | 📧 (email) + 📞 (tel:) | Dwa linki - email i telefon |
| Ostatnia wizyta | Data + czas | Format: DD.MM.YYYY HH:MM |
| Akcje | ✏️ edycja | Ikona ołówka |

### Paginacja

```
Pozycje od 1 do 20 z 785 | na stronie [20 ▼]

[1] z 40    [>]
```

---

## 👤 Szczegóły Klienta

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BREADCRUMBS: Klienci / Marzena Adamska                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ [edytuj] [więcej ▼]                                                         │
├──────────────────────────────┬──────────────────────────────────────────────┤
│                              │                                              │
│  KARTA KLIENTA               │  ZAPLANOWANE WIZYTY: 1                       │
│  ├─ Marzena Adamska          │  ├─ Koloryzacja Ola...                       │
│  │   (link do profilu)       │  │   piątek 06.03.2026 13:00                 │
│  ├─ 📞 +48 691 433 821       │  │   250,00 zł                               │
│  ├─ 📧 nie podano            │  └─ [więcej]                                 │
│  ├─ 🏷️ należy do grup:       │                                              │
│  │   RODO, Sylwester, WRACAM │  ZREALIZOWANE WIZYTY: 24                     │
│  ├─ 📝 brak opisu            │  ├─ Koloryzacja Ola...  350,00 zł [AB]      │
│  │   [edytuj opis]           │  ├─ Koloryzacja Ola...  350,00 zł [AB]      │
│  ├─ płeć Kobieta             │  ├─ Rozjaśnienie...     380,00 zł [AB]      │
│  └─ data dodania 23.08.2017  │  └─ [więcej]                                 │
│                              │                                              │
│  [ZDJĘCIE PROFILOWE]         │                                              │
│  (placeholder kobiety)       │                                              │
│                              │                                              │
├──────────────────────────────┴──────────────────────────────────────────────┤
│ TABS:                                                                       │
│ [podsumowanie] [dane osobowe] [statystyki] [historia wizyt] [komentarze]   │
│ [komunikacja] [galeria zdjęć] [załączone pliki]                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sekcja "należy do grup" - KLUCZOWA

```
🏷️ należy do grup: RODO, Sylwester, WRACAM
```

**Format:**
- Etykieta: "należy do grup:"
- Wartość: grupy rozdzielone przecinkami
- Brak grup: wyświetlana jest tylko etykieta z wartością pustą lub "brak"

---

## 🔍 Filtrowanie po Grupach

### URL Pattern

```
/customers?f[0][fn]=groups&f[0][i][]=31826&f[0][bg]=and&q=&s[f]=default&s[o]=asc
```

**Parametry:**
- `f[0][fn]=groups` - filtruj po grupach
- `f[0][i][]=31826` - ID grupy (RODO = 31826)
- `f[0][bg]=and` - operator logiczny (AND)
- `s[f]=default` - sortowanie po domyślnym polu
- `s[o]=asc` - kolejność rosnąca

### Sidebar przy filtrowaniu

```
GRUPY KLIENTÓW              KRYTERIA WYSZUKIWANIA ✕
├── wszyscy                 ┌─────────────────────────────┐
├── Umówieni...             │ należą do grup:             │
├── Ostatnio...             │ ○ każdej z wybranych  ●     │
├── Nie rezerw...           │ ○ którejkolwiek z wybranych │
├── Nioxin                  │                             │
├── WRACAM                  │ grupy:                      │
├── RODO ✓                  │ ┌───────────────────────┐   │
├── Sylwester               │ │ RODO              [✕] │   │
├── Podwyżka...             │ └───────────────────────┘   │
├── Kobiety wszystkie       └─────────────────────────────┘
└── Kobiety Ola

[dodaj/edytuj/usuń]
```

### Główna część przy filtrowaniu

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BREADCRUMBS: Klienci / Lista klientów / Wyniki wyszukiwania                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ wybrane kryteria wyszukiwania:                    [✕]                       │
│ ┌─────────────────────────────────────────────────────────┐                 │
│ │ należą do grup (80)  RODO                           [✕] │                 │
│ └─────────────────────────────────────────────────────────┘                 │
│                                                                             │
│ Klientów spełniających kryteria: 80    [utwórz grupę]                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☑️ zaznacz wszystkich (0)                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ... tabela klientów ...                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Komunikaty

- **Liczba klientów:** "Klientów spełniających kryteria: 80"
- **Akcja:** "[utwórz grupę]" - link do utworzenia nowej grupy z tych wyników
- **Badge:** "należą do grup (80) RODO"

---

## 🎨 Style i UX

### Kolory

| Element | Kolor | HEX |
|---------|-------|-----|
| Tło sidebar | Ciemny szary | `#3a3f44` |
| Tekst sidebar | Jasny szary | `#aaaaaa` |
| Active item | Niebieski | `#008bb4` |
| Linki | Niebieski | `#008bb4` |
| Tekst główny | Czarny | `#333333` |
| Drugorzędny | Szary | `#777777` |
| Bordery | Jasny szary | `#d5d5d5` |

### Typografia

| Element | Rozmiar | Waga |
|---------|---------|------|
| H1 (imie klienta) | 24px | Normal |
| H2 (sekcje) | 18px | Bold |
| H4 (sidebar headers) | 12px | Bold (uppercase) |
| Tekst | 14px | Normal |
| Mały tekst | 11px | Normal |

### Interakcje

| Akcja | Efekt |
|-------|-------|
| Hover na link | Podkreślenie |
| Hover na wiersz | Zmiana tła na `#f5f5f5` |
| Active grupa | Niebieskie tło, biały tekst |
| Checkbox hover | Border niebieski |

---

## 🔧 Funkcjonalności do Implementacji

### 1. Sidebar - Grupy Klientów

```typescript
interface CustomerGroup {
    id: string;
    name: string;
    color?: string;      // Opcjonalny kolor (jak w naszym systemie)
    isSystem?: boolean;  // Czy to grupa systemowa (wszyscy, ostatnio dodani)
    memberCount?: number;
}

// Systemowe grupy (zawsze widoczne)
const SYSTEM_GROUPS = [
    { id: 'all', name: 'wszyscy klienci', isSystem: true },
    { id: 'today', name: 'Umówieni na dzisiaj', isSystem: true },
    { id: 'recent', name: 'Ostatnio dodani', isSystem: true },
    { id: 'no_online', name: 'Nie rezerwują online', isSystem: true },
];

// Dynamiczne grupy z API
const DYNAMIC_GROUPS = [
    { id: '1', name: 'Nioxin', memberCount: 15 },
    { id: '2', name: 'WRACAM', memberCount: 8 },
    { id: '3', name: 'RODO', memberCount: 80 },
    { id: '4', name: 'Sylwester', memberCount: 12 },
    { id: '5', name: 'Podwyżka 1.06.2021', memberCount: 45 },
    { id: '6', name: 'Kobiety wszystkie', memberCount: 342 },
    { id: '7', name: 'Kobiety Ola', memberCount: 156 },
];
```

### 2. Tabela Klientów

```typescript
interface CustomerTableRow {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    lastVisitDate: Date;
    groups?: string[];  // Nazwy grup do wyświetlenia w tooltip
}
```

### 3. Szczegóły Klienta - Sekcja Grup

```tsx
// CustomerGroupsSection.tsx
export function CustomerGroupsSection({ groups }: { groups: CustomerGroup[] }) {
    if (!groups || groups.length === 0) {
        return (
            <div className="customer-field">
                <span className="label">należy do grup:</span>
                <span className="value">-</span>
            </div>
        );
    }
    
    return (
        <div className="customer-field">
            <span className="label">należy do grup:</span>
            <span className="value">
                {groups.map(g => g.name).join(', ')}
            </span>
        </div>
    );
}
```

### 4. Filtrowanie

```typescript
// URL query params
interface GroupFilter {
    field: 'groups';
    operator: 'and' | 'or';  // każdej z wybranych / którejkolwiek
    groupIds: string[];
}

// Przykładowy URL
// /customers?filter[groups]=1,2,3&filter[operator]=and
```

---

## ✅ Checklist Implementacji

### Sidebar - Grupy
- [ ] Systemowe grupy (zawsze widoczne)
- [ ] Dynamiczne grupy z API
- [ ] Przycisk "więcej/mniej" do rozwijania
- [ ] Link "dodaj/edytuj/usuń" grupy
- [ ] Podświetlenie aktywnej grupy
- [ ] Licznik klientów w grupie

### Tabela Klientów
- [ ] Checkboxy do zaznaczania
- [ ] Linki do szczegółów klienta
- [ ] Telefon z linkami (tel: + email)
- [ ] Data ostatniej wizyty
- [ ] Ikona edycji
- [ ] Paginacja
- [ ] Sortowanie

### Szczegóły Klienta
- [ ] Sekcja "należy do grup:"
- [ ] Wypisanie wszystkich grup po przecinku
- [ ] Obsługa braku grup ("-" lub puste)
- [ ] Zakładki (podsumowanie, dane, statystyki, itp.)

### Filtrowanie
- [ ] Filtrowanie po jednej grupie
- [ ] Filtrowanie po wielu grupach (AND/OR)
- [ ] Wyświetlanie aktywnych filtrów jako badge
- [ ] Licznik wyników
- [ ] Przycisk "utwórz grupę" z wyników
- [ ] Breadcrumbs z "Wyniki wyszukiwania"

---

## 📝 Różnice Między Versum a Naszą Implementacją

| Element | Versum | Nasz Panel | Status |
|---------|--------|------------|--------|
| Systemowe grupy | 4 (wszyscy, umówieni, ostatnio, nie online) | Brak | ❌ Do dodania |
| Dynamiczne grupy | ✅ | ✅ | ✅ |
| Rozwijanie grup | ✅ "więcej/mniej" | ✅ | ✅ |
| Zarządzanie grupami | ✅ "dodaj/edytuj/usuń" | ❌ | ❌ Do dodania |
| Wyświetlanie grup w szczegółach | ✅ "należy do grup:" | ❌ | ❌ Do dodania |
| Filtrowanie grup | ✅ z AND/OR | ✅ | ✅ |
| Paginacja | ✅ | ✅ | ✅ |
| Sortowanie | ✅ | ✅ | ✅ |
