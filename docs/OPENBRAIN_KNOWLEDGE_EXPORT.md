# SalonBW — eksport wiedzy do OpenBrain

_Stan na 2026-07-10 (master `223f985`+). Format: 1 sekcja `## NOTE:` = 1 wpis
do `brain_store` / `brain_store_bulk` (domain: `build`, tagi w nagłówku).
Gdy konektor OpenBrain MCP zostanie ponownie autoryzowany w claude.ai,
agent importuje ten plik hurtem i odnotowuje datę importu na dole._

---

## NOTE: salonbw-projekt-cel-i-kontekst
tags: salonbw, business-context

Panel SalonBW powstaje, bo Booksy kupiło Versum — żona ownera (Aleksandra,
stylistka) nie chce ich polityki/reklam. Cel: własny panel dla JEDNOOSOBOWEJ
działalności (salon fryzjerski Black & White, Bytom, ul. Webera 1a/13).
Trzy aplikacje: landing (dev.salon-bw.pl — publiczny salon-bw.pl to STARY,
osobny serwis, celowo nieruszany do decyzji o cutoverze), panel
(panel.salon-bw.pl, Next.js Pages Router + Bootstrap 5.3, PO POLSKU),
API (api.salon-bw.pl, NestJS + TypeORM + Postgres). Hosting: MyDevil
(FreeBSD, Passenger), konto `vetternkraft`, serwer s0.mydevil.net.
Deploy: GitHub Actions push na master → build + upload + MIGRACJE + restart.
Klientka rezerwuje online (online_pending → confirmed), staff zarządza
kalendarzem, finalizacja z płatnością/rabatami/dodatkami/materiałami
(dedukcja magazynu), klient widzi wizyty BEZ CEN.

## NOTE: salonbw-twarde-reguly-i-pulapki
tags: salonbw, rules, traps

1) UI wyłącznie po polsku. 2) Zakaz niebieskiego: .btn-primary /
.btn-outline-primary mają ZASZYTY niebieski (retune --bs-primary ich nie
zmienia) — używać btn-dark/btn-outline-dark/PanelButton; brand czerń/biel/
srebro (#0d0d0d/#6e7278/#b4b8be). 3) Każda mutacja ma onError z toastem.
4) type="button" na nie-submit (PanelButton ma default). 5) Modale: role=
dialog + aria-modal + focus trap; NIGDY klasa `modal fade` bez `.show` —
w BS5 to opacity:0 = modal niewidoczny (bug uderzył 7 razy!). 6) Daty
lokalne: NIGDY toISOString().slice(0,10) (przesuwa dzień w UTC+) — używać
apps/panel/src/utils/date.ts. 7) Backend: globalny ValidationPipe z
forbidNonWhitelisted — pole spoza DTO = 400 (ta klasa ZEPSUŁA REJESTRACJĘ
na prod); numeryczne query-paramy wymagają @Type(() => Number). 8) Encje:
kolumna Date|null lub union MUSI mieć jawne type: w @Column, inaczej API
nie wstaje (ColumnTypeUndefinedError — położyło deploy 3x). 9) Nowa wartość
LogAction = migracja ALTER TYPE ADD VALUE (enum zamrożony). 10) Migracje
FK-safe, idempotentne, z down(); destrukcyjne tylko za zgodą ownera.
11) Nowe repo w konstruktorze serwisu = mocki w test-context. 12) Klient
NIE widzi cen (żadnych paidAmount/internalNote w projekcjach klienckich).
13) appointments.notes NIE ISTNIEJE (usunięta 2026-07-09) — pola
strukturalne: clientComment, staffRecommendations, onlineAddonsSummary,
onlineTotalDurationMinutes, onlineDurationNeedsVerification; internalNote
= prywatne staffu. 14) jsdom NIE wykrywa niezgodności ról ARIA z realnym
Chromium (np. input[type=search] ignoruje role=combobox) — accessibility
weryfikować realnym E2E. 15) Weryfikować UI realnym kliknięciem myszy,
nie element.click() w JS (fałszywe pozytywy przy opacity:0). 16) Wiele
router.push({...router.query}) w jednym ticku = klobber przez stale
snapshot — merge na synchronicznym ref. 17) Decimal z Postgresa przychodzi
jako STRING — Number() przed .toFixed. 18) grid: repeat(7,1fr) =
minmax(auto,1fr) — do równych kolumn zawsze minmax(0,1fr).

## NOTE: salonbw-architektura-i-deploy
tags: salonbw, architecture, deploy

Monorepo pnpm: apps/panel, apps/landing, backend/salonbw-backend.
Panel: persistent shell w _app.tsx (VersumShell/SalonShell), secondary nav
przez useSetSecondaryNav (nie inline!), /calendar POZA shellem. Deploy
(deploy.yml): push na master → path-filter wybiera landing/panel/api;
workflow_dispatch z target=landing|panel|api|all|probe + environment.
UWAGA: push-deploy czyta zmienne środowiska STAGING mimo DEPLOY_ENV=
production (quirk) — flagi typu POS_ENABLED ustawiać w OBU środowiskach.
Deploy NIE uruchamia testów jednostkowych (osobny CI). Krok migracji:
if [ -f dist/src/migrate.js ] (fallback || maskował błędy — naprawione).
Krok „Verify SSH Connectivity" ma diagnostykę SFTP na ścieżce błędu
(rozróżnia SFTP-only od pełnej blokady). E2E Playwright Regression
(e2e-playwright-regression.yml) bije w ŻYWY PROD po każdym pushu
dotykającym panelu — sekrety E2E_ADMIN_*/E2E_CLIENT_* + var E2E_BASE_URL;
specy w apps/panel/tests/e2e/regression/ są READ-ONLY ze skip-guardami.
Konta: Aleksandra id 29 (admin+stylistka, kontakt@salon-bw.pl), e2e.client
.0628 id 53 (CI Playwright — NIE USUWAĆ), „Test tesr" id 54 (konto ownera).

## NOTE: salonbw-incydent-ssh-deploy-2026-07
tags: salonbw, incident, ssh, mydevil

Objaw: od `165e914` (2026-07-09 ~19:18) każdy deploy padał na „Verify SSH
Connectivity": klucz przechodził autoryzację (Identity added), ale serwer
odrzucał exec („exec request failed on channel 0"). Diagnostyka dodana do
workflow (`c144b4d`) pokazała, że SFTP też pada („subsystem request failed")
— czyli NIE tryb SFTP-only. Kluczowe zawężenie: wszystkie 3 serwisy WWW
działały (healthz 200, DB/SMTP ok) → konto nie zawieszone, limity procesów
nie wyczerpane → została hipoteza WYGASZONEGO dostępu SSH na koncie MyDevil
(SSH włączany czasowo; po wygaśnięciu klucz dalej autoryzuje, ale każdy
kanał jest odrzucany). POTWIERDZONE: owner włączył SSH w panelu MyDevil
2026-07-10 i deploy ruszył. Lekcje: (a) commity docs-only padające na tym
samym kroku = dowód że to nie kod; (b) czerwone E2E na prodzie przy
zamrożonym deployu to NIE regresja kodu — prod nie ma nowych commitów;
(c) diagnostyka SFTP zostaje na stałe w deploy.yml; (d) sandbox Claude
NIE może SSH-ować nigdzie (proxy wycisza porty non-HTTP — CONNECT:22
zwraca 200 ale zero danych, sprawdzone kontrolnie na github.com:22).

## NOTE: salonbw-stan-projektu-2026-07-10
tags: salonbw, status

ZROBIONE (plan 10/10 + plan Sonneta): Fazy 1-3 i 5 planu 10/10 (historia
wizyt+oceny klienta, smoke-pass staff, design sweep a11y Lighthouse 100,
cleanup danych testowych); decyzje ownera 1-5 wdrożone (staff-confirm
reschedule wrócił, dodatki online = pozycje rozliczeniowe finalizacji z
pre-fill, osobne zgody kanałów, description zablokowane dla klienta,
wymóg importu danych strukturalnych); GDPR audit-trail zgód
(CONSENT_UPDATED); avatar klientki widoczny u staffa; P3 techniczne
(PanelButton default, feed id-collision, badge=pending count, debounce,
util dat); Z1 pogrupowany addon-picker (+remap przy zmianie długości —
fix z review `3e6becc`); Z2 combobox-ARIA omniboksu (type=text!);
Z3 specy Playwright (22 testy/8 plików). Batche ownera (Codex) z 07-07/
07-08/07-09 przereviewowane — naprawione: P0 rejestracja (whatsappConsent
w RegisterDto), pomoc-403 (→/emails/contact), 4 niewidoczne modale,
filtr dodatków isActive+onlineBooking, no_show z rescheduled_pending,
czyszczenie clientComment (undefined vs null), finalize nie wymazuje
staffRecommendations. Kolumna notes USUNIĘTA z prod.
OTWARTE: Z4 import danych prod (czeka na wsad; clientComment/
staffRecommendations wypełniać BEZPOŚREDNIO — parsera już nie ma!);
Z5 residuum magazynu (za zgodą ownera); Faza 4 ownera: backup bazy
(KRYTYCZNE), zmiana temp hasła admina, SMSAPI_TOKEN, decyzja o domenie,
Sentry DSN, Google OAuth; rozdzielenie semantyki zgód marketing-vs-
transakcyjne (decyzja ownera); UPLOADS_DIR na MyDevil (czy avatary
przetrwają deploy); live E2E staff-flow po deployu.

## NOTE: salonbw-rytualy-agenta
tags: salonbw, workflow, agents

Start sesji: git pull (owner pracuje równolegle na masterze — stream
Codex!), top-3 wpisy .claude/rules/active-context.md, status Deploy
(failure = priorytet). Koniec zadania: prettier+eslint+tsc, pełne testy
(panel 307+, backend 242+; testów nie wycofujemy), commit na branchu
claude/design-salon-landing-page-thY4G → push → ff-merge do master →
push; przy odrzuceniu: fetch+rebase+testy PO rebase. NATYCHMIAST wpis do
active-context (git add -f — katalog w .gitignore). Dokumenty: active-
context = dziennik+backlog; docs/SONNET_EXECUTION_PLAN.md = zadania
wykonawcze; docs/PANEL_10_10_PLAN.md = historia decyzji. Model-fit:
Sonnet = UI-plumbing/testy wg jawnych kontraktów, Opus/Fable = review,
integracja, debug prod, migracje destrukcyjne. Każdy batch ownera na
masterze przechodzi review (6 klas błędów: kolumny bez type, DTO-
whitelist, modal fade, angielskie stringi, niebieskie klasy, brak testów).

---

_Import do OpenBrain: wykonać brain_store per sekcja (title = nazwa NOTE,
content = treść, domain=build, tags jak w nagłówku), potem dopisać tu
"Zaimportowano: <data>" i commit._
