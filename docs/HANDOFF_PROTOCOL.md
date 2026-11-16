# Protokół przekazania pracy (handoff) — obowiązuje KAŻDEGO agenta

_Wersja 1.1, 2026-11-16 (klasy ryzyka; 1.0: 2026-07-27). Dotyczy tak samo Codeksa, Claude'a i człowieka._
_Cel: po każdym zadaniu stan projektu jest zapisany tak, że dowolny agent
zaczynający „na zimno" wie w 5 minut, gdzie jesteśmy i co dalej._

---

## 1. Dlaczego ten protokół powstał (realne awarie, nie teoria)

| Co się stało | Kiedy | Koszt |
|---|---|---|
| Dwa strumienie dopisywały wpisy **na górze tego samego** `AGENT_STATUS.md` | 2026-07-27 | 2 konflikty merge w jednej sesji; PR przestał budować merge-ref, przez co **CI w ogóle nie odpalało** i nikt tego nie zauważył |
| `active-context.md` stał na 07-12, a master miał 45 commitów do 07-22 | 2026-07-22 | Agent pracował na nieaktualnym obrazie projektu |
| Fakt „token Instagrama ODRZUCANY" przeżył swoją naprawę | 07-22→07-23 | Zadanie wisiało na liście blokerów GO mimo że było zrobione |
| Stan „gdzie jesteśmy" rozsypany po 3 plikach (~3100 linii) | stale | Zimny start = czytanie tysięcy linii zamiast jednej strony |

Wnioski, które protokół egzekwuje: **nie dopisuj do wspólnego pliku**,
**datuj i weryfikuj fakty**, **trzymaj jeden krótki plik stanu**.

---

## 2. Trzy warstwy zapisu (każda ma inną rolę)

| Plik | Rola | Tryb zapisu |
|---|---|---|
| `docs/PROJECT_STATE.md` | **„Gdzie jesteśmy TERAZ"** — 1 strona, pierwszy plik czytany na zimno | **NADPISUJ** (nigdy nie dopisuj) |
| `docs/journal/YYYY-MM-DD-<slug>.md` | **Jedno zadanie = jeden plik** — pełny zapis Finding→Change→Validation | **NOWY PLIK** (nigdy nie edytuj cudzego) |
| `docs/PROJECT_COMPLETION_PLAN.md` | Plan dojścia do produkcji (fazy, bramki, decyzje) | Edytuj tylko przy zmianie planu/decyzji |

**Kluczowa zasada anty-konfliktowa:** dwa agenty nigdy nie piszą do tego samego
pliku. Journal to katalog osobnych plików — merge jest zawsze bezkonfliktowy.
`PROJECT_STATE.md` jest krótki i nadpisywany w całości, więc konflikt (jeśli
wystąpi) rozwiązuje się w 30 sekund, a nie przez scalanie 2000 linii.

> `docs/AGENT_STATUS.md` (2256 linii) i `.claude/rules/active-context.md` są
> **archiwalne — tylko do CZYTANIA**. Nie dopisuj już do nich. Historia zostaje
> tam, nowe wpisy idą do `docs/journal/`.

---

## 3. Klasy ryzyka i definicja ukończenia zadania (DoD)

Zakres pracy i dokumentacji zależy od klasy ryzyka zmiany. Prawa decyzyjne
opisuje nadrzędna sekcja w `AGENTS.md`; tu są definicje klas.

| Klasa | Co obejmuje | Wymagane | Kto decyduje |
|---|---|---|---|
| **A, odwracalne** | UI, style, teksty, dokumentacja, testy, refaktor bez zmiany zachowania | lint + typecheck + test dotkniętego pliku | agent; raport po fakcie |
| **B, logika** | rezerwacje, zgody, statystyki, API, uprawnienia, CI/deploy | walidacja z §4 + wdrożenie na dev + opis ryzyka (2-3 zdania) | agent rekomenduje; owner zatwierdza wydanie na produkcję |
| **C, nieodwracalne** | destrukcyjne migracje, sekrety i env produkcyjny, realne dane klientek, wysyłki do klientek, treści prawne | backup + dry-run + §8 | owner, **przed** wykonaniem |

Wątpliwość między A i B rozstrzyga się jako B, między B i C jako C.

Zadanie **nie jest skończone**, dopóki nie są spełnione punkty dla jego klasy:

- [ ] **1. Zmiana** zrobiona i zwalidowana w zakresie swojej klasy (A, B, C).
- [ ] **2. Następny krok nazwany wprost** w raporcie albo „brak" (A, B, C).
- [ ] **3. Wpis w journalu**: nowy plik `docs/journal/YYYY-MM-DD-<slug>.md`
      wg szablonu §5 (tylko B i C).
- [ ] **4. `PROJECT_STATE.md` zaktualizowany** (tylko B i C, i tylko gdy
      zmienił się stan projektu albo lista spraw czekających na ownera).
- [ ] **5. Commit** zawiera i zmianę, i wpisy (B i C).

Przed pushem: `scripts/handoff-check.sh` (B i C) albo
`HANDOFF_CLASS=A scripts/handoff-check.sh` (A).

Ryzyka, które owner świadomie przyjął, są zapisane w
[`docs/decisions/RISK_REGISTER.md`](decisions/RISK_REGISTER.md). Agent ich
nie otwiera ponownie bez nowego faktu.

---

## 4. Walidacja — co znaczy „zwalidowane"

Klasa A: lint, typecheck i test dotkniętego pliku wystarczą.

Minimum dla zmiany klasy B i C (dostosuj do zakresu):
- `pnpm --filter @salonbw/panel test` (lub celowany plik) — zielone
- `pnpm exec tsc --noEmit` w dotkniętej aplikacji — czyste
- `pnpm exec eslint --fix <zmienione pliki>` — czyste
- build dotkniętej aplikacji, jeśli zmiana może go złamać
- **bugfix = rytuał fail-first**: test najpierw failuje bez fixu (weryfikacja
  przez `git stash` na pliku źródłowym), potem przechodzi
- **zmiana widoczna w UI** = weryfikacja po deployu (zrzut/klik), nie „powinno
  działać"

---

## 5. Szablon wpisu do journala

Nazwa pliku: `docs/journal/2026-07-27-krotki-slug.md`

```markdown
# <tytuł zadania>

- **Data:** 2026-07-27
- **Agent:** Claude Opus 5 / Codex / człowiek
- **Commit(y):** `abc1234`
- **PR:** #1466 (albo „brak")

## Finding
Co konkretnie było nie tak / czego brakowało — z DOWODEM (ścieżka pliku,
zachowanie, zrzut, wynik curla). Bez nazwanego Findingu nie zaczynaj zmiany.

## Change
Minimalna zmiana adresująca Finding. Bez „przy okazji".

## Validation
Co dokładnie uruchomiono i z jakim wynikiem (liczby, nie „przeszło").

## Rollout
Numery runów CI / Deploy, wynik live-verify. Albo „nie dotyczy".

## Follow-up
Następny krok wprost, albo „brak".
```

---

## 6. Zasada świeżości faktów (najważniejsza)

**Nie dziedzicz faktów z logów — weryfikuj je.** Każdy fakt o produkcji zapisany
w `PROJECT_STATE.md` musi mieć **datę weryfikacji**. Fakt starszy niż ~7 dni
traktuj jako niepewny i sprawdź ponownie, zanim na nim oprzesz decyzję.

Szybka weryfikacja stanu produkcji:
```bash
curl -sS https://api.salon-bw.pl/healthz          # db / smtp / instagram
curl -sS -o /dev/null -w "%{http_code}\n" https://panel.salon-bw.pl
git log --oneline origin/master -5                 # czy master się nie ruszył
```

To ta zasada wyłapałaby „token Instagrama odrzucany" (fakt nieaktualny o kilka
dni) i „panel nie ma domeny" (nigdy niezweryfikowane założenie).

---

## 7. Rytuał startu sesji (zimny start, dowolny agent)

1. `git fetch origin master && git log --oneline -10` — **czy master się ruszył?**
   Równoległy strumień (owner/Codex/Claude) pracuje na tych samych plikach.
2. Przeczytaj **`docs/PROJECT_STATE.md`** — to wystarczy do orientacji.
3. Potrzebujesz szczegółów zadania? → `docs/journal/` (najnowsze pliki).
4. Potrzebujesz kierunku? → `docs/PROJECT_COMPLETION_PLAN.md` (§3.0 fazy A–E).
5. Sprawdź, czy CI na masterze jest zielone, zanim zaczniesz.
6. Jeśli pracujesz na starszej gałęzi: **rebase na master ZANIM zaczniesz** —
   inaczej PR nie zbuduje merge-refa i CI cicho nie odpali.

---

## 8. Bramki, których agent NIE przekracza sam

- Migracje **destrukcyjne** na produkcyjnej bazie → dry-run w opisie PR +
  `pg_dump` + **jawna zgoda ownera** przed merge.
- Sekrety, tokeny, klucze, env produkcyjny → agent podaje instrukcję, wykonuje
  owner (safe-skrypty).
- Treści prawne i dane identyfikacyjne firmy → agent robi DRAFT, decyduje owner.
- Taksonomia biznesowa (np. nazwy kategorii produktów) → propozycja, nie fakt
  dokonany.
