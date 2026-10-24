# Plan UAT dopasowany do realnych danych po imporcie Booksy

- **Data:** 2026-10-24
- **Agent:** Claude Opus 5.5
- **Commit(y):** `dbf02876`, ten commit
- **PR:** brak (fast-forward na `master` na prośbę ownera)

## Finding

Ponowny plan importu na produkcji (2026-10-23 wieczorem, bez zapisu) dał
`alreadyImported` dla wszystkiego: 1047 klientek, 10 109 wizyt, 144 opinie,
0 do utworzenia, 0 konfliktów. Import był już zapisany o 17:21. Mimo to
`docs/UAT_PLAN.md` §0 opisywał dane syntetyczne (12 klientów, 30 wizyt), więc
UAT prowadziłby do zapisów testowych na kartach prawdziwych klientek.

## Change

`docs/UAT_PLAN.md` §0: opis realnego stanu danych (klientki i wizyty realne,
magazyn syntetyczny, przyszłe rezerwacje jeszcze nie zaimportowane) oraz
zasady testowania: zapisy tylko na koncie testowym albo kartach „UAT …”,
prawdziwe karty tylko do porównania z Booksy, spis tego, co powstało w UAT.
§2a: liczba wizyt mierzona na karcie testowej.

## Validation

- Plan importu na produkcji: `mode: plan`, `conflicts: []`, „No DB changes”.
- Eksport usunięty z serwera po planie (`ls ~/booksy-export` → No such file).
- Zmiana dotyczy wyłącznie dokumentacji.

## Rollout

Nie dotyczy kodu. Detektor zmian deployu powinien pominąć wdrożenie aplikacji.

## Follow-up

- Owner przechodzi UAT według zaktualizowanego planu.
- Przy finalnym imporcie 91 przyszłych rezerwacji NIE ustawiać
  `IMPORT_BOOKSY_RESET_CLIENT_PASSWORDS` — zresetowałoby ponownie 1068 kont
  klientek, w tym konto techniczne CI.
- Niezweryfikowane w kodzie: że importowane klientki nie dostaną żadnej
  wiadomości (opiera się na braku zgód i `reminderSent=true`).
