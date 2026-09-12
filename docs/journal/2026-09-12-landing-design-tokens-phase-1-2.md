# Landing: warstwa fotografii i dyscyplina tokenów (Faza 1.1, 1.2, 2 planu)

- **Data:** 2026-09-12
- **Agent:** Claude Sonnet 5
- **Commit(y):** (branch `claude/development-status-1xv0z4`, przed PR)
- **PR:** brak jeszcze (do otwarcia po tym wpisie)

## Finding

`docs/LANDING_DESIGN_PLAN.md` (PR #1504) zmierzył trzy konkretne problemy na
żywym renderze landingu: (1) każde zdjęcie na stronie renderowało się w
kolorze mimo marki „Black & White" — zero ujednoliconego traktowania obrazu;
(2) tekst pod zdjęciami miał osobną kombinację krycia/gradientu w każdej
sekcji (hero 0.45 blend multiply, karta usługi 0.35 + gradient 0,92→0,65,
pasmo CTA osobno) — w paśmie CTA napis z szyldu salonu przebijał się przez
nagłówek dokładnie tam, gdzie gradient miał najsłabsze krycie (środek, 0.7),
czyli za tekstem; (3) 64 surowe wystąpienia `#b4b8be` zamiast tokenu (+16×
`#0d0d0d`, 12× `#ffffff`), 6 różnych wartości `letter-spacing` w
mikro-typografii, tekst treściowy 14 px na mobile (reguła marki: ≥16 px), oraz
`rgba(220,80,80,0.9)` (błąd logowania) jako jedyny kolor chromatyczny poza
tokenami — liczony ręcznie: 4,16:1 na `#0d0d0d`, poniżej progu AA dla małego
tekstu.

## Change

**Faza 1.1 — jedna warstwa monochromatyczna.** Nowe klasy w `globals.css`:
`.brand-photo` (`grayscale(1) contrast(1.06)`) i `.brand-photo--soft`
(dodatkowo `brightness(0.96)` dla teł-tekstur pod tekstem). Zastosowane na
każdym żywym `<Image>`/`<img>` na landingu: `SplitHero` (zdjęcie hero),
`ServicesTeaser` (tło karty polecanej), `SalonGallery` (siatka desktop+mobile),
`BookingCta` (tło pasma), `AboutSpread` (portret założycielki), `gallery.tsx`
(kafelki z feedu Instagram) i `ImageLightbox` (pełnoekranowy podgląd). Martwy
`HeroSlider.tsx` (niezaimportowany nigdzie, flagowany w planie jako relikt do
usunięcia dopiero w Fazie 1.4 po sesji zdjęciowej) celowo pominięty.

**Faza 1.2 — jednolity scrim.** Nowe tokeny `--scrim-strong`
(`rgba(13,13,13,0.88)`) i `--scrim-soft` (`rgba(13,13,13,0.55)`). Krytyczny
fix: `.booking-cta-section__overlay` zmieniony z diagonalnego gradientu
(najsłabszy dokładnie w centrum, za nagłówkiem) na jednolite
`var(--scrim-strong)` — szyld salonu przestaje przebijać się przez tekst.
`ServicesTeaser`'s tło karty polecanej dostało `linear-gradient(to right,
var(--scrim-strong) 0%, var(--scrim-soft) 100%)` zamiast osobnej kombinacji.

**Faza 2 — dyscyplina tokenów.** Nowe tokeny w `:root`: `--brand-white`,
4-stopniowa skala tekstu na ciemnym tle (`--white-label` 0.55 /
`--white-muted` 0.6 / `--white-soft` 0.65 / `--white-strong` 0.75 — wszystkie
≥4,5:1 na `--brand-black`), 3-wartościowa skala trackingu
(`--tracking-label` 0.08em / `--tracking-cta` 0.14em / `--tracking-eyebrow`
0.2em, dobrana wg roli tekstu, nie najbliższej liczby) i `--state-error`
(`#e35a5a`, 5,44:1 na `--brand-black` — zastępuje przezroczysty czerwony 4,16:1
w `BookingModal`, 3 wystąpienia). Wszystkie 23 dotknięte pliki
(`Navbar`, `Footer`, `BookingModal`, `Testimonials`, `CookieConsent`,
`SectionHeader`, `ServicesTeaser`, `MapFacade`, `HistoryAccordion`,
`ValuesSection`, `contact.tsx`, `services.tsx`, `index.tsx`, `404.tsx`, trzy
strony `services/*.tsx`, `ImageLightbox`, `gallery.tsx`, `AboutSpread`,
`SalonGallery`, `BookingCta`, `SplitHero`) zmigrowane na te tokeny. Świadomie
NIE tknięte: hairline bordery i alfa teł niepasujące do żadnej z 4 nazwanych
ról (np. `rgba(255,255,255,0.06-0.12)` na obwódkach), `#161616` w `MapFacade`
(celowo inny odcień niż `--brand-black` dla warstwowania kart), `theme-color`
w `_document.tsx` (atrybut meta HTML nie przyjmuje `var()`).

Przy okazji Fazy 2.3 (16 px na mobile): `SectionHeader`'s `subtitle`
(`text-sm`→`text-base`, kaskaduje na 5 sekcji które go używają),
`ServicesTeaser`'s opis karty, `HistoryAccordion`'s treść akordeonu
(`text-sm md:text-base`→`text-base`, usunięty warunek na desktop). Fazy 2.4
(rytm sekcji): sekcja kontaktu w `index.tsx` miała jedyny na stronie inline
`paddingTop/paddingBottom: 5rem` zamiast klasy `py-20 md:py-28` używanej przez
każdą inną sekcję — ujednolicone.

## Validation

- `npx tsc --noEmit` w `apps/landing` — czyste.
- `npx eslint src` w `apps/landing` — czyste.
- `npx jest` w `apps/landing` — 22 zestawy / 70 testów PASS.
- `npx next build` — sukces, 12/12 stron statycznych wygenerowanych.
- Wizualna weryfikacja: `next start` lokalnie + Playwright (Chromium z
  `/opt/pw-browsers`) zrzuty pełnostronicowe na 1440 i 390 px dla `/`,
  `/services`, `/contact`, `/gallery`, `/services/coloring`, z rzeczywistym
  przewijaniem (żeby wyzwolić `loading="lazy"` i `animation-timeline: view()`
  — pierwsza próba bez przewijania dała fałszywie puste sekcje, bo
  `page.screenshot({fullPage:true})` nie przewija realnie przez stronę).
  Po poprawce: siatka galerii (desktop 4-kol masonry + mobile 2-kol), portret
  założycielki i tło hero renderują się poprawnie w jednolitej szarości;
  `/contact`, `/services/coloring` bez regresji layoutu. `/gallery` pokazuje
  oczekiwany stan „Galeria Instagram jest chwilowo niedostępna" — sandbox nie
  ma dostępu do zewnętrznego API Instagrama, niezwiązane ze zmianą.

## Rollout

Nie dotyczy — zmiana jeszcze niezmergowana. PR do otwarcia po tym wpisie.

## Follow-up

Fazy 3 (sygnatura wizualna: zastąpienie kreski 40×2px pod nagłówkiem,
naprawa nakładania numerka/badge na karcie polecanej, przesunięcie znaku
wodnego B&W w hero, usunięcie zduplikowanego cudzysłowu w About/Testimonials),
4 (treść po sesji zdjęciowej — czeka na ownera) i 5 (porządki) z
`docs/LANDING_DESIGN_PLAN.md` pozostają nierozpoczęte. Faza 1.3 (pipeline
`sharp` do wariantów rozmiarowych, decyzja o `images.unoptimized`) też poza
zakresem tej sesji.
