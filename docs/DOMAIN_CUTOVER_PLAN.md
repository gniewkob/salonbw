# Plan przepięcia landingu: `dev.salon-bw.pl` → `salon-bw.pl`

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
4. **`dev.salon-bw.pl` zostaje** jako środowisko podglądu z `noindex`
   (wariant domyślny) — decyzja ownera, patrz §3.4.
5. **Rollback bez utraty danych:** stara strona jest archiwizowana, a jej pliki
   zostają na serwerze (§6).

## 3. Faza 0 — przygotowanie (bez wpływu na produkcję)

### 3.1 Zmiany w kodzie (jeden PR, CI + review)

- [ ] **Middleware landingu:** host `www.salon-bw.pl` → `308/301` na
      `https://salon-bw.pl` + ta sama ścieżka i query. Test jednostkowy.
- [ ] **Mapa przekierowań starej strony** (`next.config.mjs` → `redirects()`,
      `permanent: true`) wg §3.2. Test: każdy z 54 adresów → oczekiwany cel.
- [ ] **Panel:** `pages/auth/register.tsx` ma na sztywno
      `https://dev.salon-bw.pl/privacy` i `/policy` → `NEXT_PUBLIC_SITE_URL`.
      `AuthContext.tsx` (wylogowanie) ma fallback `https://dev.salon-bw.pl` →
      `https://salon-bw.pl`.
- [ ] **Deploy panelu:** ustawić `NEXT_PUBLIC_SITE_URL=https://salon-bw.pl`
      w env buildu panelu (dziś ustawiony tylko dla landingu).
- [ ] Reguła `no-store` dla `dev.salon-bw.pl` w `next.config.mjs` — zostaje
      (dotyczy tylko `dev.`).

Te zmiany można wdrożyć **przed** przepięciem: linki panelu do regulaminu
zadziałają dopiero po przepięciu, więc wdrażamy je w tym samym oknie albo
tuż po (patrz §4, krok 7).

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
- [ ] Los `dev.salon-bw.pl`: (a) zostaje jako podgląd z `noindex` (domyślnie),
      (b) 301 → `salon-bw.pl`.
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
4. **Deploy landingu na nowy cel:** zmienne repo
   `MYDEVIL_PUBLIC_REMOTE_PATH_PRODUCTION` → katalog `salon-bw.pl`
   (np. `domains/salon-bw.pl/public_nodejs`) i
   `MYDEVIL_PUBLIC_APP_NAME_PRODUCTION` → `salon-bw.pl`; potem
   `gh workflow run deploy.yml -r master -F ref=master -F target=landing`.
   Zanotować stare wartości (rollback).
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
   - `https://dev.salon-bw.pl/` dalej z `noindex` (wariant a).
6. **Logi:** `~/domains/salon-bw.pl/logs/error.log` i Passenger — brak błędów.
7. **Panel:** deploy zmian z §3.1 (linki do regulaminu, wylogowanie) —
   sprawdzić, że rejestracja w panelu linkuje do `https://salon-bw.pl/policy`.

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

1. Przywrócić stare wartości `MYDEVIL_PUBLIC_*_PRODUCTION` (landing znów
   deployuje się na `dev.`).
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
