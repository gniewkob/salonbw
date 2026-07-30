# Rollout danych: zgodność syntetycznych wizyt z grafikiem Oli

- **Data:** 2026-07-30
- **Agent:** Claude (kontroler po implementacji Codexa, PR #1477)
- **Commit(y):** `68a215d7` (kod, merge PR #1477); ten wpis (docs)
- **PR:** #1477 (zmergowany)

## Finding

`docs/PROJECT_STATE.md` z 2026-07-29 raportował: „Dataset zawiera wizyty
w środę mimo poprawnego komunikatu 'salon zamknięty'". Kod naprawiający
generator (PR #1477) był już zmergowany i wdrożony, ale produkcyjne dane
nadal pochodziły ze starego, wadliwego generatora.

Niezależne `synthetic:data:verify` (nowy, schedule-aware kod) na danych
sprzed resetu potwierdziło finding liczbowo: **13 wizyt poza grafikiem**
(`SYNTHETIC_APPOINTMENT_OUTSIDE_SCHEDULE`: appointment id 150, 152, 156, 160,
163, 165, 167, 168, 170, 173, 174, 176, 177) i **3 nakładające się**
(`SYNTHETIC_APPOINTMENT_OVERLAP`: id 152, 160, 176). Komenda poprawnie
zakończyła się fail-closed (exit 1), zgodnie z projektem.

## Change

Wykonano zaakceptowaną przez ownera sekwencję operacyjną (owner: „tak"):

1. Świeży `pg_dump --format=custom` streamowany bezpośrednio z hosta MyDevil
   (pg_dump 16.10, zgodny z wersją serwera) do lokalnego pliku `600`, bez
   pozostawiania kopii na serwerze.
2. `SYNTHETIC_PROTECTED_EMAILS` uzupełnione lokalnie przez odczytową (RO,
   `REPEATABLE READ READ ONLY`) kwerendę do produkcyjnej bazy — dokładnie
   1 konto admin, dokładnie 1 nie-syntetyczny klient (zgodny z timestampem
   trwałego konta CI z 2026-07-28). Wartości zapisane wyłącznie do lokalnego
   `.env` (`600`), nigdy nie wypisane w pełni.
3. `synthetic:data:apply` — transakcja zatwierdzona: reset 12 klientów/30
   wizyt/12 produktów/5 dokumentów magazynowych, insert tych samych liczności
   + 4 prowizje, 2 opinie, 3 transakcje lojalnościowe, 1 pozycja receptury.
   `scheduleSummary.convertedInProgress = 3` (liczba wizyt `in_progress`
   przeniesionych na przyszłe `confirmed` bo kotwica nie trafiała w godziny
   pracy).
4. Niezależny `synthetic:data:verify` po apply: **`scheduleViolations: 0`**.
5. `/healthz`: `status=ok`, `database=ok`.
6. Kontrola kalendarza (odczytowa kwerenda po dniu tygodnia): 30 wizyt
   rozłożonych na Pon/Wt/Czw/Pt/Sob — **zero w środę i niedzielę** (zamknięte
   dni grafiku Oli).
7. Rotacja hasła produkcyjnej roli PostgreSQL: `ALTER ROLE` przez aktywne
   połączenie (stare hasło jeszcze ważne) → `scripts/safe-update-api-env.sh`
   zaktualizował `PGPASSWORD` i `DATABASE_URL` w produkcyjnym `.env`
   (z automatycznym backupem `.env.bak.safe-update.*`, `600`), zrestartował
   `api.salon-bw.pl` i zweryfikował `/healthz` po restarcie → lokalny `.env`
   zaktualizowany tym samym hasłem → 3 sekrety GitHub Actions (`DATABASE_URL`,
   `MYDEVIL_DB_PASSWORD`, `PGPASSWORD`) nadpisane przez `gh secret set` ze
   stdin. Hasło nigdy nie pojawiło się w widocznym outpucie ani w treści
   żadnej komendy — generowane do pliku lokalnego `600`, przesyłane przez
   `stdin`/pipe, plik usunięty po użyciu.

## Validation

- `synthetic:data:apply`: `blockers: []`, `verification.scheduleViolations: 0`
  (w ramach samej transakcji apply).
- `synthetic:data:verify` (osobne, niezależne uruchomienie po apply):
  `scheduleViolations: 0`, `blockers: []`, `protectedAccountsPresent: 2`,
  `remainingNonSyntheticClients: 0`.
- `/healthz` (dwukrotnie — od razu po apply i ponownie po restarcie API
  wskutek rotacji hasła): `status=ok`, `database=ok`, `smtp=ok`,
  `instagram=ok`.
- Panel: `https://panel.salon-bw.pl` → HTTP 307 (login), bez zmian.
- Kwerenda rozkładu wizyt po dniu tygodnia: 0 wizyt w środę, 0 w niedzielę;
  zakres dat wygenerowanych wizyt 2026-07-09 → 2026-08-03.
- Backupy `.env` z tej sesji na serwerze: oba `600` (starszy backup z
  2026-07-22, sprzed poprawki uprawnień, pozostał `644` — poza zakresem tej
  zmiany, nie dotknięty).
- 3 sekrety GitHub Actions (`DATABASE_URL`, `MYDEVIL_DB_PASSWORD`,
  `PGPASSWORD`) mają świeży znacznik czasu aktualizacji (2026-07-30 11:30 UTC).

## Rollout

Wyłącznie operacja na danych/sekretach produkcyjnych — kod już był wdrożony
przez PR #1477 (`68a215d7`, Deploy MyDevil run `30524961627`, sukces,
zweryfikowany wcześniej). Ta sesja nie zmieniała kodu.

## Follow-up

Brak. Faza B (UAT) może kontynuować na poprawionym, zgodnym z grafikiem
datasecie. Lokalny backup `pg_dump` z tej operacji leży tymczasowo w
katalogu scratchpad sesji (nie w repo, nie trwały) — do przeniesienia w
bezpieczne miejsce przez ownera, jeśli ma zostać zachowany dłużej niż czas
trwania sesji.
