# STAN PROJEKTU — czytaj to jako PIERWSZE

> **Ten plik NADPISUJEMY, nie dopisujemy.** Ma zostać jednostronicowy.
> Zasady pracy: [`docs/HANDOFF_PROTOCOL.md`](./HANDOFF_PROTOCOL.md).
> Historia zadań: [`docs/journal/`](./journal/). Plan: [`docs/PROJECT_COMPLETION_PLAN.md`](./PROJECT_COMPLETION_PLAN.md).

**Ostatnia aktualizacja:** 2026-07-31 (popołudnie) · **Aktualizował:** Claude

---

## Cel projektu

Własny panel dla **jednoosobowego salonu fryzjerskiego** (Salon Black & White,
Bytom). Właścicielka **Aleksandra pracuje jako admin** — rola „pracownik" jest
świadomie **poza zakresem** GO. Cel: w pełni działający panel na produkcji,
odejście od Booksy.

## Gdzie jesteśmy

**Faza B** ścieżki do produkcji (§3.0 planu): **UAT §1 i §2 przejrzane w
całości** (cztery przebiegi, 2026-07-30/31) — pulpit, kalendarz, wizyta,
finalizacja, karta klientki, magazyn (niskie stany), statystyki/raport
finansowy, ustawienia, cała ścieżka klientki (rejestracja, rezerwacja,
wiadomości, akceptacja zmienionego terminu, ocena, zgody). **8 realnych
bugów** znalezionych i naprawionych (Sentry CSP, dublowanie sprzedaży
produktów, „Płatność: opłacona", brak receptury w karcie klientki — 2
warstwy, finalizacja z recepturą zawsze 400, baner niskiego stanu na
pulpicie zaniżał liczbę produktów, raport finansowy mylił pełną kwotę
transakcji z czystym przychodem usługowym — finding #4). **Zero otwartych
znanych bugów finansowych.** Formalne zamknięcie UAT i decyzja o przejściu
do Fazy C — do właściciela.

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
| Ocena klientki widoczna w `/reviews` admina; pulpit poprawnie liczy „8" (4 brak+4 niski) zamiast „4" (fix `1b64834e`) | 2026-07-31 |
| §1.8/§1.9/§1.10 UAT (magazyn/statystyki/ustawienia) przejrzane | 2026-07-31 |
| Raport finansowy poprawnie rozdziela usługi/towary/napiwek (fix `7b38e606`); „Sprzedaż usług" 130 zł zamiast 185 zł na tej samej wizycie #182 | 2026-07-31 |

> Fakt starszy niż ~7 dni = niepewny. Zweryfikuj ponownie (§6 protokołu).

## Ostatnio zrobione

- **Finding #4 naprawiony: raport finansowy nie myli już pełnej kwoty
  transakcji z przychodem usługowym** (2026-07-31, `7b38e606`; pełny zapis
  `docs/journal/2026-07-31-finding-4-statistics-revenue-fix.md`). Root
  cause dwuwarstwowy: `resolveAppointmentPrice()` zwracało `paidAmount`
  (usługa+dodatki+produkty−rabat+napiwek) wprost jako „przychód usługowy" w
  pulpicie/wykresie przychodów/rankingu pracowników/raporcie prowizji; a
  osobne zapytania „przychód z produktów" czytały WYŁĄCZNIE starą tabelę
  `product_sales` (nigdy `warehouse_sales`) — ten sam dwutabelowy problem
  co finding #2, tu zerujący „Sprzedaż towarów" i przez to jeszcze bardziej
  zawyżający „usługi". Nowe `resolveServiceRevenue()` odejmuje napiwek i
  sprzedaż produktów POWIĄZANYCH Z TĄ WIZYTĄ od `paidAmount`; nowe
  `getProductSaleRows()` to jedno zapytanie świadome obu tabel, z którego
  każdy wywołujący agreguje po dniu/pracowniku/wizycie zamiast duplikować
  zapytanie. `getServiceRanking` przy okazji przepisane z surowego SQL na
  fetch-encji + redukcja (koniec z ręcznym cytowaniem aliasów). Świadomie
  NIETKNIĘTE: `getCashRegister` (saldo kasy = poprawnie pełna kwota) i
  `getClientStats.topClients.totalSpent` (poprawnie „ile klient wydał
  łącznie"). **Zweryfikowane na żywo na TEJ SAMEJ wizycie #182:** „Sprzedaż
  usług" 130,00 zł (było 185,00 zł), „Sprzedaż towarów" 59,60 zł (było
  0,00 zł), „Utarg" 189,60 zł = usługi+towary bez napiwku — w pełni spójne
  z tabelą pracowników. **UAT §1+§2 nie ma już żadnego znanego,
  udokumentowanego bugu finansowego.**
- **UAT Fazy B — zamknięcie §1.8/§1.9/§1.10 + bug pulpitu (niski stan)**
  (2026-07-31, `1b64834e`; pełny zapis
  `docs/journal/2026-07-31-uat-faza-b-trzeci-przebieg.md`): magazyn (niskie
  stany), statystyki (raport finansowy + eksport + usługi + prowizje),
  ustawienia (online-booking, katalog usług) — wszystko czyste. Potwierdzone
  też: ocena 5★ klientki z poprzedniego przebiegu widoczna poprawnie w
  `/reviews`. **Znaleziony i naprawiony realny bug:** baner „niskim stanem
  magazynowym" na pulpicie czytał WYŁĄCZNIE `lowStockCount`, ignorując
  rozłączną kategorię `outOfStockCount` — pokazywał „4" zamiast realnych 8
  produktów wymagających uwagi (4 niski stan + 4 całkowicie wyprzedane), a w
  skrajnym przypadku (same produkty wyprzedane, zero „tylko niskich") baner
  znikałby CAŁKOWICIE mimo pustego magazynu. Fix uwzględnia obie kategorie w
  warunku i liczbie. **UAT §1 i §2 z `docs/UAT_PLAN.md` przejrzane w
  całości** — formalne zamknięcie i decyzja o Fazie C należy do właściciela.
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

1. **Decyzja właściciela:** formalnie zamknąć UAT (§4 planu — wszystkie
   ścieżki §1+§2 przejrzane, zero otwartych 🔴, finding #4 naprawiony) i
   przejść do Fazy C (import danych) / D (miękki start).
2. Drobne, nieblokujące (🎨/🟡 do backlogu ETAP 5): wygasła sesja panelu
   czasem przekierowuje na `dev.salon-bw.pl` zamiast `/auth/login`; surowe
   komunikaty walidacji backendu trafiają czasem wprost do UI; przycisk
   „pobierz raport Excel" generuje `.csv`; tabela „Dane w podziale na
   pracowników" pokazuje zera przy imieniu Aleksandry (rola `admin`, nie
   `employee`) mimo że „Łącznie" poprawnie sumuje — patrz follow-up w
   journalu `2026-07-31-finding-4-statistics-revenue-fix.md`.
3. Przed Fazą C (import danych) posprzątać dane testowe ze WSZYSTKICH
   CZTERECH przebiegów UAT z 2026-07-30/31 — pełne listy w journalach:
   `2026-07-30-uat-faza-b-pierwszy-przebieg.md`,
   `2026-07-30-uat-faza-b-receptura-i-deploy-incydent.md`,
   `2026-07-30-uat-faza-b-drugi-przebieg.md`,
   `2026-07-31-uat-faza-b-trzeci-przebieg.md`.

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
