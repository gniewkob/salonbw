# Rejestr ryzyk i decyzji ownera

Jedyne miejsce, w którym zapisuje się, że owner **przyjął, ograniczył albo
odrzucił** ryzyko. Wpisy dodaje owner albo agent na jego wyraźne polecenie w
danym zadaniu. Agent nie wpisuje decyzji, której owner nie podjął.

Zasady (nadrzędna sekcja w `AGENTS.md`):

- Status „zaakceptowane" zamyka temat. Agent nie podnosi go ponownie.
- Ponowne otwarcie wymaga nowego faktu, zgodnego z kolumną „Otworzyć ponownie, gdy".
- Jedna linia na decyzję. Szczegóły, jeśli potrzebne, w `docs/decisions/<data>-<slug>.md`.

Statusy: `zaakceptowane` · `ograniczone` (przyjęte z warunkiem) · `odrzucone`
(ryzyko ma być usunięte) · `wygasłe`.

| ID | Data | Ryzyko | Decyzja | Uzasadnienie (1 zdanie) | Otworzyć ponownie, gdy |
|---|---|---|---|---|---|
| R-000 | RRRR-MM-DD | _przykład: brak osobnego środowiska testowego dla X_ | _zaakceptowane_ | _koszt przewyższa skutek przy jednym użytkowniku_ | _pojawi się drugi użytkownik_ |

<!-- Wiersz R-000 jest wzorem. Usuń go przy pierwszym prawdziwym wpisie. -->
