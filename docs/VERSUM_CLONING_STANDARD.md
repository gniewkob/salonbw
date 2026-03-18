# Standard Klonowania Versum -> Panel (Pattern-Driven Development)

Data: 2026-03-17  
Status: **obowiązujący standard** dla wszystkich agentów i developerów

## 1. Cel i zasada nadrzędna

Cel klonowania: **100% funkcjonalności, szybszy UX i 98% zgodności wizualnej (Visual Parity)** dla modułów panelu (`panel.salon-bw.pl`). Klonowanie 1:1 (pixel-perfect) jest wtórne i nie może blokować velocity dostarczania.

Zasada:

-   1. **Identyfikacja flow** w referencji (dane wejściowe, mutacje, wyjście),
-   2. **Komponowanie widoku** z `Panel UI Kit` (Tailwind do layoutu, stare klasy do kolorów/typografii dopasowane do SalonBW),
-   3. **Adopcja integracyjna** (routing, auth, API, mocki w MSW aby zrównoleglić pracę),
-   4. **Walidacja funkcjonalna** (E2E; testy wizualne z tolerancją odchyleń).

Nie projektujemy UX od nowa, ale brutalnie tniemy koszty dowożenia omijając precyzyjne dopasowywanie marginów i paddingów starymi klasami (RWD first).

## 2. Co wolno kopiować i gdzie

Dozwolone:

- logika zachowań UI/flow (kolejność kroków, modale, akcje),
- nazewnictwo klas i wrapperów, **tylko jeśli jest to wyabstrahowane do reużywalnego komponentu UI**,
- oryginalne pliki tłumaczeń JSON (przez słowniki np. `next-intl`), aby unikać literówek.

Miejsce docelowe:

- runtime vendor assets: `apps/panel/public/versum-vendor/*`
- komponenty/podstrony panelu: `apps/panel/src/*`
- kompatybilne aliasy URL: utrzymywane przez `apps/panel/next.config.mjs`

Niedozwolone:

- sekrety i dane produkcyjne w repo,
- wklejanie "surowego" gigantycznego kodu HTML z dumpa wprost do stron `pages/`. Widoki składamy z komponentów,
- zmiany infrastruktury „na zgadywanie”.

## 3. Obowiązkowy proces (SOP)

### Krok A — Capture referencji

#### A1 — Enumeracja stanów (przed jakimkolwiek kodem)

Dla każdego modułu zbuduj tabelę upfront:

| Route        | Stan                                  | Interakcje                       |
| ------------ | ------------------------------------- | -------------------------------- |
| `/customers` | pusty / ładowanie / wypełniony / błąd | filtr, kliknięcie wiersza, modal |
| `...`        | `...`                                 | `...`                            |

Screenshoty i kod weryfikują tę tabelę — nie zastępują jej.

#### A2 — Network capture (przed HTML/CSS)

- Otwórz DevTools → Network, wyczyść log.
- Przejdź przez każdy workflow modułu (wszystkie taby, modale, akcje).
- Zapisz: endpointy, metody HTTP, kształty payloadów i odpowiedzi.
- To jest wejście do Kroku C (API adaptery) — bez tego integrujesz w ciemno.
- Zrównoleglenie: zapisane payloady JSON wrzucamy jako mocki, aby Frontend nie musiał czekać na Backend.

#### A3 — HTML/CSS/asset snapshot

- Zbieramy HTML snapshot każdego stanu z A1.
- Zapisujemy screenshoty per stan.
- Artefakty: `docs/` lub `output/parity/<data-modul>/`.

### Krok B — Pattern-Driven Implementation

- Nie wklejamy czystego HTML z dziesiątkami starych klas "col-xs-\*". Reużywamy wyabstrahowane, dedykowane komponenty (np. `<PanelTable>`, `<PanelIcon>`) opisane w `UI_PATTERN_CATALOG.md`. Nazwa "Versum" dotyczy wyłącznie systemu źródłowego, nie naszego kodu docelowego.
- Do layoutu i układania siatek używamy **Tailwind CSS** (`flex`, `grid`, `gap`, `w-full`), aby zredukować błędy RWD i zyskać na szybkości dewelopmentu.

### Krok C — Integracja panelu

- Podpinamy routing panelu (canonical: `/calendar`, `/customers`, `/products`, ...).
- Podpinamy auth/session/cookie flow bez zmiany kontraktu bezpieczeństwa.
- Podpinamy API backendu; brakujące endpointy dopisujemy po stronie backendu.

### Krok D — Parity validation

- Sprawdzamy:
    - **Wyłącznie** parity funkcjonalne i istnienie struktury danych (E2E). Odpuszczamy "pixel-hunting" (akceptujemy różnice rzędu 10-15% przy zmianie silnika siatki),
    - parity funkcjonalne (każdy przycisk i workflow),
    - brak regresji lint/typecheck/build.

### Krok E — Rollout

- Kolejność: `api` -> `dashboard` (a potem ewentualnie pozostałe targety).
- Po deployu: smoke (`/healthz`, logowanie, krytyczne flow modułu).

## 4. Definicja „DONE 98% UI / 100% Funkcjonalności” dla modułu

Moduł jest „100%” tylko gdy wszystkie warunki są spełnione:

1. Widoki realizują 100% wymagań biznesowych pierwowzoru (zachowane ścieżki i pola, akceptowalne drobne odchylenia wizualne).
2. Wszystkie akcje z widoku referencyjnego działają (bez stubów i TODO).
3. Nawigacja między podwidokami działa identycznie.
4. API obsługuje wszystkie filtry/akcje wymagane przez UI.
5. Lint + typecheck przechodzą lokalnie.
6. Deploy production zakończony sukcesem i smoke test jest zielony.

## 5. Zasady implementacyjne (żeby nie rozjechać klonu)

- Budujemy w oparciu o komponenty z `Panel UI Kit` (zobacz: `docs/UI_PATTERN_CATALOG.md`). Wklejanie wielkich bloków zagnieżdżonych `div` (`Copy-paste`) bezpośrednio do stron `pages/` jest zakazane. Kod musi być czysty i dostosowany do SalonBW.
- Jeśli trzeba „adoptować” kod, zmieniaj minimalnie:
    - routing,
    - źródła danych/API,
    - auth/cookie compatibility.
- **ZALECAMY** używanie Tailwindowego layoutu do układania elementów na stronie, z zachowaniem oryginalnej kolorystyki i typografii Versum (z klas i zmiennych).
- `secondnav` traktujemy jako **kontekstowy**, nie statyczny:
    - musi zmieniać sekcję i zestaw linków zgodnie z aktualnym podmodułem/trasą (np. `sprzedaż`, `zużycie`, `dostawy`, `zamówienia`, karta klienta, kalendarz),
    - walidacja parity zawsze obejmuje przejścia route→secondnav (czy nawigacja boczna przełącza się identycznie jak w Versum).
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
