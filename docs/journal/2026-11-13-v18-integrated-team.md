# Integracja V18 i jednoosobowy zespół

- Data: 2026-11-13; PR: brak; stan: NO-GO dla DEV i PROD.
- Źródła: #1704 `9c24a9d3d1b942bae938ba251a14506bb07c4528`, #1699 `98ab0bbb6a317ae9a179d263a4219f925d2ed6e8`; wspólny przodek `77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`.

## Finding i zmiana
Pulpit liczył konta zamiast wykonawców usług. Kalendarz ukrywał filtr, gdy odpowiedź ograniczono do jednej osoby. Pulpit i filtr korzystają teraz z listy wykonawców; jednoosobowy pulpit ukrywa kartę i skrót, a filtr wieloosobowy pozostaje dostępny. Test Node nasłuchiwania przystosowano do istniejącego Jest; w przeciwnym wypadku pełny zestaw panelu zgłaszał pusty zestaw.

## Walidacja
- Regresja filtra: fail przed poprawką, pass po poprawce. Panel 132 zestawy / 667 testów PASS; backend 71 zestawów / 650 testów PASS, 3 pominięte.
- TypeScript panelu PASS; build panelu PASS; ESLint zero błędów, istniejące ostrzeżenie o zależności efektu w kalendarzu.
- Test izolowanej konfiguracji: 13 PASS; test nasłuchiwania: 6 PASS w zestawie panelu.
- Skan Gitleaks zakresu wizualnej gałęzi (od wspólnego przodka do #1704) PASS; nie jest skanem całej historii ani końcowego SHA.
- GitHub CI #43518338355 i #43511701441: konto zablokowane z powodu rozliczeń; runner nie przydzielony, testy nie uruchomiły się.
- Anonimowy DEV: panel i chroniony endpoint kalendarza 401, health API 200. Bez testu sesji, izolacji danych ani funkcjonalnego UAT.

## Rollout i następny krok
Nie wdrożono. #1685 nie zapewnia automatycznego rollbacku DEV: wymaga kontrolowanego ponownego wdrożenia właściwego komponentu; odzyskanie bazy wymaga oddzielnej próby na izolowanej kopii. Linki backupu nie dowodzą odtwarzalności. Właściciel powinien rozwiązać rozliczenia Actions oraz prywatnie unieważnić lub zmienić historycznie ujawnione dane uwierzytelniające; potem wymagane dokładne CI, review, próba odtworzenia i izolowany UAT. Produkcja, logowanie i rezerwacje online bez zmian.
