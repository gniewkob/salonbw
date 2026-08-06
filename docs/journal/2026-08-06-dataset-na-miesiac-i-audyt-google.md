# Dataset na kolejny miesiąc + audyt gotowości logowania Google

- **Data:** 2026-08-06
- **Agent:** Claude (prośba właściciela: „wypełnij kolejny miesiąc" + „co trzeba, żeby zarejestrować się przez Google")
- **Commity:** `764ecb68` (generator), `2b429f0e` (E2.1)
- **Operacja produkcyjna:** `synthetic:data:apply` (zatwierdzona przez ownera)

## Finding

**1. Kalendarz był pusty od dziś w przód.** Wizyty w bazie kończyły się na
`2026-08-05` — od 2026-08-06 ani jednej. Rozkład tygodniowy pokazywał
wszystko upchane w tygodniach 28–32.

Powierzchowna diagnoza wskazywałaby na stałe (`SYNTHETIC_FUTURE_DAYS = 60`
wyglądał poprawnie). **Realna przyczyna była w alokatorze:** przyszłe drafty
dostawały `futureCandidates()` — wszystkie nadchodzące dni posortowane
rosnąco — a `allocateAppointment()` bierze pierwszy wolny slot. Pole
`preferredOffset` było dla nich **martwe**; liczyło się wyłącznie dla
przeszłych wizyt, gdzie `preferredPastCandidates()` sortuje kandydatów wg
odległości od preferowanego dnia. Efekt: każda przyszła wizyta lądowała tuż
za kotwicą, a tydzień później kalendarz znów wyglądał na pusty.

Dowód, że to była przyczyna, a nie objaw: po samej zmianie stałych
(30→70 wizyt, rozrzut 14→30 dni) nowy test regresyjny **nadal failował** —
dopiero poprawka alokatora go zazieleniła.

**2. Logowanie Google jest gotowe w kodzie, ale nieskonfigurowane.**
Zweryfikowane na żywo: `api.salon-bw.pl/auth/social/google` → **404**
(moduł ładuje się warunkowo w `app.module.ts:133`, bez `GOOGLE_CLIENT_ID`
nie istnieje), brak `GOOGLE_*` w produkcyjnym `.env`, przycisk w panelu
ukryty flagą `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`. To stan zamierzony, nie bug.

## Change

`src/database/synthetic-data/synthetic-data.dataset.ts`:
- nowe `preferredFutureCandidates()` — lustro logiki przeszłej, sortuje
  kandydatów wg odległości od dnia, o który draft prosił;
- wolumen i rozrzut wyciągnięte ze zmagicznionych literałów do nazwanych,
  eksportowanych stałych: `SYNTHETIC_CLIENT_COUNT` 12→20,
  `SYNTHETIC_APPOINTMENT_COUNT` 30→70, `SYNTHETIC_FUTURE_SPREAD_DAYS`
  14→30, `SYNTHETIC_PAST_SPREAD_DAYS` 21;
- testy asertują stałe zamiast zahardkodowanych liczb; `commissions`
  wywodzi się z datasetu (jest pochodną liczby wizyt `completed`).

## Validation

- Backend: `pnpm test` 340/340, `tsc` czysty, `lint` 0 błędów
  (153 przedistniejące ostrzeżenia `no-unsafe-*`, bez zmian).
- Nowy test regresyjny broni właściwości, nie liczby: najdalsza przyszła
  wizyta wypada dalej niż 2 tygodnie od kotwicy i mieści się w horyzoncie.
- **Backup przed operacją:** świeży `pg_dump --format=custom` streamowany
  z hosta (pg_dump serwera, brak ryzyka niezgodności wersji) do lokalnego
  pliku `600`. Integralność sprawdzona: nagłówek `PGDMP`, `pg_restore
  --list` czyta spis treści, **80 pozycji TABLE DATA**.
- `synthetic:data:plan` (dry-run) przed zapisem: 0 blokerów, usunięcie
  14 klientek/33 wizyt, utworzenie 20 klientek/70 wizyt.
- `synthetic:data:apply`: transakcja zatwierdzona, weryfikacja wbudowana
  `actual == expected`, `protectedAccountsPresent: 2`,
  `remainingNonSyntheticClients: 0`, **`scheduleViolations: 0`**.
- **Niezależna kontrola rozkładu po apply:** **43 wizyty w przyszłości**
  (przed operacją: **0**), 27 w przeszłości, rozłożone na tygodnie 29–36
  (2026-07-16 → 2026-09-03), z gęstością 15/13/6/6/6 w tygodniach do
  przodu. `/healthz` ok, kalendarz w panelu renderuje 15 wizyt w bieżącym
  tygodniu.
- Przy okazji potwierdzone na żywo (dwukrotnie, przypadkiem): fix
  `d95ede94` działa — wygasła sesja wraca na `/auth/login?redirectTo=…`
  i po zalogowaniu ląduje na właściwej stronie.

## Rollout

Kod na `master`, wdrożony (deploy `success`). Operacja danych wykonana
lokalnie przeciw produkcyjnej bazie — ta sama procedura co rollout
z 2026-07-30.

Przy okazji resetu **zniknęły śmieci po UAT** (konta „UAT Klientka
Testowa"/„Kontynuacja" i 4 przeterminowane rezerwacje `online_pending`
wyświetlane jako „Niedobyta") — pozycja cleanupu z backlogu Fazy C jest
tym samym zamknięta.

## Follow-up

1. **Brak wizyt `in_progress`** w nowym datasecie — 9 sztuk zostało
   skonwertowanych na `confirmed`, bo generator uruchomiono o 19:21, poza
   godzinami pracy Oli (status „W trakcie" z definicji wymaga kotwicy
   wewnątrz godzin otwarcia). To poprawne zachowanie, nie bug. Jeśli
   właściciel chce testować ten status, wystarczy powtórzyć `apply` w
   godzinach pracy salonu.
2. **Logowanie Google — do uruchomienia potrzeba trzech kroków:**
   - *(owner)* Google Cloud Console → OAuth client ID typu **Web
     application**; redirect URI dokładnie
     `https://api.salon-bw.pl/auth/social/google/callback`, JS origin
     `https://panel.salon-bw.pl`; skonfigurowany consent screen (przy
     statusie „Testing" zalogują się wyłącznie konta z listy testowej —
     do publicznego użytku trzeba opublikować);
   - *(owner → agent)* przekazanie `CLIENT_ID`/`CLIENT_SECRET`, które
     agent wprowadza przez `scripts/safe-update-api-env.sh` (backup +
     guardrail + weryfikacja health);
   - *(agent)* `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` w zmiennych GitHuba
     **w obu środowiskach** (`staging` i `production` — znany quirk
     deploya) + redeploy panelu.
   Logowanie Google tworzy konto wyłącznie z rolą `client`, linkuje po
   e-mailu do istniejącego konta i ustawia te same cookies SSO co zwykły
   login. Apple wymaga płatnego Apple Developer (~$99/rok) — osobny temat.
