# Mobilny CSS landingu i bezpieczny deploy statyków

- **Data:** 2026-07-28
- **Agent:** Codex
- **Commit(y):** ten commit
- **PR:** brak

## Finding

Świeża sesja produkcyjna 390×844 pobierała HTML, CSS, fonty i chunki bez błędów:
34/34 żądania miały HTTP 200, a karty usług pojawiały się po przewinięciu.
MyDevil zawierał jednak tylko bieżący hash CSS i zero poprzednich katalogów
`.next`.

Run deployu `30398395931` dostał dwukomitowy push. Checkout z
`fetch-depth: 2` nie zawierał `github.event.before`, więc zwykły push został
uznany za force-push i niepotrzebnie wdrożył landing. Ekstrakcja przenosiła
bieżące `.next`, a po rozpakowaniu natychmiast usuwała poprzednie hashe. Karta
otwarta w tym oknie mogła pozostać bez CSS/JS aż do ponownego załadowania.

## Change

- Pełny checkout oraz wersjonowany `scripts/ci/detect-deploy-changes.sh`
  obsługują cały zakres wielocommitowego pushu.
- `scripts/mydevil/extract-frontend-bundle.sh` waliduje ścieżkę docelową,
  przywraca poprzedni runtime po błędzie i zachowuje assety bieżącego oraz
  bezpośrednio poprzedniego buildu.
- Ten sam ekstraktor obsługuje landing i panel.

## Validation

- Test fail-first: brak helpera detekcji kończył się kodem 127.
- Test retencji fail-first: poprzednia implementacja kopiowała także zbyt stare
  assety.
- `scripts/test-frontend-deploy-scripts.sh`: zielony; obejmuje dwukomitowy
  docs-only push, zmianę helpera frontendu, retencję jednej generacji, cleanup
  i odrzucenie zbyt szerokiej ścieżki.
- `bash -n` dla trzech skryptów: exit 0.
- Rzeczywisty zakres `cf302831..55ae05dc`: tylko `api=true`, landing i panel
  `false`.
- Mobilne zrzuty przed zmianą:
  `output/playwright/dev-mobile-production.png` oraz
  `output/playwright/dev-mobile-services-scrolled.png`.

## Rollout

Oczekuje na commit, push oraz końcową weryfikację CI/deploy i mobilnego
landingu.

## Follow-up

Po zielonym deployu potwierdzić bieżący i poprzedni asset CSS na MyDevil oraz
ponowić mobilny smoke w świeżej sesji.
