# 03 — Booksy UX Map (Public Discovery)

Źródła: publiczne strony Booksy Biz, Booksy Help Center (bez prywatnego reverse engineering).

## Mapa produktu

| Obszar | Co robi użytkownik | Główne akcje | Dane na ekranie | UX pattern | Priorytet dla SalonBW |
| --- | --- | --- | --- | --- | --- |
| Główna nawigacja | Przełącza moduły operacyjne | Otwórz calendar/clients/checkout/reports/settings | Moduły + skróty | Persistent shell + sidebar/topbar | P0 |
| Dashboard / start pracy | Sprawdza dzień pracy | Przegląd KPI, nadchodzące wizyty | KPI, aktywność, alerty | Card dashboard | P1 |
| Kalendarz | Zarządza slotami i obłożeniem | Add/edit/move/resize appointment | Siatka czasu, pracownicy, statusy | Time-grid + quick actions | P0 |
| Wizyty | Zarządza cyklem wizyty | Confirm/arrive/no-show/complete | Klient, usługi, status, płatność | Appointment drawer/modal | P0 |
| Klienci / CRM | Obsługuje profil klienta | Search, open profile, notes, tags | Historia wizyt i sprzedaży | List + detail split | P0 |
| Usługi | Zarządza ofertą | Add/edit category/service/variant | Cennik, czas, przypisanie | Table + forms | P1 |
| Pracownicy | Zarządza personelem | Dodaj pracownika, role, grafiki | Rola, dostępność, wydajność | Table + permission matrix | P1 |
| Magazyn / produkty | Zarządza stanem i produktami | Add product, deliveries, corrections | SKU, stan, min-level | Inventory table | P1 |
| Sprzedaż / płatności / POS | Finalizuje wizyty i sprzedaż retail | Checkout, split payment, receipt | Pozycje, rabat, tip, metody płatności | POS modal / checkout flow | P0 |
| Raporty | Analizuje wynik biznesu | Revenue/staff/services reports | KPI, trend, cashflow | Filters + charts + export | P2 |
| Komunikacja | Wysyła wiadomości i przypomnienia | Template/send/campaign/reminder | Template, status wysyłki | Campaign list + logs | P1 |
| Ustawienia | Konfiguruje biznes i polityki | Calendars, booking rules, consent | Konfiguracje, role, integracje | Settings tree | P1 |
| Rezerwacja online klienta | Klient sam bookuje termin | Wybór usługi/pracownika/godziny | Dostępność i zasady booking | Guided booking funnel | P1 |

## Priorytety dla SalonBW

- `P0`: calendar, appointments, CRM core, POS finalization, shell consistency.
- `P1`: usługi/pracownicy/komunikacja/online booking.
- `P2`: rozszerzone raporty i automatyzacje.
- `P3/OUT`: marketplace-specific growth features (np. płatne pozycjonowanie w marketplace).
