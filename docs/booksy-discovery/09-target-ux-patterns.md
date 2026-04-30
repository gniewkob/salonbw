# 09 — Target UX Patterns (Unified Panel)

## Zasada nadrzędna

Nie budować każdej strony osobno. Każda podstrona panelu musi używać tego samego shellu i tych samych primitives.

## Shell panelu

- Stały sidebar.
- Stały topbar.
- Stały page header.
- Dynamiczna treść (content outlet).
- Wspólne spacingi, typografia, states (`loading/empty/error`).

## Komponenty docelowe

| Komponent | Cel | Użycie | Props / data | Przykładowe moduły |
| --- | --- | --- | --- | --- |
| `PanelShell` | globalny layout | wszystkie strony staff | `role`, `activeModule`, `children` | cały panel |
| `PanelTopbar` | global actions + user | shell | user, branch, quick actions | cały panel |
| `PanelSidebar` | nawigacja modułów | shell | modules, active | cały panel |
| `PanelPageHeader` | tytuł i CTA | każda podstrona | title, subtitle, actions | calendar, customers |
| `PanelSecondaryNav` | nawigacja lokalna modułu | moduły z podsekcjami | tabs/tree/list | settings, warehouse |
| `PanelCard` | bloki treści | dashboard/forms | title, actions | dashboard, settings |
| `PanelTable` | listy danych | CRM/magazyn/sales | columns, rows, filters | customers, products |
| `PanelToolbar` | filtrowanie i akcje listy | list screens | search, filters, bulk actions | customers, reports |
| `PanelFilters` | zestaw filtrów | calendar/list | filter schema, state | calendar, reports |
| `PanelModal` | akcje krótkie | create/edit quick | open, onClose, onSubmit | quick add |
| `PanelDrawer` | długi flow kontekstowy | appointment/customer detail | sections, entity, actions | calendar, CRM |
| `PanelTabs` | podział sekcji | profile/detail | tabs, active | customer profile |
| `StatusBadge` | status semanticzny | wszędzie | status, variant | appointments, payments |
| `EmployeeAvatar` | identyfikacja pracownika | cards/lists | employee | calendar, sales |
| `ClientAvatar` | identyfikacja klienta | cards/lists | client | CRM, calendar |
| `PriceDisplay` | spójna prezentacja kwot | POS/reports | value, currency, tax mode | sales, reports |
| `DateRangePicker` | zakres dat | reports/list | from, to, presets | statistics/reports |

## Kontrakt wdrożenia

- Każdy nowy ekran Booksy-like musi przejść przez `PanelShell`.
- Zakaz full-screen embed jako główny sposób budowy modułu.
- Komponenty legacy utrzymujemy tylko do czasu migracji.
