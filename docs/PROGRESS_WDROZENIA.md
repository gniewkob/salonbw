# Postęp Wdrożenia SalonBW (Versum Clone)

> Ostatnia aktualizacja: 2026-04-03

## Stan Ogólny

| Faza | Status | Postęp |
|------|--------|--------|
| Faza 1: MVP | ✅ Ukończona | 100% |
| Faza 2: Core Business | ✅ Ukończona | 100% |
| Faza 3: Advanced | ✅ Ukończona | 100% |
| Faza 4: Enterprise | ✅ Ukończona | 100% |

---

> [!IMPORTANT]
> Aplikacja (Dashboard, Rezerwacja, Ustawienia) działa **wyłącznie** w **panelu** (`apps/panel`, `panel.salon-bw.pl`).  
> `dev.salon-bw.pl` (`apps/landing`) to **tylko wizytówka** + CTA do panelu — nie dodajemy tam logiki dashboardu.

> [!NOTE]
> **Produkcyjna Gotowość**: System przeszedł pełną unifikację nazewnictwa (`Customer` standard), rygorystyczną walidację danych (DTO transform) oraz centralizację logiki finansowej (`FinanceModule`). Jest gotowy do pracy jako samodzielna platforma.

Dokument planu dla fazy enterprise:
- [ENTERPRISE_READINESS_PLAN.md](./ENTERPRISE_READINESS_PLAN.md)
- [SENSITIVE_DATA_ONBOARDING_CHECKLIST.md](./SENSITIVE_DATA_ONBOARDING_CHECKLIST.md)
- [VERSUM_EXPORT_IMPORT_PLAN.md](./VERSUM_EXPORT_IMPORT_PLAN.md)
- [VERSUM_SERVICES_PRODUCTS_IMPORT.md](./VERSUM_SERVICES_PRODUCTS_IMPORT.md)

---

## ✅ Jakość i Testy (Backend)

- [x] Konfiguracja **SQLite Memory DB** dla szybkich testów izolowanych
- [x] **37/37 testów E2E** przechodzi poprawnie (`pnpm test:e2e`)
- [x] Standaryzacja encji dla kompatybilności **PostgreSQL + SQLite**
- [x] Automatyczne ładowanie encji przez `test/test-entities.ts`
- [x] Rozwiązanie problemów z `path-to-regexp` i `express 5` w NestJS 11
- [x] Poprawki stabilności: wyłączony CSRF w testach, poprawne wstrzykiwanie `PinoLogger`
- [x] **Polityka czystych logów**: Automatyczna redakcja haseł i tokenów w `LogService`
- [x] **Rygorystyczna Walidacja**: Włączono `transform: true` i walidację typów wejściowych (DTO) dla wszystkich kluczowych endpointów.
- [x] **Observability**: Dodano metryki biznesowe (Prometheus) dla JPK i Social Logins.

---

## Faza 1: MVP

### ✅ Uwierzytelnianie
- [x] Login/logout
- [x] Role użytkowników (Admin, Employee, Receptionist, Customer)
- [x] Resetowanie hasła (flow email)
- [x] CSRF Protection & JWT logic

### ✅ Kalendarz (Versum Engine)
- [x] Widok dnia/tygodnia/pracownika
- [x] Rezerwacja wizyt (nowa wizyta, edycja, przeciąganie)
- [x] Statusy wizyt (potwierdzona, oczekująca, zakończona, nieobecność)
- [x] Integracja "vendored" runtime Versum z nowym API

---

## Faza 2: Core Business

### ✅ Kartoteka Klientów
- [x] Baza klientów z historią wizyt
- [x] Statystyki klienta (LTV, częstotliwość)
- [x] Grupy klientów i tagi
- [x] Formuły zabiegowe i zgody RODO

### ✅ Katalog Usług i Produktów
- [x] Usługi (kategorie, warianty, czas trwania)
- [x] Produkty (sprzedaż detaliczna, stany magazynowe)
- [x] Receptury usług (zużycie materiałów)

---

## Faza 3: Advanced

### ✅ Moduł Finansowy i Płatności
- [x] System POS (Finalizacja wizyty, paragony niefiskalne)
- [x] Metody płatności (gotówka, karta, przedpłata)
- [x] Raporty dobowe i miesięczne
- [x] **Eksport JPK_FA (4)**: Generowanie plików XML dla Urzędu Skarbowego
- [x] **Centralizacja Logiki**: Moduł `FinanceModule` do obliczeń podatkowych.

### ✅ Prowizje i Logi
- [x] Zaawansowany system prowizji pracowników
- [x] Audit Log (Pełna historia zmian w systemie)

---

## Faza 4: Enterprise

### ✅ Bony i Program Lojalnościowy
- [x] Sprzedaż i realizacja Bonów (Gift Cards)
- [x] Program lojalnościowy (punkty za wizyty/produkty, wymiana na nagrody)
- [x] Automatyczne wygasanie punktów

### ✅ Magazyn (Unified)
- [x] Dashboard magazynu (podsumowanie stanów i aktywności)
- [x] Zamówienia u dostawców (Draft -> Sent -> Received)
- [x] Przyjęcia dostaw (Deliveries) i Inwentaryzacja
- [x] Zarządzanie bazą dostawców (Suppliers)

### ✅ Integracje i Automatyzacja
- [x] Newslettery (Edytor WYSIWYG)
- [x] Automatyczne powiadomienia (SMS/Email/WhatsApp)
- [x] Integracja z Facebook/Instagram Booking (UI konfiguracyjny)
- [x] **Social Auth**: Logowanie i rejestracja przez Google, Facebook, Apple.
- [x] **Konta hybrydowe**: Powiązanie istniejącego konta klienta z profilami społecznościowymi.
- [x] **Eksporty JPK**: Pełna obsługa formatu FA (4).

---

*Dokument aktualizowany automatycznie podczas implementacji.*
