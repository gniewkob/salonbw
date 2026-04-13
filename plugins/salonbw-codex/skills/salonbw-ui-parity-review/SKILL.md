---
name: salonbw-ui-parity-review
description: Use after a clone is functionally close to parity and needs disciplined UI/UX review for consistency, spacing, hierarchy, and states without drifting into redesign.
---

# SalonBW UI Parity Review

Use this skill after a Versum-derived clone or panel UI change is already working and now needs controlled visual review.

## Purpose

This skill exists to improve parity quality without breaking the clone-first rule.

It should help answer:

- does the cloned screen feel visually coherent
- are spacing, hierarchy, and states internally consistent
- are there obvious friction points that can be fixed without redesigning the source flow

It should not be used to invent a new UX direction while the task is still cloning.

## Read first

- `docs/VERSUM_CLONING_STANDARD.md`
- `docs/VERSUM_CLONE_PROGRESS.md`
- `plugins/salonbw-codex/skills/salonbw-versum-clone/SKILL.md`

## Safe review scope

- spacing consistency
- alignment and visual rhythm
- typography hierarchy
- state clarity for hover, active, disabled, loading, and empty states
- button/input/card consistency
- obvious affordance problems
- contrast or readability issues

## Unsafe scope during clone phase

- changing flow structure
- replacing information architecture
- inventing a new component system mid-clone
- redesigning layouts because they feel old or awkward
- changing route semantics or behavior just to make the UI cleaner

## Recommended external attachments

- Global `ui-design-system`
  - use for token consistency, spacing systems, component naming discipline, and WCAG-style contrast checks
- Global `ux-researcher-designer`
  - use for lightweight friction notes, journey observations, and post-clone usability thinking

Treat both as supporting references, not as instructions to redesign.

## Review workflow

1. Confirm the screen is already functionally working.
2. Compare the cloned screen with the source reference or intended parity target.
3. Note only issues that are:
   - visible
   - user-relevant
   - fixable without changing the source interaction model
4. Group findings into:
   - visual consistency
   - state behavior
   - readability / accessibility
   - minor usability friction
5. Apply only the fixes that preserve the original flow.
6. Re-run browser smoke after the visual changes.

## Decision rule

If a proposed improvement changes the original flow, navigation order, or mental model, it is not a parity-review fix. It belongs in a later redesign phase.

## Good outcomes

- cleaner and more consistent clone
- less noisy spacing and hierarchy
- clearer states and affordances
- better readability without changing behavior

## Guardrails

- prefer parity over elegance
- prefer consistency over novelty
- prefer small visible fixes over broad UX rewrites
