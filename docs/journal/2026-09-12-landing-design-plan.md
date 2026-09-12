# Plan przebudowy landingu i brief na sesję zdjęciową

- **Data:** 2026-09-12
- **Agent:** Claude Opus 5
- **Commit(y):** bieżący commit
- **PR:** nowy PR dla `claude/development-status-1xv0z4`

## Finding

Owner poprosił o przegląd kodu landingu pod kątem designu, z celem „perfekcyjna,
nietuzinkowa strona salonu fryzjerskiego". Przegląd objął render sekcja po
sekcji na 1440 i 390 px oraz audyt warstwy stylów na commicie `d620085`.

Diagnoza: szkielet edytorski jest dobry — Playfair, szeroko rozstrzelona
mikro-typografia, asymetryczna siatka usług, hero z diagonalnym cięciem — ale
wypełniono go fotografią dokumentacyjną pustego salonu w kolorze. Galeria
pokazuje osiem kadrów mebli i ani jednego efektu pracy, co dla salonu
fryzjerskiego jest pominięciem najmocniejszego dowodu kompetencji.

Zmierzony stan wyjściowy:

- **4,81 MB** obrazów na 390 px po pełnym przewinięciu strony głównej,
  13 plików; największy `DSC_9583.jpg` **1703 kB** jako tło pasma CTA pod
  ciemnym scrimem.
- **64** surowe `#b4b8be` w komponentach zamiast `var(--brand-silver)`
  (+ `#0d0d0d` 16×, `#ffffff` 12×); `rgba(220,80,80,0.9)` 3× w `BookingModal`
  jako jedyny chromatyczny kolor w monochromatycznej marce.
- **6** różnych wartości `letter-spacing` w mikro-typografii (0,6 / 1,2 / 1,68 /
  1,92 / 2,3 px i `normal`).
- Tekst treściowy **14 px** na mobile przy regule marki ≥ 16 px.
- Portret założycielki **270 × 370 px** — rozmyty na każdym nowoczesnym ekranie.
- Ten sam wzorzec nagłówka sekcji (eyebrow + serif + kreska 40 × 2 px +
  podtytuł) **5×** na jednej stronie; w karcie usługi numeral „01" i badge
  „POLECANE" nachodzą na siebie w tym samym rogu.

## Change

Wyłącznie dokumentacja — bez zmian w kodzie landingu.

- Nowy `docs/LANDING_DESIGN_PLAN.md`: część A (brief na sesję zdjęciową po
  stronie ownera) i część B (pięć faz w kodzie po stronie agenta), z kolejnością,
  zależnościami i mierzalnymi kryteriami odbioru każdej fazy.
- `PROJECT_STATE.md`: wpis o planie i zmierzonym stanie wyjściowym.

Część A podaje listę ujęć z liczbami, listę rzeczy do usunięcia z kadru
(czerwone róże, włączony telewizor), proporcje i minimalne rozdzielczości
wymuszone przez layout, wymóg jednego profilu konwersji monochromatycznej dla
całego zestawu oraz sposób dostarczenia plików.

Część B: (1) warstwa obrazu i pipeline wariantów, (2) dyscyplina tokenów,
trackingu, rozmiaru tekstu i rytmu, (3) sygnatura wizualna zamiast powtarzanej
kreski, (4) rytm i treść sekcji, (5) porządki. Fazy 1.1, 1.2 i 2 nie wymagają
zdjęć i mogą ruszyć od razu.

## Validation

- Pomiary wykonane na zbudowanej stronie (`next build` + `next start`) w
  Chromium: waga obrazów po skryptowanym przewinięciu całej strony, zliczenie
  literałów kolorów i wartości trackingu w DOM, rozmiary tekstu akapitów,
  wymiary plików graficznych odczytane z nagłówków JPEG.
- Zrzuty sekcja po sekcji na 1440 i 390 px posłużyły za podstawę oceny
  kompozycji; nie zapisano ich w repo (materiał roboczy).
- `scripts/handoff-check.sh` PASS.
- Drzewo robocze poza dokumentacją nietknięte.

## Rollout

Nie dotyczy — zmiana dokumentacyjna. Plan opublikowany również jako artefakt do
czytania i przekazania fotografowi; źródłem prawdy pozostaje plik w repo.

## Follow-up

Owner zajmuje się sesją zdjęciową. Po stronie kodu następny krok to Faza 1.1 +
1.2 (monochromatyczna warstwa obrazu i jednolity scrim) oraz Faza 2 (tokeny,
skala trackingu, 16 px tekstu na mobile, rytm sekcji) — obie niezależne od
zdjęć. Faza 1.3 wymaga wcześniejszego sprawdzenia, czy `sharp` ładuje się na
FreeBSD u MyDevil, bo od tego zależy, czy `images.unoptimized` może zniknąć.
