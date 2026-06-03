# Panel bundle size baseline (post F3/F4/F5)

Data: 2026-06-04
Skąd: produkcja `panel.salon-bw.pl`, buildId `7EOwNvykKlT-lkfSFoauz`
Stan po sesji 2026-06-03 (F3 calendar split + F4 mobile + F5 Heroicons).

## 1. Top-level chunki ładowane przez `/auth/login`

| Chunk | Rozmiar (gzip wire) | Czym jest |
|---|---|---|
| `_app-*.js` | 325 KB | Globalny shell — `_app.tsx` + AuthContext + SecondaryNavContext + ToastProvider + SalonShell + SalonShellMobile + MobileNavDrawer + RouteGuard. Ładowany na każdej stronie panelu. |
| `framework-*.js` | 140 KB | React + Next.js runtime. Nie tknięte. |
| `main-*.js` | 136 KB | Next.js client bootstrap. Nie tknięte. |
| `polyfills-*.js` | 113 KB | Polyfills dla starszych przeglądarek. Nie tknięte. |
| `pages/auth/login-*.js` | 6.9 KB | Tylko logika strony login. |
| `9944-*.js` | 6.4 KB | Mały vendor split. |
| `webpack-*.js` | 3.7 KB | Webpack runtime. |

Razem (gzip wire) pierwszego ładowania login: **~ 730 KB**.

## 2. Heroicons — tree-shaking sanity check

Po F5 (sprite icons → Heroicons) wszystkie importy w `apps/panel/src/` korzystają z **named imports z subpath** — to wzorzec rekomendowany przez Heroicons + Next.js do skutecznego tree-shakingu:

```ts
import { CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
```

Tree-shaking działa: tylko 23 ikony zarejestrowane w `SalonIconRegistry.ts` (plus pozostałe użyte w `ClientsList`, `booking.tsx` etc.) trafiają do bundle. Pakiet raw `node_modules/@heroicons/react/24/outline` ma 5.2 MB sources, ale produkcyjny bundle zawiera tylko fragmenty użyte w kodzie.

## 3. Co potencjalnie warto skurczyć

| Cel | Szacowany zysk | Trudność |
|---|---|---|
| `_app.js` ciągle 325 KB — sprawdzić co tam jest naprawdę potrzebne na każdej stronie (np. czy `MobileNavDrawer` mógłby być `next/dynamic` jeśli odpalany tylko na mobile) | 20-50 KB | MED — wymaga refaktoru |
| `date-fns/locale/pl` — sprawdzić czy nie importowany hurtowo gdzieś | 5-20 KB | LOW |
| `framer-motion` / inne animation libs — sprawdzić obecność | ? | LOW (audit) |
| FullCalendar (`@fullcalendar/react`) ładowane tylko na `/calendar` przez `next/dynamic({ ssr: false })` — już zoptymalizowane | — | DONE |

## 4. Jak puścić pełny analizator

`@next/bundle-analyzer` już skonfigurowane w `next.config.mjs`. Lokalnie:

```bash
cd apps/panel
pnpm analyze
```

Build trwa ~3-5 minut, otwiera dwa raporty HTML (client + server). Najbardziej użyteczne:
- **Treemap dla client bundle** — pokazuje co dokładnie jest w `_app.js`
- **Stat output** — porównanie gzipped sizes per route

## 5. Co zostało zoptymalizowane w bieżącej sesji

- **F3 (calendar split):** calendar.tsx 2365 → 1204 (-49%). Logika rozbita na 13 hooków — kod łatwiejszy do tree-shake'owania (mniejsze chunki per hook).
- **F4 (mobile mode):** `MobileNavDrawer` + `MobileBottomSheet` + `MobileReceptionListView` szacunkowo +20-30 KB do _app. Wszystkie tree-shakable, ale pojawiają się na każdej stronie panelu (`SalonShell` deleguje do `SalonShellMobile`). Możliwe `next/dynamic` w przyszłości.
- **F5 (sprite → Heroicons):** -3.5 KB raw (SalonSvgSprites.tsx -123 lines). Heroicons tree-shaken — efektywnie zerowy narzut bo i tak były potrzebne nazwy ikon.

## 6. Notatki na następną sesję

- Real `_app.js` deep dive wymaga interaktywnego `pnpm analyze`.
- Quick win: zakodować Roboto/Open Sans/Playfair jako preconnect+display=swap (już jest w `_document.tsx`).
- Service worker dla offline shell — outside scope F4 (de-scoped w planie), ale daje real perceived-perf.
- `_app.js` 325 KB to dolna granica "OK dla panelu CRM-class" — bigger CRM apps typically have 400-600 KB tu.
