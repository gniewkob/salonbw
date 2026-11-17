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
| 1 | Pakiet `packages/brand-tokens` (CSS + TS, test synchronizacji i kontrastu); landing bierze tokeny z pakietu; czcionki z `next/font` zamiast niezaładowanych nazw | niskie, tylko landing | w toku |
| 1b | Dopracowanie stylu strony głównej na tokenach: jedna skala szarości (bez ciepłych odcieni), spójne promienie, cienie, rytm sekcji; przegląd wizualny wg pętli WDI | niskie | po 1 |
| 2 | Wspólne elementy marki: logo, przyciski główny/drugorzędny, fokus, etykiety (komponenty lub klasy w pakiecie) | średnie | — |
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

- `globals.css` landingu: `@media (prefers-color-scheme: dark)` przestawia
  `body` na `#0a0a0a`/`#ededed`. Marka nie ma trybu ciemnego; tekst bez
  jawnego koloru na jasnej sekcji może wtedy stracić kontrast. Do decyzji w 1b.
- `apps/landing/app.cjs`: `syncNextDist` usuwa cel przez dowiązanie, gdy
  standalone nie ma własnego `next` (patrz journal 2026-11-18 kanał ręczny).
