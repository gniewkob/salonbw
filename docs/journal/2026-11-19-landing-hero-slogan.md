# 2026-11-19 — landing: nowe hasło hero, zdjęcia dłoni znów B&W

**Decyzja (Ola, zrzuty z iPhone'a):** w sekcji salonu zdjęcie farby ma być bez
koloru; hasło hero się nie podoba → kierunek „zdrowie włosów”.

**Zmiana:** hasło „Forma. Światło. Twoje włosy.” → „Zdrowe włosy. Piękny
kolor.” (EN „Healthy hair. Beautiful colour.”, DE „Gesundes Haar. Schöne
Farbe.”); zdjęcia dłoni przy pracy (farba, folie) na stronie głównej znów w
czerni i bieli (usunięta klasa `.work`). Kolor zostaje tylko na zdjęciach
efektów.

**Validation:** eslint, `tsc --noEmit`, jest 110/110, `pnpm build`; zrzuty 390
i 1440: hasło mieści się w dwóch liniach, farba i folie `grayscale(1)`.

**Uwaga do decyzji:** sekcja salonu ma hasło „Najpierw zdrowie włosów, potem
kolor.” — po zmianie hero oba mówią o tym samym. Do decyzji ownera.

**Rollout:** pierwsza próba zablokowana przez kontrolę miejsca MyDevil
(45,8/50 GB, próg 4 GB wolnego). Po zgodzie ownera usunięte trwale 12
najstarszych katalogów `~/.salonbw-manual/previous-landing/` (po ~430 MB,
zostawione 2 ostatnie) i 12 starych paczek `incoming/landing-dev-*`; panel,
API i produkcja nietknięte → 40,9/50 GB. Następnie dev `3e8604bd` →
`6fedbd1e` (stage, smoke ×2, plan, aktywacja PASS). Live-verify: sha
`6fedbd1e`, trasy 200, nowe hasło w HTML, `/design-lab` 404, anonimowo 401.
Produkcja nietknięta.

**Retencja (owner: „1 kopia wystarczy”):** `manual-dev-landing-activate.mjs`
na `ops/dev-landing-manual-20261118` (`807d3b4`) po w pełni zweryfikowanej
aktywacji zostawia tylko właśnie zastąpioną wersję i usuwa starsze
`previous-landing/*-before-*` oraz paczki `incoming/landing-dev-*` innych SHA;
nieudana aktywacja niczego nie usuwa (testy 23/23, w tym 2 nowe). Na hoście
zostawiona 1 kopia (`3e8604bd-before-6fedbd1e`), usunięta 1 stara paczka.
Pozostałe 2 kopie landingu były już usunięte przed tym krokiem, a zajętość
spadła do 23,4/50 GB — nie przez ten kanał (prawdopodobnie sprzątanie
strumienia V18).
