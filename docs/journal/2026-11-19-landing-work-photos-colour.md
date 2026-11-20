# 2026-11-19 — landing: zdjęcia prac w kolorze

**Decyzja (Ola, przez ownera):** „zdjęcia prac muszą być kolorowe, bo to
koloryzacja jest ważna”.

**Zmiana:** 14 zdjęć w `apps/landing/public/images/work/` ponownie pobranych z
@salon_bw (te same posty, ID w `DESIGN.md`) i zapisanych w kolorze; zdjęte
filtry grayscale z kafelków prac (zajawka galerii, strony zabiegów, dwa zdjęcia
dłoni na stronie głównej przez klasę `.work`). Wnętrza, hero i portret Oli
zostają czarno-białe. Podtytuł zajawki bez „pełna galeria — w kolorze” (PL/EN/DE).

**Validation:** eslint, `tsc --noEmit`, jest 110/110, `pnpm build`; zrzuty
1440: sekcja salonu, „O nas”, zajawka, koloryzacja, upięcia — prace w kolorze,
wnętrza B&W.

**Rollout:** po zgodzie ownera dev `dcef00c0` → `3e8604bd` (stage, smoke ×2, plan, aktywacja PASS). Live-verify: sha `3e8604bd`, 11 tras 200, nowy podtytuł zajawki w HTML, `/design-lab` 404, anonimowo 401. Produkcja nietknięta.
