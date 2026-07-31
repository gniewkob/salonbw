# STAN PROJEKTU — czytaj to jako PIERWSZE

> **Ten plik NADPISUJEMY, nie dopisujemy.** Ma zostać jednostronicowy.
> Zasady pracy: [`docs/HANDOFF_PROTOCOL.md`](./HANDOFF_PROTOCOL.md).
> Historia zadań: [`docs/journal/`](./journal/). Plan: [`docs/PROJECT_COMPLETION_PLAN.md`](./PROJECT_COMPLETION_PLAN.md).

**Ostatnia aktualizacja:** 2026-07-31 (noc) · **Aktualizował:** Claude

---

## Cel projektu

Własny panel dla **jednoosobowego salonu fryzjerskiego** (Salon Black & White,
Bytom). Właścicielka **Aleksandra pracuje jako admin** — rola „pracownik" jest
świadomie **poza zakresem** GO. Cel: w pełni działający panel na produkcji,
odejście od Booksy.

## Gdzie jesteśmy

**Faza B** ścieżki do produkcji (§3.0 planu): UAT w toku — cała ścieżka
klientki §2 (rejestracja, rezerwacja, wiadomości, akceptacja zmienionego
terminu, ocena wizyty, edycja zgód) oraz właścicielki §1
(pulpit/kalendarz/wizyta/finalizacja/§2a/karta klientki-notatka+rabat)
przetestowane end-to-end. 6 realnych bugów znalezionych i naprawionych
(Sentry CSP, dublowanie sprzedaży produktów, „Płatność: opłacona", brak
receptury w karcie klientki — 2 warstwy, finalizacja z recepturą zawsze 400).
1 głębszy problem finansowy udokumentowany (nienaprawiony). Magazyn (częściowo)
/statystyki/ustawienia do kontynuacji.

## Fakty o produkcji (ZWERYFIKOWANE — data przy każdym)

| Fakt | Zweryfikowano |
|---|---|
| `panel.salon-bw.pl` → HTTP 307 (login) — **panel JEST na realnej domenie** | 2026-07-28 |
| `dev.salon-bw.pl` → nowy landing (Next), HTTP 200 | 2026-07-28 |
| `/healthz`: HTTP 200 · db/smtp/instagram ok | 2026-07-30 |
| SMS **nie działa** — pusty `SMSAPI_TOKEN` | 2026-07-23 |
| Sentry **frontendu** działa na żywo (0 błędów konsoli po fixie CSP; wcześniej blokowany na każdej stronie) | 2026-07-30 |
| Alert o rezerwacji: mail na `BOOKING_ALERT_EMAIL` fizycznie odebrany | 2026-07-29 |
| Dataset syntetyczny zgodny z grafikiem Oli; `scheduleViolations: 0` | 2026-07-30 |
| Statystyki klienta („Łączne wydatki") już nie dublują sprzedaży produktów (220 zł, było błędnie 255 zł) | 2026-07-30 |
| Hasło produkcyjnej roli PostgreSQL + sekrety GH (repo i `staging`-environment) zsynchronizowane; auto-deploy na push znów działa | 2026-07-30 |
| Hasło jedynego konta admina obrócone (Keychain); CAPTCHA po sesji UAT ustąpiła, login znów działa | 2026-07-30 |
| „Płatność: opłacona" na drawerze wizyty (fix `e05be6fc`) potwierdzone wizualnie na żywo | 2026-07-30 |
| Karta klientki → Historia pokazuje recepturę/formułę koloru obok zaleceń (fix `3910ab62`) | 2026-07-30 |
| `DATABASE_URL` w `staging`-environment i produkcyjnym `.env` zsynchronizowany z `PGPASSWORD`/`MYDEVIL_DB_PASSWORD` (były rozjechane, deploy padał) | 2026-07-30 |
| Finalizacja wizyty z materiałem z receptury (auto-fill) działa (fix `75f13952`); wcześniej zawsze 400 | 2026-07-31 |
| Pełna ścieżka klientki (wiadomości, akceptacja terminu, ocena, zgody) działa end-to-end na żywo | 2026-07-31 |

> Fakt starszy niż ~7 dni = niepewny. Zweryfikuj ponownie (§6 protokołu).

## Ostatnio zrobione

- **UAT Fazy B — pełna ścieżka klientki + bug finalizacji z recepturą**
  (2026-07-31, `75f13952`; pełny zapis
  `docs/journal/2026-07-30-uat-faza-b-drugi-przebieg.md`): dokończenie §2 na
  nowym koncie testowym — wiadomości (dwukierunkowe), reschedule +
  akceptacja przez klientkę, edycja zgód (WhatsApp/e-mail), ocena odbytej
  wizyty (5★+komentarz), przeplatane z akcjami właścicielki. **Znaleziony i
  naprawiony realny bug:** finalizacja KAŻDEJ wizyty dla usługi z recepturą
  (np. farbowanie) zawsze kończyła się 400 — auto-wypełniony materiał z
  receptury wysyłał dodatkowe pole `productName`, którego ściśle
  wybielona (`forbidNonWhitelisted`) DTO backendu nie akceptuje. Błąd BYŁ
  pokazywany (nie cichy), ale jako surowy komunikat walidacji NestJS,
  niezrozumiały dla właścicielki, i całkowicie blokował finalizację. Fix:
  payload `usageMaterials` mapowany do kształtu przewodowego przed wysyłką
  (jak już robił sąsiedni `usageItems`). Zweryfikowane na żywo na TEJ SAMEJ
  wizycie, która wcześniej 400-owała. Odkryta i naprawiona przy okazji:
  własna metodologiczna pułapka (dwie karty przeglądarki dzielą jeden słoik
  ciasteczek — logowanie klientki w jednej karcie wylogowuje admina w
  drugiej; nie dotyczy realnych użytkowników, tylko równoległego testowania).
- **UAT Fazy B — receptura w karcie klientki + incydent deployu** (2026-07-30,
  `151565ef` + `3910ab62`; pełny zapis
  `docs/journal/2026-07-30-uat-faza-b-receptura-i-deploy-incydent.md`):
  §2a item 7 wykazał, że karta klientki → Historia pokazywała zalecenia, ale
  NIE recepturę/formułę koloru mimo że dane istnieją w bazie — backend nigdy
  ich nie czytał. Naprawa w 2 commitach (pierwszy niewystarczający: relacja
  `eager` na encji NIE jest auto-joinowana przez `createQueryBuilder()`, tylko
  przez `repo.find()` — drugi commit dodał jawny `leftJoin` + asercję
  regresyjną sprawdzającą sam wywołany zapytanie, nie tylko kształt mocka).
  **Po drodze realny incydent produkcyjny:** push pierwszego commitu wywołał
  auto-deploy, który padł na „Validate DB connectivity" — `DATABASE_URL` w
  `staging`-environment miał wbudowane STARE hasło (rozjechane względem
  poprawnego `PGPASSWORD`/`MYDEVIL_DB_PASSWORD` z wcześniejszej dzisiejszej
  synchronizacji). Produkcja działała cały czas (`/healthz` ok, stary proces
  trzymał ważne połączenie w pamięci). Zdiagnozowane bez rotacji (na wyraźne
  życzenie właściciela) przez porównanie fingerprintów SHA-256 haseł przez
  SSH; naprawione odbudowaniem `DATABASE_URL` z już-poprawnego `PGPASSWORD`
  (bez tworzenia nowego hasła). Nieudany deploy zdążył też wgrać nowy bundle
  panelu przed padnięciem na kroku bazy — produkcja serwowała stary HTML z
  odwołaniami do nieistniejącego już `_next/static/<buildId>/`, dając 404 na
  każdej stronie; naprawione tym samym redeployem (`target=api`+`target=panel`).
  **Błąd własny:** jedna komenda diagnostyczna przypadkiem wypisała stare
  (już nieważne) hasło w widocznym outpucie sesji — zgłoszone właścicielowi
  natychmiast; dalsze operacje poszły przez plik tymczasowy bez `cat`/`grep`
  pełnej wartości.
- **UAT Fazy B — pierwszy przebieg + 3 realne bugi naprawione** (2026-07-30,
  `c432ae4a` + `e05be6fc`; pełny zapis
  `docs/journal/2026-07-30-uat-faza-b-pierwszy-przebieg.md`): przejście
  ścieżki właścicielki (pulpit, kalendarz, szczegóły wizyty) i pełnej
  finalizacji z dodatkową usługą/sprzedażą/materiałem/rabatem/napiwkiem/
  recepturą (sprawdzian §2a w 9 miejscach), oraz ścieżki klientki
  (rejestracja + rezerwacja online, mobile 390×844). Naprawione: (1) CSP
  panelu blokował Sentry frontendu na każdej stronie (brak
  `*.ingest.de.sentry.io`); (2) statystyki klienta dublowały sprzedaż
  produktu (dwie tabele, `product_sales`+`warehouse_sales`, sumowane
  zamiast wzajemnie wykluczające się); (3) etykieta „Płatność" zawsze
  pokazywała „nieopłacona" niezależnie od stanu — dwuwarstwowy bug
  (martwe pole `paymentStatus` + brakujące `paidAmount` w mapowaniu
  `calendar.tsx`→drawer). Po drodze: deploy padał dwukrotnie z powodu
  desynchronizacji sekretów `staging`-environment po wcześniejszej w tej
  samej sesji rotacji hasła bazy — naprawione, auto-deploy na push
  ponownie działa. **Nienaprawiony, udokumentowany finding:** raport
  finansowy (`statistics.service.ts`) traktuje `paidAmount` (pełna kwota
  transakcji) jako czysty przychód usługowy — zawyża „Sprzedaż usług
  brutto"/„Utarg" o wartość produktów+napiwku sprzedanych przy tej samej
  wizycie. Wymaga osobnego, przetestowanego zadania.
- **PR #1477 zmergowany i wdrożony + produkcyjny rollout danych** (2026-07-30,
  `68a215d7`): generator syntetycznych wizyt respektuje wyłącznie aktywny
  grafik Oli. Pełny zapis: `docs/journal/2026-07-30-synthetic-schedule-rollout.md`.
- **Faza A zamknięta: E2.2 + E2.5 + E2.11 + E4.2** (2026-07-29): hasło admina
  i poświadczenie PostgreSQL obrócone (od tego czasu obrócone ponownie);
  Sentry (backend) przyjął testowe zdarzenia; alert rezerwacji fizycznie
  odebrany; produkcja zresetowana do datasetu syntetycznego bez PII.
- Starsza historia (deploy statyków, visual sweep, porządki repo, PR #1465/#1466,
  protokół handoff) — patrz `docs/journal/` dla pełnych zapisów.

## Następny krok (konkretnie)

1. Zweryfikować (po ustąpieniu CAPTCHA): ocena 5★ klientki
   `uat.client.20260730b@example.invalid` widoczna w `/reviews` admina.
2. Kontynuować `docs/UAT_PLAN.md`: §1.8 (magazyn — dalsza część, niskie
   stany), §1.9 (statystyki/raport finansowy, eksport Excel), §1.10
   (ustawienia: katalog usług, rezerwacja online).
3. Rozważyć jako osobne zadanie: poprawną atrybucję `paidAmount` w
   `statistics.service.ts` (patrz finding #4 w journalu
   `2026-07-30-uat-faza-b-pierwszy-przebieg.md`) — dotyczy realnych liczb w
   codziennym raporcie finansowym.
4. Drobne, nieblokujące: wygasła sesja panelu przekierowuje na
   `dev.salon-bw.pl` zamiast `/auth/login`; surowe komunikaty walidacji
   backendu (np. „property X should not exist") trafiają czasem wprost do
   UI zamiast czytelnego PL — oba niski priorytet.
5. Przed Fazą C (import danych) posprzątać dane testowe z WSZYSTKICH trzech
   przebiegów UAT z 2026-07-30/31 — pełne listy w journalach:
   `2026-07-30-uat-faza-b-pierwszy-przebieg.md`,
   `2026-07-30-uat-faza-b-receptura-i-deploy-incydent.md`,
   `2026-07-30-uat-faza-b-drugi-przebieg.md`.

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
CMS, treści prawne) i Claude (panel, plan, weryfikacja, operacje produkcyjne).
**Zawsze `git fetch` i rebase przed startem** — master potrafi przesunąć się o
kilka commitów między sesjami, a skonfliktowany PR cicho blokuje CI.
