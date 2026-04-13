# SALON-BW CLONE - MODUŁY: KLIENCI, MAGAZYN, USŁUGI

---

## MODUŁ 3: KLIENCI

### URL: panel.salon-bw.pl/{salon_slug}/customers

### Lista Klientów - Layout
```
┌──────────────────┬──────────────────────────────────────────┐
│ GRUPY KLIENTÓW   │ Klienci / Lista klientów                 │
│                  │                                          │
│ ☑ wszyscy klienci│ [wyszukaj klienta] [nazwisko: od A do Z▼]│
│ ⠂ Umówieni na dz.│ ☐ zaznacz wszystkich (0)  [👤 Dodaj klienta]│
│ ⠂ Ostatnio dodani│                                          │
│ ⠂ Nie rezerwują  │ │☐│Nazwa          │✉│📞│Telefon      │📅│Data       │✏│
│   online         │ │──┼────────────────┼──┼──┼─────────────┼──┼───────────┼──│
│ + więcej         │ │☐│Marzena Adamska │✉│📞│+48 691 433 821│📅│10.01.2026 │✏│
│                  │ │☐│Piotr Adamski   │✉│📞│+48 601 433 822│📅│23.01.2026 │✏│
│ WYBIERZ KRYTERIA │ │☐│Alinka Anczok   │✉│📞│+48 511 485 955│📅│18.12.2025 │✏│
│                  │ │☐│Copik Aneta     │✉│📞│+48 510 275 500│📅│09.12.2022 │✏│
│ ⠂ skorzystali    │ │☐│Izabella Banduch│✉│📞│nie podano     │📅│29.12.2025 │✏│
│   z usług        │ │...              │  │  │              │  │           │  │
│ ⠂ mają wizytę    │                                          │
│   w salonie      │ Pozycje od 1 do 20 z 785                │
│ ⠂ obsługiwani    │ na stronie: [20 ▼]   [1] z 40 [▶]      │
│   przez pracow.. │                                          │
│ + więcej         │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### Ikony w wierszu klienta
- ✉ (koperta) = wyślij email do klienta
- 📞 (telefon/link) = click-to-call
- 📅 (kalendarz) = data ostatniej wizyty
- ✏ (ołówek) = szybka edycja klienta
- "nie podano" - szary tekst gdy brak telefonu/emaila

### Sidebar - Grupy Klientów
- wszyscy klienci (default, bold)
- Umówieni na dzisiaj
- Ostatnio dodani
- Nie rezerwują online
- + więcej (rozwijane dodatkowe filtry)

### Sidebar - Wybierz Kryteria
- skorzystali z usług
- mają wizytę w salonie
- obsługiwani przez pracow...
- + więcej

### Sortowanie
Dropdown: "nazwisko: od A do Z ▼"
Opcje:
- nazwisko: od A do Z
- nazwisko: od Z do A
- ostatnia wizyta: najnowsza
- ostatnia wizyta: najstarsza
- data dodania: najnowsza

### Paginacja
- "Pozycje od 1 do 20 z 785"
- Dropdown: "na stronie: [20 ▼]" → 10, 20, 50, 100
- Strony: [1] z [40] [▶]

---

### Profil Klienta (Karta Klienta)

### URL: /{salon_slug}/customers/{id}

### Sidebar - KARTA KLIENTA
```
KARTA KLIENTA
👤 Marzena Adamska
├── 📊 podsumowanie (default)
├── 📋 dane osobowe
├── 📈 statystyki
├── 📅 historia wizyt
├── 💬 komentarze
├── 📧 komunikacja
├── 📸 galeria zdjęć
└── 📎 załączone pliki
```

### Widok: Podsumowanie
```
┌────────────────────────────────────────────────────────┐
│ Klienci / Marzena Adamska                              │
│                                    [edytuj] [więcej ▼] │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Marzena Adamska                 ┌──────────────────┐  │
│ 📞 +48 691 433 821              │    [AVATAR]       │  │
│ ✉ nie podano                    │    (placeholder   │  │
│ 👥 RODO, Sylwester, WRACAM      │     silhouette)   │  │
│ 📝 brak opisu [edytuj opis]     └──────────────────┘  │
│ ♀ płeć: Kobieta                                       │
│ 📅 data dodania: 23.08.2017                           │
│                                                        │
│ ┌────────────────────┐  ┌──────────────────────────┐  │
│ │ zaplanowane wizyty:│  │ zrealizowane wizyty: 24  │  │
│ │ 1                  │  │                          │  │
│ │                    │  │ Koloryzacja Ola          │  │
│ │ Koloryzacja Ola    │  │ - włosy długie           │  │
│ │ - włosy średnie    │  │ sb 10.01.2026 11:00 [AB] │  │
│ │ pt 06.03.2026 13:00│  │ 350,00 zł                │  │
│ │ Aleksandra Bodora  │  │                          │  │
│ │ 250,00 zł          │  │ Koloryzacja Ola          │  │
│ │                    │  │ - włosy długie           │  │
│ │           [więcej] │  │ pn 13.10.2025 09:30 [AB] │  │
│ │                    │  │ 350,00 zł                │  │
│ └────────────────────┘  │                          │  │
│                          │ Rozjasnienie wlosow Ola  │  │
│                          │ pt 04.07.2025 13:00 [AB] │  │
│                          │ 380,00 zł                │  │
│                          │                          │  │
│                          │                 [więcej] │  │
│                          └──────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Profil - Pola
- Imię i Nazwisko (duży nagłówek)
- Telefon (z ikoną 📞)
- Email (lub "nie podano")
- Grupy/Tagi (np. RODO, Sylwester, WRACAM)
- Opis (edytowalny link "edytuj opis")
- Płeć (Kobieta/Mężczyzna)
- Data dodania (format dd.mm.yyyy)
- Avatar (placeholder lub zdjęcie)

### Profil - Zaplanowane wizyty
- Liczba zaplanowanych
- Lista z: usługa, data, pracownik, cena
- Link "więcej"

### Profil - Zrealizowane wizyty
- Liczba zrealizowanych
- Lista z: usługa, data, avatar pracownika [AB], cena
- Link "więcej"

### Profil - Buttons
- [edytuj] → formularz edycji
- [więcej ▼] → dropdown z akcjami:
  - Dodaj wizytę
  - Wyślij wiadomość
  - Dodaj do grupy
  - Usuń klienta

### Podstrony Karty Klienta
1. **podsumowanie** - widok główny (opisany wyżej)
2. **dane osobowe** - pełny formularz edycji danych
3. **statystyki** - wydatki, częstotliwość wizyt, ulubione usługi
4. **historia wizyt** - pełna lista wszystkich wizyt z detalami
5. **komentarze** - notatki pracowników o kliencie
6. **komunikacja** - historia SMS/email wysłanych do klienta
7. **galeria zdjęć** - zdjęcia prac (before/after)
8. **załączone pliki** - dokumenty, zgody RODO etc.

### Formularz: Dodaj/Edytuj Klienta
URL: /{salon_slug}/customers/new
```
┌─────────────────────────────────────┐
│ Dodaj klienta                       │
├─────────────────────────────────────┤
│ [Imię *]                            │
│ [Nazwisko *]                        │
│ [Telefon *]                         │
│ [Email]                             │
│ [Płeć: ▼]  (Kobieta/Mężczyzna)     │
│ [Ulica]                             │
│ [Miasto]                            │
│ [Kod pocztowy]                      │
│ [Grupy/Tagi: multi-select]          │
│ [Notatki: textarea]                 │
│ [☐ Zgoda RODO]                      │
│ [☐ Zgoda SMS]                       │
│ [☐ Zgoda Email]                     │
│                                     │
│ [Zapisz] [Anuluj]                  │
└─────────────────────────────────────┘
```

---

## MODUŁ 4: MAGAZYN

### URL: panel.salon-bw.pl/{salon_slug}/products

### TABS (6 zakładek)
```
[PRODUKTY] [SPRZEDAŻ] [ZUŻYCIE] [DOSTAWY] [ZAMÓWIENIA]     [INWENTARYZACJA]
```

### TAB 1: PRODUKTY (default)
```
┌──────────────────┬──────────────────────────────────────────┐
│ Wszystkie produkt│ Magazyn / Produkty                       │
│ ⠂ Landa          │ [PRODUKTY][SPRZEDAŻ][ZUŻYCIE][DOSTAWY]  │
│ ⠂ Nioxin         │ [ZAMÓWIENIA]              [INWENTARYZACJA]│
│ ⠂ Wella          │                                          │
│ ⠂ Wella care:Pro │ [wyszukaj produkt] [wszystkie produkty▼] │
│ ⠂ Moroccanoil    │ [dodaj sprzedaż][dodaj zużycie][dodaj produkt]│
│ ⠂ produkty bez k.│                                          │
│                  │ │☐│Nazwa       │Kategoria│Rodzaj│SKU     │Stan│Cena│🛒│📥│
│ dodaj/edytuj/usuń│ │──┼────────────┼─────────┼──────┼────────┼────┼────┼──┼──│
│                  │ │☐│Invigo odżyw│brak kat.│towar │80056..│0op │0zł│🛒│📥│
│                  │ │☐│/0 Color T. │Color T. │materiał│81387.│0op │0zł│🛒│📥│
│                  │ │☐│/04 Color T.│Color T. │materiał│81387.│0op │0zł│🛒│📥│
│                  │ │☐│0/28 Kolest.│Koleston │materiał│81454.│0.65op│0zł│🛒│📥│
│                  │ │☐│0/44 Kolest.│Koleston │materiał│80056.│0.53op│0zł│🛒│📥│
│                  │ │...                                      │
│                  │ Pozycje od 1 do 20 z 821                 │
│                  │ na stronie: [20▼]   [1] z 42 [▶]        │
│                  │ [📥 pobierz bazę produktów w pliku Excel] │
└──────────────────┴──────────────────────────────────────────┘
```

Kolumny tabeli PRODUKTY:
- ☐ checkbox
- Nazwa (link → edycja)
- Kategoria (np. Color Touch, Koleston Perfect, brak kategorii)
- Rodzaj produktu: "towar" lub "materiał"
- Kod wewnętrzny (SKU) - np. 8005610642857, 81387089
- Stan magazynowy - format: "0 op. (0 ml)" lub "0,65 op. (39 ml)"
- Cena sprzedaży - format: "0,00 zł"
- 🛒 ikona sprzedaj (link)
- 📥 ikona zużyj (link)

Sidebar kategorie:
- Wszystkie produkty
- Landa, Nioxin, Wella, Wella care :Pro serwis, Moroccanoil
- produkty bez kategorii
- Link: "dodaj/edytuj/usuń" (zarządzanie kategoriami)

### TAB 2: SPRZEDAŻ
URL: /{salon_slug}/orders/new
```
┌──────────────────┬──────────────────────────────────────────┐
│ SPRZEDAŻ         │ Magazyn / Dodaj sprzedaż                │
│ ⠂ dodaj sprzedaż │                                          │
│ ⠂ historia sprze.│ │nazwa                │jednostka│ilość│cena op.│VAT│wartość│usuń│
│                  │ │[wpisz nazwę, kod..]│         │     │(brutto)│   │(brutto)│ 🗑│
│                  │ [dodaj kolejną pozycję]                   │
│                  │                     Do zapłaty: 0,00 zł brutto│
│                  │                                          │
│                  │ 1. klient: [wpisz nazwisko lub tel] [nowy klient]│
│                  │ 2. polecający pracownik: [wybierz ▼]     │
│                  │ 3. data sprzedaży: [07.02.2026 📅]       │
│                  │ 4. opis: [textarea]                       │
│                  │                                          │
│                  │ Wartość sprzedaży: 0,00 zł [przyznaj rabat]│
│                  │ netto: 0,00 zł (VAT: 0,00 zł)           │
│                  │ Do zapłaty: 0,00 zł [dodaj napiwek]      │
│                  │ Płatność:                                 │
│                  │ Reszta: 0,00 zł                           │
│                  │                                          │
│                  │ [💾 wprowadź sprzedaż]         [anuluj]  │
└──────────────────┴──────────────────────────────────────────┘
```

### TAB 3: ZUŻYCIE
URL: /{salon_slug}/usages/new
- Podobny formularz do sprzedaży
- Sidebar: dodaj zużycie, historia zużycia
- Tabela: nazwa | jednostka | ilość | usuń
- Data zużycia
- Pracownik
- Uwagi

### TAB 4: DOSTAWY
URL: /{salon_slug}/deliveries/new
```
┌──────────────────┬──────────────────────────────────────────┐
│ DOSTAWY          │ Magazyn / Dodaj dostawę                  │
│ ⠂ dodaj dostawę  │                     Ceny zakupu: [netto▼]│
│ ⠂ historia dostaw│                                          │
│ ⠂ wersje robocze │ │lp│nazwa              │jednostka│ilość│cena/op│wartość│usuń│
│   (8)            │ │ 1│[wpisz nazwę, kod.]│         │     │(netto)│(netto)│ 🗑│
│ ⠂ niski stan mag.│ [dodaj kolejną pozycję]  [dodaj nowy produkt]│
│ ⠂ dostawcy       │                        Łącznie: 0,00 zł netto│
│ ⠂ producenci     │                                          │
│                  │ 1. dostawca: [wybierz ▼] [dodaj nowego dostawcę]│
│                  │ 2. numer faktury: [____]                  │
│                  │ 3. wystawiono: [7▼] [Luty▼] [2026▼]     │
│                  │ 4. uwagi: [textarea]                     │
│                  │                                          │
│                  │ [💾 wprowadź dostawę]          [anuluj]  │
└──────────────────┴──────────────────────────────────────────┘
```

Sidebar DOSTAWY:
- dodaj dostawę
- historia dostaw
- wersje robocze (z liczbą w nawiasie, np. "(8)")
- niski stan magazynowy (alert lista)
- dostawcy (lista dostawców CRUD)
- producenci (lista producentów)

### TAB 5: ZAMÓWIENIA
URL: /{salon_slug}/product_orders
```
┌──────────────────┬──────────────────────────────────────────┐
│ ZAMÓWIENIA       │ Magazyn / Dodaj zamówienie               │
│ ⠂ dodaj zamówien.│                              [więcej ▼]  │
│ ⠂ wersje robocze │                                          │
│ ⠂ historia zamów.│ Dostawca                                 │
│                  │ [wpisz nazwę lub wybierz ▼] [dodaj dostawcę]│
│                  │                                          │
│                  │ Pozycje zamówienia                        │
│                  │ │lp│nazwa              │jednostka│ilość│usuń│
│                  │ │ 1│[wpisz nazwę, kod.]│[op. ▼]  │[1] │ 🗑│
│                  │ [dodaj kolejną pozycję]  [dodaj nowy produkt]│
│                  │                                          │
│                  │ [dodaj uwagi]                             │
│                  │                                          │
│                  │ [📧 Wyślij zamówienie]                    │
└──────────────────┴──────────────────────────────────────────┘
```

### TAB 6: INWENTARYZACJA
- Liczenie fizyczne stanu
- Porównanie z systemem
- Generowanie raportu różnic

---

## MODUŁ 7: USŁUGI

### URL: panel.salon-bw.pl/{salon_slug}/services

### Layout
```
┌──────────────────┬──────────────────────────────────────────┐
│ Wszystkie usługi │ Usługi                                   │
│ ⠂ Fryzjerstwo    │                           [dodaj usługę] │
│ ⠂ usługi bez kat.│ [wyszukaj usługę]                        │
│                  │                                          │
│ dodaj/edytuj/usuń│ │☐│Nazwa     │Kategoria│Czas    │Popularność│Cena brutto│VAT│
│                  │ │──┼──────────┼─────────┼────────┼───────────┼───────────┼───│
│                  │ │☐│Botox na w│Damskie  │120-180m│22 razy    │300-450 zł │23%│
│                  │ │☐│Combo Strz│Barber   │90 min  │107 razy   │130,00 zł  │23%│
│                  │ │☐│Dermabrazj│Damskie  │70 min  │13 razy    │150-200 zł │23%│
│                  │ │☐│Fryzura śl│Damskie  │80 min  │18 razy    │150,00 zł  │23%│
│                  │ │☐│Fryzura wi│Damskie  │60-80m  │57 razy    │100-150 zł │23%│
│                  │ │☐│Golenie gł│Barber   │40 min  │0 razy     │70,00 zł   │23%│
│                  │ │☐│Koloryzacj│Damskie  │180-210m│1469 razy  │240-280 zł │23%│
│                  │ │☐│Koloryzacj│Damskie  │250-300m│12 razy    │500-800 zł │23%│
│                  │ │☐│Modelowani│Damskie  │45-60m  │494 razy   │70-100 zł  │23%│
│                  │ │...                                      │
│                  │ Pozycje od 1 do 20 z 55                   │
│                  │ na stronie: [20▼]   [1] z 3 [▶]          │
│                  │ [📥 pobierz cennik w pliku Excel]         │
└──────────────────┴──────────────────────────────────────────┘
```

### Kolumny Usług
- ☐ checkbox
- Nazwa (link → edycja) - sortowalna ▲▼
- Kategoria (np. Damskie, Barber) - sortowalna
- Czas trwania (np. "120 - 180 minut" lub "90 minut") - sortowalna
- Popularność (np. "22 razy", "1469 razy") - sortowalna
- Cena brutto (np. "300,00 zł - 450,00 zł" lub "130,00 zł") - sortowalna
- VAT (np. "23%") - sortowalna

### Sidebar
- Wszystkie usługi
- Kategorie (np. Fryzjerstwo)
- usługi bez kategorii
- Link: "dodaj/edytuj/usuń" (zarządzanie kategoriami)

### Funkcjonalności
- Sortowanie wszystkich kolumn (click na nagłówek)
- Wyszukiwanie po nazwie
- Filtrowanie po kategoriach
- Export cennika do Excel
- Dodaj/edytuj/usuń usługę
- Zarządzanie kategoriami
