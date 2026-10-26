# Plan przepięcia landingu: `dev.salon-bw.pl` → `salon-bw.pl`

**Status 2026-10-26: przepięcie wykonane za zgodą ownera.** Poniższy plan
zachowuje stan sprzed zmiany i procedurę rollbacku. Aktywna topologia:
produkcja `salon-bw.pl` / `panel.salon-bw.pl` / `api.salon-bw.pl`, development
`dev.salon-bw.pl` / `dev-panel.salon-bw.pl` / `dev-api.salon-bw.pl`, z osobną
bazą i bramką dostępu. Trzy adresy prawne, App Domain i Site URL aplikacji
Meta zapisano i ponownie odczytano na domenie kanonicznej. Aktualne dowody
wdrożenia: [journal](journal/2026-10-25-isolated-environments.md).

_Wersja 2026-10-24. Zakres: tylko landing marketingowy. `panel.salon-bw.pl`
i `api.salon-bw.pl` zostają bez zmian._
Uzupełnia: [`DEPLOYMENT_MYDEVIL.md` §1a](DEPLOYMENT_MYDEVIL.md) i
[`RELEASE_CHECKLIST.md` §5](RELEASE_CHECKLIST.md) (bramka Meta).

**Decyzja o terminie i zgoda na wyłączenie starej strony należą do ownera.**
Ten plan nie jest zgodą na przepięcie.

---

## 1. Stan obecny (zweryfikowany 2026-10-24)

| Host | Co serwuje | Uwagi |
|---|---|---|
| `salon-bw.pl` | 301 → `https://www.salon-bw.pl/` | `http://` → `https://` działa |
| `www.salon-bw.pl` | **stara strona PHP 8.1** (kanoniczna, indeksowana) | `robots.txt` Allow, `sitemap.xml` z 54 adresami |
| `dev.salon-bw.pl` | nowy landing (Next.js, Passenger) | `X-Robots-Tag: noindex`; tylko tu działają `/privacy`, `/policy`, `/data-deletion` |
| `panel.` / `api.` | panel / API | bez zmian |

DNS: wszystkie hosty → `212.91.26.153` (MyDevil); NS `dns1/dns2.mydevil.net`;
MX `mail0.mydevil.net`; SPF `v=spf1 mx a include:mail0.mydevil.net -all`.
**Przepięcie nie wymaga zmian w DNS** — poczta `kontakt@salon-bw.pl` nie jest
dotykana. Cała zmiana dzieje się w konfiguracji stron MyDevil i w deployu.

Nowy landing jest już przygotowany: canonical, sitemap i reguła indeksowania
wskazują `https://salon-bw.pl` (`NEXT_PUBLIC_SITE_URL`, `utils/robots.ts`,
middleware ustawia `noindex` na każdym hoście innym niż kanoniczny).

## 2. Strategia

1. **Bez DNS.** Na MyDevil strona `salon-bw.pl` zmienia typ z PHP na Node.js
   (Passenger) i dostaje build landingu — ten sam, który dziś działa na `dev.`.
2. **Kanoniczny host bez `www`** (tak jest zbudowany landing). `www.` → 301 na
   `https://salon-bw.pl` — odwrotnie niż dziś.
3. **Zachowanie pozycji w Google:** każdy z 54 starych adresów dostaje 301 na
   najbliższą nową stronę (mapa w §3.2). Bez tego Google zobaczy 404.
4. **Dwa środowiska landingu (decyzja ownera 2026-10-25):**
   `salon-bw.pl` = **produkcja**, `dev.salon-bw.pl` = **development / testy**
   (stałe, z `noindex`). Panel i API pozostają jednym środowiskiem
   produkcyjnym — `dev.` korzysta z produkcyjnego API (patrz §2a).
5. **Rollback bez utraty danych:** stara strona jest archiwizowana, a jej pliki
   zostają na serwerze (§6).

## 2a. Model wdrażania landingu (dev → produkcja)

| | `dev.salon-bw.pl` (development) | `salon-bw.pl` (produkcja) |
|---|---|---|
| Kiedy dostaje build | automatycznie przy każdym pushu na `master` ze zmianą landingu | ręcznie: `workflow_dispatch` z SHA sprawdzonym na `dev.` („promocja”) |
| Indeksowanie | `noindex` (middleware, już działa) | dozwolone |
| API / panel | produkcyjne `api.` / `panel.` | produkcyjne `api.` / `panel.` |
| Zmienne MyDevil | `MYDEVIL_PUBLIC_*_STAGING` | `MYDEVIL_PUBLIC_*_PRODUCTION` |

**Wymagana zmiana w `deploy.yml` (osobny krok, do akceptacji):** dziś push na
`master` uruchamia job w środowisku `production`, a landing idzie do
`MYDEVIL_PUBLIC_*_PRODUCTION`, które wskazują na `dev.`. Po rozdzieleniu:

- push na `master` → landing do celu **development** (`*_STAGING` → `dev.`),
  panel i API jak dziś do produkcji;
- `workflow_dispatch target=landing environment=production ref=<SHA>` →
  landing do `salon-bw.pl` (`*_PRODUCTION`);
- produkcja landingu nigdy nie dostaje builda automatycznie.

**Zasada: zachować obecny automat deployu** (wymóg ownera). Bez zmian
zostają: rozwiązywanie celu w kroku `Resolve deploy destination`
(`MYDEVIL_PUBLIC_REMOTE_PATH_*` / `MYDEVIL_PUBLIC_APP_NAME_*`), bramka
`wait-for-ci-success`, wykrywanie zmian przy pushu, upload z timeoutem,
`extract-frontend-bundle.sh` z rollbackiem, restart Passengera i smoke testy.
Zmienia się wyłącznie to, **który zestaw zmiennych** (development czy
produkcja) dostaje landing w danym uruchomieniu — jedno miejsce w resolverze.

Promocja na produkcję — do wyboru przez ownera (oba warianty automatyczne,
bez ręcznego podawania ścieżek):

- **A. Przycisk:** `Run workflow` w GitHub Actions (`target=landing`,
  `environment=production`, `ref=<SHA z dev.>`). Najprostsze, zero nowych
  wyzwalaczy.
- **B. Tag (rekomendacja):** push tagu `landing-v*` na sprawdzony commit →
  workflow sam deployuje landing na `salon-bw.pl`. Historia wersji
  produkcji jest w tagach, rollback = deploy poprzedniego tagu.

Ponieważ `dev.` używa produkcyjnego API, testy na `dev.` mogą zapisywać
prawdziwe dane (np. rezerwacje). Testować na koncie testowym, jak w UAT.

**Zanim zmienimy `deploy.yml`** — owner podaje obecne wartości:
```
gh variable list --repo gniewkob/salonbw | grep -i -E 'PUBLIC|SITE|LANDING'
gh variable list --repo gniewkob/salonbw --env production | grep -i -E 'PUBLIC|SITE|LANDING'
gh variable list --repo gniewkob/salonbw --env staging | grep -i -E 'PUBLIC|SITE|LANDING'
```

## 3. Faza 0 — przygotowanie (bez wpływu na produkcję)

### 3.1 Zmiany w kodzie (jeden PR, CI + review)

- [x] **Middleware landingu:** host `www.salon-bw.pl` → 301 na
      `https://salon-bw.pl` + ta sama ścieżka i query
      (`apps/landing/src/utils/legacyRedirects.ts`, `middleware.ts`).
- [x] **Mapa przekierowań starej strony** wg §3.2 — w middleware, jedno
      przekierowanie także z `www.` (np. `www…/kontakt` → `/contact`).
      Test: każdy z 53 adresów sitemapy (poza `/`) ma cel istniejący w nowym
      serwisie, nowe trasy nie są przekierowywane.
- [x] **Panel:** linki do Polityki prywatności i Regulaminu oraz cel po
      wylogowaniu biorą adres z `NEXT_PUBLIC_LANDING_URL`
      (`apps/panel/src/utils/landingUrl.ts`). Celowo NIE z
      `NEXT_PUBLIC_SITE_URL` — panel używa go w `absUrl()` dla własnych
      adresów (galeria zdjęć).
- [x] **Deploy panelu:** `NEXT_PUBLIC_LANDING_URL` =
      `vars.LANDING_PUBLIC_URL || 'https://dev.salon-bw.pl'` — do przepięcia
      zachowanie się nie zmienia; przy przepięciu ustawić zmienną repo
      `LANDING_PUBLIC_URL=https://salon-bw.pl` i przebudować panel (§4, krok 7).
- [x] Reguła `no-store` dla `dev.salon-bw.pl` w `next.config.mjs` — zostaje
      (dotyczy tylko `dev.`).
- [ ] **`deploy.yml`: rozdzielenie dev / produkcja landingu** wg §2a —
      po podaniu obecnych wartości zmiennych przez ownera.

Zmiany oznaczone [x] są bezpieczne przed przepięciem: przekierowania działają
tylko na adresach starej strony i hoście `www.` (dziś obsługiwanym przez PHP),
a panel dalej linkuje do `dev.`.

### 3.2 Mapa 301 starej strony (do akceptacji ownera)

Stara strona ma treści, których nowy landing nie ma (kosmetyka, paznokcie,
solarium, karta podarunkowa, news). **Owner decyduje**, czy te usługi są
nadal w ofercie; jeśli nie — kierujemy na `/services` (nie 404).

| Stare adresy | Cel |
|---|---|
| `/`, `/start` | `/` |
| `/o-nas` | `/#o-nas` lub `/` |
| `/kontakt`, `/modals/adres`, `/modals/godziny` | `/contact` |
| `/modals/rezerwacja` | `https://panel.salon-bw.pl/booking` |
| `/uslugi-fryzjerskie`, `/cennik-fryzjerstwo-damskie`, `/cennik-fryzjerstwo-meskie` | `/services` |
| `/uslugi-fryzjerskie/baleyage` | `/services/balayage` |
| `/uslugi-fryzjerskie/koloryzacja`, `/dekoloryzacja` | `/services/coloring` |
| pozostałe `/uslugi-fryzjerskie/*` (17) | `/services` |
| `/uslugi-kosmetyczne`, `/uslugi-kosmetyczne/*` (18), `/cennik-kosmetyka` | `/services` (lub 410, jeśli oferta wycofana) |
| `/stylizacja-paznokci`, `/cennik-stylizacja-paznokci` | `/services` (lub 410) |
| `/rytualy-kerastase`, `/kosmetyki-revitalash`, `/pakiety-slubne`, `/solarium`, `/karta-podarunkowa` | `/services` |
| `/news`, `/posts/*` | `/` lub `/gallery` |

### 3.3 Konfiguracja (bezpieczna do zrobienia wcześniej)

- [ ] **CORS API:** dopisać `https://salon-bw.pl` (i `https://www.salon-bw.pl`)
      do sekretu `FRONTEND_URL` (dziś: `dev.` + `panel.`). Zmiana addytywna;
      deploy API. `COOKIE_DOMAIN=salon-bw.pl` już obejmuje domenę główną.
- [ ] **Inwentaryzacja serwera** (owner, terminal):
      ```
      ssh devil 'devil www list; ls -la ~/domains/salon-bw.pl; devil ssl www list; devil mysql list 2>/dev/null; devil www --help 2>&1 | head -30'
      ```
      Ustalić: typ strony `salon-bw.pl`, czy `www.` to osobna strona czy
      alias, gdzie leżą pliki PHP, czy jest baza MySQL, jakie certyfikaty.
      **Dokładną składnię `devil www del/add` i `devil ssl` potwierdzić
      z `--help` przed oknem** — komendy w §4 są wzorcem, nie zostały
      wykonane na tym koncie.
- [ ] **Kopia starej strony:** archiwum plików (`tar` katalogu domeny) + zrzut
      bazy MySQL (jeśli jest) do `~/backups/legacy-salon-bw-<data>/` oraz
      kopia na komputer ownera.
- [ ] Zrzut `sitemap.xml` starej strony i lista adresów z Google Search Console
      (Skuteczność → Strony) — uzupełnić mapę §3.2 o adresy spoza sitemapy.

### 3.4 Decyzje ownera przed oknem

- [ ] Termin okna (rekomendacja: niedziela wieczór — salon zamknięty, mały ruch).
- [ ] Mapa §3.2 (zwłaszcza: kosmetyka/paznokcie/solarium — 301 czy 410).
- [x] Los `dev.salon-bw.pl`: zostaje jako development / testy z `noindex`
      (decyzja ownera 2026-10-25, §2a).
- [ ] Akceptacja zmiany `deploy.yml` wg §2a (push → `dev.`, produkcja ręcznie).
- [ ] Zgoda na wyłączenie starej strony PHP (pliki zostają w archiwum).

## 4. Faza 1 — okno przepięcia (ok. 30–60 min, przerwa landingu kilka minut)

Panel i API działają przez cały czas. Klientki rezerwują w panelu.

1. **Stan wyjściowy:** `curl -sI https://www.salon-bw.pl/` (200),
   `https://api.salon-bw.pl/healthz` (ok), kopia z §3.3 potwierdzona.
2. **Zmiana typu strony na MyDevil** (wzorzec — składnia z `--help`):
   ```
   devil www del salon-bw.pl            # BEZ opcji usuwania plików
   devil www add salon-bw.pl nodejs /usr/local/bin/node22 production
   ```
   Jeśli `www.salon-bw.pl` jest osobną stroną — skonfigurować ją tak, by
   trafiała do tej samej aplikacji (alias) albo przekierowywała na
   `https://salon-bw.pl` po stronie MyDevil.
3. **Certyfikat TLS** dla `salon-bw.pl` i `www.salon-bw.pl` (Let's Encrypt
   przez `devil ssl www add …`), jeśli usunięcie strony go zdjęło.
4. **Deploy landingu na produkcję:** zanotować stare wartości (rollback),
   ustawić `MYDEVIL_PUBLIC_REMOTE_PATH_PRODUCTION` → katalog `salon-bw.pl`
   (np. `domains/salon-bw.pl/public_nodejs`) i
   `MYDEVIL_PUBLIC_APP_NAME_PRODUCTION` → `salon-bw.pl`; `*_STAGING` → `dev.`
   (po zmianie `deploy.yml` z §2a). Potem promocja SHA sprawdzonego na `dev.`:
   `gh workflow run deploy.yml -r master -F ref=<SHA> -F target=landing -F environment=production`.
5. **Smoke test** (z przeglądarki prywatnej i curl):
   - `https://salon-bw.pl/` 200, brak `X-Robots-Tag: noindex`,
     `<link rel="canonical" href="https://salon-bw.pl/…">`;
   - `https://www.salon-bw.pl/` i `http://salon-bw.pl/` → 301 na
     `https://salon-bw.pl/`;
   - `/privacy`, `/policy`, `/data-deletion` 200 bez logowania;
   - `/robots.txt` pozwala indeksować, `/sitemap.xml` z adresami `salon-bw.pl`;
   - 5–10 starych adresów z §3.2 → 301 na właściwe strony;
   - przycisk „Umów wizytę” → panel, logowanie i rezerwacja działają;
   - galeria Instagrama i godziny otwarcia ładują się (CORS z §3.3);
   - `https://dev.salon-bw.pl/` dalej działa, z `noindex`; następny push na
     `master` ze zmianą landingu trafia na `dev.`, nie na `salon-bw.pl`.
6. **Logi:** `~/domains/salon-bw.pl/logs/error.log` i Passenger — brak błędów.
7. **Panel:** ustawić zmienną repo `LANDING_PUBLIC_URL=https://salon-bw.pl`
   i przebudować panel (`target=panel environment=production`); sprawdzić,
   że rejestracja linkuje do `https://salon-bw.pl/policy` i `/privacy`,
   a wylogowanie prowadzi na `https://salon-bw.pl/`.

## 5. Faza 2 — po przepięciu (ten sam dzień / kolejne dni)

- [ ] **Meta / Instagram:** zapisać URL-e prawne na `salon-bw.pl`
      wg [`RELEASE_CHECKLIST.md` §5](RELEASE_CHECKLIST.md) i sprawdzić je
      z sesji niezalogowanej. Bez przekierowań z `dev.`.
- [ ] **Google Search Console:** właściwość domeny `salon-bw.pl` (DNS TXT
      w MyDevil) → zgłosić `https://salon-bw.pl/sitemap.xml`; sprawdzić
      raport stron po 1–2 tygodniach (404 → uzupełnić mapę §3.2).
- [ ] **Wizytówka Google, Booksy, bio Instagrama, Facebook:** link do strony →
      `https://salon-bw.pl`.
- [ ] Przeszukać repo i konfigurację runtime pod kątem `dev.salon-bw.pl`;
      zostawić tylko świadome wyjątki (reguły `noindex`/`no-store`, testy).
- [ ] Aktualizacja `CLAUDE.md` §1/§4, `DEPLOYMENT_MYDEVIL.md`,
      `PROJECT_STATE.md`, wpis w `docs/journal/`.
- [ ] Monitoring przez tydzień: `/healthz`, Sentry landingu, logi 404.

## 6. Rollback

Warunek: przepięcie nie przechodzi smoke testu z §4.5, a poprawka nie jest
oczywista w kilka minut.

1. Przywrócić stare wartości `MYDEVIL_PUBLIC_*_PRODUCTION` i usunąć
   `LANDING_PUBLIC_URL` (panel wraca do linków na `dev.`); przebudować panel.
2. `devil www del salon-bw.pl` (typ Node.js) i ponownie dodać stronę PHP
   wskazującą na zachowane pliki; przywrócić certyfikat.
3. Jeśli pliki/baza ucierpiały — odtworzyć z archiwum §3.3.
4. Sprawdzić `https://www.salon-bw.pl/` (200, stara strona) i `dev.` (landing).

Do czasu udanej weryfikacji **nie zmieniać** URL-i w Meta, Search Console ani
wizytówce — rollback jest wtedy niewidoczny dla świata.

## 7. Ryzyka

| Ryzyko | Mitygacja |
|---|---|
| Utrata pozycji w Google (54 stare adresy) | Mapa 301 §3.2, sitemap w Search Console, kontrola 404 |
| Utrata starej strony | Archiwum plików + bazy przed oknem; usuwanie strony bez kasowania plików |
| Poczta na `salon-bw.pl` | Brak zmian DNS/MX; po oknie wysłać i odebrać testowego maila |
| Błędy CORS (galeria, godziny, najbliższy termin) | `FRONTEND_URL` uzupełniony przed oknem |
| Brak TLS na `salon-bw.pl` po zmianie typu | Certyfikat w kroku §4.3, test `https://` w smoke teście |
| Duplikat treści `dev.` vs `salon-bw.pl` | `noindex` na `dev.` (już działa) |
| Limit procesów MyDevil (kolejna aplikacja Node) | Sprawdzić limit przed oknem; ew. ograniczyć procesy `dev.` |
| Nieprzetestowane komendy `devil` | `--help` i inwentaryzacja w Fazie 0 |

## 8. Kryterium zakończenia

- `https://salon-bw.pl` serwuje zaakceptowany landing, canonical =
  `salon-bw.pl`, indeksowanie dozwolone; `www.` i `http://` → 301.
- 3 strony prawne 200 publicznie; Meta zapisane i sprawdzone.
- Stare adresy → 301, brak skoku 404 w Search Console po 2 tygodniach.
- Panel i API bez zmian i bez błędów; poczta działa.
- Dokumentacja i journal zaktualizowane.
