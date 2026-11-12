# SalonBW V18 — wycofanie marketingu i bramki przedprodukcyjne

Status: **Draft / do testów i oceny prawnej**, 8 listopada 2026. Ten dokument nie autoryzuje publikacji na produkcji.

## 1. Stan repozytorium i kolejność integracji

- PR #1665 — rejestracja, opcjonalna zgoda marketingowa na e-mail/SMS/WhatsApp; oparty na `design/v18-communication-clarity-integrated-20261107`, a **nie bezpośrednio na master**.
- PR #1666 — uproszczony widok V18, oparty na #1665, zaakceptowany na DEV (`c3cd076e560381f7d4052136a1bad43d16bd1c08`).
- Ten Draft PR — atomowe wycofanie marketingu, oparty na #1666.
- **Brak automatycznego prawa do merge lub deploy PROD** wynikającego z CI i odbioru DEV. Po uporządkowaniu zależności konieczny jest dokładny CI docelowego zestawu zmian, migracje/preflight (jeśli dotyczy), weryfikacja API i Panelu i zgoda właściciela.

## 2. Zaobserwowany problem — zgoda zbiorcza a wycofanie

Rejestracja #1665 zbiera jedno dobrowolne oświadczenie `marketingConsent`, zapisując trzy niezależne zakresy `DIRECT_MARKETING` (SMS, WhatsApp, EMAIL) i identyczną wersję tekstu. Dotychczas w profilu można było wycofać je tylko pojedynczo, trzema oddzielnymi operacjami. Utrudniało to prostą rezygnację odpowiadającą jednemu pierwotnemu wyborowi.

### Zakres implementacji

- `POST /users/profile/consents/withdraw-direct-marketing` dla zalogowanego klienta.
- `POST /customers/:id/consents/withdraw-direct-marketing` dla personelu działającego na prośbę klienta.
- Body: `{"channels":["SMS","WHATSAPP","EMAIL"]}` lub podzbiór tych trzech, bez duplikatów i bez `PANEL`.
- Jedna transakcja Postgres `mutate()`: blokada klienta, ten sam `Idempotency-Key`, `applyWithdraw()` per kanał, osobny wpis audytu dla każdego zakresu i synchronizacja starszych booli. Błąd dowolnego kanału przerywa całość; brak cichego częściowego powodzenia.
- Interfejs V18: akcje wycofania grupy SMS/WhatsApp i e-mail oraz „Wycofaj wszystkie zgody na oferty i promocje”; również jedna akcja „wszystkie” w profilu klienta (tryb zwykły). Każda operacja wymaga potwierdzenia. Udzielenie zgody nadal wymaga odrębnego dowodu i nie zostało uproszczone ani zautomatyzowane.
- Żaden batch nie rozszerza zgód; nie zmienia powiadomień o wizytach; nie dotyczy innych celów `NEWSLETTER` i `REVIEW_REQUEST`, bo nie są zawarte w zbiorczej zgodzie rejestracyjnej.

### Testy przed publikacją

1. DTO: pusta lista, `PANEL`, duplikaty i poprawne trzy kanały; test autoryzacji `self` i `staff`.
2. Jedna transakcja dla jednego/dwóch/trzech kanałów; eventy `WITHDRAWN` dla każdego zakresu, kompatybilność istniejących klientów.
3. Reuse tego samego `Idempotency-Key`: brak duplikowanych zdarzeń; ten sam klucz z inną treścią: konflikt.
4. Celowo wymuszona awaria zapisu drugiego kanału w **realnym PostgreSQL**: pełen rollback statusów, mirrorów i audytu.
5. UI: potwierdzenie, brak optymistycznego udzielenia, self/staff, stan po odświeżeniu, mobile 320px/390px.
6. Brak zmian w powiadomieniach operacyjnych, idempotentne ponowienie wycofania, brak nowych sendów marketingowych po skutecznym opt-out.

## 3. Podstawy prawne: prawo / polityka dostawcy / wybór projektowy

| Twierdzenie / kontrola | Podstawa i konkretne miejsce | Siła / właściwa interpretacja |
| --- | --- | --- |
| Uprzednia zgoda na informację handlową i marketing bezpośredni przy użyciu wskazanych środków komunikacji | [Prawo komunikacji elektronicznej — art. 398 ust. 1](https://eli.gov.pl/api/acts/DU/2024/1221/text.html) | Obowiązek ustawowy. Nie nakazuje liczby checkboxów w UI. Wymaga świadomego wyboru dla faktycznego celu i środków komunikacji. |
| Możliwość wykazania zgody i wycofanie równie łatwe jak jej wyrażenie | [RODO — art. 7 ust. 1–3](https://eur-lex.europa.eu/eli/reg/2016/679/oj/pol) | Wymóg regulacyjny; interpretacja stosowalności do kanałów zależy od roli zgody jako podstawy przetwarzania. Jeden przycisk wycofania to nasz wybór realizacyjny minimalizujący tarcie. |
| Dobrowolność i odrębność od regulaminu | [RODO — art. 7 ust. 2 i ust. 4](https://eur-lex.europa.eu/eli/reg/2016/679/oj/pol) | Wymóg i kryterium oceny dobrowolności. Marketing bez domyślnego zaznaczenia i bez blokady rejestracji to wybór prawidłowo ograniczający ryzyko. |
| Obowiązek informacyjny | [RODO — art. 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj/pol) | Wymóg niezależny od checkboxa. Należy zweryfikować, czy faktyczna polityka prywatności na stronie opisuje procesy i okresy retencji. |
| Przed kontaktem przez WhatsApp klient musi przekazać numer/identyfikator i udzielić opt-in; wycofanie trzeba respektować | [WhatsApp Business Messaging Policy — §1, „Create a Quality Experience”](https://whatsappbusiness.com/policy/) (23.09.2026) | Wiążąca polityka dostawcy, nie polska ustawa. Nie dowodzi konieczności odrębnego checkboxa WhatsApp. |
| Osobny WhatsApp-specific checkbox nie jest obowiązkowy według aktualnych materiałów Meta | [Meta, „Best Practices for Marketing Messages on WhatsApp”, str. 20](https://whatsappbusiness.com/wp-content/uploads/2026/04/Best-Practices-for-Marketing-Messages-on-WhatsApp-.pdf) | Oficjalne wytyczne, nie zwalniają z ogólnego opt-in i prawa krajowego. Nie usuwać osobnych zapisów per kanał w CRM, bo są przydatne dla wykazywalności i łatwego opt-out. |

### Bramka legal/product

Zatwierdzić dokładną treść rejestracji `direct-marketing-bundle-v1-draft`, jej wersjonowanie i zgodność faktycznego UI z zapisywanym dowodem. Jeśli tekst oświadczenia zostanie zmieniony, historyczne dowody muszą zachować starą wersję. Nie automatycznie rozszerzać legacy SMS na WhatsApp.

## 4. Osobny blocker: WhatsApp operacyjny

W obecnym API `evaluatePreference()` traktuje operacyjny WhatsApp jako uprawniony przez `receiveNotifications` i preferencję `notifyWhatsapp`. W dokumentowanych ścieżkach `AppointmentsService.mayContact()` wywołuje `CommunicationEligibilityService.canSend()`, jednak sam `WhatsappService.sendTemplate()` nie posiada bramki recipient-id/opt-in. Wymaga to **pełnej inwentaryzacji call-site**, rozdzielenia komunikacji do klienta od wiadomości wewnętrznych do pracownika i potwierdzenia dopuszczalnej podstawy opt-in dla poszczególnych kategorii. Nie wystarcza wcześniejsza zgoda **marketingowa** do domniemania zgody na wiadomości **operacyjne**.

Wybór projektowy: obecne UI V18 **nie pozwala personelowi nowo włączyć** WhatsApp operacyjnie bez odrębnej ścieżki weryfikacyjnej. Ta ostrożność nie jest literalnym wymogiem osobnego checkboxa Meta. Przed PROD wybrać i sprawdzić w testach jedną z dwóch strategii: (A) dowód właściwego opt-in + egzekwowanie w dispatch; lub (B) wyłączenie danej kategorii WhatsApp dla klientów, jeśli brak takiego dowodu, z bezpiecznym kanałem zastępczym. Nie dopuszczać przypadkowego ograniczenia powiadomień personelu.

## 5. Definition of Done przed PROD

- [ ] Recenzja prawna/owner dla zgody zbiorczej i tekstów informacyjnych.
- [ ] CI, typecheck, Jest, test PostgreSQL transakcji/rollback + idempotencja.
- [ ] Hostowane API DEV z nowym endpointem, dopiero potem Panel DEV; potwierdzenie exact SHA obu usług.
- [ ] UAT rejestracja bez/z marketingiem i opt-out całościowy/grupowy (testowe konta, bez rzeczywistych wysyłek).
- [ ] Audyt pełnego WhatsApp recipient opt-in + send-time enforcement i rozdział pracownik/klient.
- [ ] Uporządkowanie stosu PR #1665 → #1666 → ten PR i zdefiniowanie finalnego release SHA.
- [ ] Osobne zatwierdzenie produkcji przez właściciela projektu.

**Stan końcowy na dzień sporządzenia:** wyłącznie implementacja Draft; nie wdrożono do API DEV ani PROD.
