# Plan: Panel 10/10 → wdrożenie na produkcji

Stan na 2026-07-03. Cel: panel bez luk funkcjonalnych i designowych, gotowy do
oddania realnym użytkownikom (Aleksandra + klientki). Dane testowe zostają do
końca testów — sprzątanie jest ostatnim krokiem przed startem.

## Diagnoza (krytyczny przegląd)

**Co jest mocne (nie ruszać):**
- Główny flow klienta przetestowany live E2E na prod — rejestracja (wymuszone
  zgody), rezerwacja, pulpit, reschedule→akceptacja, anulowanie, profil/zgody:
  zero bugów, zero wycieku cen do klienta.
- Kalendarz staff po redesignie (Booksy-feel, statusy B&W, godziny salonu,
  liczniki, drag z potwierdzeniem nakładania, płatność na kafelku).
- Finalizacja wizyty kompletna (cena z cennika edytowalna, produkty/usługi
  dodatkowe z wyszukiwarką, kwota zapłacona→napiwek, receptura, zalecenia,
  deducja magazynu, prowizje).
- Bezpieczeństwo: audyt zależności czysty (0 high), Gitleaks w CI, least
  privilege ról po fixie 2026-06-28, httpOnly tokeny, CSRF.
- 265 testów jednostkowych panelu + 234 backendu, wszystkie zielone.
- a11y 100 na audytowanych stronach (landing całość; panel: login, dashboard,
  customers).

**Luki funkcjonalne (ranking wg wpływu):**
1. 🔴 **Klient nie ma historii odbytych wizyt ani ocen** (zgłoszenie ownera
   2026-06-29): pulpit pokazuje tylko 10 ostatnich pozycji bez detali; brak
   „co było robione", zaleceń pracownika per wizyta, brak gwiazdek/komentarzy.
   Backend w ~80% gotowy: `GET /appointments/me`, `appointment.notes`
   (zalecenia), `POST /reviews` (Client, rating 1–5 + comment + appointmentId),
   `GET /reviews/me`. Brakuje wyłącznie UI + ewent. drobnych rozszerzeń.
2. 🟡 Opinie po stronie salonu: strona `/reviews` (admin) istnieje, ale nigdy
   nie miała realnych danych — po zbudowaniu ocen klienta trzeba ją
   zweryfikować (lista, filtr po ocenie, usuwanie nietrafionych).
3. 🟡 `statistics/employees` ma stub „Wykres aktywności pracowników wkrótce"
   — jedyny stub w panelu. Dla salonu 1-os. → usunąć sekcję zamiast budować.
4. 🟡 Moduły magazynowo-sprzedażowe (inventory, orders, deliveries,
   manufacturers, sales, loyalty, gift-cards) są zbudowane, ale nie
   przechodzone live od czerwcowych audytów — wymagają smoke-passu.
5. ⚪ SMS: integracja SMSAPI realna, ale wymaga `SMSAPI_TOKEN` w env (owner).
   WhatsApp niezweryfikowany na realnym numerze.

**Luki designowe:**
6. 🟡 Booksy-feel pass objął: kalendarz, klientów, usługi, statystyki,
   łączność, ustawienia, pulpit, finalizację. NIE objął: inventory, orders,
   deliveries, manufacturers, sales, loyalty, gift-cards — tam mogą siedzieć
   resztkowe niebieskie akcenty Versum, gęste tabele, EN stringi.
7. 🟡 a11y audytowane tylko na 3 stronach panelu — reszta bez Lighthouse.
8. 🟡 Mobile 390px zweryfikowany dla kalendarza i landingu; klient (booking /
   dashboard) i kluczowe strony staff bez systematycznego passu mobilnego.

---

## Fazy

### Faza 1 — Klient 10/10: historia wizyt + oceny (2–3 sesje) 🔴
Flagowa luka, zgłoszona wprost przez ownera.

1.1. **Strona „Moje wizyty" dla klienta** (`/visits`, w railu obok pulpitu):
   - pełna historia z `GET /appointments/me`, podział Nadchodzące / Odbyte /
     Anulowane, sortowanie od najnowszych;
   - detal wizyty (rozwijany wiersz lub strona): data+godzina, usługa,
     pracownik, status, **zalecenia salonu** (`notes`), notatka własna;
   - akcje jak na pulpicie: Anuluj / Akceptuj nowy termin / Umów ponownie;
   - bez cen (utrzymana zasada „klient nie widzi kwot").
1.2. **Oceny wizyt**: przy każdej odbytej (`completed`) wizycie gwiazdki 1–5 +
   opcjonalny komentarz → `POST /reviews` z `appointmentId`; po ocenie
   wyświetlenie własnej oceny (z `GET /reviews/me`), 1 ocena na wizytę;
   możliwość zmiany (DELETE+POST lub nowy PATCH — decyzja przy implementacji).
1.3. **Pulpit klienta**: sekcja „Ostatnie wizyty" linkuje do pełnej historii
   („zobacz wszystkie"); przy odbytych skrót do oceny.
1.4. **Strona `/reviews` (admin)**: zweryfikować na realnych ocenach z 1.2;
   dodać brakujące (filtr, kasowanie); rozważyć średnią ocen na pulpicie
   admina.
1.5. Testy jednostkowe nowych widoków + live E2E: klient ocenia odbytą
   wizytę → admin widzi opinię.

### Faza 2 — Smoke-pass funkcjonalny wszystkich modułów staff (1–2 sesje) 🟡
Metodą z czerwcowych audytów (admin na prod, przez API + UI):
2.1. Magazyn: inventory (inwentaryzacje), orders (zamówienia), deliveries
   (dostawy), manufacturers — pełne CRUD-y na żywo.
2.2. Sprzedaż: sales/new (POS), sales/history, gift-cards, loyalty.
2.3. Łączność: szablony, kampanie, masowe, automatyczne, przypomnienia —
   render + walidacje (wysyłka SMS zostaje za flagą env).
2.4. `statistics/employees`: usunąć stub „wkrótce" (salon 1-os.).
2.5. Każdy znaleziony bug: fix + test + deploy (wzorzec dotychczasowy).

### Faza 3 — Design 10/10 (1–2 sesje) 🟡
3.1. Booksy-feel sweep modułów pominiętych (lista z pkt 6): purga niebieskich,
   tabele `.table-bordered` (kontrast th/td), polskie stringi, spójne empty
   states, monochrom + semantyczne green/red.
3.2. Lighthouse a11y na reprezentatywnych stronach każdego modułu (cel 100,
   wzorzec fixów znany: silver-as-text, checkboxy 24px, hierarchia nagłówków).
3.3. Mobile 390px pass: booking, dashboard klienta, nowa historia wizyt,
   klienci, magazyn-lista, finalizacja (drawer już zrobiony).
3.4. Vibe-check per moduł: hover/focus/loading na każdej akcji (zasada z
   CLAUDE.md: każda akcja ma widoczny feedback).

### Faza 4 — Twardnienie przedprodukcyjne (1 sesja + zadania ownera)
4.1. (ja) Sentry: wpięcie DSN gdy owner założy projekt — widoczność błędów
   od pierwszego dnia.
4.2. (owner) **Backup bazy** na MyDevil — krytyczne przed realnymi danymi.
4.3. (owner) Zmiana tymczasowego hasła admina (Konto → Zmień hasło).
4.4. (owner) `SMSAPI_TOKEN` jeśli SMS-y mają działać od startu (inaczej
   zostaje e-mail L2 + WhatsApp).
4.5. (ja+owner) Test WhatsApp na realnym numerze żony.
4.6. (owner) Decyzja o domenie: cutover `salon-bw.pl` → nowy landing, albo
   start na `dev.` + panel.
4.7. (ja) Google OAuth — opcjonalnie, gdy owner da klucze z Google Cloud.

### Faza 5 — Czyszczenie i start (0.5 sesji)
5.1. Migracja FK-safe: usunięcie WSZYSTKICH danych testowych (Test Klient 49
   + ~60 wizyt, e2e klient 53 + #101/#102, wizyta #41, konta test.klient/
   test.pracownik/e2e) — wzorzec `CleanupE2eTestArtifacts` istnieje.
5.2. Finalny E2E 3 ról na czystej bazie (admin/pracownik/klient).
5.3. Health-checki + zrzut „stan na start" do active-context.
5.4. GO — udostępnienie panelu.

---

## Kolejność i szacunek
| Faza | Zakres | Sesje | Blokuje start? |
|---|---|---|---|
| 1 | Historia wizyt + oceny klienta | 2–3 | TAK (funkcja 10/10) |
| 2 | Smoke-pass modułów staff | 1–2 | TAK (pewność) |
| 3 | Design sweep + a11y + mobile | 1–2 | TAK (design 10/10) |
| 4 | Twardnienie (Sentry/backup/hasło/SMS) | 1 + owner | TAK (4.2, 4.3) |
| 5 | Cleanup danych testowych + finalny E2E | 0.5 | TAK (ostatni krok) |

Fazy 1→2→3 sekwencyjnie (fixy z 2 wpływają na 3); faza 4 zadania ownera można
zacząć od razu, równolegle.

## Zasady wykonania (obowiązujące przez cały plan)
- Każda zmiana: lint + tsc + testy przed commitem; deploy przez CI; weryfikacja
  live na prod (wzorzec dotychczasowych sesji).
- UI wg `.claude/skills/salonbw-brand` (tokeny, kontrasty, zero nowych barw).
- Bugi znalezione po drodze: fix natychmiast, wpis do active-context.
- Dane testowe NIE są sprzątane aż do fazy 5 (decyzja ownera 2026-07-03).
