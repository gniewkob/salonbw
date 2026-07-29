# STAN PROJEKTU — czytaj to jako PIERWSZE

> **Ten plik NADPISUJEMY, nie dopisujemy.** Ma zostać jednostronicowy.
> Zasady pracy: [`docs/HANDOFF_PROTOCOL.md`](./HANDOFF_PROTOCOL.md).
> Historia zadań: [`docs/journal/`](./journal/). Plan: [`docs/PROJECT_COMPLETION_PLAN.md`](./PROJECT_COMPLETION_PLAN.md).

**Ostatnia aktualizacja:** 2026-07-29 · **Aktualizował:** Codex

---

## Cel projektu

Własny panel dla **jednoosobowego salonu fryzjerskiego** (Salon Black & White,
Bytom). Właścicielka **Aleksandra pracuje jako admin** — rola „pracownik" jest
świadomie **poza zakresem** GO. Cel: w pełni działający panel na produkcji,
odejście od Booksy.

## Gdzie jesteśmy

**Faza A** ścieżki do produkcji (§3.0 planu): przed UAT.
Aplikacja jest funkcjonalnie kompletna i wdrożona; zostały zadania
przedprodukcyjne, w większości po stronie ownera.

## Fakty o produkcji (ZWERYFIKOWANE — data przy każdym)

| Fakt | Zweryfikowano |
|---|---|
| `panel.salon-bw.pl` → HTTP 307 (login) — **panel JEST na realnej domenie** | 2026-07-28 |
| `salon-bw.pl` → 301 na `www.` = **stary landing** (nginx, nie Next) | 2026-07-23 |
| `dev.salon-bw.pl` → nowy landing (Next), HTTP 200 | 2026-07-28 |
| Mobilny landing 390×844: CSS/JS 34/34 HTTP 200; karty widoczne po scrollu | 2026-07-28 |
| `/healthz`: HTTP 200 · db ok | 2026-07-29 |
| SMS **nie działa** — pusty `SMSAPI_TOKEN` | 2026-07-23 |
| Sentry **nie działa** — brak DSN → zero widoczności błędów | 2026-07-23 |
| Alert o rezerwacji do salonu: **jeden kanał** (mail `BOOKING_ALERT_EMAIL`) + dzwonek w panelu | 2026-07-23 |
| Brak **jakiejkolwiek** kategorii produktów → 822 produkty „brak kategorii" | 2026-07-27 |
| Na prodzie są **dane testowe** (Codex QA, E2E Klient, produkty AUDYT, stocktaking w toku) | 2026-07-27 |

> Fakt starszy niż ~7 dni = niepewny. Zweryfikuj ponownie (§6 protokołu).

## Ostatnio zrobione

- **Poświadczenie PostgreSQL obrócone** (2026-07-29): zaktualizowano konto
  bazy, produkcyjny i lokalny env oraz sekrety GitHub Actions
  (`DATABASE_URL`, `MYDEVIL_DB_PASSWORD`, `PGPASSWORD`). Nowe logowanie działa,
  stare jest odrzucane (`28P01`), a API raportuje `status=ok`, `database=ok`.
  Updater env wymusza teraz tryb `600` dla aktywnego pliku i backupów; regresję
  chroni test z atrapą SSH uruchamiany w CI.
- **E4.2 zatrzymane przed transakcją** (2026-07-29): świeży dump custom został
  zweryfikowany checksumą. Pierwszy `apply` wykrył brakujący fingerprint FK
  `inventory_movements.actorId → users`; minimalny fix guardu wdrożono na
  master `58354294` (CI `30430237140`, deploy `30430237091`, oba success).
  Ponowiony `apply` zatrzymał się na `product_sales → appointments`. Po obu
  próbach liczności planu były identyczne, więc baza nie została zmodyfikowana.
  Przed kolejnym potwierdzeniem wymagany jest pełny diff FK i poprawka guardu.
- **Naprawiony deploy statyków frontendu** (master `5a7a38a9`, run
  `30401261957`): wielocommitowy push nie jest już mylony z force-pushem,
  ekstrakcja ma rollback i retencję jednej poprzedniej generacji assetów.
  Po deployu stary i nowy build manifest odpowiadają 200; mobilny smoke
  390×844 ma komplet CSS/JS, widoczne karty i 0 błędów konsoli.
- **Gotowe narzędzie czystych danych pre-live**: wersjonowane komendy
  `plan`/`verify`/`apply`/`cleanup`, deterministyczny dataset bez PII i realnych
  cen, jawny rejestr kasowania, kontrola FK, rollback oraz wymóg świeżego
  `pg_dump`. Zrzut Versum pozostaje offline; **reset bazy nie został wykonany**.
- **E4.1 zakończone, plan E4.2 czysty** (2026-07-28): utworzono trwałe konto
  klienta CI bez zgód i powiadomień, atomowo przełączono dwa sekrety GitHub,
  a logowanie do API zweryfikowano. Ponowiony read-only `plan` potwierdził oba
  chronione konta i brak blockerów: do usunięcia 5 klientów, 19 wizyt,
  822 produkty i 12 dokumentów magazynowych; reset nadal nie został wykonany.
- **Ponowny visual sweep** (run `30384548803`, master `c97c9ced`): 142 testy
  przeszły, 20 opcjonalnych testów employee pominięto zgodnie z zakresem;
  przejrzano 172/172 zrzuty. CTA `UTWÓRZ WIZYTĘ` na mobile nie jest przycięte.
  Brak błędów 🔴; wykryto follow-up responsywny (27 zrzutów szerszych niż
  viewport 390 px) i lukę pokrycia dwóch mobilnych modali kategorii.
- **Porządki repo i zależności**: wszystkie gałęzie scalone do `master`, stare
  referencje usunięte, otwarte PR-y zamknięte; wersje Jest ujednolicone.
  Alert `brace-expansion` #326 zamknięty przez wspólny `minimatch@10.2.6`;
  pełny audyt zależności bez znanych podatności.
- **PR #1465** (master `d7dbb67`): ETAP 0/1 — sync logów, weryfikacja
  dependabotów (0 superseded → eskalacja), Z12 sweep wizualny 164/164 bez 🔴,
  fixy 🟡/🎨, audyt marki, emoji→Heroicons. Zweryfikowane live po deployu.
- **PR #1466** (master `7a71c19`): przedefiniowanie ścieżki na fazy A–E,
  `UAT_PLAN.md`, sweep nakładek (modale), zakres jednoosobowy, token IG zamknięty.
- **Sweep nakładek uruchomiony** (run `30306818237`) — pierwsze zrzuty modali
  w historii projektu; znaleziska w `docs/journal/`.
- **Protokół przekazania pracy** (`docs/HANDOFF_PROTOCOL.md`, ten plik,
  `docs/journal/`, `scripts/handoff-check.sh`) — po dwóch konfliktach merge
  w `AGENT_STATUS.md`, które cicho zablokowały CI. Nowe wpisy: jeden plik na
  zadanie; archiwalne logi tylko do czytania.

## Następny krok (konkretnie)

1. **Faza A: E4.2** — wykonać pełny diff FK, poprawić guard resetu i wdrożyć;
   dopiero po świeżym `pg_dump` i ponownym potwierdzeniu uruchomić
   `synthetic:data:apply`, `verify`, health-check i regresję CI.
2. Osobny follow-up: responsywność szerokich tabel/formularzy oraz wymaganie
   kompletu zrzutów modali w `e2e-visual-sweep.yml`.
3. Potem **faza B: UAT** wg `docs/UAT_PLAN.md`.

## Zablokowane na ownerze

| # | Co | Czas |
|---|---|---|
| E2.2 | Zmiana tymczasowego hasła admina | 2 min |
| E2.5 | Założenie projektu Sentry → DSN (agent wpina) | 15 min |
| E2.11 | **Test: czy alert o rezerwacji dociera na telefon** (procedura w planie) | 10 min |
| E4.2 | Ponowna zgoda po wdrożeniu pełnej poprawki guardu FK | — |
| ETAP 3a | Zatwierdzenie nazw kategorii produktów (propozycja w planie) | — |
| E3 | Import zrzutu Versum odłożony do osobnego okna po decyzji GO | — |
| E2.1 | Restore-drill backupu (mail do MyDevil) | — |
| E2.3 | Decyzja o domenie landingu (**nie blokuje panelu**) | — |

## Aktywny stan repo

- Gałąź: `master`; poza `master` brak lokalnych i zdalnych gałęzi roboczych.
- Otwarte PR-y: 0.
- CI i deploy `master` są wymagane jako końcowa bramka każdego kolejnego zadania.

## Uwaga o równoległych strumieniach

Na repo pracują **równolegle** owner/Codex (ostatnio: landing — footer, founder
CMS, treści prawne) i Claude (panel, plan, weryfikacja). **Zawsze `git fetch` i
rebase przed startem** — master potrafi przesunąć się o kilka commitów między
sesjami, a skonfliktowany PR cicho blokuje CI.
