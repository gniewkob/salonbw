# #1578 — projekt izolowanego prototypu

- **Data:** 2026-10-31; **agent:** Codex; **PR:** brak.

## Finding
Skrypt snapshotu DEV odtwarza `.env`, co wykazała syntetyczna próba. Istniejący workflow nie spełnia warunku zachowania konfiguracji i DB.

## Change
Dodano do runbooka konkretny projekt wyłącznie lokalnego prototypu oraz macierz negatywnych testów. Nie zmieniono wykonawczego kodu, bramek, konfiguracji, workflow ani danych.

## Validation
Przegląd kodu aktualnego skryptu DEV, entrypointu API i runbooka; `git diff --check`. Projekt nie jest implementacją ani przetestowaną procedurą odzyskiwania.

## Rollout / follow-up
Brak; produkcja i DEV bez zmian. Przed implementacją zmian dotyczących bezpieczeństwa wymagana zgoda zgodnie z instrukcją użytkownika. Po niej wykonać prototyp wyłącznie lokalnie i zachować status BLOCKED do zamknięcia wszystkich niezależnych bramek.
