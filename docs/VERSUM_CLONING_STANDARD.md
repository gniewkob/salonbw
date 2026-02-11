# Standard Klonowania Versum -> Panel (Źródło Prawdy)

Data: 2026-02-11  
Status: **obowiązujący standard** dla wszystkich agentów i developerów

## 1. Cel i zasada nadrzędna

Cel klonowania: **1:1 względem Versum** dla modułów panelu (`panel.salon-bw.pl`) przy zachowaniu naszej architektury (Next.js + NestJS).

Zasada:
- najpierw **kopiowanie** (HTML/CSS/assety/flow),
- później **adopcja integracyjna** (routing, auth, API),
- na końcu **walidacja parity** (wizualna + funkcjonalna).

Nie projektujemy UI od nowa, dopóki nie ma jednoznacznej decyzji produktowej o odejściu od 1:1.

## 2. Co wolno kopiować i gdzie

Dozwolone:
- markup i struktura widoków,
- style CSS i sprite/icon assets,
- zachowania UI/flow (kolejność kroków, modale, akcje),
- nazewnictwo klas i wrapperów, jeśli przyspiesza parity.

Miejsce docelowe:
- runtime vendor assets: `apps/panel/public/versum-vendor/*`
- komponenty/podstrony panelu: `apps/panel/src/*`
- kompatybilne aliasy URL: utrzymywane przez `apps/panel/next.config.mjs`

Niedozwolone:
- sekrety i dane produkcyjne w repo,
- zmiany infrastruktury „na zgadywanie”,
- refaktoryzacja „na ładniej”, jeśli psuje 1:1.

## 3. Obowiązkowy proces (SOP)

### Krok A — Capture referencji
- Zbieramy referencję modułu: screenshoty, HTML snapshot, flow kliknięć.
- Zapisujemy artefakty w `docs/` lub `output/parity/<data-modul>/`.

### Krok B — Copy-first implementation
- Odtwarzamy strukturę widoku 1:1 (layout, secondnav, tabele, modale, przyciski).
- Przenosimy CSS/assety vendorowe zamiast ręcznego „stylowania na oko”.

### Krok C — Integracja panelu
- Podpinamy routing panelu (canonical: `/calendar`, `/customers`, `/products`, ...).
- Podpinamy auth/session/cookie flow bez zmiany kontraktu bezpieczeństwa.
- Podpinamy API backendu; brakujące endpointy dopisujemy po stronie backendu.

### Krok D — Parity validation
- Sprawdzamy:
  - visual parity (screenshoty porównawcze),
  - parity funkcjonalne (każdy przycisk i workflow),
  - brak regresji lint/typecheck/build.

### Krok E — Rollout
- Kolejność: `api` -> `dashboard` (a potem ewentualnie pozostałe targety).
- Po deployu: smoke (`/healthz`, logowanie, krytyczne flow modułu).

## 4. Definicja „DONE 1:1” dla modułu

Moduł jest „100%” tylko gdy wszystkie warunki są spełnione:
1. Widoki i układ zgodne 1:1 (sidebar/secondnav/tabele/modale/kolory/ikony/fonty).
2. Wszystkie akcje z widoku referencyjnego działają (bez stubów i TODO).
3. Nawigacja między podwidokami działa identycznie.
4. API obsługuje wszystkie filtry/akcje wymagane przez UI.
5. Lint + typecheck przechodzą lokalnie.
6. Deploy production zakończony sukcesem i smoke test jest zielony.

## 5. Zasady implementacyjne (żeby nie rozjechać klonu)

- Jeśli istnieje gotowy vendor CSS/JS/asset: użyj go zamiast reimplementacji.
- Jeśli trzeba „adoptować” kod, zmieniaj minimalnie:
  - routing,
  - źródła danych/API,
  - auth/cookie compatibility.
- Dla modułów klonowanych 1:1 **nie używamy Tailwindowego layoutu i utility-classes jako warstwy prezentacji**.
  - Wymagane: klasy i struktura DOM zgodna z Versum (`default.css`/`responsive.css`/`new-ui.css` + lokalne klasy kompatybilne).
  - Tailwind dopuszczalny wyłącznie pomocniczo poza warstwą UI klonowaną 1:1 (np. tooling/dev-only), nie w finalnym renderze modułu klonowanego.
- Każda świadoma różnica vs Versum musi być opisana w:
  - `docs/VERSUM_CLONE_PROGRESS.md` (sekcja „Known deltas”),
  - PR/commit message.

## 6. Checklist przed commitem (moduły Versum clone)

Panel:
```bash
cd apps/panel
pnpm eslint src --fix
pnpm tsc --noEmit
```

Backend (jeśli były zmiany API):
```bash
cd backend/salonbw-backend
pnpm lint --fix
pnpm typecheck
```

## 7. Checklist po deployu

```bash
curl -fsS https://api.salon-bw.pl/healthz
```

Manual:
- wejście do modułu na `https://panel.salon-bw.pl`,
- przejście przez kluczowe workflow modułu 1:1,
- weryfikacja, że nie ma martwych przycisków, błędów 4xx/5xx i broken nav.

## 8. Priorytet dokumentacyjny (przy konflikcie treści)

Jeśli starsze dokumenty clone są niespójne, obowiązuje kolejność:
1. `docs/VERSUM_CLONING_STANDARD.md` (ten dokument),
2. `Agent.md`,
3. `AGENTS.md`,
4. pozostałe notatki/historyczne analizy w `docs/`.
