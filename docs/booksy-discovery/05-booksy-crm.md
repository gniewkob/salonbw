# 05 — Booksy-like CRM

## Macierz funkcji

| Funkcja | Booksy behavior | SalonBW current | Brak / gap | Target UX | Priorytet |
| --- | --- | --- | --- | --- | --- |
| Lista klientów | szybkie wyszukiwanie i segmentacja | jest `/customers` + filtry | brak spójnego toolbar pattern | unified `PanelToolbar + PanelFilters + PanelTable` | P0 |
| Karta klienta | centrum historii klienta | profil istnieje | rozproszenie danych (wizyty/sprzedaż/notatki) | zakładki: Profil, Wizyty, Sprzedaż, Notatki, Komunikacja | P0 |
| Wyszukiwarka | global search + phone/email | częściowo | brak global shortcut i federacji | global quick-search modal | P1 |
| Filtrowanie | tagi/grupy/statusy | dostępne podstawowo | brak zapisanych segmentów | saved segments + badges | P1 |
| Tagi / grupy | zarządzanie segmentami | encje istnieją (`customer_tags/groups`) | brak spójnego flow masowych operacji | bulk assign/remove | P1 |
| Historia wizyt | pełna chronologia | jest endpoint events-history | UX niespójny | timeline z linkiem do wizyty i płatności | P0 |
| Historia sprzedaży | powiązanie retail + usług | częściowo przez sales history | brak jednolitego widoku klienta | sales tab z KPI total spent/AOV | P0 |
| Notatki | notatki operacyjne | encja `customer_notes` jest | brak warning-level notes | sticky warning note + standard note | P1 |
| Zgody marketingowe | consent flags | częściowo | brak jednolitego modelu i widoku | consent block + audit trail | P1 |
| Preferencje | usługi/pracownik preferowany | brak pełnej ekspozycji | braki pól i UI | `favoriteServices`, `preferredEmployee` | P1 |
| Ostrzeżenia | no-show/debt/allergy | brak spójnej semantyki | brak badge system | warning badges widoczne też w kalendarzu | P0 |
| Komunikacja | historia SMS/e-mail | logi sms/email istnieją | brak klientocentrycznego widoku | customer communication timeline | P1 |
| Segmentacja | target campaigns | częściowo | brak gotowych segmentów biznesowych | smart segments (VIP, dormant, no-show) | P2 |
| Import/export | import klientów, dedupe | brak standaryzacji | brak workflow dedupe | import wizard + merge duplicates | P2 |
| Duplikaty | merge klientów | brak | brak narzędzia merge | duplicate detection + merge action | P2 |

## Minimalny target CRM (must-have)

Docelowy profil klienta wspiera:
- `client profile`,
- `appointment history`,
- `sales history`,
- `notes`,
- `tags/groups`,
- `consents`,
- `marketing preferences`,
- `warnings`,
- `favorite services`,
- `preferred employee`,
- `last visit`,
- `next visit`,
- `total spent`,
- `no-show count`.

## Rekomendowane zmiany

- Problem: brak jednego centrum pracy z klientem.
- Obecny stan: dane są, ale rozsiane po route-ach i API.
- Docelowy stan: profil klienta jako hub operacyjny (kalendarz + POS + komunikacja).
- Pliki / moduły do zmiany: `apps/panel/src/pages/customers/*`, `apps/panel/src/components/customers/*`, `backend/src/customers/*`, `backend/src/sms/*`, `backend/src/emails/*`.
- Priorytet: P0/P1.
- Acceptance criteria: recepcja obsłuży pełen cykl klienta bez opuszczania modułu `Klienci`.
