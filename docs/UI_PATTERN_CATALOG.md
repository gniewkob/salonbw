# UI Pattern Catalog for SalonBW Panel

This catalog defines the reusable UI patterns the implementation agent should extract and formalize **in parallel** with delivering individual screens (Build kit through backlog delivery).

## Golden Rule: "Rule of Two"

Do not build abstract UI components in isolation (Premature Abstraction). A pattern should only be formalized into a shared component (e.g., `<PanelTable>`, `<PanelFormSection>`, `<PanelModal>`) when it has **at least 2 real-world use cases** in the actual routes being delivered. Extract them organically while building P1 routes.

## Source artifacts

Primary source:

- `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`

Use especially:

- `bundle/screens/`
- `bundle/routes/*/page.html`
- `bundle/routes/*/network.json`
- `ia-summary.md`

## Core shell patterns

### Topbar

Use for:

- user menu
- notifications/help entry points
- global actions

Observed characteristics:

- persistent across modules
- compact height
- dashboard-wide context

### Main sidebar navigation

Use for:

- module switching

Expected entries:

- calendar
- customers
- stock/products
- statistics
- communication
- services
- settings
- extensions

### Secondary navigation

Use for:

- module-specific views and filters
- customer groups
- settings subareas
- reporting subsections

Rule:
implement as a reusable shell region, not as ad hoc per-page markup.

## Content patterns

### Data table view

Use for:

- customers
- services
- products
- communication listings
- statistics breakdowns
- activity logs

Standard requirements:

- toolbar with primary action
- filters or search
- sortable or grouped columns when visible in source
- empty state
- loading state
- error state

### Detail header

Use for:

- customer detail
- product detail
- service detail
- communication detail

Standard requirements:

- entity title
- status/meta area
- primary actions
- tabs or section navigation when observed

### Create/edit form

Use for:

- new customer
- new service
- settings forms
- branch and SMS settings

Standard requirements:

- grouped sections
- visible field ordering matching dump
- save/cancel action area
- inline help only when evidenced or clearly needed

### Filters bar

Use for:

- statistics
- communication
- table-heavy modules
- calendar variants

Standard requirements:

- compact control density
- left-aligned filters
- action/export controls near the same bar when observed

## Overlay patterns

### Modal

Use for:

- create flows
- confirmations
- management dialogs

Global references observed in dump:

- modal containers
- BootstrapDialog-like patterns

Rule:
modal implementation should be reusable and not tied to one module.

### Alert/notification bar

Use for:

- network/data load errors
- informational warnings
- temporary product notices

Observed global examples:

- network error bar
- invoice-related alert on dashboard
- survey banner

Rule:
only excluded scopes should stay excluded, but the alert pattern itself should be reusable.

### Date picker and range overlay

Use for:

- calendar
- statistics

Rule:
implement as a shared interaction pattern.

## State patterns

Every screen should support these states even if only one was captured directly:

- default populated state
- loading
- empty
- error
- disabled or readonly when reasonable

If a state is not explicitly visible in the dump, implement it using standard `salonbw` assumptions and mark the behavior as `invented` if needed.

## Verification rule

Use screenshots as parity checks for:

- spacing
- density
- hierarchy
- action placement
- section order

Do not use screenshots only as loose inspiration.

## Scope exclusions

These remain excluded from implementation parity:

- KSeF and accounting-specific invoice workflows
- Booksy integration and migration flows
