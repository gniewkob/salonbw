# Bezpieczne wydanie frontendu — PREPARE → VALIDATE → ACTIVATE → VERIFY → ROLLBACK

- **Status:** prototyp izolowany (issue [#1663](https://github.com/gniewkob/salonbw/issues/1663)). **Nie** jest podłączony do `deploy.yml`; obecny deploy działa bez zmian.
- **Kod:** `scripts/ci/safe-release.mjs` (biblioteka + CLI bez aktywacji), testy `scripts/ci/safe-release*.test.mjs`.
- **Zakres:** panel staging (DEV). Produkcja poza zakresem do czasu walidacji na DEV i decyzji Product Ownera.

## 1. Problem (zweryfikowany w kodzie `master`)

| # | Defekt | Miejsce |
|---|---|---|
| 1 | `node_modules` jest na liście podmienianych części i jest usuwane po ekstrakcji | `scripts/mydevil/extract-frontend-bundle.sh` (`parts`, końcowe `rm -rf`) |
| 2 | Bundle nie zawiera lockfile ani zainstalowanych zależności | `deploy.yml`, krok „Upload frontend bundle (panel)” |
| 3 | Każdy deploy = `npm install --omit=dev --no-package-lock` **w katalogu działającej aplikacji** | `deploy.yml`, „Install dependencies (frontend panel)” |
| 4 | Między ekstrakcją a końcem instalacji (~30–40 s) działające workery Passengera widzą nowe pliki i brak/niepełne `node_modules` | sekwencja extract → install → restart |
| 5 | Wersje tranzytywne nie są przypięte (brak lockfile) | `--no-package-lock` |

Odczyt RAM 112,04% (2026-11-07 21:13:24 UTC) wypadł w ostatniej sekundzie zdalnego `npm install`. To **korelacja czasowa**, nie atrybucja per-proces — nowa architektura nie jest dowodem usunięcia tego skoku.

## 2. Architektura

```
<root>/                         np. przyszłe ~/apps/nodejs/panelbw_dev.releases (NIE w prototypie)
  releases/<sha40>/             niezmienne po zapisaniu release.json (marker READY)
    node_modules -> ../../deps/<fingerprint>/node_modules
    .env.runtime.json           prywatna KOPIA (0600) z shared/, nie symlink
  releases/.staging-*           przygotowanie; nigdy nie jest celem wskaźnika
  deps/<fingerprint>/           zweryfikowany zestaw zależności + READY.json
  deps/.staging-*               jedyne miejsce, gdzie uruchamia się npm ci
  shared/                       chroniona konfiguracja (0700)
  current, previous             względne symlinki podmieniane przez rename(2)
  .lock/                        wyłączny lock (mkdir); nigdy nie jest łamany automatycznie
```

**PREPARE** (aktywny release nie jest dotykany):
1. Walidacja: SHA = dokładnie 40 znaków hex; root bezwzględny, znormalizowany, wewnątrz dozwolonego katalogu, bez symlinków po drodze; prototyp odrzuca `/usr/home/vetternkraft`.
2. Weryfikacja sha256 archiwum (wymagany digest z runnera) → listing tar (odrzuca `..`, ścieżki bezwzględne, `node_modules`, `release.json`) → ekstrakcja do `releases/.staging-*` z `--no-same-owner` → odrzucenie symlinków/plików specjalnych z artefaktu.
3. Kompletność: `package.json`, `package-lock.json`, `.next/BUILD_ID`, `.next/static/`, `app.cjs|app.js`, `public/__release.json` z `sha` równym żądanemu.
4. Manifest: tylko zakresy z rejestru (odrzuca `file:`, `link:`, `workspace:`, git, URL, alias `npm:`). Lockfile v≥2 musi zgadzać się 1:1 z grupami zależności **końcowego, przepisanego** manifestu; każdy wpis ma `resolved` z `https://registry.npmjs.org/` i integralność `sha512-`.
5. Fingerprint = sha256(zależności manifestu + `overrides` + bajty lockfile + platforma, arch, major Node, ABI `process.versions.modules`, major npm + flagi instalacji).
6. Zależności: jeśli `deps/<fp>` ma READY.json zgodny z fingerprintem, lockfile i platformą **oraz** drzewo przechodzi kontrolę — reużycie (0 operacji npm). W przeciwnym razie `npm ci --omit=dev --ignore-scripts --no-audit --no-fund` w `deps/.staging-*`, kontrola drzewa (manifest każdego niedev/nieopcjonalnego wpisu lockfile), opcjonalny probe, READY.json, `rename` → `deps/<fp>`. Błąd = usunięcie stagingu, nic nie jest publikowane (**fail closed**).
7. Kopia konfiguracji z allowlisty (`.env.runtime.json`, `.env`, `.env.production`): plik regularny, nie symlink, tryb bez bitów group/other, ≤64 KiB; kopiowany jako 0600. Konflikt z plikiem z artefaktu = błąd.
8. Hash treści drzewa (bez `node_modules`, `release.json` i konfiguracji — żaden weryfikator sekretu nie jest zapisywany), symlink `node_modules`, `release.json`, `rename` stagingu → `releases/<sha>`. Release jest albo kompletny, albo niewidoczny.

**VALIDATE** (`verifyRelease`): metadane, kompletność, hash treści, poprawność linku `node_modules`, READY zależności, zgodność platformy/ABI z bieżącym runtime, kontrola drzewa zależności, uprawnienia konfiguracji. Używane przed każdą aktywacją i rollbackiem.

**ACTIVATE** (pod lockiem): verify → `previous := current` → `current := releases/<sha>` przez `symlink(tmp)` + `rename(tmp, current)` (atomowe, nie podąża za linkiem — w odróżnieniu od `mv`, którego semantyka na symlinku do katalogu różni się między BSD a GNU) → `adapter.restart(sha)` → `adapter.healthcheck(sha)`. Ponowna aktywacja aktywnego release = `already-active`, bez restartu.

**VERIFY**: healthcheck adaptera musi potwierdzić, że serwowany jest **dokładnie** żądany SHA (np. `/__release.json`). Błąd restartu/healthchecku = automatyczne przywrócenie wskaźników i restart poprzedniego release (`ACTIVATION_ROLLED_BACK`), lub `ACTIVATION_RECOVERY_FAILED` gdy i to się nie uda.

**ROLLBACK**: `previous` musi istnieć, różnić się od `current` i przejść `verifyRelease`; deterministyczne A → B → A → B. Nie dotyka danych, uploadów, bazy ani `shared/`.

### Dlaczego eliminuje to podmianę zależności in-place
Działający worker rozwiązuje `realpath(current)` przy starcie i ładuje kod i `node_modules` z jednego, niezmiennego katalogu. Przygotowanie pisze wyłącznie do katalogów `.staging-*`, które nigdy nie są celem wskaźnika; `npm ci` (które usuwa `node_modules` przed instalacją) działa tylko w nieaktywnym stagingu. Zmienia się jedynie wskaźnik — po pełnej walidacji — a stary release pozostaje nietknięty do rollbacku.

## 3. Lockfile końcowego manifestu (przyszła integracja na runnerze)
`deploy.yml` przepisuje manifest (`link:` → `file:`, usuwa linie `workspace:`, w DEV usuwa `devDependencies`). Lockfile monorepo (`pnpm-lock.yaml`) nie opisuje tego manifestu. Krok runnera po przepisaniu:

```bash
npm install --package-lock-only --omit=dev --ignore-scripts --no-audit --no-fund
node scripts/ci/safe-release.mjs check-lock --manifest package.json --lock package-lock.json
```

Zweryfikowano lokalnie (2026-11-08) na faktycznym manifeście DEV panelu: 334 wpisy, wszystkie z rejestru + sha512. `@salonbw/api` (`workspace:*`) jest usuwany przez `sed` i nie trafia do manifestu runtime — dlatego zależności `file:` są odrzucane, a nie wspierane. Spójność wersji z buildem: lockfile powinien docelowo powstawać z tych samych wersji co `pnpm-lock.yaml` (otwarte, patrz §7).

## 4. Natywne zależności i FreeBSD
- `node_modules` z Linux/macOS **nie jest** przenoszone na FreeBSD — instalacja zawsze odbywa się na hoście docelowym (fingerprint zawiera platformę/ABI).
- `sharp` 0.35 ładuje binarkę z opcjonalnego `@img/sharp-<os>-<arch>`; dla FreeBSD nie ma prebuilt. Przy `--ignore-scripts` (stan obecny i proponowany) sharp najpewniej nie załaduje się na MyDevil — **niezweryfikowane**; probe nie może go wymagać. `@next/swc-*` nie jest potrzebne w runtime produkcyjnym.
- Lockfile wygenerowany na Linuksie zawiera wpisy opcjonalne wszystkich platform; `npm ci` na FreeBSD pomija niepasujące (`os`/`cpu`). Kontrola drzewa pomija wpisy `optional`/`devOptional`.

## 5. Bezpieczeństwo — kontrole i ograniczenia
| Obszar | Kontrola | Ograniczenie |
|---|---|---|
| Łańcuch dostaw | Lockfile z rejestru + sha512, `npm ci` weryfikuje integralność, `--ignore-scripts` | Zaufanie do registry.npmjs.org; brak podpisów provenance |
| Pochodzenie artefaktu | sha256 z runnera + `__release.json.sha` = SHA | Digest przekazywany tym samym kanałem SSH co archiwum |
| Ścieżki/symlinki | Root bez symlinków, listing tar, brak symlinków w artefakcie, wskaźniki tylko `releases/<sha40>` | Wyścig TOCTOU między walidacją a użyciem na koncie współdzielonym nieeliminowany (ten sam użytkownik) |
| Sekrety | Kopia 0600 z allowlisty, brak logowania treści, brak hashy sekretów w `release.json` | Sekret istnieje w N katalogach release (retencja = sprzątanie release) |
| Współbieżność | `mkdir .lock`, brak auto-łamania | Lock po crashu wymaga ręcznego usunięcia po weryfikacji |
| Rollback | Verify przed przełączeniem, auto-recovery po nieudanym healthchecku | Zmiana ABI Node unieważnia stare zależności (świadomie fail closed) |

Sekret schedulera wskazany wcześniej nie jest używany ani modyfikowany; jego rotacja to osobne zadanie P0.

## 6. Pomiary lokalne (macOS arm64, Node 26, npm 11; 1 próbka — nie MyDevil)
| Metryka | legacy `npm install --no-package-lock` | `npm ci` z lockfile | reużycie (fingerprint bez zmian) |
|---|---:|---:|---:|
| Czas (zimny cache npm) | 23,3 s | 13,1 s | 0 operacji npm |
| Max RSS procesu npm | 481 MiB | 374 MiB | 0 |
| `node_modules` | 652 MiB | 652 MiB | 0 dodatkowo (współdzielone) |
| Wersje top-level (262) | — | 0 różnic | — |

Generowanie lockfile na runnerze: 13,5 s, 371 MiB RSS (koszt runnera, nie hosta). Dysk: każdy **nowy** fingerprint to dodatkowy zestaw ~650 MiB obok aktywnego; release bez zmian zależności kosztuje tylko artefakt. Wymagana retencja (np. current + previous + ich zestawy deps) — sprzątanie świadomie poza prototypem.

**Hipoteza dla MyDevil (niezmierzona):** deploy code-only eliminuje npm całkowicie; deploy ze zmianą zależności zastępuje rozwiązywanie drzewa instalacją z lockfile (lokalnie −22% RSS) i nie konkuruje z workerami o ten sam katalog. Nie twierdzimy, że usuwa skok 112%.

## 7. Czego mock nie dowodzi (do weryfikacji na DEV)
1. Czy Passenger/`devil www restart` uruchamia aplikację z `realpath` wskaźnika i czy restart po zmianie celu symlinka ładuje nowy release (Passenger może cache'ować app root).
2. Rejestracja aplikacji MyDevil: dziś `domains/<d>/public_nodejs -> apps/nodejs/<app>` (`ensure-app-symlink.sh`), a `staging-release-snapshot.sh` odrzuca zlinkowany katalog aplikacji. Integracja wymaga wyboru granicy aktywacji (np. `public_nodejs -> <root>/current`) i aktualizacji tych kontroli — **nie wykonano**.
3. Czy Next 15 w trybie niestandalone działa z symlinkowanym `node_modules` na FreeBSD (lokalnie `require('next')` przez symlink działa).
4. Zachowanie `npm22 ci` na FreeBSD (wersja npm, wpisy opcjonalne, natywne moduły) i realne zużycie RAM.
5. `.next/static` poprzedniego release dla otwartych kart — obecny ekstraktor kopiuje stare chunki; w nowym modelu wymaga to osobnej decyzji (np. kopiowanie listy poprzednich chunków przy prepare).

## 8. Procedura odtworzeniowa (docelowa, po integracji)
1. `status` → odczytaj `current`/`previous`.
2. Jeśli lock istnieje: upewnij się, że żaden deploy nie trwa (GitHub Actions + `ps`), dopiero wtedy usuń `.lock`.
3. `verify --sha <previous>`; przy sukcesie rollback przez adapter (przełączenie + restart + healthcheck SHA).
4. Gdy oba release są niepoprawne: dotychczasowy snapshot `staging-release-snapshot.sh` pozostaje ścieżką awaryjną do czasu wycofania.

## 9. Walidacja DEV
Plan kontrolowanego eksperymentu (wymaga zgody PO): [SAFE_RELEASE_DEV_VALIDATION_PLAN.md](SAFE_RELEASE_DEV_VALIDATION_PLAN.md).
