# Landing Design Direction

> Strategic brief, critique, and recipe for `apps/landing`. Owner: design.
> Captured 2026-06-01 after a critical review session.

## Brief (from owner)

- **Pozycjonowanie**: nowoczesny + elegancki salon. Target: kobieta szukająca **jakości** (premium price-point), nie low-cost, nie trendy-bait.
- **"Akademia Zdrowych Włosów"** to **differentiator słowny** (jak "Atelier", "Studio") — sygnał wysokiego standardu i mistrzostwa. **Nie jest** obietnicą medyczną/kliniczną.
- **Trichologia (Nioxin)** — Aleksandra ma doświadczenie i pracuje z protokołami Nioxin, ale to **soft proof point**, nie wiodąca usługa. Wzmianka — tak. Cała sekcja kliniczna — nie.
- **Roadmap**: rozszerzenie oferty o **doczepianie włosów** (extensions). Plan publikacji dedykowanej strony usługi w przyszłej iteracji.

## Diagnoza (TL;DR)

Strona jest **dobra**, ale **over-designed** dla swojej obietnicy. Premium audience odczytuje nadmiar dekoracji jako sygnał *try-hard* — odwrotnie do "jakości".

Egzekucja techniczna (a11y, SEO, performance, animacje, focus management) — **na poziomie A**. Decyzje strategiczne (IA, hierarchia, paleta typograficzna) — **B−**. Po zacięciu około 30% elementów strona zyska na klasie więcej niż po 100 godzinach polishingu.

## Recipe: cuts and additions

### Cut: Hero (z 11 elementów do 6)

Wytnij z `SplitHero.tsx`:
- B&W mark (logo w nav wystarcza)
- scroll-hint
- floating-card z godzinami + telefonem (przenieś do sekcji `Contact`)
- diagonal divider
- gold-tint overlay
- meta-pill z trust-statement

Zostaw: eyebrow ("Akademia Zdrowych Włosów"), headline ("Black & White"), 1-liniowy tagline, primary CTA ("Umów wizytę"), 1 zdjęcie pracy. Sekret modernej elegancji = **cisza**.

### Cut: Tangerine (trzecia typografia)

`Tangerine` (kursywa) na akcencie "Black & White" w hero i podpisach w `FounderMessage` kojarzy się z lokalnym salonikiem (anti-pattern script-fonts w hair industry z 2010). Premium audience czyta to jako *try-hard*.

Wszystkie miejsca z `font-family: 'Tangerine'` → **Playfair Display italic, lighter weight**. Mocniej, ciszej, premium. Para Playfair + Open Sans wystarczy.

### Cut: Information architecture — z 10 sekcji do 5

Obecny home page (`pages/index.tsx`) ma 10 sekcji. Premium service business potrzebuje 5–7.

Recipe pod target:

```
1. Hero (uproszczony, 1 CTA)
2. Services preview — 3-4 karty z ceną widełkową ("od X zł")
3. Gallery — top 6 realnych prac (curated, nie cały Instagram feed)
4. Founder note — Aleksandra, 1 akapit + cytat (Nioxin/trycho jako soft anchor)
5. Booking CTA + Contact + Mapa
```

**Wytnij całe sekcje:**
- `StatsBar` (liczby)
- `TrustStrip` (loga marek)
- `PartnerBrands` (osobna sekcja partnerów)
- `GoldTickerStrip` (czysta dekoracja, 0 informacji)

**Zmniejsz:**
- `AboutSpread` → 1-akapit founder note (zamiast pełnego "founder + 3 principles")
- `Testimonials` → cytat klientki **nad zdjęciem w gallery** (zamiast osobnej sekcji)

Cztery moduły trust (`StatsBar` + `TrustStrip` + `PartnerBrands` + `Testimonials`) → **jeden mocny** (testimonial w gallery) + **jedno wzmocnienie** (loga marek na stronie `/services`, nie na home).

### Cut: motion fatigue

`ScrollReveal` + `StaggerReveal` owijają niemal każdą sekcję. Brak motion-systemu.

- Ustal 2 czasy: 150ms (micro) / 300ms (macro)
- Ustal 1 easing: `cubic-bezier(0.32, 0.72, 0, 1)` (natywne, iOS-like)
- **Animuj tylko hero entry + mikro-stany interakcji**. ScrollReveal może zostać dla 1-2 kluczowych sekcji (np. `AboutSpread`), nie dla wszystkich.

### Unify: CTA system

Dziś `~5 wariantów` "primary action button" na landingu (`.btn-silver`, `.btn-gold` legacy, `.split-hero__cta-primary`, `.footer-booking-btn`, inline-style w `BookingModal` i `contact.tsx`).

→ **Jedna klasa**: `.btn-primary` w jednym miejscu w CSS. Wszystkie CTA używają tej samej klasy. Spójność = profesjonalizm.

### Add: cennik widełkowy na `/services`

Premium buyer **nie dzwoni żeby zapytać o cenę**. Obecnie ceny są w panelu/Versum.

Dodaj widełki na `/services` i kartach hero usług:
- "Strzyżenie damskie · od 150 zł"
- "Balayage · od 450 zł"
- "Koloryzacja jednolita · od 280 zł"

Premium = "wiem co kupuję i co zapłacę". Ukrywanie ceny = sygnał niskiej pewności wartości.

### Add: gallery jako before/after pairs

Premium hair salon **sprzedaje pracą wizualną**. Obecny `SalonGallery` to Instagram-feed = commodity perception.

Recipe dla gallery na `/gallery`:
- **Before/after pairs** zamiast feed-flow
- 1-linijkowy opis: co zrobiono ("balayage 3-tone, rozjaśnienie 3 lvl, toner T18")
- Top 6 na home (`SalonGallery` component), 20-30 na dedykowanej `/gallery`
- Każde zdjęcie = mini case-study

### Roadmap: `/services/extensions` (doczepianie)

Gdy usługa rusza, dedykowana strona w stylu istniejących `services/coloring.tsx` / `services/balayage.tsx` / `services/highlights.tsx`. Struktura:

```
- Hero (dark, z headline "Doczepianie włosów")
- 3 metody (mikroringi / nano / tape-in — wybór wg waszej oferty)
- 3 cele (objętość / długość / koloryzacja przez doczepy)
- Cena widełkowa ("od X zł")
- 6 before/after par
- FAQ (jak długo, jak pielęgnować, kiedy serwis)
- CTA "Umów konsultację"
```

Doczepianie sprzedaje się **zdjęciami i wiedzą**. Brak dedykowanej strony = brak konwersji w segmencie najwyższej marży.

## Decyzje strategiczne do podjęcia osobno

Te punkty wymagają wyboru właściciela — nie są mechaniczną poprawką:

### Nazwa marki vs paleta

Nazwa "Black & White" obiecuje monochromię. Realna paleta strony to **silver + warm-cream + warm-brown** (po rebrand z gold). Wizualnie czyta się jako "elegancki beżowy salon", nie "monochromatyczny salon edytorski".

Dwie ścieżki:
- **A** — wycofać warm-paletę, zrobić prawdziwą monochromię (B/W + jeden akcent srebra). Mocniejsza, bardziej zapamiętywalna, ale wymaga rewizji zdjęć/copy.
- **B** — zachować obecną warm-paletę i traktować "Black & White" jako nazwę własną właścicieli salonu (jak imię firmy), nie wizualną obietnicę. Wtedy warm-mineral jest świadomym wyborem brandu.

**Rekomendacja**: B (mniej dyspu pracy, paleta już dobrze wykonana). Ale uświadomić: nie kupujemy "kontrast czarno-biały" jako kąt marketingowy, kupujemy "B&W" jako nazwę firmy.

### Multilingual: dotłumaczyć albo ukryć

Switcher PL/EN/DE w navbarze obiecuje multilingual. Część treści przełącza się, ale **strony prawne (`/policy`, `/privacy`) i detail usług (`/services/{coloring,balayage,highlights}`) są hardkodowane po polsku**.

Dwie ścieżki:
- **A** — dotłumaczyć wszystko (legal wymaga prawnika; usługi wymagają redaktora EN/DE)
- **B** — ukryć chipy PL/EN/DE dopóki nie ma pełnego pokrycia

**Rekomendacja**: B krótkoterminowo, A w docelowej iteracji. Stan obecny ("obiecane, połowicznie dostarczone") jest gorszy niż "tylko po polsku".

### Logo marek partnerskich

W copy serwisów wymieniacie "Wella i Kerastase". W `PartnerBrands` używacie ich logo. Sprawdzić:
- czy używacie oficjalnych assetów (Wella zmieniała logo 2–3 razy w ostatniej dekadzie)
- czy proporcje są zachowane (brak rozciągania, kompresji)
- czy clear-space (min. 0.5x wysokości "W" wokół) jest zachowany
- czy macie pisemną zgodę / umowę partnerską

Brand misuse marek partnerskich może doprowadzić do problemów prawnych. To detal, ale ważny.

## Co działa dobrze i należy zachować

- **Accessibility scaffolding** — skip link, focus-visible global, role=dialog, focus trap w `BookingModal`/`ImageLightbox`, aria-current na linkach, aria-pressed na chipach językowych. **Powyżej średniej dla branży.**
- **SEO** — JSON-LD `LocalBusiness` (na home), OpenGraph kompletny, canonical, geo-meta, robots. **Pełny pakiet.**
- **`next/image` site-wide** — 0 raw `<img>`. Prawidłowe `sizes`, `priority` na hero.
- **Iframe Map** — `loading="lazy"`, `title`, `referrerPolicy`. **Modelowe.**
- **Reduced-motion respektowane** — slider, scroll-reveal, route-progress. Wzorcowe.
- **Brand silver + warm-brown stokenizowane** — wszystkie kolory w `--brand-*` zmiennych. Future-proof.
- **i18n LightboxIcon + tłumaczenia hero** — komponent `ImageLightbox` dotłumaczony (PL/EN/DE).

## Priorytety wdrożenia (sugerowane)

| Priorytet | Zmiana | Wysiłek | Impact |
|---|---|---|---|
| 1 | IA: cut 5 sekcji z home page | 1 PR (~4h) | Bardzo wysoki — szybsza konwersja, czystsza marka |
| 2 | Cennik widełkowy na `/services` | 1 PR (~2h) + content | Wysoki — usuwa friction premium audience |
| 3 | Hero simplification | 1 PR (~3h) | Wysoki — pierwsze wrażenie |
| 4 | Usunąć Tangerine (3. typografia) | 1 PR (~1h) | Średni — visual coherence |
| 5 | Unify CTA system | 1 PR (~2h) | Średni — DX + spójność |
| 6 | Multilingual decision (cut chipy vs dotłumaczyć) | 1 PR (~1h jeśli cut, 2-3 dni jeśli tłumaczenie) | Wysoki dla credibility |
| 7 | Gallery → before/after pairs | 1 PR + content | Wysoki dla konwersji, najpierw potrzebne zdjęcia |
| 8 | `/services/extensions` dedicated page | 1 PR + content | Średni teraz / wysoki po wprowadzeniu usługi |

## Notatki dla agenta

- Wszystkie cięcia są **strukturalne**, nie kosmetyczne — wymagają decyzji właściciela przed PR.
- Nie usuwać komponentów bez backupu — `StatsBar`/`TrustStrip`/`PartnerBrands` mogą wrócić w innej formie (np. mini-pasek loga na `/services` zamiast hero home).
- Każda cut-only zmiana = osobny PR. Łatwiej rolować w razie zmiany zdania.
- Decyzja "B vs A" w nazwa/paleta i multilingual — POTWIERDZIĆ z właścicielem przed implementacją.
