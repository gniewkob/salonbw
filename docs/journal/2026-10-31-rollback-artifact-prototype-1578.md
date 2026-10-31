# #1578 — lokalny prototyp artefaktu

- **Data:** 2026-10-31; **agent:** Codex; **PR:** brak.

## Finding
Kod API #1576 i `b208e36e` jest identyczny. Nie ma wskazanej regresji ani alternatywnego bezpiecznego zachowania, więc nie można przedstawić tego samego kodu jako naprawy regresji zależności.

## Change
Z archiwum Git pełnego SHA `1ced2e70a441389ded5a075659f8bf06b670644e` zbudowano lokalny prototyp API; `dist`, manifest i `app.js`, bez danych i konfiguracji. SHA-256 `3e56aa573244a0377a54c15c97014af99e1452350ab790ff2e0d41270175744c`. Artefakt przechowywany lokalnie poza repozytorium.

## Validation
Lokalny Node 26.12.1, build Nest z istniejącymi node_modules, 1348 plików dist. Czyste odtworzenie do katalogu tymczasowego: integralność, ścieżki, entrypoint, manifest gate, izolowana instalacja npm bez skryptów i lockfile, kontrola instalacji, syntetyczny Sharp JPEG/PNG/WebP i bcrypt PASS. Tymczasowy katalog usunięto. Bez uruchomienia aplikacji, bazy, Passenger lub FreeBSD. Istniejące node_modules nie są potwierdzeniem odtwarzalności; instalacja npm nie zamraża pełnego grafu.

## Rollout / follow-up
Bez produkcji, merge, deploymentu, migracji lub restartu. BLOCKED: artefakt nie jest gotowym rollbackiem; wymagane faktyczne zachowanie regresji, właściwe docelowe środowisko, niezależny artefakt, zgodność DB i kontrola Passenger.
