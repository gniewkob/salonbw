# Weryfikacja stanu po sześciu tygodniach przestoju

- **Data:** 2026-10-22
- **Agent:** Claude Opus 5
- **Commit(y):** ten commit (tylko dokumentacja)
- **PR:** gałąź `claude/przygotowany-plan-rp46za`

## Finding

Owner poprosił o ponowną weryfikację, bo nie wiedział, jak aktualny jest zapis.
Słusznie: ostatni commit na masterze to **2026-09-12**, czyli **sześć tygodni
ciszy**. Żaden fakt w `PROJECT_STATE.md` nie był młodszy niż 11 września, a
zasada świeżości (§6 protokołu) uznaje fakt starszy niż ~7 dni za niepewny.
Trzy z nich okazały się nieaktualne, dwa w sposób mylący.

### 1. Token Instagrama znów wygasł (było: `instagram ok`)

`api/healthz` zwraca `instagram: error`, `instagram_http_400_oauthexception_190_0`
— dwa pomiary pod rząd, więc nie chwilowa awaria. Kod 190 to unieważniony lub
wygasły token.

Skutek sprawdzony na żywo: `dev.salon-bw.pl/gallery` oddaje 200, ale **zero
URL-i do mediów IG** i komunikat „Galeria Instagram jest chwilowo niedostępna".
Degradacja jest uczciwa (brak crasha, brak fałszywej treści), ale strona
pokazująca prace salonu jest pusta.

To **trzeci** cykl wygaśnięcia (lipiec → naprawa → dziś). Długie tokeny IG żyją
~60 dni, więc bez automatycznego odświeżania to się powtórzy około grudnia.
`refresh_access_token` działa tylko na tokenie jeszcze **nieprzedawnionym**, a
ten już jest — więc jedyną naprawą jest nowy token wygenerowany interaktywnie
w narzędziach Meta, wprowadzony przez `scripts/safe-update-instagram-token.sh`.

Uwaga do dokumentacji: `docs/ENV.md` nazywa to „Instagram Basic Display API", ale
to API zostało wyłączone w grudniu 2024. Skrypt waliduje przez
`graph.instagram.com/me`, co dziś odpowiada **Instagram API with Instagram
Login**. Nazwa w ENV.md jest przedawniona i myli przy generowaniu tokenu.

### 2. Audyt bezpieczeństwa: 6 krytycznych, 24 wysokie

`pnpm audit --audit-level=high` na obecnym lockfile: **63 podatności — 4 low,
29 moderate, 24 high, 6 critical**. Stan z `PROJECT_STATE.md` („0 high/critical
i 3 moderate", 2026-09-10) jest nieaktualny — sześć tygodni bez aktualizacji
zależności przy aktywnym dependabocie.

Krytyczne:

| Pakiet | Naprawione w | Gdzie | Co |
|---|---|---|---|
| `next` | >=15.5.28 | apps/landing | **Nieuwierzytelnione RCE** |
| `@sentry/nextjs` | >=10.75.2 | apps/landing | obejście middleware |
| `dompurify` | >=3.4.17 | apps/panel | obejście SAFE_FOR_TEMPLATES |
| `handlebars` (×2) | >=4.7.10 | root | wstrzyknięcie JS |
| `proxy-addr` | >=2.0.8 | backend | spoofing IP |

Najpoważniejsze jest pierwsze: nieuwierzytelnione RCE w Next na **publicznie
dostępnym landingu**.

### 3. Oba PR-y bezpieczeństwa są bezużyteczne w obecnej formie

Przegląd #1506 i #1507 — żaden nie jest gotowy do mergea, z **dwóch różnych
przyczyn**:

**#1507 (next 15.5.24 → 15.5.27) to no-op, mimo zielonego CI.**
`pnpm-workspace.yaml` ma w `overrides` wpis `next: 15.5.24`. Override wygrywa z
`package.json`, więc po mergeu zainstalowany byłby nadal **15.5.24**. Lockfile
zapisuje `specifier: 15.5.24`, dlatego `--frozen-lockfile` przechodzi i CI
świeci na zielono — co jest tu pułapką, bo sugeruje załataną podatność.
Podwójnie bezcelowy: advisory wymaga `>=15.5.28`, a PR celuje w 15.5.27, który
wciąż mieści się w zakresie podatnym (`<=15.5.27`).
**Realna naprawa wymaga podniesienia override w `pnpm-workspace.yaml`**, nie
samego `package.json`.

**#1506 (nodemailer ^9.1.0 → ^10.0.9) nie buduje się.**
Nie ma override na nodemailer, więc zmiana jest realna — ale PR nie rusza
`pnpm-lock.yaml` (lock trzyma `specifier: ^9.1.0`, `version: 9.1.1`), a CI
instaluje przez `pnpm install --frozen-lockfile`. Stąd `Backend API` pada po
~35 s i `Security Audit` po ~13 s: to błąd instalacji, nie testów.
Sama zmiana wersji jest **niskiego ryzyka merytorycznie**: kod używa wyłącznie
`createTransport({host,port,secure,auth})`, `sendMail({to,subject,html,from})`
i `verify()` (`emails.service.ts`), czyli najstabilniejszej części API, dodatkowo
odciętej własnym typem `MailTransporter`. Node nie blokuje: `engines >=22`,
`.nvmrc` 22, CI 22, host `node22`.

To tłumaczy, dlaczego **24 PR-y dependabota gniją od sierpnia**: bot podnosi
`package.json` bez lockfile'a, a brama CI wymaga zamrożonego locka.

### 4. Konsekwencja operacyjna: deploy jest zablokowany

Brama `Security Audit` pada na high/critical, a `deploy.yml` wymaga zielonego CI
dla konkretnego SHA. Audyt padł na #1507, który wobec mastera jest zmianą
pustą — czyli **audyt na masterze już faktycznie pada**. Każdy następny push
zatrzyma się na tej bramie. Nie da się dziś niczego wdrożyć bez naprawy
zależności albo świadomego uchylenia bramy.

### 5. Protokół przekazania działa, ale `PROJECT_STATE.md` spuchł

Dobra wiadomość: **55 wpisów w journalu** między 27.07 a 12.09, jeden plik na
zadanie, zero konfliktów merge w dokumentacji. Archiwalny `AGENT_STATUS.md`
tknięty raz (07.08) i potem już nie.

Drift: `PROJECT_STATE.md` ma **473 linie / 32 KB** zamiast „jednej strony,
nadpisywanej" (§4). Sekcja „Ostatnio zrobione" to 265 linii i przestała spełniać
swoją funkcję — zimny start znów wymaga czytania setek linii. Nie skracam tego
jednosobowo: to trzy miesiące pracy innych agentów i decyzja o tym, co zostaje,
nie należy do przypadkowej sesji. Zgłoszone jako follow-up.

## Change

Wyłącznie dokumentacja. Żadnej zmiany kodu, zależności ani konfiguracji.

- ten wpis,
- `docs/PROJECT_STATE.md`: data i autor, nowe fakty z 2026-10-22 na początku
  sekcji „Fakty zweryfikowane", przepisana sekcja „Otwarte problemy i następny
  krok" (blokada bramy audytu wyprzedza import danych), zaktualizowana pozycja
  Instagrama w „Zablokowane na ownerze".

## Validation

Wszystko mierzone, nie zakładane, 2026-10-22 ok. 21:51 UTC:

- `api/healthz` 200: `database` ok (18 ms), `smtp` ok (110 ms),
  `instagram` **error** (`oauthexception_190_0`, 2 pomiary).
- `panel.salon-bw.pl` 307; `dev.salon-bw.pl` 200.
- `salon-bw.pl` 301 → `www`, nadal **stary PHP 8.1.34**, zero wystąpień
  `_next` → cutover landingu nie nastąpił.
- `dev.salon-bw.pl/gallery` 200, 0 URL-i mediów IG, komunikat o niedostępności.
- `pnpm audit --audit-level=high`: 24 high / 6 critical (lista wyżej).
- Ostatni `Deploy (MyDevil)` na masterze: `34712638623`, **success**, 12.09.
- Diff `#1506` i `#1507` wobec mastera: odpowiednio 1 i 2 pliki, **żaden nie
  zawiera `pnpm-lock.yaml`**; `next: 15.5.24` potwierdzone w `overrides`.

Nie czytano i nie modyfikowano danych klientek. Nie użyto kont. Zero zapisów.

## Rollout

Brak — dokumentacja. Nie wymaga deployu (i deploy jest i tak zablokowany, §4).

## Follow-up

Kolejność sugerowana, **nie wykonana w tej sesji** (wymaga decyzji ownera, bo
to podniesienie zależności na ścieżce maili i publicznego landingu):

1. **`next >= 15.5.28` przez `overrides` w `pnpm-workspace.yaml`** + regeneracja
   lockfile'a. Zamyka nieuwierzytelnione RCE na publicznym landingu. Najwyższy
   priorytet. Zamknie też #1507, który należy odrzucić jako no-op.
2. Pozostałe krytyczne: `@sentry/nextjs`, `dompurify`, `handlebars`, `proxy-addr`.
3. `nodemailer >= 10.0.6` **z lockfile'em** (zastępuje #1506). Po wdrożeniu
   `healthz.smtp = ok` potwierdza `createTransport` + `verify`; realne wysłanie
   wymaga testu alertu o rezerwacji.
4. Skonfigurować dependabota tak, by aktualizował `pnpm-lock.yaml` — inaczej
   każdy przyszły PR bezpieczeństwa powtórzy ten sam martwy cykl.
5. Automatyczne odświeżanie tokenu IG przed 60-dniowym terminem (cron na
   `refresh_access_token`), żeby zamknąć powtarzalną awarię galerii.
6. Skrócić `PROJECT_STATE.md` do jednej strony; szczegóły zostają w journalu.
7. Poprawić nazwę API Instagrama w `docs/ENV.md` (nie „Basic Display").

**Przed importem rzeczywistych danych** wrócić do pominiętego restore-drillu
(decyzja ownera 2026-08-06). Następnym krokiem planu jest nieodwracalny import,
a dowodu odtwarzalności backupu nadal nie ma.
