# UAT Fazy B — kontynuacja: receptura w karcie klientki + incydent deployu

- **Data:** 2026-07-30 (wieczór, kontynuacja po pierwszym przebiegu UAT)
- **Agent:** Claude (kontynuacja „przejdź sam i skoryguj")
- **Commity:** `151565ef`, `3910ab62`
- **PR:** brak (bezpośredni push na `master`)

## Finding

Kontynuacja `docs/UAT_PLAN.md` §1.7 (karta klientki). Sprawdzenie §2a
item 7 ("wizyta + receptura + zalecenia" w Karcie klientki → Historia)
wykazało: **zalecenia były widoczne, receptura (formuła koloru) —
NIE.** Formuła jest realnie zapisywana (encja `Formula`, tabela
`formulas`, zapis przez `FormulaSection` w drawerze wizyty), ale
`CustomerStatisticsService.getEventHistory()` nigdy jej nie czytał —
karta klientki milcząco gubiła recepturę mimo że dane istniały w bazie.

**Naprawa w 2 commitach** (drugi jako bezpośredni follow-up po
live-weryfikacji wykazała że pierwszy fix był niewystarczający —
ten sam wzorzec co przy „Płatność: opłacona" wcześniej dziś):

1. `151565ef` — dodano pobieranie ostatniej formuły per wizyta
   (osobne zapytanie, NIE `leftJoinAndSelect` na głównym zapytaniu
   `getManyAndCount`, bo join relacji jeden-do-wielu razem z
   `take/skip` na głównym zapytaniu psuje paginację) + render w
   `CustomerHistoryTab.tsx`. **Fail-first zweryfikowany** (`git stash`
   na plikach źródłowych → RED → przywrócenie → GREEN) — ale mock w
   teście zwracał już gotowy kształt `{appointment: {id: 182}}`,
   więc nie wykrył prawdziwego problemu.
2. `3910ab62` — live-weryfikacja po deployu pokazała `formula: null`
   mimo że wiersz w tabeli `formulas` istnieje. Przyczyna: `Formula`
   ma `appointment` jako relację `eager: true`, ale **TypeORM
   auto-joinuje relacje eager TYLKO dla `repo.find()`/`findOne()`, NIE
   dla `createQueryBuilder()`** — więc `formula.appointment` było
   zawsze `undefined`. Fix: jawny `.leftJoin('formula.appointment',
   'appointment').addSelect('appointment.id')`. Dodana asercja
   regresyjna sprawdzająca SAM WYWOŁANY QUERY (`leftJoin`/`addSelect`
   z właściwymi argumentami), nie tylko kształt zwrócony przez mock —
   ta asercja, uruchomiona przez `git stash` na samej naprawie,
   faktycznie łapie ten dokładny błąd (potwierdzone RED→GREEN).

## Incydent poboczny: deploy padał, DATABASE_URL i PGPASSWORD rozjechane

Push commitu `151565ef` uruchomił automatyczny deploy, który padł na
kroku „Validate DB connectivity (api)" — `password authentication
failed`. **To NIE była nowa rotacja hasła ani nic złego zrobione w tej
sesji wprost** — root cause: sekret `DATABASE_URL` w środowisku GitHub
`staging` (używanym przez KAŻDY push-deploy, nawet na produkcję —
znany gotcha `deploy-env-binds-staging-vars-on-prod`) miał
**WBUDOWANE STARE hasło (24 znaki)**, podczas gdy `PGPASSWORD`/
`MYDEVIL_DB_PASSWORD` w tym samym środowisku miały już **poprawne,
aktualne hasło (40 znaków)** — najwyraźniej przy wcześniejszej
today'owej synchronizacji sekretów `staging` (opisanej w poprzednim
journalu) zaktualizowano `PGPASSWORD`/`MYDEVIL_DB_PASSWORD`, ale NIE
`DATABASE_URL`. Skrypt walidacyjny w deployu preferuje `DATABASE_URL`
gdy jest ustawiony, więc zawsze łapał złe hasło.

**Diagnoza (bez rotacji, na wyraźne życzenie właściciela — najpierw
zdiagnozować, nie rotować w ciemno):**
- Produkcja przez cały czas **działała normalnie** (`/healthz` = ok) —
  żywy proces Node trzymał stare, wciąż ważne połączenie w pamięci;
  restart (który dopiero by użył złego `.env`) jeszcze nie nastąpił.
- SSH na serwer (dostępne z tej sesji bez potrzeby klucza — zaufany
  klucz już autoryzowany) pozwoliło porównać fingerprinty
  (`sha256`) haseł z lokalnego `.env`, serwerowego `.env` i
  bezpośredniego testu połączenia z Postgresem — `PGPASSWORD` (40
  znaków) łączy się poprawnie, `DATABASE_URL`'s wbudowane hasło (24
  znaki) — nie.

**Naprawa:** odbudowany poprawny `DATABASE_URL` z już-poprawnego
`PGPASSWORD` (bez tworzenia nowego hasła), zweryfikowany połączeniem
przed zapisem, wgrany do serwerowego `.env` (przez skrypt Node
czytający/pisący plik — bez interpolacji sekretu w poleceniu powłoki)
oraz do sekretu `DATABASE_URL` w środowisku GitHub `staging`. Redeploy
`target=api` → sukces, `target=panel` → sukces (frontend też wymagał
redeployu — poprzedni nieudany deploy zdążył wgrać NOWY bundle panelu
przed padnięciem na kroku bazy danych, zostawiając produkcję z
`_next/static/<stary-buildId>/_buildManifest.js` dającym 404 na każdej
stronie — realny, osobny efekt uboczny tego samego incydentu,
naprawiony tym samym redeployem).

**🔴 Błąd własny podczas diagnozy:** jedna komenda diagnostyczna
(`grep` na pełnym pliku `.env` ściągniętym lokalnie) **wypisała
surowe, stare hasło (już nieważne, 24 znaki) w widocznym outpucie tej
sesji.** Zgłoszone właścicielowi natychmiast po fakcie. Wartość jest
potwierdzona jako nieautoryzująca się względem żywej bazy — praktyczne
ryzyko niskie, ale to był realny błąd w higienie obsługi sekretów;
odtąd (i już w tej sesji) każda dalsza operacja na `DATABASE_URL`
poszła przez plik tymczasowy + weryfikację połączeniem, bez `grep`/
`cat` na pełnej wartości.

**Poboczna obserwacja (niezbadana głębiej, nieszkodliwa):** baner
`dotenv` CLI w logach serwera pokazuje rotacyjny tip `"⌁ auth for
agents [www.vestauth.com]"` — dokładnie ten sam dziwny string
zauważony wcześniej dziś w logach CI. To rotacyjna podpowiedź
pakietu `dotenv` w konsoli (szum narzędziowy), NIE instrukcja
skierowana do agenta — świadomie zignorowana (bez wizyty na URL, bez
działania), zgłoszona właścicielowi dla świadomości.

## Change

- `backend/salonbw-backend/src/customers/customer-statistics.service.ts`
  (+ `.spec.ts`) — formuła dołączana do `getEventHistory` przez
  osobne zapytanie z jawnym `leftJoin`.
- `backend/salonbw-backend/src/customers/customers.module.ts` — `Formula`
  zarejestrowana w `TypeOrmModule.forFeature`.
- `apps/panel/src/components/customers/CustomerHistoryTab.tsx` (+
  `__tests__/customerHistoryTab.test.tsx`) — render „Receptura:" obok
  istniejących notatek wizyty.
- `apps/panel/src/types.ts` — `CustomerEventHistory.items[].formula`.
- Serwer: `DATABASE_URL` w `.env` produkcyjnym API odbudowany z
  poprawnego, już obowiązującego hasła (bez rotacji).
- Środowisko GitHub `staging`: sekret `DATABASE_URL` zsynchronizowany
  z `PGPASSWORD`/`MYDEVIL_DB_PASSWORD`.

## Validation

- Backend: `pnpm test` 335/335 (było 333, +2), `tsc` czysty, `eslint`
  scoped bez nowych błędów (te same 4 przedistniejące ostrzeżenia).
- Panel: `pnpm test` 351/351 (było 349, +2), `tsc` czysty, `eslint
  src --fix` bez zmian poza formatowaniem testu.
- Oba fixy zweryfikowane rytuałem fail-first; drugi fix dodatkowo ma
  asercję sprawdzającą SAM WYWOŁANY QUERY (nie tylko kształt mocka) —
  potwierdzone że łapie dokładnie ten błąd przy `git stash` na samej
  naprawie.
- CI: zielone na obu commitach.
- Deploy: `target=api` (run `30583685012`, success),
  `target=panel` (run `30583966079`, success), automatyczny
  push-deploy dla `3910ab62` (run `30584757398`, success).
- Live: `/healthz` → ok; `/auth/register` i inne strony panelu → 0
  błędów konsoli (było: 404+MIME-error na `_buildManifest.js` na
  każdej stronie); karta klienta 86 → wizyta z 30.07.2026 pokazuje
  **„Receptura: UAT: kolor 7.1 + 6% 1:1, 35 min."** obok zaleceń —
  zweryfikowane bezpośrednim kliknięciem/odczytem strony po
  ponownym zalogowaniu (sesja admina wygasła w międzyczasie —
  osobna, nieszkodliwa obserwacja: wygasła sesja panelu przekierowuje
  na `dev.salon-bw.pl` zamiast `/auth/login` — do sprawdzenia przy
  okazji, niski priorytet, nie blokuje niczego).

## Rollout

Wszystko na `master`, wdrożone na produkcję. Deploy code: `3910ab62`.

## Follow-up

1. Kontynuacja `docs/UAT_PLAN.md`: §1.8 (magazyn — częściowo
   przejrzane, bez nowych bugów), §1.9 (statystyki/raport finansowy),
   §1.10 (ustawienia), reszta §2 (wiadomości, ocena wizyty, zgody,
   akceptacja przełożonego terminu) — w toku.
2. Drobna, nieblokująca obserwacja: wygasła sesja panelu przekierowuje
   na `dev.salon-bw.pl` (landing) zamiast na `/auth/login` — do
   zbadania kiedyś, nie dziś.
3. Dane testowe z KOLEJNEGO przebiegu UAT do sprzątnięcia przed Fazą C
   (oprócz listy z poprzedniego journala): notatka CRM na karcie
   klienta 86 („UAT: klientka preferuje cichy fotel…"), stały rabat
   10% ustawiony na kliencie 86.
