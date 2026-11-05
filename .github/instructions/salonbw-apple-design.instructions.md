---
applyTo: "apps/landing/src/**/*.{tsx,ts,css}"
---

# SalonBW — Apple Design craft within Web Design Intelligence

Use the installed **WDI Apple Design** skill (independent adaptation:
`skills://plugins/web-design-intelligence/apple-design`) alongside
`web-design-director`, `motion-interaction`, `prototype` and the mandatory
`.claude/skills/salonbw-brand/SKILL.md`.

This is a Next.js website, NOT a native Apple application. The SalonBW brand,
browser semantics, real booking, API service data, accessibility and performance
always override Apple-inspired visual trends. Never copy iOS navigation,
Liquid Glass or another proprietary Apple appearance.

## Working principles

1. **Clarity and hierarchy:** one recognizable primary CTA ("Umów wizytę"),
   real price/catalog access, readable copy and original salon photography.
2. **Direct manipulation:** photos and spatial content should respond to
   familiar swipe, native scrolling, keyboard and visible arrow controls.
   Never require a gesture as the sole means of interaction.
3. **Continuity:** use transformations only to explain changes of viewpoint,
   not to distract. Preserve content and focus when variants change.
4. **Physical but restrained:** 150–300ms UI feedback; longer deliberate
   scene transitions only when they improve comprehension. Transitions
   interruptible through subsequent input; no autoplay 3D spinning.
5. **Agency:** native scroll and URLs work; visitors can reach booking and
   services without completing an animation.
6. **Accessibility:** at least 44x44px touch targets, visible keyboard focus,
   adequate contrast, alt text, PL/EN/DE content in existing Design Lab,
   support prefers-reduced-motion, safe-area and narrow-screen layouts.
7. **Performance:** prefer CSS transforms/opacity, native scroll-snap and
   requestAnimationFrame where necessary; no WebGL just for ornament and
   no new UI dependencies without an evaluated reason.
8. **Evidence:** review mobile 390px, tablet 768px and desktop 1440px,
   validate keyboard, touch, zero horizontal overflow, booking, and reduced
   motion. Record observed screenshots and actual CI/browser results.
9. **Deployment:** user approves designs on hosted DEV first; NEVER merge
   an exploratory design branch to master or deploy it to production.

## Prototype evaluation

- 04 / Immersive Experience: controlled camera pull-back, still readable on
  short mobile screens; the scroll position and visual state remain linked.
- 05 / Motion Reel: naturally swipeable photo gallery with visible arrow
  buttons and coherent active-frame feedback.
- 06 / Spatial Atelier: short, deterministic 3D rotation with a stationary
  reference, touch alternatives, and immediate response to subsequent input.

## Attribution

WDI Apple Design skill is an independent, non-verbatim adaptation.
Primary guidance:
- https://developer.apple.com/design/human-interface-guidelines/design-principles/
- https://developer.apple.com/design/human-interface-guidelines/motion/
- https://developer.apple.com/design/human-interface-guidelines/gestures/

Apple HIG is reference material for interaction judgment, not an applicable
normative requirement for this website.
