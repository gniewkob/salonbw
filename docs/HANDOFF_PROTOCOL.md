# Protokół przekazania pracy (handoff) — obowiązuje KAŻDEGO agenta

_Wersja 1.0, 2026-07-27. Dotyczy tak samo Codeksa, Claude'a i człowieka._
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

## 3. Definicja ukończenia zadania (DoD)

Zadanie **nie jest skończone**, dopóki wszystkie punkty nie są spełnione:

- [ ] **1. Kod/zmiana** zrobiona i zwalidowana (patrz §4).
- [ ] **2. Wpis w journalu** — nowy plik `docs/journal/YYYY-MM-DD-<slug>.md`
      wg szablonu §5.
- [ ] **3. `PROJECT_STATE.md` zaktualizowany** — sekcje „Ostatnio zrobione",
      „Następny krok", „Zablokowane na ownerze", „Fakty zweryfikowane".
- [ ] **4. Commit** zawiera i zmianę, i wpisy (jeden spójny commit lub PR).
- [ ] **5. Następny krok nazwany wprost** — konkretne zdanie, nie „dalsze prace".
      Jeśli nic nie zostało: napisz „brak".

Uruchom `scripts/handoff-check.sh` przed pushem — sprawdzi punkty 2–3.

---

## 4. Walidacja — co znaczy „zwalidowane"

Minimum dla zmiany w kodzie (dostosuj do zakresu):
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
