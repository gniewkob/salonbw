# Landing L1 — kontekstowe wejścia do katalogu usług

- **Data:** 2026-10-31
- **Zakres:** issue [#1580](https://github.com/gniewkob/salonbw/issues/1580), iteracja L1
- **Baseline:** `b208e36ebb9df508bc8f4555346d1de9ffa5e9b7`
- **Zmieniony obszar:** wyłącznie `apps/landing`; brak API/DB/deploymentu

## Finding

Strona główna prezentowała trzy różne grupy usług (Fryzjerstwo, Akademia Pielęgnacji, Przedłużanie Włosów), lecz wszystkie karty prowadziły pod identyczny `/services` i nie wskazywały właściwej części oferty.

`/services` już pobiera aktualny katalog przez `GET /services/public` (SSR), filtruje po `onlineBooking !== false` i wylicza ceny `od` z wariantów. Nie tworzyć równoległego statycznego cennika.

## Change

- Karty prowadzą do trzech stabilnych kluczy: `/services?offer=hairdressing`, `?offer=care`, `?offer=extensions`.
- SSR waliduje dokładnie te klucze, dopasowuje do bieżących kategorii na podstawie nazw kategorii i usług; specjalistyczna nazwa kategorii ma priorytet nad dopasowaniem pojedynczej usługi.
- Jeśli kategoria nie istnieje lub nie da się potwierdzić dopasowania, strona pozostaje na pełnym, aktualnym katalogu (bez pustego stanu, fikcyjnych usług czy cen).
- Ręczny wybór kategorii/„Wszystkie” działa nadal. Domyślny `/services` i aktualne ścieżki BookingModal, SEO oraz języki PL/EN/DE pozostają bez zmian.

## Validation

Dodane testy:
- jednostkowe `serviceOfferFocus.test.ts`: trzy grupy, polskie znaki, specjalistyczna kategoria, brak dopasowania, niepoprawny parametr;
- `servicesTeaserOffers.test.tsx`: wszystkie trzy odnośniki i istniejące „Pełna oferta usług”;
- `servicesAnalytics.test.tsx`: dopasowanie SSR i ręczna nawigacja po kategoriach.

**Do uzupełnienia po CI:** exact SHA, landing Jest, TypeScript, build, bezpieczeństwo CI.

**Nadal wymaga wizualnego odbioru:** zrzuty 390/1440 px z aktualnego DEV po publikacji wersji testowej. Nie twierdzić, że wykonano screenshoty ani testy produkcyjne.

## Rollout

Tylko PR. Bez zmian produkcji, backendu, bazy, konfiguracji Passenger i bez migracji.

## Follow-up

Następny etap L2 w #1580: czytelność listy cen, wariantów i przejścia do rezerwacji w `/services`. Realne ceny i dostępność muszą pochodzić z katalogu, bez marketingowych kwot na sztywno.
