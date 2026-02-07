# SALON-BW CLONE - MODUŁY: DASHBOARD I KALENDARZ

---

## MODUŁ 1: DASHBOARD (Pulpit)

### URL: panel.salon-bw.pl/{salon_slug}

### Layout
```
┌─────────────────────────────────────────────────────┐
│ [Alert systemowy - żółte tło, przycisk X zamknij]   │
│ Tytuł: "Możliwe opóźnienia w wysyłce faktur"       │
│ Treść: informacja systemowa                          │
├─────────────────────────────────────────────────────┤
│ [Info banner - turkusowe tło]                        │
│ "Podziel się z nami swoją opinią!" [CTA button] [X] │
├─────────────────────────────────────────────────────┤
│ 🏠 Pulpit                                           │
│ [bieżący miesiąc ▼] Statystyki: 1 lut - 7 lut 2026│
│                                    [👤 Dodaj klienta]│
├─────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────────┐      │
│ │liczba wizyt│ │nowi klienci│ │obroty salonu  │      │
│ │ 18 ↑      │ │ 1 ↑       │ │[pokaż obrót]  │      │
│ │100% (+18) │ │100% (+1)  │ │100% (+4080 zł)│      │
│ │[LINE CHART]│ │[LINE CHART]│ │[LINE CHART]   │      │
│ └───────────┘ └───────────┘ └───────────────┘      │
├─────────────────────────────────────────────────────┤
│ ┌─────────────┐┌──────────────────┐┌──────────────┐│
│ │ ⚙ aktywności ││ 📅 najbliższe    ││ ☑ zadania    ││
│ │    [więcej]  ││    wizyty        ││    [+][🗑]   ││
│ │              ││                  ││              ││
│ │[GB] Zalog..  ││ pon 09.02.2026   ││ + nowe zad.  ││
│ │14:59 sb 07.02││ 09:00 [AB] Karol.││              ││
│ │              ││   Usługa spoza c.││ Nie znalezio-││
│ │[GB] Zalog..  ││ 09:30 [AB] Joanna││ no żadnych   ││
│ │14:56 sb 07.02││   Koloryzacja Ola││ zadań        ││
│ │              ││                  ││              ││
│ │[Re] Usunięcie││ wt 10.02.2026    ││ Archiwum     ││
│ │13:16 sb 07.02││ 12:00 [AB] Ewa   ││ Zadań →      ││
│ │              ││   Strzyżenie Dam.││              ││
│ │[GB] Zalog..  ││                  ││              ││
│ │12:58 sb 07.02││ śr 11.02.2026    ││              ││
│ │              ││ 09:30 [AB] Katar.││              ││
│ │ ...x15 items ││                  ││              ││
│ │              ││ [kalendarz wizyt]││              ││
│ └─────────────┘└──────────────────┘└──────────────┘│
└─────────────────────────────────────────────────────┘
```

### Komponent: Alert Systemowy
- Żółte/pomarańczowe tło
- Tytuł bold (np. "Możliwe opóźnienia w wysyłce faktur")
- Treść (wieloliniowa)
- Przycisk X zamknij (prawy górny)
- Stan: przechowywany w localStorage aby nie pokazywać ponownie

### Komponent: Info Banner
- Turkusowe tło
- Tekst + CTA button (np. "wypełnij ankietę")
- Przycisk X zamknij
- Jednoliniowy

### Komponent: Period Selector
- Dropdown button: "bieżący miesiąc ▼"
- Trzy opcje:
  - "bieżący miesiąc" → ?period=month (od 1-go do dziś)
  - "bieżący tydzień" → ?period=week (pon-nd bieżący)
  - "ostatnie 31 dni" → ?period=last_31_days
- Po wybraniu: tekst "Statystyki salonu: {start} - {end}" się aktualizuje
- Aktualizuje wszystkie 3 wykresy

### Komponent: Statistics Card (x3)
Każda karta:
- Tytuł: mały szary tekst (np. "liczba wizyt")
- Wartość: duża bold cyfra (np. "18") + strzałka ↑/↓
- Kolor strzałki: zielony (wzrost) / czerwony (spadek)
- Zmiana: "100% (więcej o 18)" tekst
- Mini Line Chart:
  - Oś X: daty (01.02, 02.02, 03.02, ...)
  - Oś Y: wartości (autoscale)
  - Kolor linii: niebieski z gradientem fill
  - Tooltip na hover z dokładną wartością
- SPECJALNE: karta "obroty salonu" ma button [pokaż obrót] do toggle widoczności kwoty
- Tooltip na wykresie: "07.02: obroty (zł) 680"

### Komponent: Aktywności (Activity Logs)
- Header: ikona ⚙ + "aktywności" + link "więcej" (→ /settings/employees/activity_logs)
- Lista max 15 pozycji
- Każdy wpis:
  - Avatar (inicjały w kolorowym kółku, np. "GB" niebieski, "Re" zielony)
  - Nazwa pracownika (link → filtr activity logs by user_id)
  - Typ akcji (link → filtr by activity type)
  - Data + godzina (format: "14:59, sobota 07.02.2026")
- Typy akcji:
  - "Zalogowanie do systemu" (signin)
  - "Usunięcie wizyty" (event_destroy)
  - "Edycja danych klienta"
  - "Dodanie klienta"
  - "Modyfikacja wizyty"

### Komponent: Najbliższe Zaplanowane Wizyty
- Header: ikona 📅 + "najbliższe zaplanowane wizyty"
- Grupowanie: po datach (format: "poniedziałek 09.02.2026")
- Wiersz wizyty:
  - Godzina: niebieski link (np. "09:00") → redirect do kalendarza z event highlight
  - Avatar pracownika: kolorowe kółko z inicjałami (np. "AB" różowy)
  - Imię klienta: zwykły tekst
  - Usługa: zwykły tekst (np. "Koloryzacja Ola - włosy długie")
- Footer: link "kalendarz wizyt" → /{salon_slug}/calendar
- Wyświetla max 3 dni do przodu

### Komponent: Zadania (Tasks)
- Header: ikona ☑ + "zadania" + [+] (dodaj widok) + [🗑] (kasuj)
- Pole input: "+ nowe zadanie" (placeholder)
- Po wpisaniu tekstu i Enter → otwiera modal edycji
- Lista zadań: pending only
- Jeśli brak: "Nie znaleziono żadnych zadań"
- Footer: link "Archiwum Zadań" → /todo/archives/

### Modal: Edycja Zadania
```
┌─────────────────────────────────────────┐
│ Edycja zadania                          │
├─────────────────────────────────────────┤
│ 1. [Nazwa zadania *]                    │
│                                         │
│ 2. opis                                 │
│    [textarea]                           │
│                                         │
│ 3. zadanie dla                          │
│    [wpisz nazwę lub wybierz z listy]    │
│    Select options:                      │
│    - Wszyscy pracownicy                 │
│    - Wszyscy recepcjoniści              │
│    - Aleksandra Bodora                  │
│    - Recepcja                           │
│    - Gniewko Bodora                     │
│                                         │
│ 4. priorytet                            │
│    [normalny ▼]                         │
│    Options:                             │
│    - normalny (value: 0)                │
│    - średni ! (value: 1)                │
│    - wysoki !! (value: 2)               │
│    - pali się !!! (value: 3)            │
│                                         │
│ 5. przypomnienie                        │
│    [☑ aktywne]                          │
│    [dd.mm.yyyy] [HH ▼] : [MM ▼]       │
│    HH: 00-23                            │
│    MM: 00,05,10,15,20,25,30,35,40,45,50,55│
│                                         │
│ [zapisz zadanie]  [< powrót do listy]   │
└─────────────────────────────────────────┘
```

### API Dashboard
```json
GET /api/v1/salons/{id}/dashboard?period=month
Response:
{
  "period": { "start": "2026-02-01", "end": "2026-02-07" },
  "stats": {
    "total_visits": 18,
    "total_visits_change_percent": 100,
    "total_visits_change_absolute": 18,
    "new_customers": 1,
    "new_customers_change_percent": 100,
    "new_customers_change_absolute": 1,
    "revenue": 4080.00,
    "revenue_change_percent": 100,
    "revenue_change_absolute": 4080.00
  },
  "charts": {
    "visits": [
      {"date": "01.02", "value": 2},
      {"date": "02.02", "value": 1},
      {"date": "03.02", "value": 0},
      {"date": "04.02", "value": 3},
      {"date": "05.02", "value": 5},
      {"date": "07.02", "value": 7}
    ],
    "new_customers": [...],
    "revenue": [...]
  }
}
```

---

## MODUŁ 2: KALENDARZ

### URL: panel.salon-bw.pl/{salon_slug}/calendar

### 4 Tryby Widoku: [miesiąc] [tydzień] [dzień] [recepcja]

### Controls Bar
```
┌────────────────────────────────────────────────────────────┐
│ [◀] [▶] [dzisiaj] [🖨drukuj]    DATA    [miesiąc][tydzień][dzień][recepcja] │
└────────────────────────────────────────────────────────────┘
```
- [◀] [▶] : prev/next (dzień/tydzień/miesiąc w zależności od widoku)
- [dzisiaj] : go to today
- [🖨] : drukuj rozkład dnia (PDF) - generuje PDF z bieżącym widokiem
- DATA: format zależy od widoku:
  - Dzień: "sobota, 7 lutego 2026"
  - Tydzień: "2 lutego 2026 – 8 lutego 2026"
  - Miesiąc: "luty 2026"
- [miesiąc][tydzień][dzień][recepcja] : switcher widoku (active = podświetlony)

### Sidebar Kalendarza
```
┌──────────────────────┐
│ [◀◀] LUTY 2026 [▶▶] │  ← nawigacja miesiąca (podwójne strzałki)
│ [◀]            [▶]  │  ← nawigacja roku
│ pn wt śr cz pt so n │
│ 26 27 28 29 30 31  1│
│  2  3  4  5  6 [7] 8│  ← [7] = dziś (podświetlone)
│  9 10 11 12 13 14 15│
│ 16 17 18 19 20 21 22│
│ 23 24 25 26 27 28  1│
│                      │
│ PRACOWNICY           │
│ ☑ Aleksandra Bodora ■│  ← ■ = kwadrat koloru (np. różowy)
│ ☐ Recepcja           │
│ ☐ Gniewko Bodora     │
│                      │
│ [widok ▲]            │  ← toggle sidebar
│   └─ [Zarządzaj widokami] │  ← link do /calendar/views
└──────────────────────┘
```

### WIDOK MIESIĄC
```
│ tydz.│ poniedziałek │ wtorek  │ środa   │ czwartek│ piątek  │ sobota  │ niedziela    │
│──────┼──────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────────────│
│  5   │ 26           │ 27      │ 28      │ 29      │ 30      │ 31      │ 1            │
│      │ 9:00-15:00   │12:00-19 │ 9:00-15 │12:00-19 │ 9:00-15 │ 9:00-13 │ salon nieczyn│
│      │[10:00 Klient]│[13:00 C]│[10:00 K]│[10:00 K]│[10:00 K]│[11:30 C]│              │
│      │[12:00 Klient]│[17:20 S]│[13:00 B]│[13:00 Z]│[11:00 Z]│[9:30 Rękas]│           │
│      │[14:30 Klient]│         │[14:30 L]│[16:00 N]│[12:45  ]│[13:00 Kr]│             │
│      │[17:15 Klient]│         │[16:00 N]│[17:30  ]│[13:00 P]│         │              │
│      │              │         │         │         │[14:30 H]│         │              │
│──────┼──────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────────────│
│  6   │ 2            │ 3       │ 4       │ 5       │ 6       │ 7       │ 8            │
│ ...  │ ...          │ ...     │ ...     │ ...     │ ...     │ ...     │ salon nieczyn│
```

Cechy widoku miesiąca:
- Grid 7 kolumn (pn-nd) + kolumna "tydz." z numerem
- Pod datą: godziny pracy pracownika (np. "9:00 - 15:00")
- "salon nieczynny" w niedzielę (lub inny dzień wolny)
- Wizyty w kolorowych blokach:
  - RÓŻOWY/CZERWONY: standardowa wizyta (kolor pracownika)
  - ZIELONY: "pierwsza wizyta" klienta - z labelką [pierwsza wizyta]
  - SZARY: specjalne zdarzenia
- Format wizyty: "[HH:MM] Nazwisko Imię" + nazwa usługi (druga linia)
- Click na wizytę → modal szczegółów lub redirect do widoku dnia

### WIDOK TYDZIEŃ
```
│ tydz.6│pon 02.02    │ wt 03.02    │ śr 04.02    │ czw 05.02   │ pt 06.02    │ sb 07.02    │ nie 08.02     │
│ dzień  │ 9:00-15:00  │12:00-19:00  │ 9:00-15:00  │12:00-19:00  │ 9:00-15:00  │ 9:00-13:00  │ salon nieczyn │
│────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼───────────────│
│ 8:00   │             │             │             │             │ ┌──────────┐│ ┌──────────┐│               │
│ 8:30   │             │             │             │             │ │8:45-10:15││ │8:30-9:30  ││               │
│ 9:00   │             │             │ ┌──────────┐│             │ │Zolenska  ││ │Segiet Ew. ││               │
│ 9:30   │ ┌──────────┐│             │ │9:00-13:00││             │ │Fryzura   ││ │Strzyżenie ││               │
│        │ │9:30-9:55  ││             │ │Marka M.  ││             │ │wieczorow.││ └──────────┘│               │
│ 10:00  │ │           ││             │ │Koloryzacj││             │ │Płat:250zł││ ┌──────────┐│               │
│        │ └──────────┘│             │ │Opis klient││             │ └──────────┘│ │9:30-13:00 ││               │
│ 11:00  │             │             │ │Mobile:608 ││ ┌──────────┐│ ┌──────────┐│ │Rękas Kat. ││               │
│        │             │             │ │           ││ │11:00-13:00│ │11:00-13:00│ │Koloryzacja││               │
│ 12:00  │ ┌──────────┐│ ┌──────────┐│ │Płat:400zł││ │Tomasik O ││ │Piecuch A ││ │Płat:400zł ││               │
│        │ │12:00-16:00││ │12:00-16:00│ │(gotówka) ││ │Fryzura   ││ │Fryzura   ││ └──────────┘│               │
│ 13:00  │ │Wieczorek A││ │Nierobiś M│ └──────────┘│ │Płat:250zł││ │wieczorow.││ ┌──────────┐│               │
│        │ │Rozjaśn.  ││ │Koloryzacj│ ┌──────────┐│ └──────────┘│ │Płat:250zł││ │13:00-15:00││               │
│ 14:00  │ │Płat:450zł││ │Płat:300zł│ │13:00-15:00│             │ │ [pierwsza ││ │Kruszewska ││               │
│        │ │(karta kr)││ │(gotówka) │ │Miś Bożena││             │ │  wizyta]  ││ │Koloryzacja││               │
│ 15:00  │ │          ││ ┌──────────┐│ │Koloryzacj││             │ └──────────┘│ │Płat:130zł ││               │
│        │ │          ││ │15:00-16:00│ │Płat:320zł││             │ ┌──────────┐│ │(gotówka)  ││               │
│ 16:00  │ └──────────┘│ │Matuszk.T ││ │(karta kr)││ ┌──────────┐│ │14:30-16:00│ └──────────┘│               │
│        │ ┌──────────┐│ │Strzyżenie│ └──────────┘│ │16:00-19:00│ │Henczel J ││             │               │
│        │ │16:00-19:00│ └──────────┘│             │ │ZEBRANIE  ││ │[pierwsza] ││             │               │
│ 17:00  │ │Ziółek Agn│ ┌──────────┐│             │ │(CZERWONY)││ │Modelow.  ││             │               │
│        │ │Rozjaśn.  ││ │16:00-19:00│             │ └──────────┘│ ┌──────────┐│             │               │
│ 18:00  │ │Płat:360zł││ │Nierobiś M│             │             │ │16:00-16:45│             │               │
│        │ │(gotówka) ││ │Koloryzacj│             │             │ │Bryła Artur│             │               │
│ 19:00  │ └──────────┘│ │Płat:300zł│             │             │ │Strzyżenie│             │               │
│ 20:00  │             │ └──────────┘│             │             │ │maszynką  ││             │               │
│        │             │             │             │             │ └──────────┘│             │               │
```

Cechy widoku tygodnia:
- 7 kolumn (pn-nd) + kolumna godzin
- Nagłówek: "tydz.6" (numer tygodnia) + "dzień" (link)
- Pod datą: godziny pracy (np. "9:00-15:00")
- Bloki wizyt z pełnymi detalami:
  - Zakres godzin (np. "9:30 - 13:00")
  - Imię i nazwisko klienta
  - Nazwa usługi
  - Opcjonalnie: "Opis klienta: ..." (dodatkowe info)
  - Opcjonalnie: "Mobile Phone: 608495017"
  - Płatność: "Płatności: 400,00 zł (gotówka: 400,00 zł)"
  - Lub: "Płatności: 450,00 zł (karta kredytowa: 450,00 zł)"
- Specjalne oznaczenia:
  - [pierwsza wizyta] - zielony label dla nowego klienta
  - ZEBRANIE - czerwony/różowy blok dla zdarzeń specjalnych
  - "Opis wizyty: zebranie" / "Opis wizyty: pianino"
- Niebieska linia = aktualny czas (live update co minutę)
- "salon nieczynny" w niedzielę

### WIDOK DZIEŃ
```
│          │ Aleksandra Bodora              │
│ tydz. 6  │ 9:00 - 13:00                   │
│ dzień    │                                 │
│──────────┼─────────────────────────────────│
│ 8:00     │                                 │
│ 8:30     │ ██ 8:30 - 9:30 ███████████████ │
│          │ Segiet Ewelina                  │
│ 9:00     │ Strzyżenie Damskie Ola         │
│          │ - włosy krótkie                 │
│ 9:30     │ ██ 9:30 - 13:00 ██████████████ │
│          │ Rękas Katarzyna                 │
│ 10:00    │ Koloryzacja Ola                 │
│          │ - włosy bardzo długie           │
│ 11:00    │                                 │
│ 12:00    │ Płatności: 400,00 zł            │
│          │ (gotówka: 400,00 zł)            │
│ 13:00    │ ██ 13:00 - 15:00 █████████████ │
│          │ Kruszewska Danuta               │
│          │ Koloryzacja Ola                 │
│ 14:00    │ - włosy średnie                 │
│          │ Płatności: 130,00 zł            │
│          │ (gotówka: 130,00 zł)            │
│ 15:00    │───── niebieska linia (teraz) ───│
│ ...      │                                 │
│ 20:00    │                                 │
```

Cechy widoku dnia:
- 1 kolumna per pracownik (widoczni wg filtra)
- Nagłówek: imię pracownika + godziny pracy
- "tydz. X" klikalne → widok tygodnia
- "dzień" label
- Bloki wizyt z pełnymi detalami (jak w tygodniu)
- Szare tło = poza godzinami pracy
- Przerywane linie po prawej stronie = godziny
- Niebieska linia = teraz (aktualna godzina)

### WIDOK RECEPCJA
- Identyczny z widokiem DZIEŃ ale:
  - Uproszczony widok (mniej detali)
  - Quick action buttons na wizytach
  - Optymalizowany dla szybkiej obsługi klienta
  - Możliwe ukrycie cen

### Custom Views (Zarządzanie widokami)
URL: /{salon_slug}/calendar/views
- Tworzenie custom widoków per rola
- Jeśli brak: "Brak zdefiniowanych widoków"
- Konfiguracja: nazwa, typ widoku, role, filtry, kolumny

### Appointment Block - szczegóły
```json
{
  "id": 383700585,
  "time_range": "9:30 - 13:00",
  "customer_name": "Rękas Katarzyna",
  "service_name": "Koloryzacja Ola - włosy bardzo długie",
  "employee_name": "Aleksandra Bodora",
  "employee_color": "#FF69B4",
  "price": 400.00,
  "payment_method": "gotówka",
  "payment_amount": 400.00,
  "is_first_visit": false,
  "notes": "",
  "description": "",
  "status": "completed"
}
```

### Kolory bloków
- Standardowa wizyta: kolor pracownika (np. różowy #FF69B4)
- Pierwsza wizyta: zielony label [pierwsza wizyta] na bloku
- Zdarzenie specjalne: czerwony/ciemnoróżowy (zebranie, przerwa)
- Poza godzinami: szare tło

### Interakcje
- Click na wizytę → modal szczegółów / edycja
- Double-click na pusty slot → tworzenie nowej wizyty
- Drag & drop → zmiana godziny/daty
- Click na dzień w mini-kalendarzu → zmiana daty
- Click na pracownika (checkbox) → filtrowanie
