# Implementacja Grup Klientów (jak w Versum)

## Problem

Mamy dwie implementacje sidebaru klientów:
1. `ClientsSidebar` - statyczny, używany w `pages/clients/index.tsx`
2. `CustomerSidebar` - dynamiczny z grupami API

## Rozwiązanie: Konsolidacja na CustomerSidebar

### Architektura

```
Clients Page
├── VersumShell
│   ├── VersumMainNav (sticky)
│   └── CustomerSidebar (dynamiczny z API) ✅
│       ├── Statyczne filtry: Wszyscy, Ostatnio dodani, VIP
│       └── Dynamiczne grupy z API: RODO, Sylwester, WRACAM
└── MainContent
    └── CustomerListTable
```

### CustomerSidebar - Struktura

```typescript
interface CustomerSidebarProps {
    // Grupy z API
    groups: CustomerGroup[];
    
    // Aktywna grupa (z URL query ?group=xyz)
    selectedGroupId?: string;
    
    // Callback przy wyborze grupy
    onGroupSelect: (groupId: string | null) => void;
    
    // Dodatkowe filtry (tagi, płeć, wiek)
    filters: CustomerFilters;
    onFilterChange: (filters: CustomerFilters) => void;
}
```

### Dane z API (Backend ✅)

```typescript
// GET /customer-groups
[
    { id: "1", name: "RODO", color: "#ff4444", memberCount: 45 },
    { id: "2", name: "Sylwester", color: "#ff8800", memberCount: 12 },
    { id: "3", name: "WRACAM", color: "#44aa44", memberCount: 8 }
]
```

### Podział Grup (jak w Versum)

Widok klientów powinien pokazywać grupy w sekcjach:

```
📁 GRUPY KLIENTÓW
   ├── 👥 wszyscy klienci          [zawsze]
   ├── 📅 Umówieni na dzisiaj      [zawsze - computed]
   ├── 🔔 Nieodpisani              [zawsze - computed]
   ├── ⭐⭐⭐⭐⭐                    [zawsze - computed]
   
   --- Dynamiczne z API ---
   
   ├── 🔴 RODO (45)                [z API]
   ├── 🟠 Sylwester (12)           [z API]
   └── 🟢 WRACAM (8)               [z API]
```

### Implementacja Sidebar

```typescript
// components/customers/CustomerSidebarUnified.tsx
export function CustomerSidebarUnified() {
    const { data: groups } = useCustomerGroups();
    const router = useRouter();
    const selectedGroup = router.query.group as string | undefined;
    
    // Statyczne "smart" grupy
    const staticGroups = [
        { id: 'all', name: 'Wszyscy klienci', icon: 'users', computed: false },
        { id: 'today', name: 'Umówieni na dzisiaj', icon: 'calendar', computed: true },
        { id: 'unresponded', name: 'Nieodpisani', icon: 'bell', computed: true },
        { id: 'vip', name: 'VIP', icon: 'star', computed: true },
    ];
    
    return (
        <aside className="customer-sidebar">
            <section className="static-groups">
                {staticGroups.map(group => (
                    <GroupItem 
                        key={group.id}
                        {...group}
                        active={selectedGroup === group.id}
                        onClick={() => selectGroup(group.id)}
                    />
                ))}
            </section>
            
            <section className="dynamic-groups">
                <h4>Moje grupy</h4>
                {groups?.map(group => (
                    <GroupItem
                        key={group.id}
                        id={group.id}
                        name={group.name}
                        color={group.color}
                        count={group.memberCount}
                        active={selectedGroup === group.id}
                        onClick={() => selectGroup(group.id)}
                    />
                ))}
                <CreateGroupButton />
            </section>
        </aside>
    );
}
```

### Wyświetlanie Grup w Szczegółach Klienta

W `CustomerSummaryTab` dodaj sekcję "należy do grup":

```typescript
// W CustomerSummaryTab
<div className="customer-groups">
    <span>należy do grup:</span>
    <div className="group-tags">
        {customer.groups?.map(group => (
            <span 
                key={group.id}
                className="group-tag"
                style={{ borderColor: group.color }}
            >
                {group.name}
            </span>
        ))}
    </div>
</div>
```

## Endpointy API (Już Zaimplementowane ✅)

```
GET    /customer-groups              - lista grup
POST   /customer-groups              - tworzenie grupy
PUT    /customer-groups/:id          - edycja grupy
DELETE /customer-groups/:id          - usuwanie grupy
POST   /customer-groups/:id/members  - dodanie klientów do grupy
DELETE /customer-groups/:id/members/:customerId - usunięcie z grupy
```

## Hooki (Już Zaimplementowane ✅)

```typescript
const { data: groups } = useCustomerGroups();
const createGroup = useCreateCustomerGroup();
const updateGroup = useUpdateCustomerGroup();
const deleteGroup = useDeleteCustomerGroup();
const addMembers = useAddGroupMembers();
const removeMember = useRemoveGroupMember();
```

## Lista Zadań

- [x] Backend API dla grup
- [x] Entity CustomerGroup z relacją ManyToMany
- [x] Hooki React Query
- [x] Konsolidacja sidebarów (ClientsNav działa w VersumSecondaryNav)
- [x] Dodanie wyświetlania grup w CustomerSummaryTab (tagi z kolorami)
- [x] Dodawanie/usuwanie klientów z grup w UI (modal + przyciski)
- [x] Drag & drop do grup (jak w Versum) - przeciągnij klienta na grupę w sidebarze

## Podsumowanie

Implementacja grup klientów została ukończona. Funkcjonalności:
- Dynamiczne grupy z API z kolorami i licznikami
- Szybkie grupy: wszyscy, umówieni na dziś, ostatnio dodani
- Filtrowanie listy klientów po grupach i tagach
- Zarządzanie grupami w szczegółach klienta (dodaj/usuń)
- Drag & drop klientów do grup w sidebarze
