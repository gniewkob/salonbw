# Protokół przekazania pracy między agentami

- **Data:** 2026-07-27
- **Agent:** Claude Opus 5
- **Commit(y):** ten commit
- **PR:** #1466 → następny (gałąź `claude/przygotowany-plan-rp46za`)

## Finding
Zapis stanu prac nie przeżywał zmiany agenta. Dowody z tej sesji:
1. Oba strumienie (Codex/owner i Claude) dopisywały wpisy **na górze tego samego**
   `docs/AGENT_STATUS.md` (2256 linii) → **dwa konflikty merge w jednej sesji**.
   Skonfliktowany PR nie mógł zbudować merge-refa, więc **CI w ogóle się nie
   odpalało** i nikt tego nie zauważył, dopóki nie sprawdziłem ręcznie.
2. `active-context.md` stał na 07-12, gdy master miał już 45 commitów do 07-22.
3. Fakt „token Instagrama ODRZUCANY" przeżył swoją naprawę o kilka dni i wisiał
   na liście blokerów GO.
4. „Gdzie jesteśmy" było rozsypane po 3 plikach (~3100 linii) — zimny start
   wymagał przeczytania tysięcy linii.

## Change
- `docs/HANDOFF_PROTOCOL.md` — wiążący dla KAŻDEGO agenta: definicja ukończenia
  zadania (DoD), trzy warstwy zapisu, szablon wpisu, **zasada świeżości faktów**
  (każdy fakt o produkcji z datą weryfikacji; >7 dni = sprawdź ponownie),
  rytuał zimnego startu, bramki nieprzekraczalne bez ownera.
- `docs/PROJECT_STATE.md` — **jedna strona, NADPISYWANA**: cel, faza, fakty
  zweryfikowane z datami, ostatnio zrobione, następny krok, zablokowane na
  ownerze, aktywna gałąź, ostrzeżenie o równoległych strumieniach.
- `docs/journal/` — **jeden plik na zadanie** (`YYYY-MM-DD-slug.md`).
  Bezkonfliktowe z definicji: dwa agenty nigdy nie piszą tego samego pliku.
- `scripts/handoff-check.sh` — egzekwuje DoD przed pushem: wymaga wpisu w
  journalu i odświeżenia `PROJECT_STATE.md`, blokuje dopisywanie do archiwalnych
  logów (furtka `HANDOFF_ALLOW_ARCHIVED=1` na uzasadnione wyjątki).
- Wpięcie w OBA punkty wejścia: `AGENTS.md` (Codex) i `Agent.md` (+ symlink
  `claude.md`), oraz baner „archiwalny" w `.claude/rules/active-context.md`.

## Validation
`bash -n` na skrypcie czyste; skrypt uruchomiony na własnym change-secie —
najpierw poprawnie zgłosił braki (journal + PROJECT_STATE), po uzupełnieniu
przechodzi. Zmiana wyłącznie dokumentacyjno-narzędziowa, nie dotyka aplikacji.

## Rollout
Docs + skrypt; brak wpływu na build i runtime.

## Follow-up
Opcjonalnie: wpiąć `scripts/handoff-check.sh` do CI jako miękki krok
(ostrzeżenie) dla PR-ów dotykających `apps/` lub `backend/`. Nie zrobione
świadomie — najpierw niech protokół sprawdzi się w praktyce przez kilka zadań.
