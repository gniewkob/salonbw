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

**Faza B** ścieżki do produkcji (§3.0 planu): UAT.
Faza A jest zamknięta: aplikacja jest funkcjonalnie kompletna, dane testowe są
syntetyczne, alert rezerwacji dociera, a błędy produkcyjne trafiają do Sentry.

## Fakty o produkcji (ZWERYFIKOWANE — data przy każdym)

| Fakt | Zweryfikowano |
|---|---|
| `panel.salon-bw.pl` → HTTP 307 (login) — **panel JEST na realnej domenie** | 2026-07-28 |
| `salon-bw.pl` → 301 na `www.` = **stary landing** (nginx, nie Next) | 2026-07-23 |
| `dev.salon-bw.pl` → nowy landing (Next), HTTP 200 | 2026-07-28 |
| Mobilny landing 390×844: CSS/JS 34/34 HTTP 200; karty widoczne po scrollu | 2026-07-28 |
| `/healthz`: HTTP 200 · db ok | 2026-07-29 |
| SMS **nie działa** — pusty `SMSAPI_TOKEN` | 2026-07-23 |
| Sentry działa: backendowy event testowy dotarł do produkcyjnego projektu; DSN API i frontendu ustawione | 2026-07-29 |
| Alert o rezerwacji: mail na `BOOKING_ALERT_EMAIL` fizycznie odebrany; dzwonek/licznik zweryfikowane; artefakty testowe usunięte | 2026-07-29 |
| Produkcja ma wyłącznie dataset syntetyczny: 12 klientów, 30 wizyt, 12 produktów, 5 dokumentów; 0 niesyntetycznych klientów | 2026-07-29 |
| Hasło jedynego konta admina obrócone; logowanie sekretem odczytanym z Keychain działa | 2026-07-29 |

> Fakt starszy niż ~7 dni = niepewny. Zweryfikuj ponownie (§6 protokołu).

## Ostatnio zrobione

- **Zgodność generatora datasetu z grafikiem Oli zaimplementowana lokalnie**
  (2026-07-29): aktywny grafik jest jedynym źródłem prawdy, `custom_hours`
  zastępuje cały dzień bez dziedziczenia tygodniowych przerw, a niedozwolone
  `in_progress` są przenoszone jako przyszłe `confirmed`. Generator i
  niezależna walidacja działają przed transakcją, a raport CLI ujawnia tylko
  agregaty grafiku. Nie wykonano deployu ani żadnej operacji na produkcyjnej
  bazie.
- **Faza B rozpoczęta — UAT start dnia i kalendarza** (2026-07-29): produkcyjny
  preflight API/db/panel/landing jest zielony; logowanie administracyjne,
  pulpit, liczniki, widoki Dzień/Tydzień/Miesiąc, bezpośredni widok Recepcja
  oraz szczegóły syntetycznej wizyty zweryfikowane bez zmiany danych.
  Wykryto 🟡: zaimplementowany widok Recepcja nie był dostępny w przełączniku;
  dodano i wdrożono responsywny przycisk z testem fail-first (CI
  `30454936758`, deploy `30454935479`; mobile 390 px bez overflow). Dataset
  zawiera wizyty w środę mimo poprawnego komunikatu „salon zamknięty” —
  finding danych do decyzji przed przebiegiem finansowym UAT.
- **Faza A zamknięta: E2.5 + E2.11** (2026-07-29): produkcyjny Sentry
  przyjął testowe zdarzenia backendu, a alert syntetycznej rezerwacji został
  fizycznie odebrany i potwierdzony przez ownera. Po teście usunięto wizytę,
  konta testowe i powiązane logi. Przy aktywacji DSN wykryto i naprawiono
  inicjalizację Replay podczas SSR oraz parser health-checku w
  `safe-update-api-env.sh`; oba przypadki mają weryfikację fail-first.
- **E2.2 zakończone** (2026-07-29): hasło jedynego konta admina obrócono
  losowo, zapisano wyłącznie w macOS Keychain i potwierdzono logowaniem przez
  produkcyjne API. Dodano fail-closed
  `scripts/rotate-prelive-admin-password.sh` do ponownej rotacji po UAT.
- **Poświadczenie PostgreSQL obrócone** (2026-07-29): zaktualizowano konto
  bazy, produkcyjny i lokalny env oraz sekrety GitHub Actions
  (`DATABASE_URL`, `MYDEVIL_DB_PASSWORD`, `PGPASSWORD`). Nowe logowanie działa,
  stare jest odrzucane (`28P01`), a API raportuje `status=ok`, `database=ok`.
  Updater env wymusza teraz tryb `600` dla aktywnego pliku i backupów; regresję
  chroni test z atrapą SSH uruchamiany w CI.
- **E4.2 zakończone** (2026-07-29): po świeżym dumpie, semantycznym preflighcie
  FK i read-only `PREPARE` wszystkich 20 szablonów insertów wykonano jedno
  zatwierdzone `apply`. Usunięto stare dane operacyjne oraz dokładnie 188 logów
  przypisanych do 5 resetowanych klientów; pozostałe logi zachowano. Utworzono
  dataset bez PII i realnych cen: 12 klientów, 30 wizyt, 12 produktów i 5
  dokumentów. `verify`: 2 chronione konta, 0 niesyntetycznych klientów,
  0 blockerów. `/healthz` jest zielone, a regresja Playwright
  `30443911725` przeszła 23/23 testy.
- **Naprawiony deploy statyków frontendu** (master `5a7a38a9`, run
  `30401261957`): wielocommitowy push nie jest już mylony z force-pushem,
  ekstrakcja ma rollback i retencję jednej poprzedniej generacji assetów.
  Po deployu stary i nowy build manifest odpowiadają 200; mobilny smoke
  390×844 ma komplet CSS/JS, widoczne karty i 0 błędów konsoli.
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

1. Po finalnym przeglądzie całej gałęzi wdrożyć kod, a następnie wykonać
   wyłącznie odczytowy produkcyjny `synthetic:data:plan`. Nie wykonywać
   automatycznego resetu: jedno `apply` wymaga późniejszej, osobnej zgody
   ownera i świeżego `pg_dump`.
2. Następnie dokończyć **fazę B: UAT** wg `docs/UAT_PLAN.md`: wykonać oznaczony
   przepływ umówienie → finalizacja → magazyn → statystyki.
3. Osobny follow-up: responsywność szerokich tabel/formularzy oraz wymaganie
   kompletu zrzutów modali w `e2e-visual-sweep.yml`.

## Zablokowane na ownerze

| # | Co | Czas |
|---|---|---|
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
