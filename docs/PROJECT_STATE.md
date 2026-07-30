# STAN PROJEKTU — czytaj to jako PIERWSZE

> **Ten plik NADPISUJEMY, nie dopisujemy.** Ma zostać jednostronicowy.
> Zasady pracy: [`docs/HANDOFF_PROTOCOL.md`](./HANDOFF_PROTOCOL.md).
> Historia zadań: [`docs/journal/`](./journal/). Plan: [`docs/PROJECT_COMPLETION_PLAN.md`](./PROJECT_COMPLETION_PLAN.md).

**Ostatnia aktualizacja:** 2026-07-30 · **Aktualizował:** Claude

---

## Cel projektu

Własny panel dla **jednoosobowego salonu fryzjerskiego** (Salon Black & White,
Bytom). Właścicielka **Aleksandra pracuje jako admin** — rola „pracownik" jest
świadomie **poza zakresem** GO. Cel: w pełni działający panel na produkcji,
odejście od Booksy.

## Gdzie jesteśmy

**Faza B** ścieżki do produkcji (§3.0 planu): UAT.
Faza A jest zamknięta: aplikacja jest funkcjonalnie kompletna, dane testowe są
syntetyczne i zgodne z realnym grafikiem pracy, alert rezerwacji dociera, a
błędy produkcyjne trafiają do Sentry.

## Fakty o produkcji (ZWERYFIKOWANE — data przy każdym)

| Fakt | Zweryfikowano |
|---|---|
| `panel.salon-bw.pl` → HTTP 307 (login) — **panel JEST na realnej domenie** | 2026-07-28 |
| `salon-bw.pl` → 301 na `www.` = **stary landing** (nginx, nie Next) | 2026-07-23 |
| `dev.salon-bw.pl` → nowy landing (Next), HTTP 200 | 2026-07-28 |
| `/healthz`: HTTP 200 · db/smtp/instagram ok | 2026-07-30 |
| SMS **nie działa** — pusty `SMSAPI_TOKEN` | 2026-07-23 |
| Sentry działa: backendowy event testowy dotarł do produkcyjnego projektu | 2026-07-29 |
| Alert o rezerwacji: mail na `BOOKING_ALERT_EMAIL` fizycznie odebrany | 2026-07-29 |
| Dataset syntetyczny **zgodny z grafikiem Oli**: 12 klientów, 30 wizyt, 12 produktów, 5 dokumentów; 0 wizyt w środę/niedzielę (zamknięte dni); `scheduleViolations: 0` | 2026-07-30 |
| Hasło produkcyjnej roli PostgreSQL obrócone (kolejna rotacja po operacji apply); `.env` prod+lokalny i 3 sekrety GH zsynchronizowane | 2026-07-30 |
| Hasło jedynego konta admina obrócone (Keychain) | 2026-07-29 |

> Fakt starszy niż ~7 dni = niepewny. Zweryfikuj ponownie (§6 protokołu).

## Ostatnio zrobione

- **PR #1477 zmergowany i wdrożony + produkcyjny rollout danych** (2026-07-30,
  `68a215d7`, Deploy `30524961627` sukces): generator syntetycznych wizyt
  respektuje wyłącznie aktywny grafik Oli (regularne godziny, przerwy,
  wyjątki), niedozwolone `in_progress` przechodzi w przyszłe `confirmed`,
  `apply` blokuje tabele grafiku i re-waliduje pod blokadą przed
  resetem+insertem. Niezależny `verify` na STARYCH danych potwierdził finding
  liczbowo (13 wizyt poza grafikiem, 3 nakładające się) → wykonano świeży
  `pg_dump` → `apply` (zatwierdzone, 0 blockerów) → `verify` po apply
  (`scheduleViolations: 0`) → `/healthz` ok → kontrola kalendarza (0 wizyt w
  środę/niedzielę) → rotacja hasła bazy (rola PostgreSQL, prod `.env`, lokalny
  `.env`, 3 sekrety GitHub Actions). Pełny zapis: `docs/journal/2026-07-30-synthetic-schedule-rollout.md`.
- **Faza B rozpoczęta — UAT start dnia i kalendarza** (2026-07-29): produkcyjny
  preflight API/db/panel/landing zielony; logowanie, pulpit, liczniki, widoki
  Dzień/Tydzień/Miesiąc, widok Recepcja i szczegóły wizyty zweryfikowane.
  Znaleziony i naprawiony brak przycisku Recepcji w przełączniku (CI
  `30454936758`, deploy `30454935479`).
- **Faza A zamknięta: E2.2 + E2.5 + E2.11 + E4.2** (2026-07-29): hasło admina
  i poświadczenie PostgreSQL obrócone (od tego czasu obrócone ponownie, patrz
  wyżej); Sentry przyjął testowe zdarzenia; alert rezerwacji fizycznie
  odebrany; produkcja zresetowana do datasetu syntetycznego bez PII (wtedy
  jeszcze bez świadomości grafiku — naprawione dzisiaj).
- Starsza historia (deploy statyków, visual sweep, porządki repo, PR #1465/#1466,
  protokół handoff) — patrz `docs/journal/` dla pełnych zapisów.

## Następny krok (konkretnie)

Dokończyć **fazę B: UAT** wg `docs/UAT_PLAN.md` na poprawionym datasecie:
wykonać oznaczony przepływ umówienie → finalizacja → magazyn → statystyki.

## Zablokowane na ownerze

| # | Co | Czas |
|---|---|---|
| ETAP 3a | Zatwierdzenie nazw kategorii produktów (propozycja w planie) | — |
| E3 | Import zrzutu Versum odłożony do osobnego okna po decyzji GO | — |
| E2.1 | Restore-drill backupu (mail do MyDevil) | — |
| E2.3 | Decyzja o domenie landingu (**nie blokuje panelu**) | — |
| — | Lokalny `pg_dump` backup z operacji 2026-07-30 leży tymczasowo w scratchpad sesji Claude — do przeniesienia w trwałe miejsce, jeśli ma zostać zachowany | — |

## Aktywny stan repo

- Gałąź: `master`; poza `master` brak lokalnych i zdalnych gałęzi roboczych.
- Otwarte PR-y: 0.
- CI i deploy `master` są wymagane jako końcowa bramka każdego kolejnego zadania.

## Uwaga o równoległych strumieniach

Na repo pracują **równolegle** owner/Codex (ostatnio: landing — footer, founder
CMS, treści prawne) i Claude (panel, plan, weryfikacja, operacje produkcyjne).
**Zawsze `git fetch` i rebase przed startem** — master potrafi przesunąć się o
kilka commitów między sesjami, a skonfliktowany PR cicho blokuje CI.
