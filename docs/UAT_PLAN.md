# UAT — plan testów akceptacyjnych (właścicielka + klientka)

_Wersja 2026-10-26. Faza B ścieżki do produkcji (`docs/PROJECT_COMPLETION_PLAN.md` §3.0)._
_Ten dokument zastępuje sztuczny „live E2E agenta" (E4.3) — przejście realnego
dnia pracy przez właścicielkę jest miarodajniejsze niż skrypt._

---

## Decyzja operacyjna — dwa systemy utrzymywane ręcznie

**Owner, 2026-10-26:** Booksy pozostaje aktywne przez nieokreślony jeszcze
okres; Booksy i SalonBW będą utrzymywane ręcznie. Nie ma automatycznej
synchronizacji ani ustalonej daty wyłączenia Booksy. Ta decyzja nie jest GO
na finalny import, otwarcie produkcyjnych zapisów lub automatyczny deploy.

Przy ręcznej obsłudze obu systemów operator:

- Przed przyjęciem lub przesunięciem wizyty sprawdza zajętość obu kalendarzy.
- Dla nowej wizyty, zmiany terminu i anulowania sprawdza odpowiadający zapis
  w drugim systemie; rozbieżności wyjaśnia przed potwierdzeniem klientce.
  Przy kopiowaniu kontroluje termin, usługę, czas trwania i status.
- W prywatnym rejestrze roboczym rozróżnia wizyty skopiowane ręcznie od
  zaimportowanych. Nie publikuje danych klientek ani identyfikatorów w PR.
- Po obsłużeniu zmian porównuje oba kalendarze, w szczególności najbliższy
  dzień pracy. Nie zakłada, że zapis w jednym systemie zmienił drugi.
- Przed kolejnym importem weryfikuje duplikaty ręcznych zapisów, konflikty
  oraz zmienione/anulowane rezerwacje. Podobieństwo terminu i klientki nie
  jest wystarczającym dowodem tożsamości rekordu ani zgodą na jego usunięcie.

Importer jest idempotentny po `import_source_links`, ale **nie synchronizuje
zmian istniejących wizyt**: powiązane rekordy pomija. Reconciliation wykazuje
rozbieżności, nie naprawia ich. Brak wizyty w eksporcie nie dowodzi anulowania.
Eksport z 23.10 służy przygotowaniom; nie jest bieżącym lustrem Booksy.

## 0. Zanim zaczniesz

**Gdzie testujemy:** zapisy i pełne scenariusze §1–2a wyłącznie na
`https://dev-panel.salon-bw.pl`, z `dev.salon-bw.pl` i `dev-api.salon-bw.pl`.
Dev ma osobną bazę, konta, cookies i wyłączone wysyłki. Używaj wyłącznie
syntetycznych kart. Nie kopiuj danych klientek z produkcji do dev.
`panel.salon-bw.pl` służy tu wyłącznie do odczytu historii po imporcie.

**Warunki przed testem:**
- [ ] Potwierdź środowisko dev, aktualny SHA i działanie bramki dostępu.
- [ ] Potwierdź syntetyczne konta, katalog i grafik; wyłączone wysyłki.
- [ ] Zapisz stan początkowy magazynu/statystyk oraz identyfikatory fixture
      wyłącznie w prywatnym środowisku testowym.
- [ ] Nie interpretuj historycznych checkboxów E2/E4 ani regresji jako
      bieżącego potwierdzenia dostarczenia wiadomości lub GO ownera.

**Kontrola produkcji tylko do odczytu:** historyczny import 2026-10-23
obejmował 1047 klientek, 10 109 wizyt i 144 opinie. Właścicielka porównuje
wybrane znane jej karty z Booksy prywatnie, bez eksportowania PII do zgłoszeń.
Nie twórz i nie zmieniaj wizyt, klientek, notatek, zdjęć ani zgód na produkcji.

**Rezerwacje przyszłe — wynik 2026-10-26:** dostępny eksport ma mtime
2026-10-23; świeżość i kompletność wobec obecnego Booksy są niepotwierdzone.
Zawiera 85 nadal przyszłych potwierdzonych wizyt: 82 z kartą klientki,
3 anonimowe. Żadna nie jest powiązana z SalonBW. W źródle jest 7 par
nakładania obejmujących 12 wizyt; 0 kolizji z aktywnym kalendarzem SalonBW.
Plan istniejącego importera proponuje 91 zapisów, w tym 9 przeszłych nadal
potwierdzonych; to nie jest gotowa lista przyszłych rezerwacji do importu.
[Dowody i komendy](journal/2026-10-26-booksy-reconciliation-and-legacy-status.md).

**Zasady testu syntetycznego:** użyj konta testowego klientki i kart „UAT …”
na dev. Zapisz utworzone fixture do późniejszego cleanupu wyłącznie na dev.
Wyłączone kanały nie dowodzą rzeczywistego dostarczenia SMS/email/push.
Test rzeczywistego odbioru wymaga osobnej akceptacji wskazanego odbiorcy.

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
- [ ] Logowanie na `dev-panel.salon-bw.pl`
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

Sprawdź biznesowo, czy **jedna syntetyczna sfinalizowana wizyta poprawnie
przepływa przez wszystkie moduły na dev**. Zrób to jako pojedynczy, świadomy przebieg
i zanotuj liczby PRZED i PO.

**Przed startem zanotuj:**
- stan magazynowy farby, której użyjesz: `______`
- utarg dziś (Statystyki → Raport finansowy): `______`
- liczba wizyt na karcie wybranej klientki (testowej albo „UAT …", nie
  prawdziwej): `______`

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

### Osobne bramki importu i uruchomienia produkcyjnego

Ukończenie UAT na dev nie wymaga świeżego eksportu ani wyłączenia Booksy.
Przed kolejnym produkcyjnym importem i otwarciem zapisów wymagane są:

- [ ] Świeży, kompletny eksport Booksy z zapisanym momentem wykonania oraz
      uzgodnionym oknem zmian w obu systemach na czas planu/apply/kontroli.
      Utrzymanie Booksy po operacji nie wymaga jego wyłączenia.
- [ ] Ponowne read-only reconciliation; brak nieznanych statusów, duplikatów,
      zerwanych powiązań i niewyjaśnionych zmian powiązanych wizyt.
- [ ] Rozliczenie ręcznie skopiowanych wizyt; brak podwójnych zapisów.
      Kandydaci na duplikaty wymagają potwierdzenia operatora, nie automatycznego linkowania.
- [ ] Owner rozstrzyga anonimowe wizyty, przeszłe „confirmed” i nakładanie
      terminów. Nie dopasowujemy ani nie uzupełniamy brakujących klientek.
- [ ] Plan tylko dla zaakceptowanej delty; brak resetowania haseł i zgód.
- [ ] Udokumentowane GO właścicielki, backup i procedura kontrolowanego zapisu.
- [ ] Ponowny plan po imporcie: 0 nieoczekiwanych zapisów, kontrola kalendarza.
- [ ] Uzgodniony sposób ręcznej obsługi obu kalendarzy i rozbieżności po starcie.

**Wyłączenie Booksy jest oddzielną, późniejszą decyzją ownera.** Obecnie nie
ma terminu ani zgody na tę operację. Akceptacja panelu i kolejnego importu
nie stanowi zgody na zakończenie Booksy.

---

## 5. Uwagi

- **Rola „pracownik" — świadomie poza zakresem** (decyzja ownera 2026-07-23):
  salon jednoosobowy, Aleksandra pracuje jako admin. Gdyby doszło zatrudnienie,
  dopisać osobną ścieżkę (grafik pracownika, ograniczony dostęp) i sekrety
  `E2E_EMPLOYEE_*`.
- **Dane testowe utworzone w trakcie UAT na dev** (wizyty, klientki, sprzedaże)
  oznacz, spisz i posprzątaj po próbach wyłącznie na dev. Nie przygotowujemy
  tej bazy do importu realnych danych klientek. Nie resetuj produkcji.
- Scenariusze zapisujące wykonuj **wyłącznie na dev**. Historyczne instrukcje
  dopuszczające testowe zapisy na produkcji nie obowiązują w tym zadaniu.
