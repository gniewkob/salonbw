# Usunięcie martwej zachęty do Booksy z komunikacji SalonBW

- **Data:** 2026-10-26
- **Agent:** ChatGPT / Web Design Intelligence
- **Gałąź:** `codex/remove-stale-booksy-ui-20261026`
- **Commit(y):** `2bae53c8`, `677ee981` (kod); kolejne commity dokumentacji na tej samej gałęzi
- **PR:** utworzony po zapisaniu tego pliku, do walidacji przed merge

## Finding

- `apps/panel/src/pages/communication/[id].tsx` eksponował checkbox „Dodaj zachętę do umówienia się na wizytę przez aplikację Booksy”.
- Powiązany stan `booksyPrompt` był ustawiany w UI, lecz **nie był wykorzystywany** w `handleSendReply` ani w payloadzie `sendSms`. Checkbox był martwym, mylącym elementem interfejsu.
- `apps/panel/src/styles/salon-shell.css` posiadał styl `.communication-booksy-checkbox` wyłącznie dla tego nieużywanego elementu.
- Przeszukanie aktywnego repozytorium GitHub nie wykazało wystąpień adresu `booksy.com` w plikach kodu; wystąpienia słowa Booksy są przede wszystkim historycznym pochodzeniem danych, migracjami, dokumentacją i etykietami archiwalnych opinii.
- `apps/landing/src/middleware.ts` utrzymuje 301 dla 54 starych ścieżek PHP oraz osobne przekierowanie `/modals/rezerwacja` do panelowego `/booking`. Te przekierowania są potrzebne do zachowania starych adresów i **nie kierują do Booksy**.
- `docs/PROJECT_STATE.md` i `docs/journal/2026-10-25-isolated-environments.md` dokumentują wykonany cutover produkcji do Next.js w dniu 2026-10-26. Bezpośrednia weryfikacja publicznych domen w tej sesji nie była możliwa (narzędzia sieciowe nie uzyskały odpowiedzi).
- Dołączone archiwum starej strony PHP zawiera Booksy w 4 starych plikach (szablonach i cennikach); nie jest częścią bieżącej aplikacji Next.js.

## Change

- Usunięto checkbox „Booksy” i osierocony stan `booksyPrompt` z widoku komunikacji.
- Usunięto osierocony selektor CSS.
- Nie zmieniano wysyłki SMS/email ani danych historycznych, importów, migracji, etykiet źródeł archiwalnych opinii czy przekierowań starych adresów.
- Legacy PHP i jego prywatna kopia pozostają do przywrócenia wcześniejszej wersji, dopóki owner nie zatwierdzi ich usunięcia po potwierdzonym przywróceniu kopii.

## Validation

- Statycznie sprawdzono, że oba wystąpienia stanu `booksyPrompt` (deklaracja/użycie) zniknęły, a cały blok checkboxa został usunięty tylko raz.
- Statycznie potwierdzono, że pozostały kod komunikacji nadal wywołuje `sendSms.mutateAsync` z dotychczasowymi argumentami.
- **NOT TESTED:** TypeScript, lint, jednostkowe CI, render na dev, E2E uwierzytelnionego panelu; do potwierdzenia w PR i staging.

## Rollout

- Zmiany znajdują się wyłącznie w odrębnej gałęzi GitHub, **brak wdrożenia na dev i produkcję**.
- Proponowana kolejność: zielone CI PR → staging `dev-panel.salon-bw.pl` z konkretnym SHA → test nadawania SMS w sandboxie/bez faktycznej wysyłki → owner akceptacja → merge i kontrolowana publikacja produkcyjna.
- Istniejące reguły automatycznego deployu po push/merge do `master` wymagają ostrożności: nie scalać PR przed akceptacją staging.

## Follow-up

1. Potwierdzić rzeczywiste redirecty produkcji (301 dla starych PHP i `/modals/rezerwacja` do własnego panelu), bez używania pamięci podręcznej wyszukiwarki jako dowodu live.
2. Potwierdzić na staging skuteczność wejścia w `/booking` i brak Booksy w rzeczywistym UI komunikacji.
3. W osobnym PR usprawnić zachowanie usługi po rejestracji i poprawność analityki `begin_checkout`, bez zmiany flow autoryzacji bez testów E2E.
4. Po zakończonym UAT rozważyć usunięcie nieaktywnego PHP z serwera; nie usuwać backupu przed niezależnym testem odtworzenia.
