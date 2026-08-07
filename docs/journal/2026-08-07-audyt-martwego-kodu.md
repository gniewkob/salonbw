# Audyt „ukrytych" funkcjonalności — kod istnieje, ale nic go nie używa

- **Data:** 2026-08-07
- **Agent:** Claude (właściciel: „sprawdź czy nie mam więcej takich ukrytych funkcjonalności")
- **Typ:** audyt (bez zmian w kodzie)
- **Punkt wyjścia:** `PushService` miał zero wywołań (naprawione `26cc095f`)

## Metoda

1. Serwisy backendu bez referencji poza własnym plikiem/modułem/spekiem.
2. 377 endpointów backendu skonfrontowanych z 166 wywołaniami `apiFetch`
   z panelu i landingu (weryfikacja kandydatów surowym grepem, bo
   normalizacja ścieżek daje fałszywe trafienia).
3. 114 tras panelu skonfrontowanych z linkami/`router.push`.
4. Flagi środowiskowe vs faktyczny stan produkcyjnego `.env`.
5. Stan tabel `reminder_settings`, `sms_logs`, `email_logs` na produkcji.

## Znaleziska — wg wagi biznesowej

### 🔴 1. Przypomnienia o wizytach: skonfigurowane na SMS, SMS martwy

`reminder_settings` na produkcji: `active = true`, `preferred_channel =
'sms'`. `SMSAPI_TOKEN` w `.env` jest **pusty**, a `sms_logs` ma **0
rekordów** — czyli od zawsze nie poszło ani jedno przypomnienie SMS-em,
mimo że system jest ustawiony jakby szło.

Łagodzące: `automatic-reminder.service` próbuje e-maila **niezależnym
`if`, nie `else`**, więc klientki z adresem i zgodą dostają przypomnienie
mailem. Połowa możliwości jest jednak cicho martwa, a ustawienie
„preferowany kanał: SMS" wprowadza w błąd.

### 🔴 2. WhatsApp: każda wysyłka to ciche no-op

`WHATSAPP_TOKEN` pusty → `WhatsappService.enabled = false` → `sendMessage`
robi wczesny `return`. Dotyczy **wszystkich** wysyłek: potwierdzenie
rezerwacji do klientki, powiadomienie o zmianie terminu, alert o nowej
rezerwacji do pracownika, oraz `reminder.service`.

Osobno: **istnieją dwa równoległe serwisy przypomnień** —
`reminder.service` (`@Cron('0 * * * *')`, wysyła wyłącznie WhatsAppem,
czyli dziś nie robi nic) i `automatic-reminder.service`
(`@Cron(EVERY_HOUR)`, SMS + e-mail). Ten pierwszy to w praktyce martwy
duplikat mielący co godzinę.

### 🟡 3. `POST /database/seed-test-data` bez bezpiecznika środowiskowego

Endpoint jest `@Roles(Admin)`, ale **nie ma żadnej bramki na środowisko**
— admin może na produkcji wstrzyknąć dane testowe (pracownicy, usługi,
klientki, wizyty). Seed tylko dopisuje, nie kasuje, więc nie jest
destrukcyjny, ale po imporcie realnych danych klientek (E3) wmieszałby
fałszywe rekordy między prawdziwe. Wzorzec do naśladowania jest w repo:
skrypt syntetyczny wymaga `APP_LIFECYCLE=prelive` + frazy potwierdzającej.

### 🟡 4. Zarządzanie kategoriami usług nieosiągalne z UI

`/settings/service-categories` to pełna strona CRUD (zbudowana
2026-06-17), do której **nie prowadzi ani jeden link**. Regresja po
sprzątaniu IA z 2026-07-06: usunięto wtedy kafelek „kategorie usług", bo
linkował do kategorii PRODUKTÓW, ale poprawnego linku nigdy nie dodano.
Strona działa — jest tylko niewidoczna.

### 🟡 5. `/statistics/warehouse/changes` bez linku

Realna strona statystyk ruchów magazynowych (pobiera `MovementStats`),
`StatisticsNav` linkuje wyłącznie `/statistics/warehouse`.

### 🟢 6. Martwy kod bezpieczny do usunięcia

- `/settings/employees/new` — zastąpione modalem na liście pracowników
  (przycisk „Dodaj pracownika" otwiera formularz in-page). Sama strona
  jest nieosiągalna, ale funkcja NIE jest utracona.
- `/settings/categories/new` — analogicznie, zastąpione modalem.
- `/statistics/warehouse/value` — dane pobiera już `index.tsx`, osobna
  strona to duplikat.
- `/stocktakings` — celowy redirect na `/inventory`, zostawić.

### 🟢 7. Endpointy bez konsumenta (świadome lub nieszkodliwe)

- `GET /commissions/me` — pracownik nie ma UI do własnych prowizji (rola
  „pracownik" jest poza zakresem GO, więc dziś bez znaczenia).
- `POST /invoices/:id/jpk`, `POST /invoices/jpk/export` — eksport JPK bez
  UI; wiąże się z otwartym pytaniem o fiskalizację (do księgowej).
- `/auth/social/facebook`, `/auth/social/me` — uśpione świadomie.

### ✅ Sprawdzone i czyste

- `NEXT_PUBLIC_LOG_TOKEN` występuje **wyłącznie w komentarzu**
  dokumentującym dawną naprawę — nie ma wycieku sekretu do bundla.
- `ReminderService`/`DatabaseMetricsService`/`DatabaseSlowQueryService`
  mają zero wywołań, ale są sterowane `@Cron` — to nie martwy kod
  (`DatabaseMetricsService` widać w logach produkcyjnych).
- `POS_ENABLED` i `SENTRY_DSN` ustawione na produkcji.
- Puste na produkcji, zgodnie z wiedzą: `REDIS_URL`, `LOKI_URL`,
  `UPLOADS_DIR`.

## Rekomendowana kolejność

1. **Rozstrzygnąć przypomnienia** (#1+#2): albo token SMSAPI, albo
   przestawić `preferred_channel` na e-mail, żeby ustawienie mówiło
   prawdę. Przy okazji usunąć martwy `reminder.service` (WhatsApp-only).
2. **Zabramkować `seed-test-data`** (#3) — przed importem realnych danych.
3. Przywrócić link do kategorii usług (#4) i do statystyk ruchów (#5) —
   drobne, czysto nawigacyjne.
4. Usunąć martwe strony (#6) — kosmetyka, bez pośpiechu.
