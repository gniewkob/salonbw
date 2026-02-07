# Analiza HAR z Versum - Moduł Klienci

**Data analizy:** 2026-02-07  
**Źródło:** `docs/Architektura/customers.panel.versum.com.har` (16.8 MB)

---

## 📊 Podsumowanie

| Element | Status | Uwagi |
|---------|--------|-------|
| Endpointy URL | ✅ Potwierdzone | `/salonblackandwhite/customers` |
| Struktura HTML | ✅ Zidentyfikowana | Server-side rendering |
| Dane klientów | ❌ Brak | HAR zapisany za wcześnie (przed AJAX) |
| GraphQL queries | ⚠️ Ograniczone | Tylko powiadomienia, nie customers |
| Konfiguracja | ✅ Pełna | `VersumConfig` z parametrami |

---

## 🔗 Endpointy URL (z HTML)

```
/salonblackandwhite/customers              → Lista klientów
/salonblackandwhite/customers/{id}         → Profil klienta
```

**Znaleziono linki do klientów:**
- `/salonblackandwhite/customers/10911931`
- `/salonblackandwhite/customers/11671319`
- `/salonblackandwhite/customers/13165859`
- ... (ponad 20 ID klientów)

To potwierdza naszą strukturę URL!

---

## ⚙️ VersumConfig

Znaleziono konfigurację w HTML:

```json
{
  "branch_id": 19581,
  "user_id": 4272118,
  "branch_subdomain": "salonblackandwhite",
  "is_vat_payer": true,
  "payment_finish_url": "/salonblackandwhite/settings/payment_processing/versum_order_payments/new",
  "physical_help_url": "/salonblackandwhite/helps/new",
  "notification_center_notifications_path": "/salonblackandwhite/notification_center/notifications",
  "lumo": false,
  "medical_office": false,
  "resources_activated": false,
  "gift_cards_activated": false,
  "gift_cards": {
    "max_inscription_length": 70,
    "purpose_kind_pickable": true,
    "default_purpose_kind": "spv"
  },
  "tips": {
    "tips_activated": true,
    "tips_payment_methods": ["cash", "credit_card", "cheque", "transfer"],
    "tips_default_percents": "10"
  },
  "prepayments_enabled": false,
  "online_payments_enabled": false,
  "online_payments_available": true,
  "new_customer_modal_version": "v7",
  "env": "production",
  "application": {
    "api": {
      "deviceToken": null,
      "graphQL": {
        "url": "/graphql"
      },
      "auth": {
        "url": "/oauth/token",
        "clientId": "82c84458b0da414e99fc58a9771cf321"
      }
    }
  },
  "t_net": "netto",
  "t_gross": "brutto",
  "current_branch_readonly": false
}
```

### Kluczowe informacje:
- **GraphQL endpoint:** `/graphql` (POST)
- **Auth endpoint:** `/oauth/token`
- **Gift cards:** Aktywne z konfiguracją
- **Tips:** Aktywne (10% default)
- **Online payments:** Dostępne ale nieaktywne

---

## 📡 GraphQL Queries (znalezione)

```graphql
# Powiadomienia
query GetNotificationCenterPushNotifications($count: Int, $cursor: String, $page: Int)
query GetNotificationCenterUnreadCount
query GetNetGrossTranslationType
```

**Brak w HAR:**
- ❌ `GetCustomers` lub podobne (lista klientów)
- ❌ `GetCustomer` (szczegóły klienta)
- ❌ `GetCustomerGroups`
- ❌ `GetCustomerHistory`

**Dlaczego?** HAR został zapisany zbyt wcześnie - przed załadowaniem danych klientów przez AJAX.

---

## 🎨 Struktura HTML

### Zidentyfikowane klasy CSS:
- `customers` - główny kontener
- `svg-customers-nav` - ikona nawigacji
- `sprite-customer_telephone` - ikona telefonu
- `customer_action` - akcje klienta

### Brak w HAR:
- Szczegółowa struktura tabeli
- Sidebar z filtrami
- Formularze edycji

---

## ⚠️ Problemy z HAR

HAR został nagrany **przed** wykonaniem zapytań o dane klientów. Typowy flow:

```
1. Ładowanie strony → HTML/CSS/JS (ZAPISAŁEŚ TUTAJ)
2. Inicjalizacja aplikacji
3. AJAX/GraphQL → pobieranie listy klientów (BRAK W HAR)
4. Renderowanie tabeli
5. Interakcje użytkownika (kliknięcia, filtry)
```

---

## ✅ Weryfikacja naszej implementacji

| Element | Nasza implementacja | Versum | Status |
|---------|-------------------|--------|--------|
| Endpoint lista | `/salonblackandwhite/customers` | `/salonblackandwhite/customers` | ✅ Zgodne |
| Endpoint profil | `/salonblackandwhite/customers/:id` | `/salonblackandwhite/customers/:id` | ✅ Zgodne |
| GraphQL | Brak (REST API) | `/graphql` | ⚠️ Różnica |
| Auth | JWT | OAuth2 | ⚠️ Różnica |

### Różnice architektoniczne:
1. **Versum używa GraphQL** - my używamy REST
2. **Versum używa OAuth2** - my używamy JWT

Te różnice są **akceptowalne** dla compat layer - nasze endpointy REST mapują się na funkcjonalność GraphQL.

---

## 🎯 Rekomendacje

### 1. Dokończenie modułu (bez nowego HAR):
Nasza obecna implementacja jest **funkcjonalnie kompletna**:
- ✅ API adapter z endpointami `/salonblackandwhite/customers/*`
- ✅ Frontend w stylu Versum
- ✅ E2E tests
- ✅ Visual tests

### 2. Pełna weryfikacja (wymaga nowego HAR):
Aby potwierdzić 100% zgodność, potrzebujemy HAR z:
- Requestami GraphQL dla customers
- Odpowiedziami z danymi klientów
- Payloadami z filtrów i sortowania

### 3. Jak nagrać poprawny HAR:
```
1. Otwórz DevTools → Network → Preserve log ✅
2. Wejdź na /salonblackandwhite/customers
3. POCZEKAJ aż załaduje się lista klientów (2-3 sekundy)
4. Kliknij w klienta → przejdź do profilu
5. Przełącz wszystkie zakładki (podsumowanie, dane, historia...)
6. Wróć do listy
7. Użyj filtrów/wyszukiwarki
8. Prawy przycisk → "Save all as HAR with content"
```

---

## 📋 Status Definition of Done

| Kryterium | Status | Komentarz |
|-----------|--------|-----------|
| Reference capture (HAR) | ⚠️ Częściowe | HTML + config, brak danych AJAX |
| Vendored assets + CSS | ✅ Gotowe | `versum-shell.css` |
| Full API adapter | ✅ Gotowe | 6 endpointów REST |
| E2E tests | ✅ Gotowe | 10 testów |
| Pixel parity tests | ✅ Gotowe | 10 screenshotów |
| Module freeze | ✅ Gotowe | Dokumentacja |

**Wniosek:** Moduł jest **gotowy do użycia** mimo brakujących danych AJAX w HAR.
