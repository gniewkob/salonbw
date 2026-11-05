# SalonBW WDI / Apple Design — interaction quality pass

Date: 2026-11-02. Applicable to experimental DEV Design Lab variants 04–06.

## Provenance

Applied the installed **Web Design Intelligence apple-design** skill. It is an
independently authored web adaptation, not a verbatim copy of Emil Kowalski's
upstream skill and not an official Apple product or certification.

Authoritative primary sources (guidance, not normative requirements for our site):

- Apple Human Interface Guidelines — Motion:
  https://developer.apple.com/design/human-interface-guidelines/motion
  Purposeful, brief, physically coherent motion; give the user control and
  allow reducing/interrupting large movement.
- Apple Human Interface Guidelines — Gestures:
  https://developer.apple.com/design/human-interface-guidelines/gestures
  Familiar direct manipulation, responsive feedback and equivalent input.
- Apple Human Interface Guidelines — Design Principles:
  https://developer.apple.com/design/human-interface-guidelines/design-principles/
  Consistency, preserved user context, multiple input methods.
- Apple Human Interface Guidelines — Feedback:
  https://developer.apple.com/design/human-interface-guidelines/feedback
  Immediate, clear confirmation of changing interface state.

## Applied changes

1. **05 Motion Reel**: focused rail supports ArrowLeft/ArrowRight/Home/End as
   alternatives to touch-swipe and visible prev/next buttons. Live photo
   position feedback, snap-stop on actual cards and low-latency pressed states.
2. **06 Spatial Atelier**: horizontally directed touch gesture rotates one
   image. Vertical gestures remain native browser scrolling (touch-action
   pan-y), with regular buttons and keyboard arrows as alternatives. CSS
   transition tuned to 680ms with interruption via current state; selected
   caption and live position feedback.
3. **Design Lab selector + CTAs**: consistent short pressed feedback
   (180ms), accessible focus and minimum touch targets. Selector uses a
   practical three-column desktop/two-column mobile grid for six choices.
4. **Reduced-motion fallback**: no orbit transitions or zoom on preference,
   while image selection, booking and URL navigation still work.
5. **Mobile ergonomics**: native scrolling, no scroll/wheel hijacking; safe
   area-aware footer and controls.

## Interaction contract

Element | Trigger | Feedback | Exit/interrupt | Accessible alternative
---|---|---|---|---
Motion Reel | Native touch/trackpad swipe or rail keyboard | Current photo position, progress meter and scroll snap | New swipe/key/button interrupts or changes target | Visible prev/next buttons, focusable labeled region
Spatial Atelier | Horizontal touch gesture or rotation button | 60-degree photo movement, position and caption update | Next gesture/button always accepted | ArrowLeft/ArrowRight on focusable region, visible buttons
Booking | Tap/click/Enter | Press feedback <200ms; existing BookingModal | Existing modal Escape/close | Native button and preserved focus behavior
Design selector | Tap/click/Enter | Pressed state, updated URL and stage | Select another option instantly | Keyboard-focusable buttons with aria-pressed

## Explicit non-goals

No cloning of Apple proprietary visual appearance, no macOS window chrome,
no Liquid Glass imitation, no hidden gestures, no new heavy runtime dependency.
Preserve SalonBW typography, authentic photographs, semantic navigation,
real booking flow, real service catalogue and DEV-only access boundaries.

## QA

Use CI and real Next.js browser checks for six variants at 390px and 1440px,
including arrow-key navigation, touch simulation, photo lightbox and booking.
Record PASS/FAIL. Do not claim physical iPhone performance or WCAG compliance
without actual device and accessibility audit. Only DEV deployments are
authorized under the existing exact-SHA, CI-gated release workflow.
