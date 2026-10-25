# Administrator systemu i pulpit techniczny

## Zakres zatwierdzony przez ownera

Administrator systemu ma pełny dostęp do modułów, lecz nie jest personelem
salonu i nie pojawia się na listach pracowników ani w rezerwacjach. Po
zalogowaniu widzi stan API, bazy, poczty/powiadomień, integracji, wersję
wdrożenia i bieżące wykryte awarie. Właścicielka zachowuje pulpit salonu.

## Model i zgodność

Zachowujemy `role=admin` jako istniejący poziom uprawnień. Nowa kolumna
`users.isSystemAdmin` (NOT NULL, default false) oznacza funkcję techniczną.
Nie ma mapowania na adres e-mail w kodzie ani automatycznego backfillu kont.
Profil użytkownika udostępnia flagę; /dashboard wybiera odpowiedni pulpit.
Istniejący admin salonu i wszystkie dotychczasowe role działają bez zmian.

Personel oraz rezerwacje wykluczają konta techniczne także na backendzie.
Nie można przypisywać im usług ani czasu pracy. Samo ukrycie w UI nie jest
zabezpieczeniem. Przypisanie funkcji do konta ownera to osobna kontrolowana
operacja po migracji i wdrożeniu, bez adresów w wersjonowanej dokumentacji.

## Kontrakt GET /system/status

- Wymaga JWT, roli admin i bieżącej flagi isSystemAdmin odczytanej z bazy.
- 401 bez sesji; 403 dla pozostałych ról/admina salonu; 200 z wynikiem kontroli.
- Cache-Control: no-store. Dane: checkedAt, status ok/degraded, api (status,
  uptimeSeconds, revision), services (database/smtp/instagram, status i
  latencyMs), notifications.deliveryVerification=unknown.
- Wykorzystuje istniejący HealthService, bez wysyłania wiadomości testowych.
  Pomija surowe komunikaty wyjątków, hosty, sekrety i dane klientek.
- Wersja API pochodzi z APP_RELEASE zapisanego przy deployu z immutable SHA.
  Brak prawidłowego SHA oznacza null, nigdy fikcyjną wersję.
- Status SMTP oznacza połączenie, nie odbiór wiadomości. Brak pomiaru SMS,
  push lub historii incydentów pozostaje wyraźnym brakiem danych.

## UI

Istniejący SalonShell i /dashboard; domyślny widok konta technicznego.
Monochromatyczne karty zgodne z brandem, polskie etykiety stanów, czas kontroli,
przycisk odświeżenia, odświeżanie co 60 s. Awaria pobrania danych nie może
pozostawić nieoznaczonego zielonego/aktualnego stanu. Pozostałe moduły nadal
są dostępne w standardowej nawigacji administratora.

## Walidacja i rollout

Testy najpierw: personel nie zawiera admina systemu, backend odmawia
przypisania usług/czasu pracy, endpoint zwraca 403 bez flagi i usuwa wrażliwe
komunikaty, dashboard rozróżnia typy admina i pokazuje awarię/unknown.
Pełne zestawy backend/panel, lint/typecheck/build, mobile/desktop i kontrola
kontraktu. Przygotować PR do przeglądu przed zmianą produkcyjnej konfiguracji
uwierzytelniania. Kolejność rollout: API+migracja, panel, kontrolowane przypisanie
flagi do wskazanego konta, ponowne logowanie i smoke. Cofnięcie UI nie wymaga
usunięcia kolumny ani danych konta.
