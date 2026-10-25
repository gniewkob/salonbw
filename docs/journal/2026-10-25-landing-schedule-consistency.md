# Spójność godzin landingu z harmonogramem

- **Data:** 2026-10-25
- **Agent:** Codex
- **Commit(y):** ten commit
- **PR:** przygotowanie do przeglądu

## Finding

Widoki dopisywały niedzielę zamkniętą niezależnie od grafiku. Zamknięty cały
tydzień powodował powrót do godzin zapasowych. JSON-LD zawierał stałe
godziny, a CTA cennika obiecywało 09–19 w tygodniu. Najbliższy termin używał
strefy urządzenia zamiast Europe/Warsaw.

## Change

Wspólny model grafiku i generator JSON-LD; godziny z API przekazywane przez
serwer do home (ISR 60 s) i kontaktu (SSR). Przeglądarka dodatkowo odświeża
grafik po montażu. Wszystkie dni pochodzą z grafiku, także zamknięty tydzień
i otwarta niedziela. CTA PL/EN/DE odsyła do terminów w kalendarzu.
Najbliższy termin jest wyświetlany w strefie salonu.

Odczyt serwerowy ma timeout 4 s. Przy awarii godzin nie publikuje się
statycznego JSON-LD; widok zachowuje dotychczasowy fallback konfiguracji.
ISR jest rewalidacją na żądanie, a nie gwarancją odświeżenia co 60 s bez ruchu.

Gałąź startuje od origin/master, bez dwóch lokalnych commitów Fazy 0 domeny
oraz bez niezacommitowanego planu ownera. Główny checkout pozostaje nietknięty.

## Validation

- Testy regresji najpierw FAIL w głównym checkoucie, po poprawce PASS.
- Izolowana gałąź: baseline 70/70, po poprawce 79/79 (24 zestawy).
- ESLint src z autofix PASS; typecheck PASS; build PASS na Next 15.5.28.
- Wcześniejsza weryfikacja lokalna tej samej poprawki: widoki 390/1440,
 surowy HTML home/contact zgodny z API, Lighthouse accessibility
 home/contact/services 100/100/100. Weryfikacja na wdrożeniu jeszcze wymagana.
- Regresja produkcyjnego panelu 40187848395: 23/23; dotyczy obecnego
 wdrożenia panelu, nie tej jeszcze niewdrożonej poprawki landingu.

## Rollout

Bez deployu i zmian produkcyjnej konfiguracji. Cutover domeny i izolacja dev
pozostają osobnymi bramkami. Profil administratora systemu i jego pulpit
są osobnym zakresem, potwierdzonym przez ownera.

## Follow-up

CI konkretnego SHA, przegląd poprawki, deploy landingu na dev i smoke godzin
oraz JSON-LD. Dopiero po UAT osobna decyzja o przełączeniu domeny.
