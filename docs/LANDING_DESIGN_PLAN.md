# Plan doprowadzenia landingu do poziomu „nietuzinkowy"

**Utworzony: 2026-09-12 · Claude Opus 5 · stan wyjściowy `d620085`**

Podstawa: przegląd designu z 2026-09-11/12 (render sekcja po sekcji na 1440 i
390 px + audyt stylów). Wszystkie liczby w tym dokumencie są zmierzone, nie
szacowane.

## Diagnoza w jednym zdaniu

Szkielet edytorski jest dobry — Playfair, szeroko rozstrzelona mikro-typografia,
asymetryczna siatka usług, hero z diagonalnym cięciem — ale wypełniono go
fotografią dokumentacyjną pustego salonu w kolorze, co niweczy obietnicę marki
„Black & White" i sprowadza całość do poziomu przeciętnej strony lokalnej firmy.

## Podział odpowiedzialności

| Część | Kto | Blokuje |
|---|---|---|
| A. Sesja zdjęciowa | Owner + Aleksandra | Fazę 1 (finalne podmiany) i Fazę 4 |
| B. Fazy 1–5 w kodzie | Agent | — (pipeline i system można robić przed sesją) |

---

# CZĘŚĆ A — brief na sesję zdjęciową

## A1. Co fotografować

Priorytet malejący. Liczby to minimum ujęć **po selekcji**, nie liczba zdjęć do
zrobienia.

| # | Ujęcie | Ile | Gdzie trafi |
|---|---|---|---|
| 1 | **Efekty pracy** — koloryzacja, balayage, rozjaśnienia: włosy w świetle, kadr od tyłu i z profilu, bez twarzy lub z twarzą za zgodą | 8–12 | galeria (nowe portfolio), karty usług |
| 2 | **Dłonie przy pracy** — nakładanie farby, czesanie, nożyczki w ruchu, detal palców i pasma | 4–6 | hero, pasmo CTA, tła kart |
| 3 | **Portret Aleksandry** — przy oknie, światło boczne, spojrzenie w obiektyw i wariant „przy pracy" | 2–3 | sekcja „O nas" |
| 4 | **Detale wnętrza** — fotel z bliska, lustro, narzędzia ułożone na blacie, faktura ściany | 4–6 | galeria, przerywniki |
| 5 | **Wnętrze ogólne** — 2 kadry, wyłącznie jako tło, nie jako treść | 2 | tła sekcji |

**Czego NIE fotografować:** pustych stanowisk jako głównego tematu, recepcji
w szerokim kącie, całej sali „żeby było widać, że duża". Dziś strona ma osiem
takich kadrów i zero włosów.

## A2. Przygotowanie planu

- **Usunąć z kadru wszystko kolorowe:** czerwone róże, sztuczne kwiaty,
  kolorowe plakaty, ulotki. Wyłączyć telewizor (dziś na każdym zdjęciu świeci
  różowym obrazem).
- **Zasłonić lub wyłączyć** ekrany i podświetlane reklamy produktów.
- Blaty puste: dwa–trzy narzędzia ułożone celowo, reszta schowana.
- Jedno źródło światła głównego. Najlepiej światło dzienne z okna + biała
  blenda. Nie mieszać świetlówek sufitowych z lampą błyskową — dziś zdjęcia
  mają różny balans bieli między kadrami i to widać na siatce galerii.

## A3. Formaty i rozdzielczości (wymuszone przez layout)

Podane wartości to **minimum po kadrowaniu**, przy założeniu ekranów 2×.

| Przeznaczenie | Proporcja | Minimum | Uwagi |
|---|---|---|---|
| Hero (prawy panel) | 4:5 pion | **2000 × 2500** | kadr musi znieść przycięcie do 50% szerokości ekranu i pełnej wysokości |
| Pasmo CTA | 16:5 poziom | **2800 × 900** | tekst ląduje na środku — środek kadru zostawić spokojny |
| Karta usługi (tło) | 3:4 pion | **1600 × 2100** | widoczne przy 35% krycia pod gradientem |
| Galeria / portfolio | mieszane 3:4 i 4:3 | **1600** dłuższy bok | siatka masonry, część kafli pionowa |
| Portret założycielki | 3:4 pion | **1200 × 1600** | dziś plik ma 270 × 370 px — jest rozmyty na każdym nowoczesnym ekranie |

## A4. Postprodukcja

- **Czarno-biała konwersja, jeden profil dla całego zestawu.** Nie „każde
  zdjęcie osobno" — chodzi o to, żeby osiem kadrów obok siebie wyglądało jak
  jedna sesja.
- Kontrast lekko podbity, czernie głębokie, biele nieprzepalone.
- Bez winiet, bez ziarna (ziarno dokłada strona, w warstwie CSS).

## A5. Dostarczenie

- Format: **JPEG jakość 85–90**, przestrzeń sRGB, bez metadanych GPS.
- Nazewnictwo: `portfolio-01.jpg`, `hands-01.jpg`, `founder-01.jpg`,
  `detail-01.jpg`, `interior-01.jpg`.
- Do tego **oryginały bez kompresji** — warianty rozmiarowe wygeneruje skrypt
  z Fazy 1, nie ręcznie.
- Wrzucić do repo w `apps/landing/public/images/2026/` (nowy katalog; stare
  pliki zostają do czasu przełączenia).

---

# CZĘŚĆ B — plan zmian w kodzie

## Stan wyjściowy, zmierzony

| Metryka | Wartość dziś |
|---|---|
| Obrazy na stronie głównej po pełnym przewinięciu (390 px) | **4,81 MB / 13 plików** |
| Największy pojedynczy plik | `DSC_9583.jpg` **1703 kB** (tło pasma CTA) |
| Surowy `#b4b8be` zamiast tokenu | **64 wystąpienia** (+ `#0d0d0d` 16×, `#ffffff` 12×) |
| Różne wartości `letter-spacing` w mikro-typografii | **6** (0,6 / 1,2 / 1,68 / 1,92 / 2,3 px) |
| Tekst treściowy na mobile | **14 px** (reguła marki: ≥16 px) |
| Ten sam wzorzec nagłówka sekcji | **5×** na jednej stronie |
| Kolor chromatyczny poza tokenami | `rgba(220,80,80,0.9)` 3× w `BookingModal` |

---

## Faza 1 — fotografia jako system, nie jako pliki

**Cel:** strona ma jedną spójną warstwę obrazu, niezależnie od tego, czy pod
spodem leży stara czy nowa sesja. Fazę można zrobić **przed** sesją — wtedy
stare zdjęcia natychmiast przestają wnosić przypadkowy kolor.

### 1.1 Monochromatyczna warstwa obrazu

- Nowa klasa `.brand-photo` w `globals.css`:
  `filter: grayscale(1) contrast(1.06);`, wariant `.brand-photo--soft` dla teł
  pod tekstem.
- Zastosowanie: `SplitHero`, `ServicesTeaser`, `SalonGallery`, `BookingCta`,
  `AboutSpread`, `gallery.tsx`.
- **Kryterium odbioru:** żaden obraz na landingu nie renderuje się w kolorze;
  sprawdzenie przez zrzut i przez computed style `filter` na każdym `<img>`.

### 1.2 Jednolity scrim pod tekstem

- Dziś każde tło ma własną kombinację krycia i gradientu (hero `0.45` blend
  multiply, karta usługi `0.35` + gradient 0,92→0,65, pasmo CTA osobno).
- Wprowadzić dwa tokeny: `--scrim-strong` (tekst nagłówkowy na zdjęciu) i
  `--scrim-soft` (tło dekoracyjne).
- **Kryterium:** w paśmie CTA napis „black & white salon fryzjerski" z szyldu
  nie jest czytelny pod hasłem; kontrast tekstu na zdjęciu ≥ 4,5:1 zmierzony
  na najjaśniejszym fragmencie kadru.

### 1.3 Pipeline wariantów rozmiarowych

- Skrypt `scripts/build-images.mjs` (sharp, już jest w zależnościach):
  z każdego oryginału generuje 480/960/1600/2400 px + wersję WebP.
- Komponenty dostają `sizes` odpowiadające realnemu layoutowi (dziś `50vw`
  nawet tam, gdzie element jest pełnoszerokościowy na telefonie).
- **Decyzja do podjęcia:** czy `images.unoptimized: true` w `next.config.mjs`
  może zniknąć. Wymaga sprawdzenia, czy `sharp` ładuje się na FreeBSD u
  MyDevil — jeśli nie, pipeline offline (ten skrypt) jest odpowiedzią i flaga
  zostaje.
- **Kryterium:** strona główna na 390 px po pełnym przewinięciu **≤ 1,2 MB**
  obrazów (dziś 4,81 MB); `Cache-Control` na `/images/*`.

### 1.4 Podmiana treści (po sesji)

- `content.ts`: `SALON_GALLERY` → portfolio efektów zamiast wnętrz;
  `FOUNDER_MESSAGE.photo` → nowy portret.
- Usunąć `slider2.jpg`, `slider3.jpg` (270 × 370, relikty po martwym
  `HeroSlider`) i `DSC_9584.jpg`, gdy przestanie być używany.

---

## Faza 2 — dyscyplina systemu

**Cel:** zmiana odcienia srebra to jedna linia, nie dziewięćdziesiąt.

### 2.1 Tokeny zamiast literałów

- 64 × `#b4b8be` → `var(--brand-silver)`, 16 × `#0d0d0d` → `var(--brand-black)`,
  12 × `#ffffff` → `var(--brand-white)` (token do dodania).
- Skale kryjące biel na czerni (`rgba(255,255,255,0.55/0.6/0.65/0.75)`) →
  cztery nazwane tokeny, zgodne z tabelą kontrastu w skillu `salonbw-brand`.
- `rgba(220,80,80,0.9)` w `BookingModal` → token `--state-error` z wartością
  spełniającą AA na tle modala.
- **Kryterium:** `grep -c '#b4b8be' src/` = 0 poza definicją tokenu.

### 2.2 Skala mikro-typografii

- Trzy dozwolone wartości trackingu zamiast sześciu: `0.08em` (etykiety w
  tekście), `0.14em` (CTA, nawigacja), `0.2em` (eyebrow sekcji).
- Zapisać jako `--tracking-label / --tracking-cta / --tracking-eyebrow`.
- **Kryterium:** audyt w przeglądarce zwraca ≤ 3 różne wartości `letter-spacing`
  wśród elementów uppercase.

### 2.3 Tekst treściowy 16 px na mobile

- `hero tagline`, opisy usług, oś czasu w „O nas", podtytuł galerii: 14 → 16 px
  z `line-height` 1,6–1,7.
- **Kryterium:** każdy akapit dłuższy niż 40 znaków ma ≥ 16 px na 390 px.

### 2.4 Rytm pionowy

- Jedna skala odstępów sekcji (`--section-y`), sekcja kontaktu przestaje
  używać inline'owego `5rem`.
- **Kryterium:** wszystkie sekcje strony głównej mają identyczny odstęp
  górny/dolny, mierzony w DOM.

---

## Faza 3 — sygnatura wizualna

**Cel:** przestać powtarzać najbardziej generyczny gest w internecie (kreska
40 × 2 px pod nagłówkiem) i zastąpić go czymś, co należy do tej marki.

### 3.1 Numeracja sekcji

- `SectionHeader` dostaje wariant z numerem porządkowym: `01 — USŁUGI`,
  `02 — SALON`, `03 — OPINIE`, `04 — KONTAKT`, w mikro-typografii
  `--tracking-eyebrow`.
- Kreska pod tytułem znika ze wszystkich pięciu wystąpień.
- Numerale już istnieją w kodzie (`service-numeral`), ale siedzą jako
  watermark w karcie — przenieść ich rolę na poziom strony.
- **Kryterium:** zero wystąpień `width: '40px', height: '2px'`; numeracja
  spójna i ciągła na stronie głównej.

### 3.2 Odgruzowanie karty usługi

- W karcie „Fryzjerstwo" konkurują dziś trzy ozdobniki: ikona w szarym kaflu,
  numeral „01" i badge „POLECANE" — dwa ostatnie nachodzą na siebie w prawym
  górnym rogu.
- Zostaje **numeral**, znika kafel z ikoną (lub odwrotnie — do decyzji przy
  makiecie, ale nie oba). Badge przenieść na lewą krawędź nad tytuł.
- **Kryterium:** żadne dwa elementy dekoracyjne nie zajmują tego samego rogu.

### 3.3 Hero: watermark i mobile

- `B&W` watermark przesunąć tak, by nie przechodził pod przyciskami CTA
  (dziś na 390 px „ODKRYJ USŁUGI" leży na literze W).
- Na mobile poprawić kompozycję „Black / & / White” — dziś wcięcie „White"
  wygląda przypadkowo, nie jak decyzja.
- **Kryterium:** na 390 px żaden element dekoracyjny nie przecina przycisku;
  zrzut przed/po.

### 3.4 Jeden ornament cudzysłowu, nie dwa

- Ten sam wielki glif `"` występuje w „O nas" i w „Opiniach". Zostawić w
  jednym miejscu — w opiniach, gdzie niesie znaczenie.

---

## Faza 4 — rytm i treść sekcji

### 4.1 „O nas"

- Prawa kolumna kończy się ~200 px wyżej niż lewa — martwa przestrzeń.
- Portret dostaje realną ramę offsetową (dziś srebrna ramka odstaje od
  zdjęcia z białym tłem i wygląda jak błąd wyrównania).
- Oś czasu: dwa wpisy to za mało na osobny komponent — albo rozbudować do
  czterech (2011 otwarcie, certyfikaty, Akademia, dziś), albo zwinąć do
  jednego zdania pod cytatem.

### 4.2 Opinie

- Sekcja ma 770 px wysokości na cztery linijki tekstu. Skrócić do rytmu
  sekcji, rozważyć układ dwóch opinii obok siebie na desktopie.
- Gwiazdki: zamienić na typograficzny zapis (`5,0 / 5` w mikro-typografii)
  albo usunąć — widget recenzji kłóci się z edytorskim tonem.

### 4.3 Galeria → portfolio

- Po sesji: siatka pokazuje **efekty pracy**, nie meble.
- Podpisy zamiast samych zdjęć: rodzaj zabiegu + czas trwania
  („Balayage · 3 h"). To jednocześnie treść i dowód kompetencji.
- Lightbox zostaje.

---

## Faza 5 — porządki z poprzedniego przeglądu

Nie blokują designu, ale zdejmują ciężar z projektu.

- Osiem martwych komponentów (`TrustStrip`, `PartnerBrands`, `ValuesSection`,
  `HeroSlider`, `HistoryAccordion`, `ShortcutCard`, `CustomCursor`,
  `LoadingSpinner`) — usunąć.
- Martwy stan `bookingModalOpen` w `index.tsx` (trzecia instancja
  `BookingModal`, której nie da się otworzyć).
- Sentry poza bundlem współdzielonym (dziś 131 kB gz `_app`).
- Zbędny `preconnect` do `fonts.gstatic.com` przy self-hostowanych fontach.
- Pozostałe cele dotykowe < 44 px: stopka 31 × 19, ikony społecznościowe
  20 × 20, chipy kategorii 124 × 36.

---

## Kolejność i zależności

```
Faza 1.1 + 1.2 (monochrom + scrim)  ── można dziś, natychmiastowy efekt
Faza 2 (system)                     ── można dziś, niezależna
Faza 3 (sygnatura)                  ── po Fazie 2 (używa nowych tokenów)
        │
        └── sesja zdjęciowa ──► Faza 1.3 + 1.4 (pipeline + podmiana)
                                 └──► Faza 4 (rytm i treść)
Faza 5 (porządki)                   ── kiedykolwiek, najlepiej osobnym PR
```

## Definicja ukończenia

- Strona główna na 390 px: **≤ 1,2 MB** obrazów po pełnym przewinięciu.
- Zero obrazów renderowanych w kolorze.
- Zero surowych literałów kolorów marki w komponentach.
- ≤ 3 wartości trackingu, tekst treściowy ≥ 16 px na mobile.
- Zero powtórzeń kreski pod nagłówkiem; numeracja sekcji spójna.
- Lighthouse accessibility 100 utrzymane, brak przewijania w poziomie na
  390 px, wszystkie cele dotykowe ≥ 44 px.
- Każda faza osobnym PR z zrzutami przed/po na 1440 i 390 px.
