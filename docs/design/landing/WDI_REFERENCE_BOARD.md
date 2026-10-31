# WDI Reference Board — Salon Black & White

- **Verified:** 2026-10-31; original salon websites (not screenshot galleries or unverifiable rankings).
- **Scope:** Homepage introduction, catalog hierarchy, per-service pricing/variants and booking entry.
- **Use policy:** Patterns and interaction ideas only. No copied photos, source templates, third-party fonts or testimonials. No conversion statistics attributed to examples.

| Source (direct, original) | Observed content/pattern | Fit to SalonBW | Adapt / reject | Risk / evidence boundary |
| --- | --- | --- | --- | --- |
| [Sassoon Salon](https://salon.sassoon-global.com/) | Understated luxury positioning; concise brand statement and location-led exploration. | Editorial restraint is consistent with Playfair/Open Sans and monochrome identity. | **Adapt** disciplined heading scale and whitespace for the homepage; **reject** region/location selection for our single-salon site. | Textual page structure inspected on 2026-10-31; visual performance, mobile/a11y not measured. |
| [Salon SCK — services](https://www.salonsck.com/services/) | Clear service groups, a mixture of fixed prices, ranges, `& Up` and explicitly consultation-dependent services; direct booking entry. | Closest model for hair service variants and price transparency. | **Adapt** price classification, service category explanations and context-aware call to action, only when supported by catalog; **reject** hardcoded portfolio/claims. | Their catalog/booking platform differs; no transferable conversion claim. |
| [Duck & Dry](https://duckanddry.com/) | First-screen treatment prices beside “Book Now”, service lookbook and FAQs explaining choice of hair length. | Aligns with the imported flat Booksy variants and needs of visitors who know their service. | **Adapt** quick price/time/booking comprehension; **reject** colorful e-commerce UI and product merchandising. | No assumption that hair length variants follow the same rules for our salon. |
| [The Salon Project](https://thesalonproject.com/) | Consultation-led messaging, explicit service routes and direct online booking link; photo-centric brand narrative. | Useful reference for positioning without hiding the booking path. | **Adapt** clear service-to-booking path; **reject** replicated reviews/star ratings and unverified consultation promises. | Their reputation metrics are not relevant to Black & White; original site inspected on 2026-10-31. |

## Pattern matrix

| Pattern | Editorial impact | Conversion hypothesis (unmeasured) | Responsive / access constraint | Decision |
| --- | --- | --- | --- | --- |
| Full-screen cinematic hero | Strong if first-party photos are excellent | Could slow the route to prices | Must not displace first action excessively on mobile; LCP and reduced-motion | **Shorten and simplify** rather than add more animation |
| One main booking CTA concept | Clear | Less decision friction | ≥44px touch, visible focus, preserve BookingModal | **Adopt** |
| Catalog price beside duration | Functional elegance | Supports comparison before booking | Single column at 390px; reflow without horizontal overflow | **Adopt** |
| Grouped variants and explicit “od” | Transparent | Reduces uncertainty about actual service scope | `details/summary` keyboard native; exact API price type and nested semantics | **Keep and improve** (L2/L3) |
| Sidebar category selector on desktop | Structured, fast scanning | Could reduce catalog browsing work | On mobile change to horizontally scrollable chips; preserve aria-pressed | **Prototype/implement B** |
| Consultation CTA instead of availability | Might fit some complex services | Could confuse when API allows direct booking | No consultation claim unless catalog/business confirms it | **Hold** |
| Decorative WebGL/ThreeUI | Potential novelty | No evidenced booking benefit | Bundle/GPU cost, no-JS, reduce-motion fallback | **Reject for L4** |

## Findings vs claims

- **OBSERVED:** Actual SalonBW code has `SplitHero`, `ServicesTeaser`, `BookingModal`, `/services` with API-driven pricing. The full-screen hero uses `height:100svh; min-height:640px`; this creates a *risk* of pushing catalog content below the fold, **not a measured loss of bookings**.
- **STATIC:** Nested variants cannot be passed as flat `serviceId` to the current BookingModal: L2/L3 preserve this, and must continue to.
- **NOT TESTED:** Relative conversion, production loading performance, actual salon catalog, screen reader, 390/1440 hosted DEV screenshots and Lighthouse.
- **PROTOTYPED:** A/B/C layouts with **synthetic data** and a demo-only booking dialog; the prototypes are not connected to any production API.

## Sources and provenance

Direct observed websites above; original SalonBW internal reference: `.claude/skills/salonbw-brand/SKILL.md`, `apps/landing/src/pages/index.tsx`, `apps/landing/src/pages/services.tsx`. No outside code/assets were imported.
