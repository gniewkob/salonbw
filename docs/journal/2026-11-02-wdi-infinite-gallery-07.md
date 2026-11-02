# WDI Design Lab 07 — Infinite Gallery / native WebGL2

Status: implementation candidate. PRODUCTION UNCHANGED. URL after successful DEV deployment: /design-lab?variant=infinite.

## Design
A camera-like gallery of six real salon photos arranged on GPU-backed textured
planes, with a smoothly changing perspective. On pointer/touch or keyboard
actions the selected photo is highlighted, the viewer moves through the
sequence and a live caption updates. Native 3D rendering (WebGL2), **not**
a CSS transform and **not** a Three.js package. No extra npm dependencies.

Built as an isolated client-side canvas inside the existing development-only
Next.js Design Lab route. Existing BookingModal, real catalog offer links and
ImageLightbox are preserved. On SSR and without WebGL the selected photo remains
visible as a normal next/image, with the same controls and live captions.
Nothing relies on external CDN photos, fictional price data or expired
Instagram URLs.

### Runtime and performance
- Native WebGL2 with vertex/fragment shaders, real photo textures on planes,
  interpolated virtual camera offset, actual GPU draw calls and depth testing.
- No continuous RAF when settled; no animation offscreen or when hidden.
- Maximum source texture dimension 1024px; pixel ratio capped at 1.5.
- Resources released (textures, program, vertex buffer, observers, listeners);
  WebGL context loss falls back to static photos.
- Reduced-motion preference: static real-photo fallback, ordinary prev/next,
  booking and photo lightbox. No scroll hijacking.
- Touch gesture with vertical scroll preserved; focusable keyboard controller.
- React 18, Next.js 15; browser-native context avoids an unverified
  npm dependency or lockfile change for this initial prototype.
- Does NOT pretend that a WebGL preview is already production-grade: validate
  mobile fps, GPU usage and true browser WebGL separately.

### Evaluation
Open 07 next to 04, 05 and 06 on DEV; compare emotional impact and usability.
If 07 wins, migrate renderer to verified Three.js/R3F8 or a documented
ThreeUI Community component after pnpm lockfile and compatibility checks.
Do not claim Three.js dependency is installed before that change.

### QA
Cypress verifies all seven URLs on mobile and desktop, real photo fallback,
keyboard navigation, modal and real catalog links. Actual WebGL2 activation
needs a capable browser and should be observed on a real device: automatic
Electron smoke may only exercise the fallback. No production deployment.
