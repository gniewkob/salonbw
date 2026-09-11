# Indeksowanie landingu zależne od hosta, nie od pliku statycznego

- **Data:** 2026-09-11
- **Agent:** Claude Opus 5
- **Commit(y):** bieżący commit
- **PR:** #1501 (rozszerzony o tę zmianę)

## Finding

Przegląd landingu wykazał, że `apps/landing/public/robots.txt` jest plikiem
statycznym z `User-agent: * / Allow: /`, identycznym na każdym wdrożeniu.
Kanonikale i sitemapa biorą adres z `NEXT_PUBLIC_SITE_URL`, które nie było
ustawiane w `deploy.yml` — działał twardy fallback `https://salon-bw.pl`
(`src/utils/seo.ts:9`, `src/pages/sitemap.xml.ts:23`).

Skutek zmierzony na żywym `dev.salon-bw.pl`: strona jest w pełni indeksowalna,
jej kanonikale wskazują `salon-bw.pl`, a sitemapa ogłasza 10 URL-i na tej
domenie, z których 9 zwraca dziś 404 (`/services`, `/services/balayage`,
`/gallery`, `/contact`, `/policy`, `/privacy`, `/data-deletion` i pozostałe;
200 daje tylko `/`, czyli stary serwis pod `www.salon-bw.pl`).

Właściciel doprecyzował plan: `dev.` jest tymczasowe, po zakończeniu prac
landing przejdzie na `salon-bw.pl`, a `dev.` zostanie właściwym środowiskiem
deweloperskim (API zostaje bez zmian). To przesuwa ciężar problemu: same
kanonikale są zgodne z docelowym stanem, ale statyczny `Allow: /` będzie
błędny również PO cutoverze — wtedy obok produkcji stanie dev z tą samą
treścią i realnym ryzykiem duplikatów.

Stan przed zmianą, zmierzony lokalnie na zbudowanym artefakcie: `/robots.txt`
zwracał identyczne `Allow: /` dla hosta `dev.salon-bw.pl` i `salon-bw.pl`,
a odpowiedzi stron nie miały nagłówka `X-Robots-Tag`.

## Change

Decyzja o indeksowaniu przeniesiona na host, który faktycznie obsłużył
żądanie — poprawna po obu stronach cutoveru, bez kolejnej zmiany wdrożeniowej.

- Nowy `src/utils/robots.ts`: `canonicalHost`, `isCanonicalHost`,
  `buildRobotsTxt`. Host normalizowany (małe litery, bez portu); brak lub
  nieparsowalny host traktowany jako niekanoniczny, więc awaria domyka się
  w stronę „nie indeksuj".
- `public/robots.txt` usunięty (plik statyczny przesłoniłby trasę), w zamian
  `src/pages/robots.txt.ts` generuje treść per host: kanoniczny → `Allow: /`
  plus `Sitemap:`, każdy inny → `Disallow: /` bez wskazywania cudzej sitemapy.
- `src/middleware.ts` dokłada `X-Robots-Tag: noindex, nofollow` na hostach
  niekanonicznych — sam `robots.txt` nie usuwa z indeksu URL-a, do którego
  ktoś już linkuje. Przekierowania na panel bez zmian.
- `deploy.yml`: jawne `NEXT_PUBLIC_SITE_URL` w buildzie landingu
  (`vars.NEXT_PUBLIC_SITE_URL` z fallbackiem `https://salon-bw.pl`), żeby
  wartość przestała zależeć od fallbacku w kodzie. Celowo NIE jest to host
  serwujący build — inaczej dev stałby się self-canonical i indeksowalny.

## Validation

- Jednostkowo: nowy `src/__tests__/robots.test.ts` 8/8 PASS (host kanoniczny,
  wielkość liter, port, hosty obce, brak hosta, własny `siteUrl`).
- Pełny pakiet landingu: 21 zestawów / **64 testy PASS**.
- `eslint` na zmienionych plikach, `tsc --noEmit` i build produkcyjny PASS;
  build wystawia `/robots.txt` jako trasę dynamiczną (246 B).
- Na zbudowanym artefakcie, przez `Host`: `dev.salon-bw.pl` → `Disallow: /`
  i `X-Robots-Tag: noindex, nofollow` (również na `/services`);
  `salon-bw.pl` → `Allow: /` + `Sitemap: https://salon-bw.pl/sitemap.xml`
  i brak nagłówka `noindex`; nieznany host → `Disallow: /`.
  Kanonikal w HTML pozostał `https://salon-bw.pl/`, a `/dashboard` nadal
  przekierowuje 308 na panel.
- `scripts/check-ops-workflows.sh`, `check-ops-workflow-docs-consistency.sh`,
  `validate-batch-telemetry-fixtures.sh` PASS; `deploy.yml` parsuje się jako
  poprawny YAML.
- Uwaga: `src/middleware.ts` nie przechodzi `prettier --check` również w
  wersji sprzed zmiany (formatowanie `matcher`), więc formatowanie pliku
  zostawiono bez zmian zamiast mieszać do diffu nieswoje poprawki.

## Rollout

Zmiana weszła zwykłym deployem landingu: PR #1501 zmergowany jako `fb138b1c`
(squash), Deploy `34639685597` success o 19:47 UTC.

Weryfikacja na żywo 2026-09-11 20:02: `https://dev.salon-bw.pl/robots.txt`
zwraca `User-agent: *` i `Disallow: /` bez linii `Sitemap`; `/` oraz
`/services` odpowiadają 200 z nagłówkiem `X-Robots-Tag: noindex, nofollow`;
kanonikal w HTML pozostał `https://salon-bw.pl/`. Strona renderuje się
normalnie.

## Follow-up

Przy cutoverze: przenieść landing na `salon-bw.pl` — wtedy ten sam build sam
z siebie zacznie wystawiać `Allow: /` i sitemapę, a `dev.` zostanie wykluczony
bez dodatkowej zmiany. Osobno: `/policy`, `/privacy` i `/data-deletion` będą
404 na `salon-bw.pl` do momentu cutoveru, więc przeglądu Meta nie należy
zgłaszać na te adresy wcześniej.
