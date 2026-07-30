# STAN PROJEKTU — czytaj to jako PIERWSZE

> **Ten plik NADPISUJEMY, nie dopisujemy.** Ma zostać jednostronicowy.
> Zasady pracy: [`docs/HANDOFF_PROTOCOL.md`](./HANDOFF_PROTOCOL.md).
> Historia zadań: [`docs/journal/`](./journal/). Plan: [`docs/PROJECT_COMPLETION_PLAN.md`](./PROJECT_COMPLETION_PLAN.md).

**Ostatnia aktualizacja:** 2026-07-30 (wieczór) · **Aktualizował:** Claude

---

## Cel projektu

Własny panel dla **jednoosobowego salonu fryzjerskiego** (Salon Black & White,
Bytom). Właścicielka **Aleksandra pracuje jako admin** — rola „pracownik" jest
świadomie **poza zakresem** GO. Cel: w pełni działający panel na produkcji,
odejście od Booksy.

## Gdzie jesteśmy

**Faza B** ścieżki do produkcji (§3.0 planu): UAT — **pierwszy realny przebieg
wykonany** (właścicielka §1 + §1.6/§2a finalizacja + klientka §2 rejestracja/
rezerwacja), 3 realne bugi znalezione i naprawione, 1 głębszy problem
finansowy udokumentowany (nienaprawiony), reszta planu do kontynuacji.

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

> Fakt starszy niż ~7 dni = niepewny. Zweryfikuj ponownie (§6 protokołu).

## Ostatnio zrobione

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

1. Kontynuować `docs/UAT_PLAN.md`: §1.7–§1.10 (karta klientki poza tym co
   przetestowano, magazyn, statystyki, ustawienia) oraz resztę §2 (wiadomości,
   ocena wizyty, zgody, akceptacja zmienionego terminu).
2. Rozważyć jako osobne zadanie: poprawną atrybucję `paidAmount` w
   `statistics.service.ts` (patrz finding #4 w journalu z 2026-07-30) —
   dotyczy realnych liczb w codziennym raporcie finansowym.
3. Przed Fazą C (import danych) posprzątać dane testowe z tego przebiegu UAT
   (konto `uat.client.20260730@example.invalid`, rezerwacja #211, wizyta #182
   zmodyfikowana) — lista w journalu z 2026-07-30.

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
