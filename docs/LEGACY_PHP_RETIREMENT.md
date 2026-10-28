# Archiwalne PHP — status po przejściu na Node.js

**Status (2026-10-28): operacja usunięcia legacy PHP została wykonana 2026-10-26 i niezależnie sprawdzona. Nie wykonywać jej ponownie.**

## Potwierdzony przebieg

- Główne repozytorium [gniewkob/salonbw](https://github.com/gniewkob/salonbw) zawiera produkcyjny stack Node.js 22 / Next.js / NestJS, bez katalogów `application/` oraz `system/` CodeIgnitera.
- Oddzielne archiwum ZIP historycznej strony zawierało CodeIgniter 3.0.4; **nie jest źródłem obecnej produkcji**.
- Domena `salon-bw.pl` została przełączona na Next.js 2026-10-25; szczegóły: [dziennik wdrożenia](journal/2026-10-25-isolated-environments.md).
- [PR #1520](https://github.com/gniewkob/salonbw/pull/1520) dokumentuje faktyczne usunięcie na mydevil.net katalogu legacy `public_html`: **1663 pliki / 77 MB** (2026-10-26), weryfikację 54 starych ścieżek i zdrowia usługi.
- [PR #1521](https://github.com/gniewkob/salonbw/pull/1521) opisuje niezależną ponowną kontrolę: brak tego katalogu, aktywny symlink Next.js, działające trasy prawne, rezerwacje i API.
- To dowody operacyjne zapisane w PR-ach, **nie nowy odczyt SSH w ramach tej zmiany dokumentacji**. Nie zbadano wszystkich ewentualnych prywatnych kopii poza znanym prefixem.

## Reguły bezpieczeństwa

1. **Nie uruchamiać ponownie skryptu usuwającego** ani `--execute` z PR #1520. PR pozostaje niescalony, a skrypt jest operacją historyczną.
2. Nie usuwać kodu Node.js, symlinków Passenger, danych PostgreSQL, kluczy środowiskowych, backupów produkcyjnych ani plików innych domen.
3. Procedura rollbacku powinna odtwarzać sprawdzone wydanie **Node.js**, a nie nieistniejącą instalację CodeIgnitera; patrz [ROLLBACK_PROCEDURE.md](ROLLBACK_PROCEDURE.md).
4. Weryfikację bieżącego hostingu wykonywać read-only. Nie traktować logu operacji z 2026-10-26 jako pomiaru stanu hosta w czasie rzeczywistym.
5. Priorytety produktu: bezpieczne wydanie poprawek rezerwacji, izolowany UAT na DEV oraz prace nad wyglądem landing page; porządkowanie legacy nie blokuje tych prac.

Powiązane: [PROJECT_STATE.md](PROJECT_STATE.md), [DEPLOYMENT_MYDEVIL.md](DEPLOYMENT_MYDEVIL.md), [PR #1520](https://github.com/gniewkob/salonbw/pull/1520), [PR #1521](https://github.com/gniewkob/salonbw/pull/1521).
