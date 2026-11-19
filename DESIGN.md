# DESIGN.md — Salon Black & White

Jedno źródło decyzji projektowych dla landingu (`apps/landing`) i — od etapu 3
planu marki — panelu. Reguły tokenów i kontrastu: skill
`.claude/skills/salonbw-brand/SKILL.md` i pakiet `packages/brand-tokens`.
Ten plik zapisuje **dlaczego** i **czego świadomie nie robimy**.

Stan: 2026-11-19 — przegląd wzorców (krok 2 WDI) zrobiony; propozycje zmian
w sekcji „Do decyzji” czekają na ownera. Decyzja zatwierdzona = przenieść ją
do bloku decyzji i dopisać datę.

## Blok decyzji (WDI)

```
Surface / mode:  Expressive (landing) · Redesign — strona działa, rezerwacja i formularze muszą działać dalej
Audience:        kobieta szukająca jakości (premium, nie low-cost), Bytom i okolice;
                 jedna rzecz do zrobienia: umówić wizytę (online lub telefon)
Direction:       „Magazyn w czerni i bieli” — salon pokazany jak sesja w drukowanym
                 piśmie: jedno zdanie, dużo bieli, zdjęcia B&W, zero promocji
Type:            display Playfair Display 700 (+ italic) · text Open Sans 400/600 ·
                 brak mono · skala z tokenów (--text-display … --text-label) ·
                 obie OFL, self-host WOFF2 (podzbiór)
Colour:          czerń #0d0d0d / #080808, biel, neutralny szary #f6f6f7, akcent srebrny
                 (#b4b8be dekoracja, #6e7278 tekst) · tylko jasny motyw
                 (ciemny wyłączony decyzją ownera 2026-11-18)
Layout:          kontener z --page-gutter, przemienne pasy ciemny/jasny, promień 2 px
Signature:       przypięte hero, które przy przewijaniu cofa kadr jak odwracana
                 strona (CSS scroll-driven, fallback JS)
Motion:          CSS scroll-driven (hero, .bw-reveal tylko transform) · View
                 Transitions między stronami · bez GSAP/Lenis — ruch to akcent, nie atrakcja
Stack:           Next 15 pages router, CSS Modules + globals, brand-tokens; nic nowego
References:      david-mallett.com (serif + B&W portret), thelanesalon.com (adres i
                 zespół na wierzchu), therow.com (jedno zdjęcie, jedna czcionka)
Not doing:       popupy i rabaty przy wejściu · kolorowe zdjęcia na landingu (decyzja
                 Oli) · karuzele/marquee · trzecia czcionka
```

## Przegląd wzorców — 2026-11-19

Metoda: oryginalne strony w Chromium (1440×900 i 390×844), zrzuty pierwszego
ekranu i dwóch przewinięć, wartości ze skryptu `extract_design.js` skilla WDI.
Ruch: wykrywanie bibliotek i liczba przejść/animacji CSS; hover nie był
oglądany. Odrzucone: aesop.com (blokada botów — nie obchodzimy),
livetruelondon.com (oglądana, wersja mobilna zwróciła błąd 520; służy jako
antyprzykład: 4 kolory CTA, baner promocji, popup cookie z maskotką).

### David Mallett — david-mallett.com · desktop + mobile
- Type: display Noto Serif 400, do 186 px, −0.02em · tekst Roboto 12–13 px, lh 1.65 · etykiety 11.5 px uppercase +0.13em
- Colour: tło #f9f7f1 (krem), tekst #1c1c1c, czarne pasy; zdjęcia portretów w B&W
- Layout: podział 50/50 zdjęcie/tekst, pasek ogłoszeń nad menu
- Signature: gigantyczny szeryf na dwóch tłach (jasne/czarne)
- Słabe: ekran zdominowany przez Black Friday i popup z rabatem (e-commerce przed salonem), tekst 12 px
- Bierzemy: portret B&W jako główny nośnik emocji; szeryf z umiarkowanym trackingiem (−0.02em nawet przy 186 px)

### Sally Hershberger — sally-hershberger.com · desktop + mobile (pod popupem)
- Type: Montserrat 16 px (85% tekstu) + display MeshedDisplay; tło czarne
- Słabe: popup „10% off” zasłania hero na desktopie i telefonie zaraz po wejściu; sklep przed salonem
- Bierzemy: nic poza ostrzeżeniem — popup przy wejściu niszczy pierwsze wrażenie premium

### The Lane — thelanesalon.com · desktop + mobile
- Type: Noto Sans 14 px, lh 1.9, +0.05em; nagłówki Arsenal 38 px; brak h1
- Colour: ciepła szarość, tekst #414141, pasek menu taupe
- Layout: strona krótka (3193 px); w nagłówku telefon, adres i „Book now”; sekcja zespołu z prawdziwym zdjęciem ludzi
- Słabe: tekst 10–14 px, brak h1, mało kontrastu
- Bierzemy: kontakt i adres widoczne od razu; prawdziwi ludzie zamiast samego wnętrza; krótka strona główna

### Nine Zero One — ninezeroonesalon.com · desktop + mobile
- Type: Helvetica 12–16 px uppercase + własny odręczny krój (60 px w hero)
- Layout: pełnoekranowe zdjęcie wnętrza, „Book appointment” w hero, dużo wideo i zdjęć pracy (włosy z bliska)
- Słabe: baner cookie przykrywa CTA, odręczny krój trudny do czytania, menu w 2 rzędach
- Bierzemy: zdjęcia pracy z bliska (włosy, dłonie przy pracy) obok wnętrza

### The Row — therow.com (spoza branży, moda) · desktop + mobile
- Type: jedna czcionka (Basic Commercial) na 100% tekstu, 13 px; brak nagłówka na stronie głównej
- Colour: tekst #000 (88%), tła tylko #fff i #000
- Layout: strona główna = jedno zdjęcie B&W i menu (1060 px wysokości)
- Bierzemy: dyscyplinę — dwa tła, minimum etykiet, zdjęcie mówi samo

### Kinfolk — kinfolk.com (spoza branży, magazyn) · desktop + mobile
- Type: szeryf 50 px, −0.01em, wyśrodkowany; tekst szeryf 20/30; podpisy sans 15 px
- Ruch: Lenis (płynne przewijanie), wideo
- Bierzemy: rytm „numer pisma” — jeden nagłówek, dużo bieli, podpis pod zdjęciem

### Nasz landing (lokalny build `e52ad78`) — dla porównania
- Type: Playfair 113 px h1 **−0.065em**, h2 87 px **−0.077em**; Open Sans 16/24
- Colour: 6 kolorów tła (#080808, #0d0d0d, #181819, #31343a, #f6f6f7, #fff)
- Etykiety: **17** drobnych napisów uppercase w treści strony głównej, m.in. „Black & White” 3×, „Akademia Zdrowych Włosów” 2×, numeracja „01 / 02 / 03”
- Zdjęcia: wnętrze salonu w hero, w „O nas” i w galerii zastępczej; jedno małe zdjęcie założycielki; zdjęć pracy brak na dev (Instagram w B&W tylko na produkcji)
- Wysokość: 7511 px (desktop), 7683 px (telefon)

### Wnioski

- **Wspólny mianownik (konwencja):** rezerwacja w nagłówku, adres/telefon na wierzchu,
  prawdziwi ludzie i zdjęcia pracy, jedna duża fraza w hero, mało ruchu.
- **Odstępstwo (spoza branży):** The Row i Kinfolk pokazują, że „premium” robi się
  odejmowaniem — jedna czcionka lub para, dwa tła, prawie zero ozdobników.
- **Nasz ruch:** zostawiamy konwencję (rezerwacja w nagłówku, kontakt na wierzchu,
  ludzie i praca na zdjęciach) i łamiemy branżową normę promocji i popupów — zamiast
  tego cisza magazynu w czerni i bieli.

## Do decyzji (propozycje z przeglądu — nic nie wdrożone)

1. **Tracking nagłówków.** −0.065em / −0.077em to ponad 3× więcej niż u Mallett
   (−0.02em przy 186 px) i Kinfolk (−0.01em). Propozycja: −0.03em dla h1/h2. Mała
   zmiana, czytelniejsze litery na telefonie.
2. **Mniej etykiet.** 17 → ok. 6: zostawić te, które niosą informację (Dziś,
   Adres, Godziny, nazwy sekcji), usunąć powtórzenia „Black & White”, „A study in
   Black & White”, numerację „01/02/03”.
3. **Mniej teł.** 6 → 3 (czerń, biel, #f6f6f7); #181819 i #31343a zastąpić czernią.
4. **Ludzie i praca zamiast trzeciego zdjęcia wnętrza.** Większe zdjęcie Oli przy
   „Słowie od założycielki” i 2–3 zdjęcia pracy w B&W (z Instagrama albo nowa
   sesja). Wymaga materiału od salonu — to jedyna propozycja, której nie zrobię sam.
5. **Jedno hasło.** Dziś są dwa podobne („Forma. Światło. Twoje włosy.” i
   „Włosy. Twoja forma.”). Propozycja: drugie zastąpić konkretem (np. od 2011 /
   Wella / AirTouch) albo usunąć.

### Zdjęcia z Instagrama @salon_bw — przegląd 2026-11-19

Źródło: produkcyjne `/api/gallery` (Instagram Graph, 300 ostatnich postów, 237
z obrazem; 63 to wideo bez miniatury — nieprzejrzane). Zdjęcia są salonu;
klientki prawie zawsze od tyłu (nierozpoznawalne). Pliki mają maks. 1080 px
szerokości — wystarczą na kafelki i strony zabiegów, nie na pełnoekranowe hero
desktopu (tam zostaje wnętrze). W feedzie nie ma zdjęcia Oli przy pracy jako
osoby — są jej dłonie.

Krótka lista (numer roboczy → ID mediów Instagrama):
- Praca, strona główna: 116 `18029730949910572` (Air Touch, warkocz na falach),
  010 `17888029017205520` (fale blond), 139 `17992221554163534` (prosty, ciemny),
  166 `17994321991450663` (upięcie ślubne)
- Koloryzacja: 190 `17899912916334388` (chłodny blond, bob), 091
  `18225150265278824`, 020 `18473069806033350` (połysk)
- Balayage / pasemka: 116, 203 `17927879170664560`, 006 `18037187078393545`
- Upięcia: 014 `17942636783816961`, 042 `18016954157187628`, 161
  `18233091835134657`, 167 `18199497238163550`
- Proces (dłonie przy pracy): 018 `18042922778011946` (modelowanie), 199
  `18196057945111056` (farba Wella), 013 `18067171561813313` (folie)

Nie brać: grafiki z tekstem i opiniami, promocje produktów, sezonowe
(święta, dynie), kolaże kwadratowe z lat ~2016, zdjęcia z widoczną twarzą
klienta lub cudzym znakiem wodnym. Obecna zajawka na produkcji bierze 4
**ostatnie** posty — trafiają się wśród nich grafiki i dekoracje sezonowe;
propozycja: stały, wybrany zestaw zamiast „ostatnich 4”.

Kolejność od najtańszej: 1 → 2 → 3 → 5 → 4.
