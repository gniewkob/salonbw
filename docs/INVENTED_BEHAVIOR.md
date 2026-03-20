# INVENTED BEHAVIOR

## Purpose

This document defines the boundary between:
- `reconstructed` behavior, based on the Versum dump
- `invented` behavior, which must be designed by us because the source panel does not expose enough information

Primary dump location:
- `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`

The goal is to prevent agents from pretending unknown logic was extracted from Versum when it was not.

## Rule

If behavior cannot be confidently supported by:
- screenshot evidence
- saved HTML
- route-level network capture
- saved JSON responses
- exported files

then it must be treated as `invented`.

## What We Can Reconstruct Reliably

- route structure for many key views
- information architecture
- main layout and navigation
- table layouts and many list/detail page structures
- many labels, headings, tabs, toolbar patterns
- representative request/response examples
- some feature flags from inline config
- report/export entry points
- modal presence and several global overlays

## What We Must Often Invent

### Backend / business logic

- full validation rules
- side effects after create/edit/delete
- background jobs
- async processing semantics
- permission logic
- billing/accounting internals
- exact calculation formulas for reports

### Missing UI states

- all empty states
- all validation messages
- all error recovery paths
- all role-specific variants
- all modal-open variants
- all destructive confirmation flows

### Partially observed modules

- advanced settings subroutes
- social integrations
- premium / moment-like feature surfaces
- test/segmentation features
- account/credential management internals

## Explicitly Out Of Scope

These should not drive implementation parity:

- KSeF-specific accounting flows
- KSeF alerts beyond acknowledging they exist in source UI
- Booksy integration
- Booksy migration / conversion flows

## Design Rules For Invented Behavior

When behavior is invented:

1. Preserve the visible IA and UI language of the clone.
2. Reuse existing `salonbw` architecture and components first.
3. Prefer standard CRUD and standard form behavior over speculative Versum-specific logic.
4. Prefer consistency with already-implemented `salonbw` modules over speculative 1:1 mimicry.
5. Mark the implementation note as `invented`.

## Acceptable Sources For Invented Behavior

When the dump is insufficient, agents may rely on:

- already existing patterns in `apps/panel`
- common admin-panel conventions
- standard salon/business domain assumptions
- explicit product decisions recorded in project docs

## Required Agent Annotation

Whenever an implementation includes invented behavior, the agent should state:

- what exact part was not recoverable from the dump
- what assumption was chosen
- why that assumption is reasonable for `panel.salon-bw.pl`

## Practical Examples

### Reconstructed

- a customer detail page whose screenshot, HTML, and data responses exist in the dump
- an employee activity log table with route-level evidence and payload examples

### Invented

- hidden save rules for payment configuration not visible in payloads
- exact workflow of an advanced marketing tool not fully captured in the dump
- social integration authorization flows not fully exposed by screenshots or responses

## Explicit Current Route Inventory

The following routes currently exist in the panel, but must still be treated as `invented` rather than exact Versum parity:

- `/calendar/views`
- `/communication/:id`
- `/services/new`
- `/settings/payment_configuration`
- `/settings/categories`
- `/settings/customer_origins`
- `/settings/data_protection`
- `/settings/extra_fields`
- `/settings/timetable/branch`
- `/settings/timetable/employees`
- `/settings/timetable/templates`
- `/settings/timetable/employees/copy`
- `/settings/trades/new`

These routes remain `invented` for at least one of these reasons:

- backend contract does not exist yet
- visible CTA is intentionally disabled to avoid fake parity
- route is backed by local/session storage instead of shared persisted state
- salonbw uses a different domain model than legacy Versum, so the flow is reconstructed rather than copied 1:1

Route-specific note:

- `/calendar/views` is still inventoried here, but no longer because of local/session storage. The remaining delta is the route-driven Next.js modal flow versus the original Versum PJAX HTML-partial contract.
