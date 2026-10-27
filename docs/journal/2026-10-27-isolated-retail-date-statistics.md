# Wydzielenie poprawki potrąceń sprzedaży produktów z PR #1525

- **Data:** 2026-10-27
- **Zakres:** statystyki sprzedaży detalicznej i powiązanych usług
- **Base:** `master` na moment utworzenia gałęzi, bez cherry-pick historycznego łańcucha
- **Poprzedni PR:** #1525; **operacje Booksy:** #1521 (poza zakresem)
- **Nowy PR:** referencja dodawana po utworzeniu

## Finding

PR #1525 ma 16 zmienionych plików oraz zawiera odziedziczone zmiany #1521:
skrypty `cleanup-production-synthetic.ts`, `reconcile-booksy.ts`, testy tych skryptów,
zmiany workflow oraz dokumentację. Scalenie całego PR #1525 jako samej poprawki
statystyk przypadkowo wprowadziłoby potencjalnie destrukcyjne narzędzia Booksy.

Błąd statystyk: gdy sprzedaż produktu i data zakończonej wizyty należą do
różnych okresów, suma usług może zawierać produkty jako przychód z usług.
Przykładowe dane z poprzedniego PR: 40 PLN towarów + 185 PLN usług = 225 PLN,
zamiast błędnego wyniku 265 PLN.

## Change

Skopiowano **wyłącznie dwie zweryfikowane, powiązane merytorycznie zmiany**
z gałęzi `codex/statistics-cross-date-retail-20261026` do nowej gałęzi
rozpoczętej bezpośrednio z `master`:

1. `backend/salonbw-backend/src/statistics/statistics.service.ts` — przypisanie
   potrąceń produktów do identyfikatorów wizyt, a nie tylko ich przedziału dat;
   zachowanie daty transakcji przy wyliczaniu sprzedaży produktów.
2. `backend/salonbw-backend/src/statistics/statistics.service.spec.ts` —
   regresja dla `warehouse_sales` oraz historycznych `product_sales`,
   daty sprzedaży wcześniejszej/późniejszej od wizyty, addytywności
   zakresów oraz test opcjonalny na osobnej syntetycznej bazie PostgreSQL.

Nie zmieniono skryptów Booksy, importów, czyszczenia produkcji, migracji DB,
konfiguracji wysyłek ani bieżącej dokumentacji stanu całego repozytorium.

## Validation / ograniczenia

- Statycznie porównano diff PR #1525 z `master` i stwierdzono, że pliki
  `statistics.service.ts` i `statistics.service.spec.ts` zawierają całość
  regresji dotyczącej dat statystyk.
- **CI dla nowego HEAD: do weryfikacji po utworzeniu PR**; zielone CI
  oryginalnego #1525 NIE jest potwierdzeniem tej niezależnej gałęzi.
- Testy PostgreSQL w spec wymagają jawnego
  `STATISTICS_TEST_DATABASE_URL` wskazującego na oddzielną lokalną bazę
  `statistics_synthetic`; bez niego są oznaczone jako pominięte.
  Nie ustawiać tego URL na produkcji ani na istniejącej współdzielonej bazie:
  test celowo odtwarza schemat testowy.
- Wyniki kompilacji/testów/bezpieczeństwa tego PR zapisać po zakończeniu CI.

## Rollout i bramki

**Brak wdrożenia na dev i produkcję.** Nowy PR ma mieć 2 pliki kodu/testów
oraz ten journal, bez pozostałych 13 plików z #1521.

Wymagane: czyste CI dokładnego SHA, testy na wyizolowanym PostgreSQL,
code review, test raportów w dev, jawny GO ownera na oddzielny merge/deploy.
**Nie scalać pierwotnego PR #1525 jako bezpiecznego fixu statystyk.**

## Następny krok

Zweryfikować nowy PR i jego dokładny HEAD w GitHub Actions, domknąć bramkę
PostgreSQL oraz skoordynować z audytem release #1530 i zadaniem #1533.
