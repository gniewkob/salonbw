# UAT — plan testów akceptacyjnych (właścicielka + klientka)

_Wersja 2026-07-29. Faza B ścieżki do produkcji (`docs/PROJECT_COMPLETION_PLAN.md` §3.0)._
_Ten dokument zastępuje sztuczny „live E2E agenta" (E4.3) — przejście realnego
dnia pracy przez właścicielkę jest miarodajniejsze niż skrypt._

---

## 0. Zanim zaczniesz

**Gdzie testujemy:** `https://panel.salon-bw.pl` (realna produkcja).
Landing (`dev.salon-bw.pl`) NIE jest przedmiotem tego UAT — panel działa
niezależnie od decyzji o domenie.

**Warunki wstępne (faza A, muszą być zrobione):**
- [x] hasło admina zmienione (E2.2)
- [x] Sentry podpięty (E2.5) — błędy z UAT są widoczne
- [x] potwierdzone dotarcie alertu o rezerwacji (E2.11)
- [x] dane testowe wyczyszczone, dataset syntetyczny zweryfikowany (E4.2)

**Czego się spodziewać:** katalog usług jest realny (60 pozycji z Booksy),
grafik realny. Klienci, wizyty i magazyn są syntetyczne: 12 klientów,
30 wizyt, 12 produktów w 4 kategoriach i 5 dokumentów magazynowych. Nazwy,
ceny oraz stany magazynowe są fikcyjne i służą wyłącznie do UAT.

**Jak zgłaszać znaleziska:** dla każdego problemu zanotuj (wystarczy telefonem):
1. **gdzie** byłaś (adres strony / nazwa widoku),
2. **co zrobiłaś** (kliknięcie po kliknięciu),
3. **czego się spodziewałaś**, a **co się stało**,
4. **zrzut ekranu** — najważniejsze.

Klasyfikacja, żeby ustalić co naprawiamy przed startem:
- 🔴 **blokuje pracę** — nie da się wykonać zadania / dane się gubią / błąd
- 🟡 **utrudnia** — da się zrobić, ale wolno, myląco, nieintuicyjnie
- 🎨 **wygląd** — literówka, brzydko, krzywo

---

## 1. Ścieżka WŁAŚCICIELKI — Twój normalny dzień

### 1.1 Start dnia
- [ ] Logowanie na `panel.salon-bw.pl`
- [ ] **Pulpit**: czy widzisz to, czego potrzebujesz rano? (najbliższe wizyty,
      oczekujące rezerwacje online, utarg)
- [ ] Czy dzwonek/licznik zgadza się z tym, co faktycznie czeka?

### 1.2 Kalendarz (najczęściej używany widok)
- [ ] Przełącz **Dzień / Tydzień / Miesiąc** — czy pokazuje właściwy zakres?
- [ ] Czy godziny otwarcia i dni wolne (środa, niedziela) zgadzają się z Twoim
      realnym grafikiem?
- [ ] Widok **Recepcja** — czy lista dnia jest czytelna?
- [ ] Kliknij wizytę → **szczegóły**: czy widzisz wszystko, czego potrzebujesz
      (klientka, usługa, telefon, notatki, historia)?

### 1.3 Umówienie wizyty telefonicznej (klientka dzwoni)
- [ ] **Nowa wizyta** z kalendarza
- [ ] Wyszukaj istniejącą klientkę (wpisz fragment nazwiska/telefonu)
- [ ] Albo dodaj nową klientkę „z marszu"
- [ ] Wybierz usługę (wyszukiwarka usług), termin, zapisz
- [ ] **Sprawdź:** czy wizyta pojawiła się w kalendarzu na właściwej godzinie?
- [ ] Spróbuj **przeciągnąć** wizytę na inny termin
- [ ] Spróbuj umówić **dwie wizyty na ten sam czas** (dwubooking, np. w czasie
      farbowania) — czy da się potwierdzić nakładanie?

### 1.4 Rezerwacja online od klientki (kluczowy przepływ)
- [ ] Poproś kogoś (albo drugie urządzenie) o rezerwację przez panel
- [ ] **Czy dostałaś powiadomienie?** (telefon: mail; panel: dzwonek)
- [ ] Znajdź rezerwację w „oczekujących" → **Potwierdź**
- [ ] Sprawdź, czy klientka dostała potwierdzenie

### 1.5 Zmiana terminu i odwołanie
- [ ] Zaproponuj klientce **inny termin** (reschedule) — czy widzi propozycję?
- [ ] **Anuluj** wizytę — czy status i kalendarz się zgadzają?
- [ ] Oznacz wizytę jako **nieobecność (no-show)**

### 1.6 Realizacja wizyty i kasa (najważniejsze dla pieniędzy)
- [ ] Otwórz wizytę → **Finalizuj**
- [ ] Sprawdź **cenę z cennika** — czy podpowiada właściwą? Zmień ją ręcznie
- [ ] Dodaj **usługę dodatkową** (np. regeneracja)
- [ ] Dodaj **sprzedaż produktu** (np. odżywka dla klientki)
- [ ] Dodaj **zużyty materiał** (farba) — czy schodzi ze stanu magazynu?
- [ ] Wpisz **rabat**
- [ ] Wpisz **kwotę zapłaconą** większą niż należność → czy poprawnie policzy
      napiwek? I mniejszą → czy pokaże niedopłatę?
- [ ] Wybierz metodę płatności
- [ ] Dopisz **zalecenia dla klientki** (widoczne dla niej) i **notatkę
      wewnętrzną** (tylko dla Ciebie)
- [ ] Dopisz **recepturę/formułę koloru**
- [ ] Zapisz → **sprawdź**: status wizyty, kwota, stan magazynu, czy receptura
      jest w historii klientki

### 1.7 Karta klientki
- [ ] Otwórz kartę stałej klientki
- [ ] Przejdź zakładki: dane, historia wizyt, statystyki, notatki, komunikacja,
      zdjęcia, pliki
- [ ] Czy **historia wizyt i receptury** to jest to, czego potrzebujesz przy
      kolejnej wizycie?
- [ ] Dodaj **notatkę** i **zdjęcie** (efekt koloryzacji)
- [ ] Ustaw **stały rabat** i sprawdź, czy podpowiada się przy finalizacji

### 1.8 Magazyn
- [ ] Lista produktów — czy wyszukiwanie i filtry działają?
- [ ] Dodaj produkt / skoryguj stan
- [ ] Zarejestruj **sprzedaż** produktu
- [ ] Sprawdź **niskie stany**

### 1.9 Koniec dnia
- [ ] **Statystyki**: utarg dziś, rabaty, raport finansowy
- [ ] Czy liczby zgadzają się z tym, co faktycznie zrobiłaś podczas UAT?
- [ ] Pobierz raport Excel

### 1.10 Ustawienia (raz, nie codziennie)
- [ ] Dane salonu, godziny otwarcia, grafik pracy
- [ ] Katalog usług: dodaj/edytuj usługę, warianty, kategorie
- [ ] Rezerwacja online: które usługi są dostępne dla klientek

---

## 2. Ścieżka KLIENTKI (przejdź ją sama, na telefonie)

Użyj **telefonu**, nie komputera — tak zrobi 90% klientek.

- [ ] Rejestracja nowego konta (zgody: regulamin + RODO)
- [ ] **Rezerwacja**: wybór usługi → wariant → dodatki → termin
- [ ] Czy widać wolne terminy zgodne z Twoim grafikiem?
- [ ] Czy da się zarezerwować w dzień wolny albo w przeszłości? (nie powinno)
- [ ] Potwierdzenie rezerwacji — czy klientka wie, co dalej?
- [ ] **Moje wizyty**: nadchodzące, odbyte, anulowane
- [ ] Napisz wiadomość do salonu przy wizycie → odpowiedz na nią z panelu →
      czy klientka widzi odpowiedź i może odpisać?
- [ ] Akceptacja zmienionego terminu
- [ ] Anulowanie wizyty przez klientkę
- [ ] **Ocena odbytej wizyty** (gwiazdki + komentarz) → czy widzisz ją w panelu?
- [ ] Edycja profilu i **zgód** (panel/SMS/WhatsApp/e-mail)
- [ ] Czy klientka **nie widzi** nigdzie cen zapłaconych/notatek wewnętrznych?

---

## 2a. CIĄGŁOŚĆ MIĘDZYMODUŁOWA — jeden sprawdzian, najważniejszy w całym UAT

Żaden automat tego nie zweryfikował: czy **jedna sfinalizowana wizyta poprawnie
przepływa przez wszystkie moduły**. Zrób to jako pojedynczy, świadomy przebieg
i zanotuj liczby PRZED i PO.

**Przed startem zanotuj:**
- stan magazynowy farby, której użyjesz: `______`
- utarg dziś (Statystyki → Raport finansowy): `______`
- liczba wizyt na karcie wybranej klientki: `______`

**Wykonaj:** umów wizytę → potwierdź → finalizuj z: usługą dodatkową +
sprzedażą produktu + zużyciem tej farby + rabatem + kwotą zapłaconą większą
niż należność (napiwek) + zaleceniami + recepturą.

**Sprawdź, czy WSZYSTKIE ogniwa się zgadzają:**
| # | Gdzie | Czego oczekujesz |
|---|---|---|
| 1 | Kalendarz | wizyta ma status „Zakończona" i kwotę |
| 2 | Magazyn → produkt | stan farby **zmniejszony** o zużycie |
| 3 | Magazyn → sprzedaż | sprzedany produkt na liście sprzedaży |
| 4 | Statystyki → raport finansowy | utarg **wzrósł** o właściwą kwotę; rabat i napiwek widoczne |
| 5 | Statystyki → usługi | wizyta doliczona do rankingu usługi |
| 6 | Statystyki → prowizje | prowizja policzona (jeśli masz ustawione stawki) |
| 7 | Karta klientki → historia | wizyta + **receptura** + zalecenia |
| 8 | Panel klientki (jej konto) | widzi wizytę jako odbytą, widzi zalecenia, **NIE widzi kwoty ani notatki wewnętrznej** |
| 9 | Karta klientki → statystyki | liczba wizyt i suma wydatków zaktualizowane |

**Każde ogniwo, które się nie zgadza = 🔴.** To jest sedno „czy panel naprawdę
działa", a nie tylko „czy się wyświetla".

## 3. Na co zwrócić szczególną uwagę

Te obszary były zmieniane najpóźniej albo nie były testowane na żywo:

1. **Finalizacja z dodatkami i materiałami** — nigdy nie była przeklikana
   end-to-end na produkcji przez człowieka. To najważniejszy punkt UAT.
2. **Dotarcie powiadomień** — czy realnie wiesz o rezerwacji bez wchodzenia
   do panelu.
3. **Lista produktów** — świeżo dodana paginacja (20/stronę).
4. **Zaznaczanie wielu pozycji** na listach produktów/usług przy przechodzeniu
   między stronami.
5. **Widok na telefonie** — kalendarz i wizyty na małym ekranie.

---

## 4. Kryterium zakończenia UAT

- [ ] Wszystkie ścieżki z sekcji 1 i 2 przejdzięte
- [ ] Zero otwartych 🔴
- [ ] 🟡 przejrzane i zakwalifikowane: naprawiamy przed startem albo po
- [ ] 🎨 spisane do backlogu (ETAP 5)
- [ ] Wpis „UAT zakończony" do nowego pliku `docs/journal/YYYY-MM-DD-uat.md`
      oraz aktualizacja `docs/PROJECT_STATE.md`

Po spełnieniu → faza C (import danych) i D (miękki start).

---

## 5. Uwagi

- **Rola „pracownik" — świadomie poza zakresem** (decyzja ownera 2026-07-23):
  salon jednoosobowy, Aleksandra pracuje jako admin. Gdyby doszło zatrudnienie,
  dopisać osobną ścieżkę (grafik pracownika, ograniczony dostęp) i sekrety
  `E2E_EMPLOYEE_*`.
- **Dane testowe utworzone w trakcie UAT** (wizyty, klientki, sprzedaże) należy
  oznaczyć, spisać i usunąć przed importem realnych danych. E4.2 jest już
  zakończone, więc nie zakładaj, że kolejny pełny reset wykona ten cleanup.
- Wszystko, co zrobisz w UAT, jest na **realnej produkcji** — sprzedaże wejdą
  do statystyk, a zużycia zdejmą stan magazynowy.
