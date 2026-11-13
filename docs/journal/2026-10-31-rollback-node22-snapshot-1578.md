# #1578 — Node 22 i syntetyczny test snapshotu DEV

- **Data:** 2026-10-31; **agent:** Codex; **PR:** brak.

## Finding
DEV snapshot API obejmuje `.env` i przywraca go; nie spełnia warunku niezmienności konfiguracji. Wcześniejszy prototyp przetestowano wyłącznie na Node 26.

## Change
Zapisano wyniki i ograniczenia w runbooku; bez zmian skryptów, aplikacji lub konfiguracji.

## Validation
Na macOS Node 22.23.4/npm 10.9.9 w tymczasowym katalogu: weryfikacja SHA artefaktu, manifest gate, npm install bez skryptów/lockfile, dependency gate oraz Sharp JPEG/PNG/WebP i bcrypt PASS. `ip-address` nie był zainstalowany w tym grafie, w przeciwieństwie do próby Node 26; przyczyna nieustalona. Rebuild z tych samych lokalnych node_modules porównał 449/449 plików JS/JSON identycznych.

Oryginalny skrypt snapshotu DEV wykonany na syntetycznych katalogach z tymczasowym `DEPLOY_ALLOWED_ROOT`: zmiany A→B→A→B PASS, brakujący element snapshotu odmówił rollbacku przed mutacją, syntetyczne markery uploads i DB niezmienione. Syntetyczny `.env` był odtwarzany — to dowód niezgodności z założeniem. Bez uruchomienia aplikacji, DB lub Passenger. Tymczasowe dane usunięto.

## Rollout / follow-up
Bez zmian w DEV lub produkcji, merge, deploymentu, migracji czy restartu. BLOCKED: potrzebna osobna procedura z zachowaniem `.env` i jej pełny test oraz dowody FreeBSD, DB, Passenger i regresji zależności.
