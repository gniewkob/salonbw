# Ujednolicenie marki: landing + panel

- **Decyzja ownera:** 2026-11-18 („podoba mi się pomysł ujednolicenia, zapisz
  i rozpocznij wdrożenie”; „możemy dopracować też styl”).
- **Cel:** landing (`dev.salon-bw.pl` / `salon-bw.pl`) i panel (Studio V18)
  wyglądają jak jedna marka: te same kolory, czcionki, typografia etykiet,
  przyciski i fokus — z jednego źródła, zamiast osobnych zmiennych CSS.
- **Źródło reguł:** `.claude/skills/salonbw-brand/SKILL.md` (paleta, kontrast,
  typografia, CTA). Ten plan ich nie zmienia — przenosi je do kodu.

## Etapy

| Etap | Zakres | Ryzyko | Status |
|---|---|---|---|
| 1 | Pakiet `packages/brand-tokens` (CSS + TS, test synchronizacji i kontrastu); landing bierze tokeny z pakietu; czcionki z `next/font` zamiast niezaładowanych nazw | niskie, tylko landing | **zrobione** 2026-11-18 (`271e7e1`) |
| 1b | Dopracowanie stylu strony głównej na tokenach: jedna skala szarości (bez ciepłych odcieni), spójne promienie, cienie, rytm sekcji; przegląd wizualny wg pętli WDI | niskie | **część 1 zrobiona** (`271e7e1`): 28 kolorów → tokeny, bez ciepłych szarości, skala trackingu |
| 2 | Wspólne elementy marki: logo, przyciski główny/drugorzędny, fokus, etykiety (komponenty lub klasy w pakiecie) | średnie | **zrobione na landingu**: nagłówek sekcji + jasne opinie (`8d81cd4`); wspólne przyciski `bw-btn` i dwutonowy fokus w `@salonbw/brand-tokens/elements.css` (ten commit) |
| 3 | Panel Studio V18 bierze tokeny i czcionki z pakietu — **razem ze strumieniem V18** (rozwijany osobno), bez zmiany zachowania | średnie | — |
| 4 | `DESIGN.md` jako jedno źródło prawdy dla obu aplikacji; skill marki wskazuje pakiet | niskie | — |

## Zasady

- Bez nowych odcieni: czerń, biel, szarości, akcent srebrny; czerwień tylko
  jako stan błędu.
- Wartości tokenów nie zmieniają się przy przenosinach (etap 1 = zero zmian
  wizualnych poza czcionką, która dotąd spadała na fallback).
- Każdy etap: tsc/eslint/jest/build, zrzuty 1440/390/320, kontrast 0 błędów,
  Lighthouse a11y 100.
- Pakiet jest zależnością build-time; paczki wdrożeniowe nie potrzebują go w
  runtime (CSS jest wkompilowany).

## Znaleziska do późniejszych etapów

- `apps/landing/src/components/HeroSlider.tsx` nie jest nigdzie importowany
  (martwy kod po nowej stronie głównej) — do usunięcia osobno.

- ~~`prefers-color-scheme: dark` w `globals.css`~~ — usunięte (`e41d801`,
  decyzja ownera 2026-11-18); audyt jasny/ciemny: 0 błędów kontrastu.
- `apps/landing/app.cjs`: `syncNextDist` usuwa cel przez dowiązanie, gdy
  standalone nie ma własnego `next` (patrz journal 2026-11-18 kanał ręczny).

## Scalenie do `master`

PR #1722 (decyzja ownera 2026-11-18). Zablokowany przez ruleset
„SalonBW master - required CI”: 8 wymaganych kontroli, brak aktorów obejścia.
CI nie startuje (blokada płatności GitHub), więc scalenie czeka na
odblokowanie CI albo na decyzję ownera o rulesecie. Agent rulesetu nie zmienia.
