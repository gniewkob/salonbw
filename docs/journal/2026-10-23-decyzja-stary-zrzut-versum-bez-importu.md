# Decyzja: stary zrzut SQL z Versum zostaje bez importu

- **Data:** 2026-10-23
- **Agent:** Claude Opus 5.5
- **Commit(y):** ten commit
- **PR:** gniewkob/salonbw#1512 (commit z samą dokumentacją)

## Finding

Owner wskazał zrzut na dysku zewnętrznym (`LaCie`, katalog
`Archive/Backups/Legacy/dump_complete`). To 13 plików z INSERT-ami danych
zebranych z Versum w lipcu 2025, a nie `pg_dump`. Analiza objęła wyłącznie
liczby (wiersze, wypełnienie kolumn, zakresy dat), bez danych osobowych.

| Plik | Zawartość | Wartość dla panelu |
|---|---|---|
| `customer_appointments` | 1095 wizyt z lat 2017–2025, z ceną i pracownikiem | Prawie wszystkie są już na produkcji (niżej) |
| `customers_full`, `customers_complete` | 1307 wierszy, 708 klientów; imię i nazwisko w 449 wierszach, bez telefonu i e-maila; kolumny `pesel`/`nip` puste | Nie da się pewnie powiązać z kartami |
| `products_full`, `products_complete` | 900 produktów: nazwa, kategoria, producent, pojemność; bez cen i kodów | Produkcja ma już 821 produktów z Versum |
| `product_usages` | 10 565 zużyć, wszystkie bez daty | Nie da się przypisać do wizyt |
| `communications` | 35 wiadomości bez dat | Brak |
| Pracownicy, prowizje, dostawy, historia cen | 6 / 12 / 6 / 6 wierszy, bez dat | Poza zakresem (salon jednoosobowy) |

Porównanie wizyt po parze data+godzina (na serwer trafiły tylko te pary):

- 783 (72%) ma na produkcji wizytę w tym samym terminie;
- 62 to w eksporcie Booksy wizyty bez klientki, celowo nieimportowane;
- 250 nie ma w Booksy pod tym terminem: 176 w dniu, w którym Booksy ma wizytę
  o innej godzinie, 56 przesuniętych o ±1 h (40 razy −60 min, 16 razy
  +60 min, rozłożone na cały rok, więc to przełożenia, a nie błąd zmiany
  czasu w imporcie), 18 w dniach nieobecnych w Booksy.

## Decyzja (owner, 2026-10-23)

Stary zrzut zostaje **bez importu**. Źródłem historii jest eksport Booksy
(zawiera historię z Versum i jest już zaimportowany). Import 250
niedopasowanych wizyt groziłby duplikatami przełożonych wizyt i zawyżeniem
statystyk o ok. 41 tys. zł, a reszta plików nie ma danych pozwalających
na pewne powiązanie.

## Change

Brak zmian w kodzie i w bazie. Pliki tymczasowe analizy usunięte lokalnie
i z serwera.

## Validation

Nie dotyczy (decyzja).

## Rollout

Nie dotyczy.

## Follow-up

- Zrzut zawiera dane osobowe (imiona i nazwiska) na dysku zewnętrznym. Czy go
  zachować, czy usunąć, decyduje owner.
