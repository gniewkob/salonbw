# 2026-11-19 — landing: wdrożenie propozycji z przeglądu WDI + zdjęcia z Instagrama

**Decyzja ownera:** „tak akceptuję” — punkty 1–4 z `DESIGN.md` i wybór zdjęć.

**Zmiany (`apps/landing`):**
- tracking display −0.03em (home, PageHero, ServiceDetailBody, BookingModal);
- strona główna: usunięte ozdobne etykiety i numeracja sekcji, hasło sekcji
  salonu → „Najpierw zdrowie włosów, potem kolor.” (PL/EN/DE);
- tła: czerń/biel/#f6f6f7 (hero-black i surface-dark → brand-black);
- 11 zdjęć pracy z @salon_bw w B&W (`public/images/work`, WebP w manifeście);
  zajawka galerii = stały zestaw 4 (bez fetchu `/api/gallery`); strony
  zabiegów dostają prop `works` zamiast fallbacku z wnętrza; usunięty
  nieużywany klucz `workAlt`.

**Validation:** eslint, `tsc --noEmit`, jest 110/110, `pnpm build`.
Lokalnie (`next start`): 11 tras 200 (oprócz celowego 404), brak poziomego
przewijania na 1440/390/320, jedno h1, brak zepsutych obrazów; tła strony
głównej: 3 powierzchnie. Lighthouse mobile: `/` a11y 100 / perf 81,
`/services/coloring` a11y 100 / perf 85 (szum ±6–12). Zrzuty sekcji
desktop+mobile obejrzane. Test wizualny względem bazy nie uruchomiony
(zmiany celowe, brak bazy w repo).

**Rollout:** po zgodzie ownera dev `e52ad786` → `d3380b5a` (source sync, pakiet, stage, smoke ×2, plan, aktywacja PASS). Live-verify: sha `d3380b5a`, 10 tras 200, `/images/work/*` 200, nowe hasło w HTML, `/design-lab` 404, anonimowo 401. Produkcja nietknięta. Worktree na Macu usunięty, zostały dwie ostatnie paczki.
