# Domain Schema Inventory for the Versum Clone

This document lists the domain areas the implementation agent should derive from captured responses and standard salon-management assumptions.

## Source artifacts

Primary offline package:

- `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`

Use especially:

- `bundle/routes/*/network.json`
- `bundle/routes/*/responses/*`
- `bundle/downloads/*`

## Purpose

The goal is not to copy hidden Versum backend internals.
The goal is to stabilize the entities, fields and relations that are observable enough to support `panel.salon-bw.pl`.

## Core entities

### Customer

Observable from:

- customer list
- customer detail
- customer create/edit
- customer groups/settings

Likely field groups:

- identity: `id`, `first_name`, `last_name`, `full_name`
- contact: `email`, `phone`
- profile: notes, birthday, gender, marketing or consent-related flags
- relationship data: groups, tags, source, upcoming appointments, past appointments

### Service

Observable from:

- service list
- service detail
- service create/edit
- service price exports

Likely field groups:

- identity: `id`, `name`
- classification: category, group
- commercial: price, duration
- availability: employee assignment, booking visibility

### Product

Observable from:

- products module
- product detail pages
- stock/order/stocktaking views
- product price list export

Likely field groups:

- identity: `id`, `name`
- stock data: quantity, stock status, stocktaking participation
- commercial: price, cost, tax-related fields if visible
- classification: category, supplier or order grouping

### Employee

Observable from:

- employee settings
- timetable settings
- commissions
- activity logs

Likely field groups:

- identity: `id`, `name`
- role or staff classification
- timetable availability
- commission configuration
- activity log references

### Appointment and calendar view

Observable from:

- calendar
- calendar custom views
- customers linked to visits

Likely field groups:

- identity: `id`
- temporal data: date, start, end, duration
- linked entities: customer, employee, service
- state or attendance flags where visible

### Communication item

Observable from:

- communication listing
- newsletters/messages/social pages
- communication detail pages

Likely field groups:

- identity: `id`, `title`
- channel: email, SMS, social or predefined template type
- audience/segment
- scheduling or send-state metadata

### Statistics view model

Observable from:

- dashboard
- statistics dashboard
- employee/service/source/repeat-customer reports
- financial export

Likely field groups:

- date range
- grouping dimension
- totals
- counts
- value aggregates

## Relationship inventory

Minimum relationships to preserve:

- customer -> groups
- customer -> tags
- customer -> appointments
- appointment -> service
- appointment -> employee
- appointment -> customer
- service -> category
- product -> stock movements
- employee -> timetable
- employee -> commissions

## Enums and controlled values

The implementation agent should extract controlled values from responses whenever present:

- status values
- report grouping names
- communication channel names
- customer source values
- group/category names

If a value set is incomplete in captured artifacts:

- use observed values as the initial seed
- allow extension in `salonbw`
- treat missing values as `invented`, not as hidden certainty

## Recommended output for implementation

The implementation agent should gradually turn observed schema into:

- TypeScript types
- backend DTOs
- API contracts
- seed data
- mock fixtures

## What must not be claimed as known

Do not claim certainty for:

- full validation rules
- hidden backend-derived computed fields
- full permissions matrix
- async side effects after writes
- accounting rules
- external integration contracts not captured directly

## Scope exclusions

These remain outside the target clone scope:

- KSeF and accounting-specific invoice workflows
- Booksy integration and migration flows
