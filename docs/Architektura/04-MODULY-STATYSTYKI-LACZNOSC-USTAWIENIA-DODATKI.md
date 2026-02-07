# SALON-BW CLONE - MODUŁY: STATYSTYKI, ŁĄCZNOŚĆ, USTAWIENIA, DODATKI

---

## MODUŁ 5: STATYSTYKI

### URL: panel.salon-bw.pl/{salon_slug}/statistics/dashboard

### Sidebar - Raporty
```
⠂ Raport finansowy (default)
⠂ Pracownicy
⠂ Prowizje pracowników
⠂ Stan kasy
⠂ Napiwki
⠂ Usługi
├── Powracalność klientów
├── Pochodzenie klientów
⠂ Magazyn
├── Raport zmian magazyn...
├── Raport wartości produk...
⠂ Raport czasu pracy
⠂ Komentarze
├── Booksy
├── Moment
```

### Raport Finansowy (default)
```
┌──────────────────────────────────────────────────────────────┐
│ Statystyki / Raport finansowy                                │
│ [◀] [2026-02-07 📅] [▶]          [📥 pobierz raport Excel] [🖨] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Salon ogółem                                                 │
│ Liczba sfinalizowanych wizyt: 3                              │
│ Łączny czas trwania sfinalizowanych wizyt: 6 h 30 min       │
│                                                              │
│ ┌──────────────┬─────────┬──────────┐                       │
│ │              │ netto   │ brutto   │                        │
│ ├──────────────┼─────────┼──────────┤                       │
│ │Sprzedaż usług│ 552,84 zł│ 680,00 zł│                       │
│ │Sprzedaż towarów│ 0,00 zł│  0,00 zł│                       │
│ └──────────────┴─────────┴──────────┘                       │
│ Utarg ze sprzedaży usług i towarów brutto: 680,00 zł        │
│                                                              │
│ ┌──────────────┬──────────┐                                  │
│ │ Napiwki      │  0,00 zł │                                  │
│ └──────────────┴──────────┘                                  │
│                                                              │
│ Saldo gotówki w kasie: 680,00 zł                             │
│ Wpływy: 680,00 zł                                           │
│ Wydatki: 0,00 zł                                            │
│                                                              │
│ Metody płatności niewliczone do utargu brutto: 0,00 zł      │
│ Sprzedaż usług brutto: 0,00 zł                              │
│ Sprzedaż towarów brutto: 0,00 zł                            │
│                                                              │
│ ┌─────────────────────────────────┐  Udział metod płatności  │
│ │                                 │  w utargu ℹ             │
│ │        [PIE CHART]              │                          │
│ │   ████████████████████          │  ■ gotówka: 680,00 zł   │
│ │   █████ 100% █████████          │    (100%)               │
│ │   ████████████████████          │                          │
│ │                                 │                          │
│ └─────────────────────────────────┘                          │
│                                                              │
│ Dane w podziale na pracowników                               │
│ ┌──────────┬──────┬────────┬──────────┬──────────┬──────────┬──────────┬────────┬───────┐
│ │Pracownik │Wizyty│Łączny  │Sprzedaż  │Sprzedaż  │Sprzedaż  │Sprzedaż  │Utarg   │Procent│
│ │          │      │czas    │usług brut│usług nett│towarów br│towarów ne│brutto  │       │
│ ├──────────┼──────┼────────┼──────────┼──────────┼──────────┼──────────┼────────┼───────┤
│ │Aleksandra│  3   │6h 30m  │680,00 zł │552,84 zł │0,00 zł   │0,00 zł   │680,00zł│ 100%  │
│ │Recepcja  │  0   │0 min   │0,00 zł   │0,00 zł   │0,00 zł   │0,00 zł   │0,00 zł │  0%   │
│ │Gniewko B.│  0   │0 min   │0,00 zł   │0,00 zł   │0,00 zł   │0,00 zł   │0,00 zł │  0%   │
│ ├──────────┼──────┼────────┼──────────┼──────────┼──────────┼──────────┼────────┼───────┤
│ │Łącznie   │  3   │6h 30m  │680,00 zł │552,84 zł │0,00 zł   │0,00 zł   │680,00zł│ 100%  │
│ └──────────┴──────┴────────┴──────────┴──────────┴──────────┴──────────┴────────┴───────┘
│                                                              │
│ Udział pracowników w utargu                                  │
│ ┌─────────────────────────────────┐                          │
│ │        [PIE CHART]              │  ■ Recepcja (0%)         │
│ │                                 │  ■ Gniewko Bodora (0%)   │
│ │   █████ Aleksandra ██████       │  ■ Aleksandra B. (100%)  │
│ │                                 │                          │
│ └─────────────────────────────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

### Wykresy
- Pie Chart 1: Udział metod płatności w utargu (gotówka, karta, przelew)
- Pie Chart 2: Udział pracowników w utargu
- Oba z legendą i procentami

---

## MODUŁ 6: ŁĄCZNOŚĆ

### URL: panel.salon-bw.pl/{salon_slug}/communication

### Layout
```
┌──────────────────┬──────────────────────────────────────────┐
│ ⠂ Łączność       │ Łączność / Nieprzeczytane wiadomości 140 │
│ ⠂ Wiadomości     │                                          │
│   masowe         │ [wyślij wiadomość pojedynczą]             │
│ ⠂ Szablony       │ [wyślij wiadomość masową]                 │
│   wiadomości     │                                          │
│ ⠂ Grupa testowa  │ Status: [odczytane i nieodczytane ▼]     │
│ ⠂ Facebook       │ Wiadomość: [wszystkie wiadomości ▼]      │
│ ⠂ Twitter        │ Okres: [09.01.2026 : 07.02.2026 📅]     │
│ ⠂ Komentarze     │ Rodzaj: [SMS i email ▼]                  │
│ ⠂ Szablony       │                                          │
│   graficzne      │ │Odbiorca         │Wiadomość    │Rodzaj    │Wysłano     │
│ ⠂ Posty Facebook │ │Joanna Pawliszko │Twoja wizyta │sms stand.│7 lut 13:22 │
│                  │ │(+48 502 602 032)│w Akademii.. │          │            │
│                  │ │Ewelina Segiet   │Twoja wizyta │sms stand.│7 lut 09:36 │
│                  │ │(+48 509 872 758)│w Akademii.. │          │            │
│                  │ │Danuta Kruszewska│Przypomnienie│sms stand.│6 lut 13:05 │
│                  │ │(+48 603 090 496)│o wizycie... │          │            │
│                  │ │Beata Widawska   │Twoja wizyta │sms stand.│6 lut 13:01 │
│                  │ │...              │...          │...       │...         │
│                  │                                          │
│                  │ Olga Tomasik      │Przypomnienie│sms stand.│5 lut 12:59 │
│                  │ (+48 575 786 161) │o wizycie    │          │bold = nieo.│
│                  │                   │Maja będzie   │          │            │
│                  │                   │liczba wiad: 2│          │            │
└──────────────────┴──────────────────────────────────────────┘
```

### Sidebar Kanały
- Łączność (main)
- Wiadomości masowe
- Szablony wiadomości
- Grupa testowa (user-defined)
- Facebook
- Twitter
- Komentarze (opinie klientów)
- Szablony graficzne
- Posty Facebook

### Filtry
- Status: odczytane i nieodczytane / tylko odczytane / tylko nieodczytane
- Wiadomość: wszystkie / przypomnienia / potwierdzenia / marketing
- Okres: datepicker range
- Rodzaj: SMS i email / tylko SMS / tylko email

### Tabela Wiadomości
- Odbiorca: imię + nazwisko + telefon
- Wiadomość: tytuł (link) + preview treści
- Rodzaj: "sms standard" badge
- Wysłano: data + godzina
- Nieodczytane: bold tekst
- Wiele wiadomości: "liczba wiadomości: 2"

### Typy wiadomości
- "Twoja wizyta w Akademii Zdrowych..." (potwierdzenie wizyty)
- "Przypomnienie o wizycie" (reminder)
- Custom messages

---

## MODUŁ 8: USTAWIENIA

### URL: panel.salon-bw.pl/{salon_slug}/settings

### Hub Ustawień (główny widok z ikonami)
```
┌────────────────────────────────────────────────────────────┐
│ 🔧 Ustawienia                                              │
│                                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ 📊       │ │ 📋       │ │ ⏰       │ │ 📅       │      │
│ │ grafiki  │ │ dane     │ │ godziny  │ │ kalendarz│      │
│ │ pracy    │ │ salonu   │ │ otwarcia │ │          │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ 👥       │ │ 👤       │ │ ☁️       │ │ ⭐       │      │
│ │pracownicy│ │ klienci  │ │rezerwacja│ │komentarze│      │
│ │          │ │          │ │ online   │ │          │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ 💬       │ │ ✉️       │ │ 📘       │ │ 💰       │      │
│ │ łączność │ │komunikacj│ │ media    │ │ faktury  │      │
│ │          │ │z klientem│ │społecznoś│ │i abonamen│      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│ │ 💳       │ │ 👑       │ │ ⚙️       │                    │
│ │ płatności│ │ Premium  │ │ inne     │                    │
│ │          │ │          │ │ustawienia│                    │
│ └──────────┘ └──────────┘ └──────────┘                    │
│                                                            │
│ ⭐ Ustawienia dodatków                                     │
│ ┌──────────┐                                               │
│ │ 🧲       │                                               │
│ │ Marketing│                                               │
│ │Automatycz│                                               │
│ └──────────┘                                               │
└────────────────────────────────────────────────────────────┘
```

### Podmoduły Ustawień (16 sekcji)
1. **grafiki pracy** - harmonogramy pracowników
2. **dane salonu** - nazwa, adres, telefon, email, logo, opis
3. **godziny otwarcia** - per dzień tygodnia, dni wolne
4. **kalendarz** - ustawienia kalendarza (interwał, godziny, widok domyślny)
5. **pracownicy** - lista, dodaj/edytuj, role, uprawnienia, grafik, logi aktywności
6. **klienci** - ustawienia klientów, automatyczne przypomnienia, grupy
7. **rezerwacja online** - włącz/wyłącz, zasady, integracja Booksy
8. **komentarze** - zarządzanie opiniami
9. **łączność** - konfiguracja SMS gateway, limity
10. **komunikacja z klientem** - szablony automatyczne, potwierdzenia, przypomnienia
11. **media społecznościowe** - Facebook, Instagram integracja
12. **faktury i abonament** - dane do faktury, VAT, plan, historia płatności
13. **płatności** - metody płatności, kasa fiskalna
14. **Premium** - upgrade planu, funkcje premium
15. **inne ustawienia** - różne

### Ustawienia dodatków
- Marketing Automatyczny (jeśli aktywny)

---

## MODUŁ 9: DODATKI

### URL: panel.salon-bw.pl/{salon_slug}/extension/

### Layout
```
┌────────────────────────────────────────────────────────────┐
│ ⭐ Dodatki                                                  │
│                                                            │
│ ┌──────────────────────────┐ ┌──────────────────────────┐ │
│ │ 📧 Marketing Automatyczny│ │ ❤️ Program Lojalnościowy │ │
│ │                          │ │                          │ │
│ │ Skorzystaj z nowoczesnych│ │ Buduj lojalność i        │ │
│ │ rozwiązań marketingowych,│ │ zaangażowanie obecnych   │ │
│ │ które zaskoczą Cię swoją │ │ klientów i przyciągaj    │ │
│ │ skutecznością.           │ │ do salonu nowe osoby.    │ │
│ │                          │ │                          │ │
│ │ [więcej] status: ✅Aktywny│ │ [więcej] status: Nieaktyw│ │
│ └──────────────────────────┘ └──────────────────────────┘ │
│                                                            │
│ ┌──────────────────────────┐ ┌──────────────────────────┐ │
│ │ 🎁 Bony i Karnety        │ │ 📦 Zasoby                │ │
│ │                          │ │                          │ │
│ │ Zaoferuj swoim klientom  │ │ Automatycznie sprawdza   │ │
│ │ bony, karty podarunkowe  │ │ dostępność urządzeń i    │ │
│ │ i karnety. Z dodatkiem   │ │ pomieszczeń podczas      │ │
│ │ Bony i Karnety będzie to │ │ wprowadzania wizyt.      │ │
│ │ łatwiejsze niż kiedykolwi│ │ Eliminuje błędne         │ │
│ │                          │ │ rezerwacje i oszczędza   │ │
│ │ [więcej] status: Nieaktyw│ │ czas.                    │ │
│ └──────────────────────────┘ │ [więcej] status: Nieaktyw│ │
│                               └──────────────────────────┘ │
│ ┌──────────────────────────┐ ┌──────────────────────────┐ │
│ │ 🧾 Fiskalizacja          │ │ 📅 Kalendarz Google      │ │
│ │                          │ │                          │ │
│ │ Włącz funkcję fiskalizacj│ │ Idealne rozwiązanie      │ │
│ │ i drukuj paragony na     │ │ organizacyjne dla osób   │ │
│ │ drukarce fiskalnej prosto│ │ pracujących w kilku      │ │
│ │ z Versum. Zobacz, jakie  │ │ miejscach.               │ │
│ │ to szybkie i proste!     │ │                          │ │
│ │ [więcej] status: Nieaktyw│ │ [więcej] status: Nieaktyw│ │
│ └──────────────────────────┘ └──────────────────────────┘ │
│                                                            │
│ ┌──────────────────────────┐                               │
│ │ 🔒 Ograniczenie Dostępu  │                               │
│ │                          │                               │
│ │ Ogranicz dostęp do       │                               │
│ │ systemu dla wybranych    │                               │
│ │ godzin, urządzeń lub     │                               │
│ │ adresów IP.              │                               │
│ │                          │                               │
│ │ [więcej] status: Nieaktyw│                               │
│ └──────────────────────────┘                               │
└────────────────────────────────────────────────────────────┘
```

### Lista Dodatków (7 sztuk)
1. **Marketing Automatyczny** - status: ✅ Aktywny (zielony)
2. **Program Lojalnościowy** - status: Nieaktywny
3. **Bony i Karnety** - status: Nieaktywny
4. **Zasoby** (urządzenia/pomieszczenia) - status: Nieaktywny
5. **Fiskalizacja** (drukarka fiskalna) - status: Nieaktywny
6. **Kalendarz Google** (sync) - status: Nieaktywny
7. **Ograniczenie Dostępu** (IP/godziny/urządzenia) - status: Nieaktywny

### Karta Dodatku
- Ikona (kolorowa ilustracja)
- Tytuł (bold)
- Opis (tekst)
- Link "więcej" (niebieski) → strona szczegółów
- Status: "✅ Aktywny" (zielony) lub "Nieaktywny" (szary)
- Grid: 2 kolumny, responsive

### Funkcjonalności
- Przeglądanie dostępnych dodatków
- Aktywacja/dezaktywacja
- Konfiguracja aktywnych dodatków
- Status widoczny na karcie
