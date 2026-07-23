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

### ETAP 2 — Twardnienie przedprodukcyjne (owner; agent przygotowuje/weryfikuje)

| # | Zadanie | Priorytet | Uwagi |
|---|---|---|---|
| E2.1 | **Restore-drill backupu bazy**: mail do pomoc@mydevil.net (data + nazwa bazy) → potwierdzić, że dump dochodzi i się odtwarza | 🟡 | Backupy robi dostawca automatycznie (pliki: `~/backups/local`, zdalne 14 dni; baza: przez support) — [pomoc.mydevil.net/Backup](https://pomoc.mydevil.net/Backup/). Nietestowany backup ≠ backup |
| E2.2 | Zmiana tymczasowego hasła admina (Konto → Zmień hasło) | 🔴 przed GO | 2 min |
| E2.3 | **Decyzja o domenie**: cutover `salon-bw.pl` vs start na `dev.` | 🔴 blokuje E4.5 | po cutoverze → checklista Meta z `RELEASE_CHECKLIST.md` |
| E2.4 | `SMSAPI_TOKEN` (jeśli SMS od startu) | 🟢 opcja | bez tego: e-mail + WhatsApp |
| E2.5 | Sentry DSN (owner zakłada projekt, agent wpina) | 🟡 | widoczność błędów od 1. dnia |
| E2.6 | Google OAuth: klucze + `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` | 🟢 opcja | kod gotowy, uśpiony |
| E2.7 | Weryfikacja `UPLOADS_DIR` na MyDevil (avatary przeżywają deploy?) | 🟡 | SSH ownera + agent |
| E2.8 | Test WhatsApp na realnym numerze | 🟡 | jedyny niezweryfikowany kanał |
| E2.9 | NIP/REGON w danych salonu (branch_settings ma null) | 🟡 | spójność z dokumentami |
| E2.10 | ✅ **Rotacja tokena Instagram — ZROBIONE** | ✅ | 2026-07-23: `/healthz` na prodzie zwraca `instagram: ok` (latencja ~251 ms = realne odpytanie Meta). Token zrotowany (owner/stream); helper `scripts/safe-update-instagram-token.sh` zostaje do przyszłych rotacji |

### ETAP 3 — Z4: import danych produkcyjnych (Opus; ZABLOKOWANE na wsad ownera)

- Wejście: eksport klientek/historii od ownera (Booksy/Versum).
- Przed startem: E2.1 wykonany (restore-drill) + własny `pg_dump` bazy
  bezpośrednio przed migracją importu.
- Migracja wypełnia pola strukturalne bezpośrednio (reguła T7); mapowanie na
  kanoniczny katalog 60 usług; dedup wg T8.
- Bramka: PR z migracją zawiera w opisie dry-run (`SELECT count(*)` źródła
  i celu) + wymaga jawnej zgody ownera przed merge.
- Akceptacja: liczności się zgadzają; spot-check ≥5 kart klientek na prodzie
  (metoda §0 pkt 5); wpis do logów.

### ETAP 4 — Czyszczenie i GO (Opus + owner)

**E4.1** Przełączyć sekret CI `E2E_CLIENT_EMAIL` na trwałe konto (regresja
loguje się kontem e2e, które zaraz zniknie!).
**E4.2** Migracja FK-safe usuwająca dane testowe (wzorzec
`CleanupE2eTestArtifacts` / `pg_temp.cleanup_cascade_del`); za zgodą ownera
także residuum magazynu (produkty AUDYT, stocktaking #1, dostawy #8/#9,
zamówienia #1–2, sprzedaż #9). Bramka jak w E3 (dry-run + zgoda + pg_dump).
**E4.3** **Finalny live E2E 3 ról na czystej bazie metodą §0 pkt 5**:
klient (rejestracja→rezerwacja→wiadomość→ocena), pracownik
(grafik→potwierdzenie→finalizacja z dodatkami — dotąd niewykonane live),
admin (statystyki/ustawienia). Screenshoty jako dowód, cleanup `remaining=0`.
**E4.4** Health-checki + wpis „stan na start" do obu logów.
**E4.5** (wg E2.3) cutover domeny → checklista Meta (URL-e Privacy/ToS/
Data-Deletion w ustawieniach aplikacji) z `RELEASE_CHECKLIST.md`.
**E4.6** GO — udostępnienie panelu klientkom.

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

## §5. CHECKLISTA GO

- [ ] E0.1 merge #1461 + E0.2 przegląd prawny
- [ ] E0.3 dependaboty domknięte, E0.4 logi zsynchronizowane
- [ ] E1 Z12: raport ze sweepa, 🔴 naprawione
- [ ] E2.2 hasło, E2.3 domena (decyzja), ~~E2.10 token Instagram~~ ✅ (healthz `instagram: ok`, 2026-07-23), E2.1 restore-drill
- [ ] E3 import danych wykonany i zweryfikowany (po wsadzie)
- [ ] E4.1–E4.4 cleanup + finalny live E2E 3 ról + wpis „stan na start"
- [ ] E4.5 cutover + checklista Meta (jeśli dotyczy)
- [ ] GO

## §6. MAPA WIEDZY

- Logi żywe: `.claude/rules/active-context.md` (stream Claude),
  `docs/AGENT_STATUS.md` (stream Codex) — wpisy do OBU.
- Plany źródłowe: `docs/SONNET_EXECUTION_PLAN.md` (Z1–Z12, rytuały),
  `docs/PANEL_10_10_PLAN.md` (fazy), `docs/MVP_BOOKING_RUNBOOK.md` (DONE).
- Procedury: `docs/DEPLOYMENT_MYDEVIL.md`, `docs/RELEASE_CHECKLIST.md`
  (bramka Meta-cutover), `docs/ROLLBACK_PROCEDURE.md`, `docs/ENV.md`.
- Backupy dostawcy: https://pomoc.mydevil.net/Backup/ (pliki codziennie,
  `~/backups/local/RRRRMMDD/`, zdalne 14 dni; baza — restore przez support).
- Brand/design: skill `.claude/skills/salonbw-brand/`.
