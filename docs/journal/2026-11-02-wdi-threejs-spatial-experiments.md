# SalonBW — WDI Spatial Experience / ThreeUI Research and Prototype Spec

Date: 2026-11-02. Status: **concept architecture — NOT BUILT or deployed**.
Owner direction: test actual Three.js/WebGL, depth, camera choreography and rich image experiences; retain real salon photos, offer and bookings.

## Verified project runtime

- `apps/landing/package.json`: Next.js 15.5.28, React 18.3.1, pnpm 10.14.0.
- **None** of `three`, `@react-three/fiber`, `@react-three/drei`,
  `@designcodeio/threeui`, Motion or GSAP is declared in the Landing manifest.
  The *WDI ThreeUI and Apple Design skills are available*, but a skill is
  not an npm runtime dependency.
- Existing 04/05/06 variants are CSS/React motion studies, not WebGL 3D.
- Existing files provide genuine salon images and BookingModal plus live API
  service routes. Do not substitute fabricated hairstyle results.

## Primary references (verified 2026-11-02)

- ThreeUI Community source: https://github.com/MengTo/threeui
- ThreeUI Community package 1.2.0 manifest:
  https://github.com/MengTo/threeui/blob/main/package.json
  MIT; peer dependencies React >=18 <20 and three >=0.149 <1.
  Verify the **specific Community component** before using its API; Pro/Beta
  material is not included.
- ThreeUI gallery: https://threeui.com/ — example creative directions:
  photography-led chapters, spatial objects and shader-based light.
- React Three Fiber compatibility:
  https://r3f.docs.pmnd.rs/next/getting-started/introduction
  R3F v8 pairs with React 18; v9 pairs with React 19; v10 alpha is not a
  target for this project.
- Apple-inspired interaction skill: `skills://plugins/web-design-intelligence/apple-design`;
  independently adapted guidance, not Apple proprietary UI.
- SalonBW brand: `.claude/skills/salonbw-brand/SKILL.md`.

## New interactive studies — to build on DEV, not yet implemented

### 07 — Infinite Salon Gallery (priority 1)

Camera moves through a field of **project-owned photographs** on planes in a
Three.js scene (desktop pointer + scroll, mobile touch). Hover or center focus
raises a plane slightly and reveals a short title; clicking opens existing
accessible ImageLightbox; independent HTML booking button remains fixed outside
the canvas. Depth-of-field is optional, not required for function. Genuine
Instagram images must be curated through an approved read-only data flow; do
not bypass DEV Basic Auth or hotlink expiring tokens.

### 08 — Cinematic Salon Journey (priority 2)

A photographic full-screen landing narrative: viewport scroll controls
camera Z and the transition between 3 scenes (interior, artist, gallery). The
world moves around stable, accessible HTML headings and booking CTA. A
scrubbed scene stops when scrolling stops; no autoplay, no scroll hijack.
On mobile, switch to static photo chapters if GPU costs are high or if motion
is reduced.

### 09 — Interactive Monochrome Sculpture (priority 3)

A touch-rotatable gallery object made of photo planes or polished monochrome
geometry. Use Apple-style direct manipulation and interrupted spring settling,
but never clone native iOS chrome. Responsive real-photo thumbnails and a
regular photo grid serve as fallback. Explore local Three.js materials first;
no incompatible shader/premium component dependency.

## Architecture / release contract

- **Do not claim WebGL built until the package is installed, bundling is
  verified, and a functioning scene renders in a browser.**
- Add ONE minimal dependency graph at a time. Option A: plain `three` +
  `@types/three`. Option B: compatible R3F 8 + `three` for JSX composability.
  Option C: a specific public ThreeUI Community 1.2.0 component by documented
  subpath. Run pnpm to update **both manifest and lockfile**; do not invent
  lockfile entries.
- Client-only dynamic scene import in the existing Next.js Pages router; SSR
  keeps an accessible real photograph, heading, service links and BookingModal.
- Lazy-load Canvas below/after the hero's static content; preserve page content
  without JavaScript and when WebGL context creation fails.
- Reduce DPR and object counts on mobile; IntersectionObserver or page
  visibility suspends render; unsubscribe and dispose all textures, materials,
  renderer and GPU resources on teardown.
- No endless spinning, no forced scroll or input capture. Touch, mouse and
  keyboard must have equivalent controls. Respects prefers-reduced-motion,
  focus visibility and 44px hit targets.
- Use brand black/white/silver values; no neon, purple, arbitrary gold.
- One release per study, exact SHA CI, WDI browser QA + screenshots, deploy
  Landing **DEV only**, never merge to master or prod before owner review.
- Compare visuals 390 / 768 / 1440, quality and controls; measure JS delta,
  mobile LCP/INP/CLS, availability of fallback, WebGL context loss and GPU
  duty cycle. No performance or conversion claims before actual measurement.

## Recommended sequence

Keep 04/05/06 available as lighter baselines. Prototype 07 in an isolated
client-side island first. Review visuals and perf. Then prototype 08 and 09
only if the distinctive 3D experience improves storytelling and makes the
salon portfolio more compelling without reducing booking usability.
