# V18 — brak pozornej godziny przy pustym polu nowej wizyty

- **Data:** 2026-11-20
- **Agent:** Codex
- **Baza:** PR #1734, `38a5d30e055680ce9c8953f9887626c4a832c8a5`
- **Docelowy PR:** #1734 (Draft)

## Finding

W ręcznie tworzonej wizycie czas musi zostać wybrany świadomie. Jednak
`V18TimeSelector` używał `09:00` jako wewnętrznego fallbacku i równocześnie
ustawiał `aria-pressed=true` oraz aktywny styl chipów `09` / `00`, nawet gdy
`value=''`. Natywny input „Dokładna godzina” także wyświetlał `09:00`.
Taki wygląd sugerował już potwierdzony wybór, sprzeczny z placeholderem
„Wybierz godzinę”.

## Change

- Aktywny stan chipów i `aria-pressed` wymagają rzeczywistego poprawnego
  `value` (`hasSelectedTime`). Wewnętrzny fallback `09:00` nadal służy do
  złożenia pierwszego kliknięcia godziny, lecz nie do oznaczenia wyboru.
- Natywne pole `type=time` pozostaje puste do wskazania godziny.
- Zmieniono tylko `V18TimeSelector` i jego test w `v18DateInput.test.tsx`.
  Reguła obowiązkowego podania daty i godziny, slot z kalendarza, blokady
  czasu oraz zapis wizyty nie zmieniły się.

## Validation

- Test początkowo RED: `09` było `aria-pressed=true`; potem `type=time`
  miało wartość `09:00` mimo pustego wyboru.
- Po poprawce `v18DateInput.test.tsx`: **12/12 PASS**.
- Pełny panel Jest: **773/773 PASS** (138 suites).
- `pnpm exec tsc --noEmit`: **PASS**.
- `pnpm run build`: **PASS** (115 stron statycznych, 123 pliki danych).
- ESLint zmienionych plików po formatowaniu: **PASS**.
- Potwierdzona relacja commitów: `40e5c344` jest przodkiem `38a5d30e`
  (GitHub compare: ahead 74 / behind 0). Time Blocks pozostają w historii
  bazy kandydata; testy panelu obejmują ich komponenty.

## Rollout

DEV staging, Unix smoke, Passenger activation, release readback i iPhone UAT:
**NOT STARTED** dla nowego SHA. Produkcja/baza: **NONE**.

## Follow-up

Zaktualizować PR #1734 o commit, sprawdzić dokładny SHA na Macu Node 22,
przygotować i aktywować tylko DEV po read-only preflight oraz wykonać
porównanie na iPhone po publikacji.
