# Transakcyjny i idempotentny plan importu

- **Data:** 2026-09-11
- **Agent:** Codex
- **Commit(y):** bieżący commit
- **PR:** brak

## Finding

Ponowny import usług usuwał warianty i tworzył nowe identyfikatory. To mogło
wyzerować wariant historycznej wizyty i usunąć przypisanie pracownika. Importy
nie obejmowały całego pakietu transakcją. Dotychczasowy dry-run kończył się
przed porównaniem z bazą, a reimport produktu zawsze nadpisywał aktualny stan
magazynu. Liczba opakowań mogła zostać potraktowana jak liczba ml lub sztuk.

## Change

- Domyślny przebieg łączy się z bazą, porównuje rekordy i drukuje raport
  create/update/skip/deactivate/conflict bez zapisu. Samo parsowanie bez bazy
  ma osobny tryb `*_PARSE_ONLY=1`.
- Zapis wymaga jawnego `IMPORT_SERVICES_APPLY=1` albo
  `IMPORT_PRODUCTS_APPLY=1`. Cały zapis działa w jednej transakcji, a konflikt
  wycofuje pakiet.
- Warianty są dopasowywane po znormalizowanej nazwie: istniejący rekord jest
  aktualizowany z zachowaniem ID, nowy tworzony, a brakujący dezaktywowany.
- Import produktu zachowuje bieżący stan istniejącego produktu. Jego
  zastąpienie wymaga `IMPORT_PRODUCTS_REPLACE_STOCK=1`.
- Niezerowa liczba opakowań bez jawnej wartości w jednostce zużycia oraz
  ułamkowy stan niepasujący do kolumny całkowitej blokują import.
- Stawka VAT jest zapisywana jawnie, a nazwy, kody i jednostki przekraczające
  limity kolumn blokują import zamiast zostać cicho skrócone.

## Validation

- Fail-first review: bezwarunkowe `variantRepo.delete({ serviceId })` usuwało
  stabilne identyfikatory; dry-run kończył się przed połączeniem z bazą.
- Planista: 6/6 testów PASS dla zachowania ID, dezaktywacji, duplikatów,
  jednostek magazynowych i rozróżnienia update/skip.
- Izolowany PostgreSQL 15: 12/12 PASS. Plan nie zmienił bazy; dwa kolejne
  importy zachowały ID wariantów oraz FK wizyty i przypisania pracownika;
  konflikt wycofał wcześniejszą aktualizację w tej samej transakcji.
- Na tym samym PostgreSQL plan produktu nie zapisał ceny, apply zaktualizował
  cenę i VAT bez zmiany stanu 42, dopiero jawne zastąpienie ustawiło stan 60,
  a nadmiernie długa nazwa została odrzucona.
- Backend: 52 zestawy, 414 testów; typecheck, lint zmienionych źródeł i build
  PASS.

## Rollout

Nie wykonuje produkcyjnego importu. Kod oczekuje na commit, CI i Deploy.
Rzeczywisty wsad najpierw przejdzie domyślny plan bez zapisu.

## Follow-up

Owner przygotowuje CSV. Następnie: parse-only, plan względem docelowej bazy,
uzgodnienie liczników i jednostek, `pg_dump`, jawna akceptacja oraz dopiero
apply. Po imporcie trzeba uzgodnić bilans usług, wariantów, produktów, klientek,
wizyt, receptur i powiązań. Ponieważ skrypty zapisują bezpośrednio do bazy, po
apply trzeba zrestartować API, sprawdzić health i potwierdzić świeży katalog,
aby usunąć stare wartości z pamięci podręcznej procesu.
