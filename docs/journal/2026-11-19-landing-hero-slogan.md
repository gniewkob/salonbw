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

**Follow-up:** kanał ręczny przenosi każdą poprzednią wersję do
`previous-landing/` bez limitu — przy częstych wdrożeniach zapełnia konto
(~430 MB na wdrożenie). Potrzebna retencja (np. 2 ostatnie) w
`manual-dev-landing-activate.mjs` — decyzja ownera; obecnie znów 3 katalogi.
