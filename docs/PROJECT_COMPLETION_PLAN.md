# Plan dokończenia projektu SalonBW (agent-ready)

_Stan wyjściowy: 2026-07-22, master `0e7e8ae`. Dokument operacyjny dla agentów
wykonawczych (Sonnet 5 / Opus 4.8) i ownera. Syntetyzuje otwarte pozycje z
`SONNET_EXECUTION_PLAN.md` §5 (checklista GO), `PANEL_10_10_PLAN.md` (Fazy 4–5),
Backlogu `active-context.md` oraz otwartych follow-upów z `AGENT_STATUS.md`._

_Format wzorowany na sprawdzonym `SONNET_EXECUTION_PLAN.md` (Z1–Z11 wykonane
w tym reżimie, jakość po cyklu review 6/10 → 9/10)._

---

## §0. METODA PRACY — iteracja w stylu Codexa (OBOWIĄZUJĄCA)

Przegląd 44 commitów streamu Codex (12–22.07) potwierdził, że ta metoda daje
najlepszy stosunek postępu do regresji w tym projekcie. **Każde zadanie
wykonuj jako iterację o strukturze:**

1. **Finding** — co konkretnie jest nie tak / czego brakuje, z dowodem
   (ścieżka pliku, zachowanie, zrzut). Nie zaczynaj zmiany bez nazwanego
   Finding.
2. **Change** — minimalna zmiana adresująca Finding. Jedno zadanie = jeden
   PR / jeden spójny commit. Bez „przy okazji".
3. **Validation** — lokalnie: celowane Jest + `tsc --noEmit` + lint + build
   dotkniętych aplikacji; dla zmian UI dodatkowo realna weryfikacja
   (patrz §1 reguła W2). Dla bugfixów rytuał **fail-first** (test failuje
   przed fixem — weryfikacja przez `git stash` na pliku źródłowym).
4. **Rollout** — po merge: zanotuj numery runów `CI` i `Deploy (MyDevil)`.
5. **Live smoke (dla zmian dotykających prod-flow)** — wzorzec z
   `AGENT_STATUS.md` 2026-07-22 „Notification action live smoke":
   realne konto przez prawdziwy endpoint → przejście przepływu kliknięciami
   → screenshot jako dowód → **pełny cleanup artefaktów smoke z weryfikacją
   `remaining=0`**.
6. **Follow-up** — wpis do OBU logów projektu (patrz §0a), z jawnie
   nazwanym następnym krokiem albo „brak".

**Zasada gwiazdy północnej (z audytu widoczności akcji Codexa):**
_wymagana decyzja użytkownika musi być klikalna tam, gdzie jest pokazana —
nie schowana w panelu wtórnym._ Stosuj ją do każdego przeglądu UX.

## §0a. Rytuał sesji

**Start sesji:**
1. `git pull` na masterze; przejrzyj commity od ostatniego wpisu w logach —
   stream ownera/Codexa pracuje równolegle na tych samych plikach.
2. Przeczytaj: ten plik → `active-context.md` (sekcja „Current focus" +
   Backlog) → ostatnie wpisy `AGENT_STATUS.md`.
3. Zweryfikuj, że CI na masterze jest zielone, zanim zaczniesz własną pracę.

**Koniec KAŻDEGO zadania (nie sesji!):**
1. Testy zielone lub brak pusha. Wpis do logów nawet przy porażce.
2. Wpisy do **obu** logów: `active-context.md` (stream Claude) i
   `AGENT_STATUS.md` (format Finding→Change→Validation→Follow-up).
3. Commity Codexa/ownera zastane przy pullu — krótki przegląd (Codex bywa
   pomija lint; audytuj format: Problem | Naprawiony?).

---

## §1. TWARDE REGUŁY (złamanie = odrzucenie pracy; wszystkie „zapłacone" incydentami)

**Techniczne:**
- T1. `router.query` jest PUSTY na pierwszym renderze hard-load — stan z URL
  czytaj w `useEffect` na `router.isReady`, nie w initial `useState`.
- T2. Decimale z backendu przychodzą jako STRINGI (`"600.00"`) — zawsze
  `Number()` przed `.toFixed`/arytmetyką.
- T3. Body-DTO bez dekoratorów class-validator = 400 przy globalnym
  `forbidNonWhitelisted`. Query-paramy numeryczne wymagają
  `@Type(() => Number)`.
- T4. Każda nowa wartość `LogAction` = migracja `ALTER TYPE ... ADD VALUE`
  (natywny enum pg, synchronize=false).
- T5. Równe kolumny gridu: `repeat(N, minmax(0,1fr))`, nigdy `1fr`.
- T6. `/products` filtruje przez `includeInactive` (NIE `isActive`);
  `/services` odwrotnie — sprawdź DTO zanim wyślesz query-param.
- T7. Import danych prod wypełnia pola strukturalne
  (`clientComment`/`staffRecommendations`) BEZPOŚREDNIO — kolumny `notes`
  nie ma, back-parser się nie uruchomi.
- T8. Idempotencja-po-nazwie na brudnym katalogu jest zawodna — przed seedem
  weryfikuj duplikaty (lekcja `[[seed-migration-dirty-catalog]]`).

**Weryfikacyjne:**
- W1. Bugfix = rytuał fail-first (stash na źródle → test failuje → unstash →
  test przechodzi). Wyjątek: zmiany czysto wizualne CSS.
- W2. UI weryfikuj REALNYM kliknięciem myszy i inspekcją wygenerowanego DOM
  w przeglądarce. Nigdy `element.click()` z JS (dawał fałszywe pozytywy przy
  niewidocznych modalach). Przy debugowaniu CSS najpierw sprawdź, KTÓRY
  komponent faktycznie się renderuje.
- W3. Zmiana widoczna na prodzie = live-verify po deployu (nie „powinno
  działać").

**Operacyjne:**
- O1. Sekrety/tokeny: nigdy w echo, logach, commitach. Token Instagrama
  wyłącznie przez stdin `scripts/safe-update-instagram-token.sh`. Env API
  przez `scripts/safe-update-api-env.sh`.
- O2. Deploy czerwony na kroku SSH = bloker infrastrukturalny ownera —
  NIE ścigaj go commitami (historyczna strata kilku sesji).
- O3. Agent w worktree dostaje polecenie „pracuj w bieżącym katalogu"
  (agent z absolutną ścieżką pisał do głównego repo). Po delegacji sprawdź,
  czy subagent faktycznie coś wyprodukował (padały cicho na limitach).
- O4. Pliki workflow `.github/workflows/` — po każdej zmianie lokalnie
  przejść 3 skrypty ops-guard (`scripts/check-ops-workflows.sh`,
  `validate-batch-telemetry-fixtures.sh`,
  `check-ops-workflow-docs-consistency.sh`).
- O5. Treści prawne (`legalContent.ts`, `dataDeletionContent.ts`) i dane
  identyfikacyjne firmy: agent może przygotować DRAFT w PR; merge i decyzje
  merytoryczne = wyłącznie owner.

---

## §2. MACIERZ MODEL-FIT (kto wykonuje co)

| Zadanie | Sonnet 5 | Opus 4.8 | Owner |
|---|:---:|:---:|:---:|
| E0.3 zamknięcie dependabotów (superseded) | ✅ | | |
| E0.4 wpis synchronizujący do logów | ✅ | | |
| E1 Z12: dispatch sweepa + katalog zrzutów | ✅ | | |
| E1 Z12: werdykty 🔴/🟡/🎨 + fixy 🔴 | | ✅ | |
| E2 zadania konfiguracyjne (tokeny, decyzje) | | | ✅ |
| E3 import danych prod (migracje) | ❌ | ✅ | wsad |
| E4 cleanup FK-safe + finalny live E2E | ❌ | ✅ | zgoda |
| E5 audyt widoczności akcji (kontynuacja) | ✅ | | |
| E5 typing auth/social + testy strategii | ✅ | | |
| E5 test-hygiene (act() warnings) | ✅ | | |
| E5 ops MyDevil (redukcja remote-exec) | ❌ | ✅ | |
| Review każdej gałęzi przed merge | | ✅ (lub Fable) | ✅ legal |

Zasada: Sonnet dostaje zadania z zamrożonym kontraktem i mechanicznym
kryterium akceptacji; Opus — wszystko, co dotyka prod DB, SSH, migracji
i osądu wizualnego. Żaden merge bez przeglądu.

---

## §3. ZADANIA

### ETAP 0 — Domknięcie rzeczy w locie

**E0.1 (owner) Merge PR #1461** — dokumenty prawne (data-deletion 11 sekcji,
Polityka 10 sekcji, korekty Meta/adres/backup-retencja).
- Akceptacja: merge + deploy landing; `/privacy`, `/data-deletion` na dev
  pokazują nową treść.

**E0.2 (owner) Przegląd prawny** — radca, ~1–2h na gotowym drafcie
(szczególnie: klauzula art. 9 alergie, transfery poza EOG, EN/DE).

**E0.3 (Sonnet) Dependaboty #1450–#1459 → zamknąć jako superseded.**
- Kontekst: Codex wchłonął aktualizacje batchem na masterze (`5c23370`,
  `f0c40e4`, `a4ec9f5`, `6cbdc12`); jego follow-up wprost: „close
  implemented Dependabot PRs as superseded".
- Kroki: dla każdego PR porównaj bump z aktualnym `pnpm-lock.yaml` na
  masterze → jeśli wersja ≥ bumpa: zamknij z komentarzem
  „Superseded by batched update on master (`<commit>`)".
- Płot: NIE mergować żadnego z tych PR-ów; NIE zamykać, jeśli bump NIE jest
  pokryty na masterze → zostawić otwarty i wpisać do logu (eskalacja).
- Akceptacja: 0 wiszących PR-ów dependabota LUB lista niepokrytych z
  uzasadnieniem w logu; alerty #321/#322 sprawdzone po rescanie.

**E0.4 (Sonnet) Wpis synchronizujący do logów.**
- Kontekst: `active-context.md` kończy się na 2026-07-12; master ma 44
  commity streamu Codex do 2026-07-22.
- Kroki: przegląd `git log` 07-12→07-22 + odpowiadających wpisów
  `AGENT_STATUS.md` → skondensowany wpis do `active-context.md`
  (strumienie: audyt widoczności akcji, notatki wizyt, uczciwość danych,
  guardraile MyDevil, security/typing, Instagram ops, bramka Meta-cutover)
  + odnotowanie: PR #1461 rozszerza `/data-deletion` wdrożone przez Codexa
  (`6587bdf`), fix builda #1463 zmergowany (`0e7e8ae`), issue #1462 domknięte.
- Akceptacja: oba logi spójne, „Current focus" w active-context aktualny.

### ETAP 1 — Z12: weryfikacja wizualna panelu (ostatnie otwarte zadanie planu Sonneta)

**E1.1 (Sonnet) Warunki wstępne:** na masterze `Deploy (MyDevil)` success
i `E2E Playwright Regression` zielony (zawiera test Z7 „Szczegóły→dialog").
Jeśli czerwone na SSH → reguła O2 (STOP, wpis, owner).

**E1.2 (Sonnet) Dispatch + artefakt:** uruchom workflow `e2e-visual-sweep.yml`
(dispatch-only, jest na masterze od merge #1419) → pobierz artifact
`visual-sweep-screenshots` → skataloguj zrzuty (trasa × viewport × rola)
z listą braków (trasy bez zrzutu = fail testu, sprawdź trace).
- Sweep employee wymaga sekretów `E2E_EMPLOYEE_EMAIL/PASSWORD` (owner;
  konto `test.pracownik@salon-bw.pl` istnieje) — bez nich pomijany, odnotuj.

**E1.3 (Opus) Przegląd KAŻDEGO zrzutu** → raport w Backlogu active-context:
per widok 🔴 (funkcjonalne/blokujące) / 🟡 (UX/design istotny) / 🎨 (kosmetyka).
- Akceptacja: zero nieobejrzanych zrzutów; 🔴 naprawione (rytuał W1/W2)
  i wdrożone; 🟡/🎨 wpisane do Etapu 5.

### §3.0 ŚCIEŻKA DO PRODUKCJI — fazy A–E (weryfikacja 2026-07-23)

_Korekta kolejności po weryfikacji faktów na żywo. Poprzednia wersja planu
trzymała start na zadaniach, które startu NIE blokują (domena, import), a
przepuszczała te, które blokują (powiadomienia, monitoring)._

**Fakty, które zmieniły ścieżkę krytyczną (sprawdzone 2026-07-23):**
- `panel.salon-bw.pl` → **HTTP 307 (login) — panel JEST na realnej domenie
  produkcyjnej.** Klientki i pracownicy korzystają z panelu (razem z kreatorem
  rezerwacji) niezależnie od losów landingu.
- `salon-bw.pl` → 301 na `www.` (nginx, stary landing); `dev.salon-bw.pl` →
  nowy landing (Next). **Cutover domeny dotyczy landingu marketingowego i
  URL-i prawnych dla Meta — nie jest bramą do udostępnienia panelu.**
- Alert o nowej rezerwacji do salonu: `BOOKING_ALERT_EMAIL` (mail) + dzwonek/
  licznik w panelu. **SMS zbramkowany pustym `SMSAPI_TOKEN` → nie działa.**
- Sentry: DSN opcjonalny, brak → **zero widoczności błędów**.

| Faza | Zakres | Kto | Blokuje udostępnienie? |
|---|---|---|---|
| **A. Przed UAT** | E2.2 hasło · E2.5 Sentry · **E2.11 test dotarcia alertu** · E4.1+E4.2 cleanup | owner + agent | ✅ TAK |
| **B. UAT** | właścicielka przechodzi realny dzień pracy na `panel.salon-bw.pl` (`docs/UAT_PLAN.md`) | owner | ✅ TAK |
| **C. Import** | E2.1 restore-drill → E3 import historii | owner wsad + Opus | ⚠️ przed **publicznym** otwarciem |
| **D. Miękki start** | klientki na panel, Booksy jako backup, monitoring 1. rezerwacji | owner | — |
| **E. Równolegle** | E4.5 landing cutover + Meta · E0.2 przegląd prawny · E2.4 SMS | owner | ❌ NIE blokuje panelu |

**Uzasadnienie kolejności:**
1. **Powiadomienia > domena i import razem wzięte.** Nieodebrana rezerwacja to
   realna strata biznesowa. Do salonu idzie dziś JEDEN kanał (mail) + dzwonek.
   Zanim wpuścimy klientki, musi być potwierdzone, że alert fizycznie dociera
   do właścicielki (E2.11).
2. **Import PRZED publicznym otwarciem**, nie po: jeśli klientka sama się
   zarejestruje, a potem zaimportujemy ją z Booksy — powstaną duplikaty kart.
   Import nie blokuje jednak UAT (faza B może iść na danych po cleanupie).
3. **UAT (faza B) zastępuje sztuczny E4.3** — przejście właścicielki na jej
   realnym dniu pracy jest warte więcej niż skrypt agenta i jednocześnie domyka
   dotąd niewykonany live-test przepływu staff.

**Twarda zależność zamknięta (2026-07-28):** regresja CI używa trwałego,
chronionego konta klienta bez zgód i powiadomień. E4.2 nie usunie tego konta;
przełączenie sekretów i logowanie do API zostały zweryfikowane.

**✅ DECYZJA OWNERA (2026-07-23): zakres = JEDEN SALON, JEDNA OSOBA
(właścicielka pracująca jako admin). Rola „pracownik" WYPADA z zakresu GO.**
Konsekwencje, obowiązujące w całym planie:
- Sekrety `E2E_EMPLOYEE_*` **nie są potrzebne**; pominięty sweep employee w Z12
  przestaje być luką — to zamierzony zakres, nie brak.
- `UAT_PLAN.md` nie zawiera ścieżki pracownika (§5 dokumentu).
- Testy uprawnień roli employee — poza bramką GO (kod i tak je egzekwuje).
- Gdyby w przyszłości doszło zatrudnienie: wrócić do sekretów + osobnej
  ścieżki UAT (grafik pracownika, ograniczony dostęp).

### ETAP 2 — Twardnienie przedprodukcyjne (owner; agent przygotowuje/weryfikuje)

| # | Zadanie | Priorytet | Uwagi |
|---|---|---|---|
| E2.1 | **Restore-drill backupu bazy**: mail do pomoc@mydevil.net (data + nazwa bazy) → potwierdzić, że dump dochodzi i się odtwarza | 🟡 | Backupy robi dostawca automatycznie (pliki: `~/backups/local`, zdalne 14 dni; baza: przez support) — [pomoc.mydevil.net/Backup](https://pomoc.mydevil.net/Backup/). Nietestowany backup ≠ backup |
| E2.2 | ✅ Zmiana tymczasowego hasła admina | ✅ | 2026-07-29: losowa rotacja, Keychain i produkcyjne logowanie zweryfikowane; po UAT ponowić tym samym skryptem |
| E2.3 | **Decyzja o domenie**: cutover `salon-bw.pl` vs start na `dev.` | 🟡 **faza E — NIE blokuje panelu** | Korekta 07-23: panel już jest na `panel.salon-bw.pl`. Dotyczy landingu + URL-i prawnych Meta (E4.5) |
| E2.4 | `SMSAPI_TOKEN` (jeśli SMS od startu) | 🟢 faza E | bez tego: e-mail + WhatsApp + dzwonek. Warto po starcie jako 2. kanał alertu |
| E2.5 | Sentry DSN (owner zakłada projekt, agent wpina) | 🔴 **faza A** | Start z realnymi użytkownikami bez widoczności błędów = ślepy lot. Podniesione z 🟡 |
| E2.6 | Google OAuth: klucze + `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` | 🟢 opcja | kod gotowy, uśpiony |
| E2.7 | Weryfikacja `UPLOADS_DIR` na MyDevil (avatary przeżywają deploy?) | 🟡 | SSH ownera + agent |
| E2.8 | Test WhatsApp na realnym numerze | 🟡 | jedyny niezweryfikowany kanał |
| E2.9 | NIP/REGON w danych salonu (branch_settings ma null) | 🟡 | spójność z dokumentami |
| E2.10 | ✅ **Rotacja tokena Instagram — ZROBIONE** | ✅ | 2026-07-23: `/healthz` na prodzie zwraca `instagram: ok` (latencja ~251 ms = realne odpytanie Meta). Token zrotowany (owner/stream); helper `scripts/safe-update-instagram-token.sh` zostaje do przyszłych rotacji |
| **E2.11** | **Test dotarcia alertu o rezerwacji do właścicielki** — NOWE, brakowało w planie | 🔴 **faza A, najwyższy priorytet biznesowy** | Procedura niżej. Nieodebrana rezerwacja = realna strata. Dziś jeden kanał do salonu (mail `BOOKING_ALERT_EMAIL`) + dzwonek w panelu |

**E2.11 — procedura (owner, ~10 min):**
1. Upewnić się, że `BOOKING_ALERT_EMAIL` wskazuje skrzynkę, którą Aleksandra
   ma **na telefonie z włączonymi powiadomieniami push** (domyślnie
   `kontakt@salon-bw.pl`).
2. Wykonać **realną rezerwację testową** przez `panel.salon-bw.pl` (konto
   klienckie) na termin za kilka dni.
3. Sprawdzić **na telefonie**, czy mail „Nowa rezerwacja online — …" przyszedł
   i czy powiadomienie faktycznie wyskoczyło (nie tylko wylądowało w skrzynce);
   sprawdzić też folder SPAM.
4. Sprawdzić w panelu: dzwonek + licznik oczekujących rezerwacji podbił się.
5. Potwierdzić/odrzucić wizytę testową i **usunąć artefakt** (albo zgłosić do
   cleanupu E4.2, jeśli wykonywany później).
- Akceptacja: alert dotarł na telefon w < 5 min. Jeśli NIE → przed startem
  dołożyć drugi kanał (E2.4 SMS albo przekierowanie na prywatny e-mail).

### ETAP 3 — Z4: import danych produkcyjnych (ODŁOŻONY DO LIVE)

- Decyzja ownera 2026-07-28: zrzut klientów i magazynu z Versum pozostaje
  offline; przed live nie trafiają do systemu dane klientów ani realne ceny
  materiałów.
- Do testów przed UAT służy wyłącznie wersjonowany dataset syntetyczny opisany
  w [`SYNTHETIC_PRELIVE_DATA.md`](./SYNTHETIC_PRELIVE_DATA.md).
- Import realnego zrzutu wymaga osobnego okna po decyzji GO i ponownej jawnej
  zgody ownera.
- Wejście: eksport klientek/historii i magazynu od ownera (Versum).
- Przed startem: E2.1 wykonany (restore-drill) + własny `pg_dump` bazy
  bezpośrednio przed migracją importu.
- Migracja wypełnia pola strukturalne bezpośrednio (reguła T7); mapowanie na
  kanoniczny katalog 60 usług; dedup wg T8.
- Bramka: PR z migracją zawiera w opisie dry-run (`SELECT count(*)` źródła
  i celu) + wymaga jawnej zgody ownera przed merge.
- Akceptacja: liczności się zgadzają; spot-check ≥5 kart klientek na prodzie
  (metoda §0 pkt 5); wpis do logów.

### ETAP 3a — Kategorie produktów (owner zatwierdza nazwy, agent seeduje)

**Finding (sweep nakładek 2026-07-27):** modal „Zarządzaj kategoriami
(Produkty)" pokazuje **„Brak kategorii."** — nie istnieje ani jedna kategoria
produktowa, dlatego wszystkie ~822 produkty mają „brak kategorii". Filtrowanie
i raport wartości magazynu wg kategorii są przez to bezużyteczne.

**Decyzja ownera (07-23): kategorie są przydatne — wprowadzamy.**

- Wejście: zatwierdzona przez ownera lista nazw. **Agent nie wymyśla taksonomii
  biznesowej samodzielnie.**
- **Propozycja startowa** (wyprowadzona z realnego katalogu — dominują linie
  Wella: Color Touch, Koleston Perfect, Shinefinity oraz pielęgnacja):
  1. Koloryzacja (farby)
  2. Rozjaśniacze i oksydanty
  3. Pielęgnacja (szampony, odżywki, maski)
  4. Stylizacja
  5. Materiały zużywalne / akcesoria
  6. Produkty do odsprzedaży
- Wykonanie: migracja seedująca kategorie + **przypisanie produktów regułami po
  nazwie/marce** (np. `Koleston Perfect`/`Color Touch` → Koloryzacja), z raportem
  ile produktów trafiło do każdej kategorii i ile zostało bez przypisania.
- Bramka jak w E3: dry-run w opisie PR + `pg_dump` + jawna zgoda ownera.
- Akceptacja: 0 kategorii → N kategorii; odsetek produktów bez kategorii
  spadł; spot-check na `/products` z filtrem kategorii.
- Kolejność: najlepiej **razem z importem (faza C)**, żeby nie kategoryzować
  dwa razy — ale można też wcześniej, bo nie jest destrukcyjne.

### ETAP 4 — Czyszczenie, UAT i GO (Opus + owner)

**E4.1 + E4.2 — faza A, kolejność wymuszona.**
- **E4.1 ✅ (2026-07-28)** Sekrety CI `E2E_CLIENT_EMAIL`/
  `E2E_CLIENT_PASSWORD` wskazują trwałe konto testowe, którego cleanup nie
  kasuje. Konto nie ma zgód ani aktywnych powiadomień.
- **E4.2** Transakcyjny skrypt FK-safe usuwa dane testowe i tworzy czysty
  dataset syntetyczny. Zakres oraz komendy:
  [`SYNTHETIC_PRELIVE_DATA.md`](./SYNTHETIC_PRELIVE_DATA.md).
  **ZOSTAWIĆ:** konto właścicielki, konto CI (po przełączeniu E4.1), konto
  klienckie ownera.
- Bramka: najpierw read-only `plan`, następnie **`pg_dump` bezpośrednio przed**
  i **jawna zgoda ownera** na osobne uruchomienie `apply`. Skrypt wymaga
  `APP_LIFECYCLE=prelive`, frazy potwierdzającej i świeżego dumpa.
- Akceptacja: `remaining=0` dla każdej usuwanej encji, health-check po
  migracji, CI regresji nadal zielone (dowód, że E4.1 zadziałało).

**E4.3 → zastąpione przez UAT właścicielki (faza B).** Zamiast sztucznego
E2E agenta: Aleksandra przechodzi swój **realny dzień pracy** wg
[`docs/UAT_PLAN.md`](./UAT_PLAN.md). To jednocześnie domyka dotąd niewykonany
live-test przepływu staff (grafik → potwierdzenie → finalizacja z dodatkami).
Agent pozostaje do dyspozycji: diagnoza + fix znalezisk w trakcie UAT.

**E4.4** Health-checki (`/healthz`: db/smtp/instagram) + wpis „stan na start"
do obu logów.

**E4.5** (faza E, wg E2.3) cutover domeny landingu → checklista Meta (URL-e
Privacy/ToS/Data-Deletion) z `RELEASE_CHECKLIST.md` §5. **Nie blokuje
udostępnienia panelu.**

**E4.6 GO — miękki start (faza D):** udostępnienie panelu klientkom przy
zachowaniu Booksy jako backupu przez pierwszy okres; monitoring pierwszych
realnych rezerwacji (dotarcie alertu, throttle, deliverability L2, Sentry).

### ETAP 5 — Rozwój po starcie (backlog priorytetyzowany)

**P1 (kontynuacja ścieżki Codexa — pierwsze tygodnie):**
- Audyt widoczności akcji, kolejne use case'y: widoki wiadomości (odpowiedź
  salonu → czy klient ma klikalną akcję?), akcje staff w drawerze/kalendarzu
  ukryte w panelach wtórnych. (Sonnet; wzorce w AGENT_STATUS 07-21/07-22.)
- Semantyka zgód marketing vs transakcyjne (decyzja ownera + zmiana modelu).
- SMS transakcyjne po E2.4; web-push: Service Worker w panelu (backend VAPID
  gotowy).
- Typing auth/social/JWT + testy strategii (refresh-token z httpOnly cookie,
  normalizacja profilu Google). (Sonnet)
- Test-hygiene: warningi `act(...)` w testach drawera. (Sonnet)
- Monitoring pierwszych realnych rezerwacji (throttle, deliverability L2).

**P2 (1–2 miesiące):**
- Ops MyDevil: redukcja remote-exec u źródła, zdjęcie tymczasowego crona
  cleanup (follow-up Codexa). (Opus)
- 4 high-vuln zależności (ws/form-data/multer/nodemailer) + blokada audytu
  w CI; cykliczny batch dependabotów metodą Codexa.
- Aktywacja GA4 (owner podaje GA ID; baner Consent Mode czeka) i cache
  `/images/*`.
- Profesjonalna korekta EN/DE dokumentów prawnych; znaleziska 🟡/🎨 z Z12.
- Okresowy `pg_dump` o retencji dłuższej niż 14 dni dostawcy (przed każdą
  destrukcyjną migracją obowiązkowo).

**P3 (kierunkowe, z macierzy parytetu Versum/Booksy):**
- Faktury VAT / fiskalizacja; zunifikowany POS (bony/pakiety); obłożenie +
  prognoza w statystykach; eksport per-klientka.
- Logowanie Apple (wymaga Apple Developer) i aktywacja Facebook
  (`FACEBOOK_APP_ID/SECRET` — kod uśpiony).
- Konsolidacja 3 implementacji kategorii produktów.

---

## §4. POZA ZAKRESEM AGENTÓW (wyłącznie owner)

- Merge dokumentów prawnych i wszelkie decyzje o treści prawnej (reguła O5).
- Sekrety, tokeny, klucze OAuth, zmienne środowiskowe prod (agent podaje
  instrukcję, owner wykonuje przez safe-skrypty).
- Decyzja o domenie, decyzja o semantyce zgód, wsad danych do importu.
- Wszystko wymagające panelu MyDevil / interaktywnego logowania do Meta.

## §5. CHECKLISTA GO (wg faz A–E, §3.0)

**Zrobione:**
- [x] E0.1 dokumenty prawne zmergowane (#1461) · E0.3 dependaboty zweryfikowane
      (0 superseded → eskalacja P2) · E0.4 logi zsynchronizowane
- [x] E1 Z12: pełny raport ze sweepa (164/164), 0×🔴; 🟡 i 🎨 naprawione,
      zweryfikowane na żywo po deployu (`docs/Z12_VISUAL_SWEEP_REPORT.md`)
- [x] E2.10 token Instagram (healthz `instagram: ok`, 2026-07-23)
- [x] E2.2 hasło admina obrócone; Keychain + logowanie zweryfikowane
      (2026-07-29)

**FAZA A — przed UAT (blokuje udostępnienie):**
- [ ] E2.5 Sentry DSN — projekt + wpięcie _(owner zakłada, agent wpina)_
- [ ] **E2.11 test dotarcia alertu o rezerwacji na telefon** _(owner, ~10 min)_
- [x] E4.1 trwałe konto klienta CI + przełączenie dwóch sekretów
- [x] E4.2 cleanup danych testowych i dataset syntetyczny
      _(2026-07-29: verify 12/30/12/5, 0 blockerów; regresja 23/23)_

**FAZA B — UAT (blokuje udostępnienie):**
- [ ] Właścicielka przechodzi `docs/UAT_PLAN.md` (realny dzień pracy)
- [ ] Znaleziska z UAT naprawione lub świadomie odłożone

**FAZA C — dane syntetyczne i gotowość (przed publicznym otwarciem):**
- [ ] E2.1 restore-drill backupu bazy _(owner: mail do MyDevil)_
- [x] E4.2 plan + backup + zatwierdzony `apply` syntetycznego datasetu

**FAZA D — GO:**
- [ ] E4.4 health-checki + wpis „stan na start"
- [ ] E4.6 miękki start: klientki na panel, Booksy jako backup, monitoring
- [ ] E3 import z Versum dopiero w osobnym oknie po decyzji GO i zgodzie ownera

**FAZA E — równolegle (NIE blokuje panelu):**
- [ ] E2.3 decyzja o domenie → E4.5 cutover landingu + checklista Meta
- [ ] E0.2 przegląd prawny (radca) — przed szerokim pozyskiwaniem danych
- [ ] E2.4 SMS jako drugi kanał alertu · E2.7 UPLOADS_DIR · E2.8 WhatsApp ·
      E2.9 NIP/REGON

**✅ Decyzja zamknięta (07-23):** zakres = jeden salon, jedna osoba (admin).
Rola „pracownik" poza GO — szczegóły i konsekwencje w §3.0.
- [ ] E4.5 cutover + checklista Meta (jeśli dotyczy)
- [ ] GO

## §6. MAPA WIEDZY

- Logi żywe: `.claude/rules/active-context.md` (stream Claude),
  `docs/AGENT_STATUS.md` (stream Codex) — wpisy do OBU.
- Plany źródłowe: `docs/SONNET_EXECUTION_PLAN.md` (Z1–Z12, rytuały),
  `docs/PANEL_10_10_PLAN.md` (fazy), `docs/MVP_BOOKING_RUNBOOK.md` (DONE).
- **Wdrożenie:** `docs/UAT_PLAN.md` (faza B — scenariusz dla właścicielki),
  `docs/Z12_VISUAL_SWEEP_REPORT.md` (audyt wizualny + marki, W2-verified).
- Procedury: `docs/DEPLOYMENT_MYDEVIL.md`, `docs/RELEASE_CHECKLIST.md`
  (bramka Meta-cutover), `docs/ROLLBACK_PROCEDURE.md`, `docs/ENV.md`.
- Backupy dostawcy: https://pomoc.mydevil.net/Backup/ (pliki codziennie,
  `~/backups/local/RRRRMMDD/`, zdalne 14 dni; baza — restore przez support).
- Brand/design: skill `.claude/skills/salonbw-brand/`.
