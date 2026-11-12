# Plan kontrolowanej walidacji DEV — bezpieczne wydanie panelu (#1663)

- **Status:** PROPOZYCJA — **wymaga zgody Product Ownera przed jakąkolwiek operacją na hoście.**
- **Cel:** jednym, krótkim i odwracalnym eksperymentem na `panelbw_dev` (`dev-panel.salon-bw.pl`) odpowiedzieć na pytania, których mock nie rozstrzyga (`docs/SAFE_RELEASE_DESIGN.md` §7).
- **Poza zakresem:** produkcja, landing, API, zmiana `deploy.yml`, zmiana konfiguracji MyDevil (`devil www options`, nowe domeny), restart innych aplikacji, akcje na procesach spoza eksperymentu, baza danych.
- **Zasada przewodnia:** ten sam SHA co aktualnie serwowany na DEV — zmienia się wyłącznie układ katalogów, nie kod. Każda różnica w zachowaniu wynika więc z mechanizmu wydania.

## 1. Pytania, na które eksperyment ma odpowiedzieć

| # | Pytanie | Dowód rozstrzygający |
|---|---|---|
| Q1 | Czy `npm22 ci --omit=dev --ignore-scripts` z lockfile działa na FreeBSD w nieaktywnym katalogu? | exit 0, `verify` PASS |
| Q2 | Ile RAM i czasu zużywa ta instalacja na koncie współdzielonym? | szereg próbek RSS co 5 s, czas trwania |
| Q3 | Czy Passenger po `devil www restart` uruchamia aplikację z release wskazanego przez łańcuch symlinków `public_nodejs → …/current → releases/<sha>`? | `cwd` nowego workera = katalog release, marker układu = 200 |
| Q4 | Czy Next 15 działa z symlinkowanym `node_modules` na FreeBSD? | brak `MODULE_NOT_FOUND`, strona logowania 200, `/__release.json` = SHA |
| Q5 | Czy powrót do obecnego układu (A→B→A na poziomie dostawcy) jest natychmiastowy i czysty? | `cwd` = oryginalny katalog, marker = 404 |
| Q6 | Czy runtime zapisuje pliki w katalogu aplikacji (łamiąc niezmienność release)? | `find -newer` przed/po; `verify` po aktywacji |

## 2. Role i zgody

| Rola | Odpowiedzialność |
|---|---|
| Product Owner | Zgoda na zakres, okno czasowe i kryteria przerwania — **zapisana w #1663 przed fazą 1** (nazwane ścieżki, nazwane operacje). |
| Operator (właściciel, SSH + Basic auth DEV) | Wykonuje komendy z własnego terminala; jedyna osoba dotykająca hosta. |
| Agent | Przygotowuje Gate 0 (kod), skrypt próbkujący i lockfile; analizuje wyniki; nie wykonuje SSH bez osobnej, jawnej zgody na daną fazę. |

## 3. Gate 0 — przed oknem (bez dostępu do hosta)

1. **Zmiany w prototypie (osobny commit w PR #1664, z testami):**
   - jawny przełącznik eksperymentu: `--allow-dev-experiment` dopuszcza **wyłącznie** root `/usr/home/vetternkraft/apps/nodejs/panelbw_dev.releases` (prototyp domyślnie odmawia całego konta);
   - komenda `point --name current --sha <sha>` (atomowe `rename(2)`, tylko wewnątrz rootu release);
   - opcja jawnej listy ścieżek zapisywalnych przez runtime, wyłączonych z hasha (domyślnie pusta; wypełniana dopiero na podstawie wyniku Q6).
2. CI PR #1664 zielone dla dokładnego SHA, review przeprowadzone.
3. Lockfile: z manifestu panelu dla **aktualnie wdrożonego SHA** (ten sam `sed` i usunięcie `devDependencies` co w `deploy.yml`), `npm install --package-lock-only --omit=dev --ignore-scripts`, potem `safe-release.mjs check-lock` → PASS. Generowany na Macu.
4. Skrypt próbkujący (`sample-rss.sh`): co 5 s zapisuje UTC, sumę RSS konta i RSS w kategoriach `npm`, `panel-worker`, `api-worker`, `inne`. **Nie zapisuje pełnych linii poleceń ani zmiennych środowiska.** Wynik do `~/.deployment-private/safe-release-dev/` (0700).
5. Zamrożenie deployów staging na czas okna (brak `workflow_dispatch` dla `staging`); informacja w #1663.
6. Okno: pora niskiego ruchu, ~60 min, operator dostępny do końca.

## 4. Kryteria przerwania (obowiązują w każdej fazie)

| Sygnał | Działanie |
|---|---|
| Suma RSS konta > **70%** limitu przed startem fazy | nie zaczynać fazy |
| Suma RSS konta > **85%** w trakcie `npm22 ci` | przerwać **wyłącznie** własny proces npm (SIGTERM, PID z fazy 2), usunąć `deps/.staging-*` |
| Brak miejsca: < 2 GiB wolnej kwoty przed fazą 2 | nie zaczynać fazy 2 |
| `devil www restart` zwraca błąd | **nie** używać fallbacku `tmp/restart.txt` (zapisałby do release) → natychmiast faza 4 (powrót) |
| Healthcheck po aktywacji niezgodny w ciągu 60 s lub błąd 5xx | natychmiast faza 4 |
| Restart innej aplikacji / alarm dostawcy | natychmiast faza 4, eskalacja do PO |
| Jakakolwiek niejasność | powrót do stanu wyjściowego, nie improwizować |

## 5. Fazy

### Faza 1 — rozpoznanie tylko do odczytu (~15 min)
Nic nie jest tworzone ani zmieniane. Zbierane wyłącznie wartości nie-wrażliwe:

```bash
freebsd-version; uname -m; node22 -v; npm22 -v
readlink ~/domains/dev-panel.salon-bw.pl/public_nodejs          # oczekiwane: …/apps/nodejs/panelbw_dev
cat ~/apps/nodejs/panelbw_dev/public/__release.json               # SHA bieżącego DEV (bez sekretów)
ls -A ~/apps/nodejs/panelbw_dev                                    # tylko nazwy
ls -ld ~/apps/nodejs/panelbw_dev/tmp ~/apps/nodejs/panelbw_dev/.next/cache 2>&1
find ~/apps/nodejs/panelbw_dev -newer ~/apps/nodejs/panelbw_dev/.next/BUILD_ID \
  -not -path '*/node_modules/*' -not -name '.env*' | head -50     # Q6: co zapisuje runtime
df -h ~; quota 2>/dev/null
ps -U vetternkraft -o pid,ppid,rss,etime,comm                      # baseline (bez argumentów)
procstat -b <PID workera panelbw_dev>                              # który binarny Node uruchamia Passenger
procstat -f <PID workera panelbw_dev> | grep cwd                   # bieżący katalog roboczy workera
```

**Go/No-go:** Node Passengera = `node22` z tym samym ABI co CLI (inaczej fingerprint byłby liczony dla złego runtime → STOP); kwota dyskowa wystarczająca; RSS < 70%; wynik Q6 przeanalizowany (jeśli runtime pisze do katalogu aplikacji — dopisać te ścieżki do listy wyłączeń z Gate 0 i dopiero wtedy kontynuować).

### Faza 2 — przygotowanie w nieaktywnym katalogu (~20 min)
Tworzy wyłącznie nowe katalogi; działająca aplikacja nie jest dotykana.

1. `mkdir -p ~/apps/nodejs/panelbw_dev.releases/shared && chmod 700` tych katalogów; skopiować `safe-release.mjs` do `~/.deployment-private/safe-release-dev/` (0700).
2. Konfiguracja: `install -m 600 ~/apps/nodejs/panelbw_dev/.env.runtime.json ~/apps/nodejs/panelbw_dev.releases/shared/.env.runtime.json` (kopiowanie, bez wyświetlania treści).
3. Artefakt z bieżącego katalogu (ten sam kod), bez `node_modules`, `.env*`, `tmp`, `.diagnostics`, `.next/cache`, `*.prev.*`, `deploy.tar.gz`; dodać przesłany `package-lock.json` i marker `public/__layout.json` (`{"layout":"releases"}` — plik statyczny, jedyna różnica treści); `sha256 -q` archiwum.
4. Start próbkowania; `NODE_OPTIONS=--max-old-space-size=512 node22 safe-release.mjs prepare --allow-dev-experiment --root … --allowed-root /usr/home/vetternkraft --sha <SHA> --archive … --archive-sha256 … --shared .env.runtime.json --npm npm22`.
5. `verify` → PASS. Zapisać: czas, szczyt RSS, rozmiar `deps/<fp>` i `releases/<sha>`.
6. Drugie `prepare` tego samego SHA → `already-prepared`, 0 operacji npm (potwierdzenie reużycia na hoście).

**Wycofanie fazy 2:** `rm -rf ~/apps/nodejs/panelbw_dev.releases` (wyłącznie katalog utworzony w tej fazie). Odpowiedzi Q1/Q2 są już zebrane, nawet jeśli dalsze fazy zostaną odwołane.

### Faza 3 — aktywacja (~10 min, punkt bez powrotu nie istnieje)
1. Zapisać oryginalny cel: `readlink ~/domains/dev-panel.salon-bw.pl/public_nodejs > ~/.deployment-private/safe-release-dev/original-link`.
2. `point --name current --sha <SHA>`.
3. Atomowa podmiana linku domeny (BSD `mv -h` nie podąża za symlinkiem do katalogu):
   ```bash
   cd ~/domains/dev-panel.salon-bw.pl
   ln -s /usr/home/vetternkraft/apps/nodejs/panelbw_dev.releases/current public_nodejs.new
   mv -h public_nodejs.new public_nodejs
   ```
4. `devil www restart dev-panel.salon-bw.pl` (bez fallbacku `restart.txt`).
5. Weryfikacja (≤ 60 s): `/__layout.json` = 200 (Basic auth), `/__release.json.sha` = SHA, `/auth/login` = 200, `procstat -f <nowy PID> | grep cwd` = `…/releases/<SHA>`, brak `MODULE_NOT_FOUND`/5xx w `~/logs/nodejs/…` (tylko grep nazw błędów, bez kopiowania logów).
6. Obserwacja 5 min z próbkowaniem; `verify` ponownie (Q6 — czy runtime coś zapisał w release).

### Faza 4 — powrót do stanu wyjściowego (~5 min, wykonywana ZAWSZE)
```bash
cd ~/domains/dev-panel.salon-bw.pl
ln -s "$(cat ~/.deployment-private/safe-release-dev/original-link)" public_nodejs.orig
mv -h public_nodejs.orig public_nodejs
devil www restart dev-panel.salon-bw.pl
```
Weryfikacja: `/__layout.json` = 404, `/__release.json.sha` = ten sam SHA, `cwd` workera = `apps/nodejs/panelbw_dev`, `/auth/login` = 200. **Stan końcowy musi być identyczny z wyjściowym** — inaczej następny deploy zatrzyma się na kontroli `ensure-app-symlink.sh` (to jest zabezpieczenie, nie usterka).

### Faza 5 — porządek i dowody (~10 min)
- Zatrzymać próbkowanie; odmrozić deploye staging.
- Katalog `panelbw_dev.releases`: decyzja PO — usunąć albo zachować do kolejnej iteracji (nie jest używany przez runtime).
- Komentarz w #1663 (zanonimizowany): wersje, odpowiedzi Q1–Q6, czas i szczyt RSS instalacji, porównanie z odczytem z 2026-11-07, rozmiary, odchylenia od planu. Bez linii poleceń procesów, ścieżek do sekretów, treści logów i wartości konfiguracji.

## 6. Kryteria sukcesu
- Q1, Q3, Q4, Q5 = TAK; Q2 zmierzone z rozdzielczością ≤ 5 s i bez przekroczenia 85%.
- Faza 4 przywraca dokładnie stan wyjściowy.
- Żadna inna aplikacja nie została zrestartowana ani zmieniona.

## 7. Wynik → decyzja
| Wynik | Następny krok |
|---|---|
| Wszystko TAK | Projekt integracji z `deploy.yml` dla DEV (lockfile na runnerze, `prepare` przez SSH, aktywacja przez link domeny, aktualizacja `ensure-app-symlink.sh`/`staging-release-snapshot.sh`), osobny PR i osobna zgoda. |
| Q3 = NIE (Passenger cache'uje katalog) | Alternatywa: aktywacja przez podmianę samego `apps/nodejs/panelbw_dev` na symlink lub przez `devil` — ponowna analiza, bez kolejnego eksperymentu bez zgody. |
| Q1/Q4 = NIE | Diagnoza natywnych zależności/npm na FreeBSD; prototyp pozostaje niezintegrowany. |
| Q6 = runtime pisze do release | Lista wyłączeń lub katalog zapisywalny poza release, przed integracją. |
| Q2 > 85% | Ograniczenia npm (`--maxsockets`, limit pamięci, okno czasowe) przed jakąkolwiek integracją. |
