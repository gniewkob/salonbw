# Rozliczenie wykonania cleanupu produkcji

- **Data:** 2026-10-26
- **Agent:** Codex
- **PR:** #1521
- **Ref kontroli:** `64cee5bdb69c42d70dfb64f8aee648296dca627b`

## Finding

Nowe zlecenie ownera dotyczyło wdrożenia cleanupu, lecz journal nadal podawał
PENDING mimo wcześniejszego apply. Na hoście zachowały się prywatne raporty
planu i wykonania; potwierdzają 192 usunięte rekordy i ochronę pozostałych.

## Change

Skorygowano własny journal wykonania i PROJECT_STATE na podstawie świeżego
odczytu, nie samego historycznego opisu. Własny izolowany worktree; checkout
ownera oraz checkouty review/UAT bez zmian. Brak zmian kodu cleanupu między
wykonanym `8aa1c7b8` a `64cee5bd`; narzędzie już wdrożone prywatnie na hoście.

## Validation

- 18:12 Europe/Warsaw: nowy READ ONLY plan pusty; nie wykonano apply.
- Osobna transakcja READ ONLY: 1047 klientek, dwa konta admina, 10 109 wizyt,
  144 opinie; linki Booksy odpowiednio 1047/10 109/144, dangling=0.
- Produkty/kategorie/dostawcy i dokumenty magazynowe objęte planem: zero.
- Prywatny backup istnieje, 0600, 1 427 706 bajtów, 82 TABLE DATA,
  tożsamość bazy zgodna. Brak restore-drill; backup nie opuszcza hosta.
- Produkcja health 200: database/smtp/instagram ok, runtime `328d362f`.
  Dev health 200, database ok, outbound checks skipped; runtime `8aa1c7b8`.
- Istniejące CI ref `64cee5bd`, run `40357588707`: SUCCESS (sprawdzone live).
  Raport wcześniejszej sesji: backend 526 PASS i PostgreSQL 12/12.
  Nie powtarzano testów kodu dla tej korekty dokumentacji.
- Claude review wcześniej zakończył się błędem wykonania; nie jest security PASS.

## Rollout

Brak nowego deploymentu aplikacji, migracji lub operacji danych. Operacja
cleanupu już zakończona; świeży pusty plan jest kontrolą idempotencji.
Szczegóły faktycznego apply w journalu production-synthetic-cleanup.

## Follow-up

UAT prowadzi osobna sesja wyłącznie na dev. Przy finalnym cutoverze wymagane
świeży eksport, rozliczenie wyjątków, GO właścicielki i odrębny import.
Nie wyłączać Booksy i nie odtwarzać testowych kont produkcyjnych.
