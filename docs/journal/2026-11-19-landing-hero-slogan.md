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

**Rollout:** dev — czeka na zgodę ownera. Produkcja nietknięta.
