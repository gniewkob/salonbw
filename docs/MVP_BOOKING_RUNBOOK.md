# MVP Booking — wytyczne dojścia do podstawowej funkcjonalności

_Stan na 2026-06-10. Role: Gniewko = administrator, Aleksandra = właścicielka
i pracownik, agent = deweloper/architekt._

Cel: klientka rezygnuje z telefonu i klika „Umów wizytę" → wybiera usługę
i termin → salon widzi zgłoszenie, potwierdza jednym kliknięciem → klientka
dostaje potwierdzenie. Wszystko inne jest dodatkiem.

---

## 1. Co JUŻ działa (zweryfikowane w kodzie, na produkcji od 2026-06-10)

| Obszar | Stan |
|---|---|
| Kreator rezerwacji `/booking` (3 kroki: usługa → termin → potwierdzenie) | działa, wymaga konta klienta |
| Statusy `online_pending` / `rescheduled_pending` + migracja DB | na produkcji |
| `GET /calendar/available-slots` (auth) + publiczny `nearest-slot` | na produkcji |
| Badge „oczekujące online" w topbarze panelu (`countOnlinePending`) | działa |
| Przejście statusów: `online_pending → confirmed` (drawer + quick modal) | działa |
| WhatsApp do klientki przy POTWIERDZENIU rezerwacji | działa (`whatsappService.sendBookingConfirmation`, wymaga `phone` + zgody `receiveNotifications`) |
| Baza klientów `/customers` (CRUD, notatki, tagi, grupy, historia wizyt) | działa |
| Baza usług `/services` (CRUD, warianty, czas trwania, ceny, przypisanie pracowników) | działa |
| Grafiki pracowników: encje `timetables` (sloty tygodniowe, wyjątki, szablony) + UI `/settings/timetable/employees` | działa jako MODUŁ |
| Godziny otwarcia salonu: `branch.workingHours` + UI `/settings/timetable/branch` (wiele zakresów/dzień) | działa jako MODUŁ |
| Rejestracja klienta + SSO cookies `.salon-bw.pl` | działa |
| Kalendarz `/calendar` z widokiem recepcji, finalizacją, formułami | działa |

## 2. Luki BLOKUJĄCE MVP (znalezione w kodzie — to jest realna praca dev)

### L1 — KRYTYCZNA: sloty ignorują godziny pracy
`CalendarService.getAvailableSlots` ma **zahardkodowane** `WORK_START=9:00`,
`WORK_END=19:00`, **siedem dni w tygodniu**. Skutki:
- klientka może zarezerwować **niedzielę** (salon zamknięty),
- sobota oferuje sloty do 19:00 (realnie 9:00–15:00),
- grafik pracownika (urlop, skrócony dzień) jest ignorowany — kolizje
  wyłapuje tylko nakładka z istniejącymi wizytami/blokadami.

**Fix (dev, ~0,5–1 dnia):** w pętli slotów zastąpić stałe przecięciem:
`branch.workingHours[dzień]` ∩ `timetable_slots` pracownika na ten dzień
(z uwzględnieniem `timetable_exceptions`). Brak grafiku pracownika →
fallback na godziny salonu (świadoma decyzja, nie cichy default 9–19).
Testy: niedziela → 0 slotów; sobota → ostatni slot ≤ 14:30; urlop → 0.

### L2 — WYSOKA: salon nie dostaje powiadomienia o NOWEJ rezerwacji
Klientka rezerwuje → status `online_pending` → jedyny sygnał to badge
w panelu. Jeśli nikt nie zajrzy do panelu, zgłoszenie wisi.
**Fix (dev, ~0,5 dnia):** po utworzeniu wizyty z `OnlinePending` wysłać
e-mail na adres salonu (SMTP już skonfigurowane i zdrowe na prod:
`smtp: ok` w healthz). Treść: kto, co, kiedy, link do `/calendar`.
(Mock `sendNewOnlineBookingAlert` już istnieje w test-context — realna
implementacja nigdy nie powstała.)

### L3 — ŚREDNIA: brak auto-odświeżania badge'a oczekujących
Badge liczy `online_pending` przy załadowaniu. Przy otwartym panelu przez
cały dzień nowe zgłoszenie nie podbije licznika.
**Fix (dev, ~2 h):** polling co 60 s w hooku badge'a (bez websocketów —
za duży koszt na MVP).

### L4 — NISKA (decyzja produktowa): rezerwacja wymaga konta
`/booking` wymaga zalogowania. Dla MVP to jest OK (mniej spamu, klientka
ma historię), ale podnosi próg. Świadomie ZOSTAWIAMY — w danych
kontaktowych telefonu nie ruszamy. Jeśli konwersja będzie słaba, dopiero
wtedy rozważyć rezerwację gościa (duża praca: anty-spam, dedup klientów).

## 3. Plan — 4 dni robocze

### Dzień 1 (dev): L1 — godziny pracy w slotach
Rano implementacja + testy, po południu deploy API i smoke:
niedziela pusta, sobota ucięta, dzień z wyjątkiem urlopowym pusty.

### Dzień 2 (dev): L2 + L3 — powiadomienia
E-mail o nowym zgłoszeniu + polling badge'a. Deploy, test E2E:
rezerwacja testowa → mail przychodzi → badge rośnie bez przeładowania.

### Dzień 3 (WY — konfiguracja danych, ~2-3 h klikania w panelu)
To jest praca administratora i właścicielki, nie kod:
1. **Usługi** (`/services`): realna lista — nazwa, czas trwania (uczciwy,
   bo steruje slotami!), cena, kategoria. Usunąć/dezaktywować testowe.
2. **Pracownik** (`/settings/employees`): konto Aleksandry z rolą
   `employee` (właścicielski dostęp daje DRUGIE konto admin/owner — nie
   mieszać ról na jednym koncie, bo statystyki prowizji się zaśmiecą).
3. **Przypisanie usług do pracownika** — bez tego kandydatem na slot jest
   „każdy pracownik" (fallback w kodzie).
4. **Godziny salonu** (`/settings/timetable/branch`): pn–pt 10–19,
   sob 9–15 (uwaga: strona główna reklamuje pn–pt od 10:00 — slotom
   z L1 podać te same godziny, dziś kod oferuje od 9:00).
5. **Grafik Aleksandry** (`/settings/timetable/employees`): tygodniowy
   + wyjątki (urlopy).
6. **Dane klientek**: NIE importować hurtem na MVP. Baza zbuduje się
   sama z rezerwacji; ręcznie dodawać tylko stałe klientki przy okazji
   wizyt (`/customers` → Dodaj).

### Dzień 4 (wspólnie): test generalny + odpalenie
1. Scenariusz pełny na produkcji: rejestracja testowej klientki →
   rezerwacja → mail do salonu → potwierdzenie w panelu → WhatsApp
   do klientki → wizyta w kalendarzu → finalizacja po „wizycie".
2. Scenariusz odmowy: rezerwacja → anulowanie z panelu.
3. Scenariusz kolizji: dwie klientki na ten sam slot (drugą musi
   zablokować `assertNoConflict`).
4. Dopiero po zielonych trzech scenariuszach: link „Umów wizytę"
   komunikować klientkom (Instagram/wizytówka Google).

## 4. Czego ŚWIADOMIE nie robimy na MVP
- płatności/zaliczek online,
- SMS-ów (jest WhatsApp przy potwierdzeniu; resztą jest telefon),
- rezerwacji bez konta (L4),
- przypomnień automatycznych przed wizytą (moduł `/communication/automatic`
  istnieje — włączyć w tygodniu 2., po okrzepnięciu flow),
- importu historycznej bazy klientek.

## 5. Kryteria odbioru MVP (wszystkie muszą być zielone)
- [ ] Niedziela nie oferuje slotów; sobota kończy się zgodnie z godzinami salonu
- [ ] Urlop w grafiku = brak slotów tego dnia
- [ ] Nowa rezerwacja online → e-mail do salonu < 1 min
- [ ] Badge oczekujących rośnie bez przeładowania panelu
- [ ] Potwierdzenie z panelu → WhatsApp do klientki (przy zgodzie)
- [ ] Podwójna rezerwacja tego samego slotu niemożliwa
- [ ] Aleksandra umie samodzielnie: potwierdzić, przełożyć, anulować,
      sfinalizować wizytę i dodać klientkę (sesja treningowa = część dnia 4)
