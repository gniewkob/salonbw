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
- CI `30401261855`: `completed/success`.
- Deploy `30401261957`: `completed/success`; detekcja odczytała pełny
  dwukomitowy zakres bez fallbacku „base commit not found”.
- MyDevil po deployu: manifest retencji obecny, katalog starego i nowego build
  ID istnieje, brak osieroconych `.next.prev.*`.
- Stary `_buildManifest.js` oraz bieżący HTML/CSS/JS: HTTP 200.
- Świeży mobilny smoke 390×844: karty po scrollu `opacity: 1`, konsola
  0 błędów/ostrzeżeń; zrzut
  `output/playwright/dev-mobile-after-deploy.png`.

## Rollout

Master `5a7a38a9`; CI `30401261855` i Deploy `30401261957` zakończone
sukcesem. Produkcyjny landing, panel i API przeszły smoke.

## Follow-up

Obserwować kolejny zwykły docs-only push: ma zakończyć się bez wdrażania
landingu, panelu i API.
