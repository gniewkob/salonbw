# Rollback API: izolowany preflight (#1578)

- **Data:** 2026-10-31
- **Baza instrukcji:** #1576, `1ced2e70a441389ded5a075659f8bf06b670644e`.
- **Wynik:** `ROLLBACK_PREFLIGHT=BLOCKED`; nie wykonano rollout/rollbacku.

## Finding

Wydanie zależności musi zapewnić możliwość powrotu bez przywracania znanych
podatności. Kod API w #1576 względem `b208e36ebb9df508bc8f4555346d1de9ffa5e9b7`
nie zmienia się poza manifestem; zachowanie nowego grafu nie jest zatem
cofnięte przez ponowne użycie tego samego grafu. Wersję historycznego artefaktu
oraz możliwość bezpiecznego odtworzenia trzeba ustalić niezależnie od samej
integralności archiwów.

## Evidence

W izolowanym katalogu FreeBSD skopiowano wyłącznie skompilowany kod i manifest,
bez `.env`, uploads i dostępu do bazy; użyto zatwierdzonego manifestu npm oraz
bramki #1576. Instalacja npm, kontrola wersji, ładowanie zależności, syntetyczne
przetwarzanie JPEG/PNG/WebP i bcrypt przeszły. Porównanie kodu lokalnego builda
wykazało 449 zgodnych plików JS/JSON oraz jeden dodatkowy plik w runtime,
którego pochodzenie należy wyjaśnić. Odtworzono w osobnym katalogu wyłącznie 1349 plików kodu archiwalnego i entrypoint, bez `.env` i uploads; próba kodu PASS. Nie było próby uruchomienia aplikacji ani przywrócenia środowiska produkcyjnego.

## Change / follow-up

[Runbook](../ROLLBACK_API_DEPENDENCY_PREFLIGHT.md) definiuje warianty i STOP/GO.
Przed uznaniem pełnego preflightu trzeba dostarczyć jednoznaczny bezpieczny
kandydat przywracający oczekiwane zachowanie, weryfikację artefaktu i bazy,
test procedury z niezmiennym `.env`/uploads oraz niezależny plan powrotu.
Ustalenia operacyjne o produkcyjnym grafie i backupach przekazać prywatnie.

## Dodatkowa weryfikacja

Syntetyczny test oryginalnego `app.js` potwierdził priorytet środowiskowego
`APP_RELEASE` w trybie produkcyjnym i niezmienność pliku `.env`; tryb
development ma przeciwną precedencję. Passenger i rzeczywisty sposób dostarczenia
zmiennej nie były testowane. Odczytowe porównanie potwierdziło zgodność
dodatkowego entrypointu migracji z historycznym archiwum, bez ustalenia SHA
jego pochodzenia. Nie wykonywano ani nie usuwano tego pliku.

## Passenger: dokumentacja dostawcy

Odczytowo potwierdzono, że dokumentacja MyDevil opisuje przekazywanie zmiennych
Passenger przez profil powłoki; może to objąć wiele aplikacji konta i wymaga
odrębnej weryfikacji. Nie zmieniono profilu ani konfiguracji. Dodatkowy plik
migracji nie ma mapy źródłowej, więc jego SHA kodu źródłowego nie jest znany.
