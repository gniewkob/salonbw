# Ujednolicenie marki — etap 1, 1b i początek 2 (landing)

- **Data:** 2026-11-18
- **Agent:** Claude Opus 5.5
- **Commit(y):** `271e7e1`, `8d81cd4` (gałąź `design/brand-unification-20261118`, od `design/black-white-homepage-20261117`)
- **PR:** brak

## Finding
1. Tokeny marki żyły osobno w landingu (`globals.css`) i panelu
   (`salon-shell.css`/`salon-theme.css`) — brak jednego źródła.
2. `body` i nagłówki miały `font-family: 'Open Sans'` / `'Playfair Display'`,
   a `next/font` rejestruje generowane nazwy (`openSans`, `playfair`) i zmienne
   tylko na wrapperze w `_app`. Stopka i wszystko bez jawnego stylu
   renderowało się czcionką zastępczą (Arial/Georgia).
3. Moduł strony głównej: 28 kolorów na sztywno, w tym ciepłe szarości
   (`#f7f6f4`, `#c8c6c3`, `#c2c1bf`) zakazane przez skill marki; tracking
   etykiet w 5 wartościach zamiast 3.
4. Dwa style nagłówków sekcji (rozdziały vs `SectionHeader`) i trzy ciemne
   bloki pod rząd (galeria, opinie, kontakt).

## Change
- `packages/brand-tokens` (CSS + TS + test), landing importuje tokeny przed
  `globals.css`; klasa `.brand-fonts` na wrapperze `_app`.
- Moduł strony głównej na tokenach; ciepłe szarości → biel / srebro na ciemnym.
- `SectionHeader` w stylu rozdziałów (cały landing); opinie na jasnym tle.

## Validation
Tokeny 4/4; tsc; eslint; jest 28/28 suites (93 testy); `next build`;
Playwright 1440/390/320: overflow 0, jeden h1, kontrast 0 błędów (81 węzłów),
okno rezerwacji działa; czcionki obliczone = `playfair`/`openSans` (także
stopka). Galeria i kontakt obejrzane na zrzutach.

## Rollout
2026-11-18 18:4x, po zgodzie ownera: `dev.salon-bw.pl` przełączony kanałem
ręcznym (`ops/dev-landing-manual-20261118` @ `b1bb457`, packager usuwa
zależności `workspace:` poza `@salonbw/api`) z `09611f5e` na `f29721a0`.
Stage, smoke `app.cjs` i `app.js`, plan i aktywacja PASS za pierwszym razem.
Live-verify (Basic Auth): `__release.json` sha `f29721a0`, BUILD_ID
`ewrG3_8YdwZnybif8oICa`; `/`, `/services`, `/contact`, `/gallery`,
`/policy`, `/privacy`, `/data-deletion` = 200; `/design-lab` = 404;
anonimowo 401; HTML ma `brand-fonts`, oba arkusze CSS zawierają tokeny.
Poprzednia wersja w `previous-landing/09611f5e…-before-f29721a0…`.
Produkcja nietknięta.

## Follow-up
Etap 2 dalej: przyciski i fokus jako wspólne klasy; etap 3 (panel V18) ze
strumieniem V18.

## Etap 2 — przyciski i fokus (2026-11-18 wieczór)

**Finding:** fokus globalny i 22 pierścienie Tailwind były srebrne
(`#b4b8be`) — 1,99:1 na białej nawigacji (próg dla wskaźnika fokusu 3:1);
kilka reguł miało `outline: none` z samą zmianą koloru (stopka, lista usług,
pola formularza). Pięć wariantów przycisków o różnych rozmiarach;
`.contact-form__submit` miał biały tekst na srebrze (antywzorzec ze skilla).

**Change:** `@salonbw/brand-tokens/elements.css`: dwutonowy fokus (czarny
obrys + biała otoczka, `:where`, niska specyficzność) i przyciski `bw-btn`
(`--primary`, `--on-dark`, `--on-light`, `--dark`, `--compact`, ≥44 px).
Landing: 22 miejsca w 15 plikach na `bw-btn`, usunięte stare klasy
przycisków, lokalne srebrne obrysy i `outline: none`, klasy fokusu Tailwind
(poza `focus:not-sr-only`).

**Validation:** tokeny 5/5; tsc; eslint; jest 28/28 (93); build; audyt 4
stron (/, /contact, /services, 404): 21 przycisków — wysokość 44 px, kontrast
≥9,76:1; 178 zatrzymań fokusu — każde ≥3:1 względem tła, 0 słabych.

**Rollout:** po zgodzie ownera `dev.salon-bw.pl` przełączony kanałem ręcznym
z `f29721a0` na `1a7fcbb4` (stage, smoke `app.cjs`/`app.js`, plan, aktywacja
PASS za pierwszym razem). Live-verify: `__release.json` sha `1a7fcbb4`,
BUILD_ID `SeBuiIKZEanqgwNhp2GoU`; 7 podstron 200, `/design-lab` 404,
anonimowo 401; strona główna ma 6× `bw-btn--primary`, 0× `btn-silver`; CSS
zawiera dwutonowy fokus. Poprzednia wersja w
`previous-landing/f29721a0…-before-1a7fcbb4…`. Produkcja nietknięta.

## Tryb ciemny i scalenie (2026-11-18, 19:xx)

- Usunięty automatyczny tryb ciemny landingu; etykiety `SectionHeader` na
  jasnym tle → `--brand-warm-label` (silver-ink dawał 4,48:1 na pasie opinii —
  przeoczone przez wcześniejszy audyt tylko rozdziałów strony głównej).
  Audyt pełnych stron (7 tras × tryb jasny/ciemny): 0 błędów. Commit
  `e41d801`, **nie wdrożony na dev**.
- PR #1722 do `master`: `mergeable: true`, ale `blocked` przez ruleset
  (8 wymaganych kontroli CI, bez obejścia). Nie scalony.

## Hero jak w Cinematic + poprawki (2026-11-18, 20:xx)

Owner: „ten hero nie miałby być taki jak w cinematic?”. Wariant 09 stonował
hero pod dłuższy nagłówek i niższą ramę. Teraz: nagłówek „Forma. Światło. /
Twoje włosy.”, skala 9vw / 11,5rem, rama 80svh, ciemniejsze zdjęcie, scrimy i
pionowy napis z propozycji; mobile w rozmiarach propozycji, bez wiersza meta.
Słowa kluczowe zostają w etykiecie i leadzie, SEO head bez zmian.
Dodatkowo: pływający przycisk chowa się, gdy widać CTA strony
(`data-booking-cta`); płynne przewijanie tylko bez `prefers-reduced-motion`;
status „dziś” z tego samego harmonogramu co lista godzin (zgłoszenie Graphify,
P2, `9821d8f`). Porównanie z propozycją: zrzuty 1440 i 390 px.

**Rollout:** po zgodzie ownera dev przełączony z `1a7fcbb4` na `75001880`
(stage, smoke `app.cjs`/`app.js`, plan, aktywacja PASS za pierwszym razem).
Live-verify: sha `75001880`, BUILD_ID `kIE7Hn1f_RFthOWgJAX0U`; 7 podstron 200,
`/design-lab` 404, anonimowo 401; HTML zawiera nowy h1, 2× `data-booking-cta`
i pionowy napis. Poprzednia wersja w
`previous-landing/1a7fcbb4…-before-75001880…`. Produkcja nietknięta.

## Podstrony w jednym kadrze + ruch hero (2026-11-18, 21:xx)

Owner: hero bez efektu oddalania, zniknęły warianty usług, podstrony nie
pasują do głównej (dysonans po przejściach); ocena skillem WDI.

**Finding (WDI, 1440 px):** lewa krawędź h1 na podstronach 72/112/302/330 px
lub wyśrodkowana; h1 130/80/64/63/56/48 px; etykiety 9,6–12 px; podstrony
płaskie czarne bez zdjęcia; pływający przycisk zasłaniał „Umów” w cenniku na
mobile. Warianty usług zgubione, bo gałąź zbudowana od `master`.

**Change:** `411a3cd` — warianty usług przywrócone (z `58610f7c`), ruch
„cofania kadru” (Immersive pull-back) na stronie głównej. `dffef4f` — wspólny
`PageHero` (zdjęcie, scrim, settle, cofanie kadru) na usługach, 3 stronach
zabiegów, galerii i kontakcie; wariant tekstowy na stronach prawnych i 404;
tokeny `--page-gutter`/`--page-max` w `@salonbw/brand-tokens`; jedna lewa
krawędź na wszystkich stronach; przycisk pływający chowa się przy każdym
„Umów” (także renderowanym później); usunięte martwe style.

**Validation:** tokeny 5/5; tsc; eslint; jest 30/30 (115); build; audyt 11
tras 1440/390: lewa krawędź h1 72 px / 20 px wszędzie, h1 89 px (zdjęcie)
i 69 px (tekst), etykiety 11,8 px, overflow 0; cofanie kadru potwierdzone
(skala ramy 1 → 0,94 po 350 px przewinięcia); przycisk pływający ukryty nad
wierszami cennika.

**Rollout:** po zgodzie ownera dev przełączony z `75001880` na `dffef4fe`
(stage, smoke `app.cjs`/`app.js`, plan, aktywacja PASS za pierwszym razem).
Live-verify: sha `dffef4fe`, BUILD_ID `CkoQiqlQ6UgIWP_uZgPzc`; 10 tras 200,
`/design-lab` 404, anonimowo 401. Poprzednia wersja w
`previous-landing/75001880…-before-dffef4fe…`. Produkcja nietknięta.

## Pełny audyt WDI, popup logowania, iPhone (2026-11-18, 22:xx)

Owner: popup logowania niespójny graficznie; brak pełnej analizy skillem;
na iPhonie strona słaba, hero „nie daje efektu”.

**Finding (WDI, pełna lista kontrolna; dane z publicznego API):**
- P1 — efekt cofania kadru niewidoczny: rama malała tak szybko, jak
  przewijała się poza ekran (zmierzone w WebKit, iPhone 15: skala 0,91 przy
  wyjeździe kadru). Na telefonie zdjęcie przyciemnione scrimem pod tekst z
  lewej (desktop), kadr ciemny i mało czytelny.
- P1 — popup logowania: etykiety, pola i przycisk w czcionce zastępczej
  (`--font-opensans` nie istnieje → Arial), gradientowy pasek, etykieta 9,6 px,
  brak przycisku zamknięcia (X), styl odmienny od reszty.
- P1 — menu mobilne: godziny otwarcia (11 px) na górze, linki 13 px;
  pływający przycisk widoczny nad otwartym menu.
- P1 — cele dotykowe < 24 px: linki stopki, przełącznik języka, link
  powrotu na stronach zabiegów.
- P2 — nawigacja, stopka i część sekcji na `container` (lewa krawędź 112 px
  zamiast 72 px).
- Bez błędów: kontrast (0 błędów, 11 tras × 3 szerokości), overflow 320 px,
  jeden h1, kolejność nagłówków, alt obrazów, wskaźnik fokusu (40 zatrzymań
  na trasę), SEO head (title, description, canonical, lang, og:image).

**Change:** `4d6e18a` — przypięta scena hero (sticky + dystans w treści
sceny; padding rodzica nie działa ze sticky), cała karta oddala się, zdjęcie
robi zoom out; telefon: hero na cały ekran, jaśniejsze zdjęcie, scrim tylko
pod tekstem. Popup jako jasny arkusz na tokenach (bottom sheet na telefonie).
Menu mobilne przebudowane. Token `--state-error-on-light`. Cele dotykowe.
Wspólna krawędź dla nawigacji i stopki.

**Validation:** tokeny 6/6; tsc; eslint; jest 30/30 (115); build; audyt
11 tras × 1440/390/320: kontrast 0, overflow 0, fokus 0 słabych, cele
< 24 px tylko link „przejdź do treści” (ukryty) i link w zdaniu (wyjątek
2.5.8); WebKit iPhone 15/SE: karta trzyma pozycję przez dystans sceny,
skala 1 → 0,86; reduced motion: brak przypięcia i transformacji; popup:
fokus w pierwszym polu, pułapka Tab, Esc zamyka.

**Rollout:** po zgodzie ownera dev przełączony z `dffef4fe` na `4d6e18a2`
(stage, smoke `app.cjs`/`app.js`, plan, aktywacja PASS). Live-verify: sha
`4d6e18a2`, BUILD_ID `dk7oamICXDsB2uSR7pNp3`; 10 tras 200, `/design-lab` 404,
anonimowo 401; HTML zawiera scenę hero. Produkcja nietknięta. Nie sprawdzono
na fizycznym iPhonie — tylko WebKit z emulacją iPhone 15/SE.

## Ocena ogólna i usprawnienia WDI (2026-11-18, 23:xx)

Owner (zrzuty z iPhone'a): niebieskie kafelki zamiast strzałek; prośba o
ogólną ocenę strony i propozycje usprawnień od skilla. Wybrał: krótsza
strona główna, cennik na telefonie, pomiar szybkości, jedno „Umów” na dole;
zdjęcia prac — z Instagrama, ale na landingu w czerni i bieli (konwencja
salonu, decyzja Oli); pełna galeria w kolorze zostaje.

**Finding:** iOS renderuje U+2197 „↗” jako emoji; Lighthouse mobile: home
57, cennik 70 (LCP 6–7 s, zdjęcia 0,8–1,8 MB, fonty TTF 1,1 MB); kontrast
etykiet nad zdjęciami 1,4–3,7:1 (próbkowanie pikseli — wcześniejszy audyt
liczył kolor tła sekcji i podał 0 błędów, co było błędne); balayage i
pasemka używały miniatur 270 px jako hero; cennik na telefonie: filtr znika,
po wyborze kategorii widz zostaje przy stopce.

**Change:** `1dd56b5` strzałka jako SVG, karta hero z rogami 4 px;
`d961f55` zajawka galerii 4 kafelki (Instagram w B&W na produkcji, wnętrze
na dev), opinie bez karuzeli, przyklejony filtr cennika + powrót do listy,
bez przycisku w stopce, zdjęcia ≤2200 px (≈5,6 → 1,9 MB), fonty WOFF2
podzbiór (1,1 MB → 250 KB), mocniejsze scrimy i białe etykiety nad zdjęciem.

**Validation:** jest 30/30 (115); tsc; eslint; Lighthouse mobile (lokalnie,
symulowany wolny 4G): home 80, cennik 86, balayage 84; dostępność 100;
SEO 69 tylko przez noindex dev; kontrast nad zdjęciami (próbkowanie, 7 tras ×
2 szerokości) — 0 błędów; overflow 320 px 0; strona główna na iPhonie
7934 → 7354 px. Zajawki Instagrama nie da się zobaczyć na dev (brak tokenu)
— sprawdzona ścieżka zastępcza; na produkcji API galerii zwraca zdjęcia.

**Rollout:** po zgodzie ownera dev przełączony z `4d6e18a2` na `d961f557`
(stage, smoke `app.cjs`/`app.js`, plan, aktywacja PASS). Live-verify: sha
`d961f557`, BUILD_ID `Uk75K-6C1sWJKdaf0QwSW`; 10 tras 200, `/design-lab` 404,
anonimowo 401; HTML strony głównej bez znaku „↗”. Produkcja nietknięta.
