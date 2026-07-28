# Ponowny visual sweep po stabilizacji animacji nakładek

- **Data:** 2026-07-28
- **Agent:** Codex
- **Commit(y):** ten commit
- **PR:** brak

## Finding

Poprzedni przebieg wykonywał zrzuty części modali w trakcie animacji. Ponowny
workflow na `master` (`c97c9ced`) zakończył się sukcesem:

- run `30384548803`, job `90360433119`;
- 142 testy przeszły, 20 opcjonalnych testów roli pracownika pominięto zgodnie
  z zakresem jednego salonu i jednej osoby;
- artefakt zawiera 172 zrzuty: admin 81 desktop + 79 mobile, klient 6 desktop
  + 6 mobile;
- CTA `UTWÓRZ WIZYTĘ` w mobilnym drawerze jest w pełni widoczne — pierwotne
  podejrzenie przycięcia nie potwierdziło się.

Przegląd wszystkich zrzutów nie wykazał błędu klasy czerwonej. Wykazał dwie
istotne luki do osobnego zadania:

1. 27 widoków mobilnych rozszerza dokument poza viewport 390 px. Największe
   przypadki to grafiki pracowników (1142 px), szablony grafików (1175 px),
   receptura usługi (754 px), dane osobowe klienta (664 px), komentarze
   statystyk (644 px) i komunikacja klienta (560 px).
2. Mobilne modale kategorii produktów i usług nie powstały. Helper
   `openAndShoot()` traktuje niewidoczny trigger jako best-effort skip, więc
   workflow pozostaje zielony mimo braku tych dwóch plików.

## Change

Nie zmieniano UI. Ponowny sweep wykonano po wcześniejszej stabilizacji animacji
nakładek; wynik i luki pokrycia zapisano w protokole przekazania.

## Validation

- `E2E Visual Sweep` run `30384548803`: success, 142 passed, 20 skipped;
- artefakt `visual-sweep-screenshots`: 172 pliki, SHA-256
  `a605ffb7d399d9f214790b738d3381140969f0a5d0570ca6ca86b568ca633615`;
- ręcznie przejrzano 172/172 zrzuty w dziewięciu arkuszach kontaktowych;
- CTA `UTWÓRZ WIZYTĘ`: widoczne w
  `admin/390x844/modal-appointment-drawer.png`;
- automatyczny pomiar szerokości: 27/85 mobilnych zrzutów ma szerokość
  większą niż 390 px.

## Rollout

Nie dotyczy — workflow był tylko odczytowym audytem produkcyjnego UI.

## Follow-up

Przygotować osobne zadanie na responsywność tabel/formularzy i uszczelnienie
kompletności modal sweepu. Faza A E4.1+E4.2 pozostaje zablokowana do wykonania
`pg_dump`, przełączenia sekretu CI przez ownera i jawnej zgody przed migracją.
