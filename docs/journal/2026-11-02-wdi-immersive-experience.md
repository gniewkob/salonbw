# SalonBW WDI — Immersive Experience (Design Lab direction 04)

Date: 2026-11-02. Scope: visual DEV prototype only. No production release.

## Creative intent

Brand statement: **Black & White is a place with character, not a services table.**
The homepage must feel like an editorial film and photographic story while still
allowing visitors to understand real services and book a visit.

**Direction 04: Immersive Experience** uses:
1. Full-bleed authentic salon photography and a typography-led scene.
2. Scroll-linked camera pull-back: image frame scales from 1.06 to 0.83 with the
   viewport's native scroll; no scroll hijacking, continuous loops, or WebGL.
3. Editorial asymmetrical photo wall using six images *already in the repo*.
4. Existing ImageLightbox with keyboard/arrow navigation.
5. Existing BookingModal and live service-catalog links, without fictitious prices.
6. PL/EN/DE copy and mobile layouts. Static SSR content stays readable.

It is a fourth choice on **/design-lab?variant=immersive**, within the
existing development-only server guard. Production never gets a navigation entry.

## Evidence and references (observed 2026-11-02)

- [Atelier Brzozowski on Awwwards](https://www.awwwards.com/inspiration/desktop-atelier-brzozowski):
  high-contrast typography and editorial salon art direction; concept reference,
  not copied assets.
- [Berenice Ammann](https://www.bereniceammann.com/): photography-led presentation
  with a spatial portfolio. Reference for image composition, not copied media.
- [Addendum Salon](https://thefirstthelast.agency/work/addendum-salon):
  luxurious dark/light section transitions and visible booking.
- [Motion Scroll Zoom Hero](https://motion.dev/examples/react-scroll-zoom-hero):
  Jan 29, 2026, documented cinematic zoom/blur fade behavior.
- [MDN Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion):
  animation reduction support.

## Interaction contract

| Element | Trigger | Change | Exit/cancel | Reduced motion |
| --- | --- | --- | --- | --- |
| Hero frame | Native page scroll | 1.06 → .83 scale; frame corner radius and title opacity follow progress | Reverse with native scroll, scroll handler unsubscribes on unmount | Static image, no scroll-linked zoom |
| Image wall | Hover / keyboard focus | Gentle image scale and colour reveal | Immediate on blur/exit | No scale transition |
| Gallery tiles | Click / Enter / Space | Existing accessible ImageLightbox | Close / Escape / keyboard arrows | Same image viewer |
| Booking CTA | Click / Enter | Existing BookingModal | Existing modal close | No decorative motion |

The animation uses CSS composited transforms and a passive scroll listener,
updated in requestAnimationFrame. No new dependency, tracking token or remote
photo hotlink. All gallery images are project-owned repository assets.

## Important Instagram distinction

The static salon photographs are **not** misrepresented as Instagram work.
The existing /gallery feature already provides Instagram media integration when
its token is available, but the DEV frontend intentionally strips
INSTAGRAM_ACCESS_TOKEN and the DEV API is Basic Auth protected.
This design links visitors to /gallery but does not bypass that authentication
boundary or invent an unlocked public media endpoint.

**Next iteration**: design an explicit read-only, approved photo selection
served from the backend with provenance, captions, consent/rights and image
caching. Avoid public API bypasses and expiring CDN URLs in hard-coded JSX.

## Release criteria

- Run tests, lint, typecheck, Next build, WDI browser QA.
- Inspect 375/768/1280/1440px, keyboard, mobile, reduced motion, console.
- Verify screenshot artifacts and check that booking modal still opens.
- Deploy only to DEV after exact SHA CI green.
- Keep existing /design-lab variants and original homepage unchanged.
- Evaluate with owner, choose direction, then only subsequently implement homepage.

NaN