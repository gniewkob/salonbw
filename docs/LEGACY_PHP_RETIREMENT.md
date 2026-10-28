# Wycofanie historycznej strony PHP po przejściu na Node.js

**Status (2026-10-28): plan do wykonania; nie potwierdzono usunięcia żadnych plików.**

## Zakres i stan

Aktualne źródło produkcyjne: [`gniewkob/salonbw`](https://github.com/gniewkob/salonbw), Node.js 22 / Next.js (landing i panel) / NestJS (API). W GitHubowym monorepo nie występują katalogi `application/` i `system/` CodeIgnitera.

Dostarczony oddzielnie ZIP historycznej strony zawiera CodeIgniter **3.0.4**, w tym plik `index.php` uruchamiający `system/core/CodeIgniter.php`. Usunięcie `system/` **z tego archiwum** zniszczyłoby możliwość uruchomienia starej witryny.

Przełączenie domeny `salon-bw.pl` na Node zakończono według [dziennika wdrożenia](journal/2026-10-25-isolated-environments.md) 2026-10-25. Dokumentacja cutoveru zakłada zachowanie starego `public_html` jako rollback; zapis ten nie dowodzi, że backup można odtworzyć.

Ten dokument nie upoważnia do kasowania plików z serwera bez osobnego kroku operacyjnego.

## Warunki usunięcia (wszystkie wymagane)

- [ ] Owner potwierdza, że rezygnuje z natychmiastowego rollbacku do PHP i akceptuje okres obserwacji po przełączeniu.
- [ ] Bieżący stan Node na produkcji i staging jest zweryfikowany (domeny, release SHA/build ID, `/healthz`, logowanie oraz krytyczne ścieżki).
- [ ] Zidentyfikowano na serwerze **dokładne** położenie historycznych plików PHP, ich właściciela i wszelkie powiązane dane. Nie traktować `public_html` jako pewnej ścieżki bez inspekcji.
- [ ] Wykonano prywatną kopię plików i ewentualnej historycznej bazy poza katalogiem WWW; odtworzenie próbne zostało przeprowadzone i udokumentowane.
- [ ] Stare URL-e mają sprawdzoną mapę 301/410 i wyniki SEO są monitorowane; formularze, galeria, kontakt, strony prawne i rezerwacja działają w Node.
- [ ] Sprawdzono, że nie ma odwołań do historycznych plików w aktualnym Passenger/WWW, cron, webhookach, Google/Meta, certyfikatach ani poczcie.
- [ ] Jest plan cofnięcia operacji, termin i osoba zatwierdzająca zmianę.

## Bezpieczna kolejność

1. Wykonać **read-only** inwentaryzację na mydevil.net (typ domeny, docelowe linki `public_nodejs`, obecność `public_html`, rozmiary, uprawnienia i referencje). Nie zmieniać symlinków sześciu aktywnych aplikacji.
2. Sprawdzić backup i przywrócić kopię na izolowanym środowisku testowym, bez udostępniania starej strony publicznie.
3. Po zgodzie ownera przenieść zidentyfikowane pliki starego PHP do prywatnego archiwum poza katalogiem WWW (operacja odwracalna), a nie usuwać rekursywnie domeny.
4. Wykonać kontrolę: produkcyjny landing, panel, API, rezerwacje, przekierowania SEO, `privacy`/`policy`/`data-deletion`, logi i poczta.
5. Dopiero po ustalonym okresie retencji i ponownej zgodzie ownera rozważyć trwałe skasowanie **konkretnych** archiwalnych plików. Nie usuwać backupów produkcyjnej bazy klientów ani danych rezerwacji.

## Poza zakresem

- Nie usuwać `apps/landing`, `apps/panel`, `backend/salonbw-backend` ani `packages`.
- Nie usuwać plików z serwera poprzez zmianę GitHub README.
- Nie mylić historycznego CodeIgnitera z aliasami kompatybilności Versum w aplikacji Node; ich usunięcie wymaga odrębnej analizy tras i funkcji.
- Nie ruszać obecnej produkcyjnej bazy PostgreSQL, kont klientek, importu Booksy ani kluczy środowiskowych.

**Decyzja do podjęcia:** czy archiwum PHP ma pozostać w prywatnym backupie, czy owner chce również trwałego usunięcia po weryfikacji odtworzenia?

Powiązane dokumenty: [PROJECT_STATE.md](PROJECT_STATE.md), [DOMAIN_CUTOVER_PLAN.md](DOMAIN_CUTOVER_PLAN.md), [DEPLOYMENT_MYDEVIL.md](DEPLOYMENT_MYDEVIL.md), [ROLLBACK_PROCEDURE.md](ROLLBACK_PROCEDURE.md).
