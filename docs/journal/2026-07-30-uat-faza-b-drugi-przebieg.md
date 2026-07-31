# UAT Fazy B — drugi przebieg (ścieżka klientki end-to-end + bug finalizacji)

- **Data:** 2026-07-30/31 (noc)
- **Agent:** Claude (kontynuacja „przejdź sam i skoryguj")
- **Commit:** `75f13952`
- **PR:** brak (bezpośredni push na `master`)

## Finding

Kontynuacja `docs/UAT_PLAN.md` §2 (ścieżka klientki, elementy nieprzetestowane
w pierwszym przebiegu: wiadomości, akceptacja zmienionego terminu, ocena
odbytej wizyty, edycja zgód) na nowym koncie testowym
(`uat.client.20260730b@example.invalid`), przeplatana z akcjami właścicielki
(potwierdzenie rezerwacji, wiadomość do klientki, reschedule, finalizacja).

**Metodologiczna pułapka własna (nie bug produktu):** dwie karty przeglądarki
w JEDNYM kontekście dzielą ten sam słoik ciasteczek — zalogowanie się jako
klientka w karcie 2 **wylogowało** administratorkę z karty 1 (auth cookies na
`Domain=.salon-bw.pl` są per-przeglądarka, nie per-karta). Objawiało się jako
pozorne 403 „Forbidden resource" na `/api/customers` mimo poprawnie działającego
proxy `/api/*` (`pages/api/[...path].ts`) — zdiagnozowane przez
`/api/users/profile` zwracające `role: client` zamiast `admin`. Rozwiązanie:
przełączanie ról sekwencyjnie (ponowne logowanie), nie równoległe karty.

**🔴 Realny bug znaleziony i naprawiony: finalizacja wizyty z recepturą
zawsze 400.** Modal finalizacji auto-wypełnia „Materiały do zabiegu" z
receptury usługi (`FinalizationModal.tsx`, efekt na `recipeItems`) — ale
wysyłał cały obiekt stanu (`{productId, productName, quantity, unit}`)
bezpośrednio do backendu. Backendowe DTO (`UsageMaterialItemDto`,
`forbidNonWhitelisted: true`) akceptuje tylko `productId`/`quantity`/`unit` —
`productName` to pole wyłącznie do wyświetlania w UI. Efekt: **każda
finalizacja wizyty dla usługi z przypisaną recepturą (np. farbowanie) kończyła
się błędem 400**, dopóki personel ręcznie nie usunął materiału z receptury
przed finalizacją (czym niweczyłby cel auto-wypełnienia). Błąd BYŁ pokazywany
użytkownikowi (nie cichy fail) — ale jako surowy komunikat walidacji backendu
(„usageMaterials.0.property productName should not exist"), niezrozumiały dla
właścicielki. Odkryte na żywo przy finalizacji wizyty #212 (usługa „Strzyżenie
dziecięce chłopcy" z recepturą SYNTHETIC Produkt 01). Sąsiedni stan
`usageItems` (materiały dodawane RĘCZNIE przez „+ Dodaj materiał") miał już
poprawne mapowanie przed wysyłką — bug dotyczył wyłącznie ścieżki auto-fill z
receptury. Naprawione: payload dla `usageMaterials` teraz mapuje tylko
`productId`/`quantity`/`unit` (analogicznie do `usageItems`); typ
`FinalizeAppointmentRequest.usageMaterials` zawężony do kształtu przewodowego
(`Omit<UsageMaterialItem, 'productName'>`), żeby regresja nie mogła wrócić po
cichu.

Poza tym bugiem, **cała reszta ścieżki klientki przeszła bez zastrzeżeń**:
- Rezerwacja online (krok usługa→dodatki→termin→potwierdzenie) — czysto.
- Potwierdzenie rezerwacji przez personel + wiadomość do klientki — działa,
  wątek widoczny po obu stronach.
- Reschedule (personel edytuje godzinę startu → status „Czeka na klienta") +
  **akceptacja zmienionego terminu przez klientkę** („Było"/„Propozycja
  salonu", przycisk „Akceptuj nowy termin") — działa, status wraca na
  „Potwierdzona".
- **Odpowiedź klientki w wątku wiadomości** (dwukierunkowy, oba komunikaty
  widoczne z właściwym „Ty"/„Salon") — działa.
- **Edycja zgód kontaktowych klientki** (WhatsApp + e-mail) na `/account` —
  zapisuje się, toast potwierdzający.
- **Finalizacja** (po naprawie bugu) — status „Zakończona", „Zapłacono 70 zł
  · gotówka" widoczne na kafelku kalendarza.
- **Ocena odbytej wizyty** (5 gwiazdek + komentarz) przez klientkę — zapisuje
  się, widoczna natychmiast na `/visits` klientki („★★★★★ „Bardzo
  profesjonalna obsługa, polecam!"", przycisk „Zmień ocenę"). Weryfikacja
  admin-side w `/reviews` **nie wykonana w tym przebiegu** — CAPTCHA
  zablokowała kolejne logowanie administratorki po bardzo dużej liczbie
  logowań w tej sesji (świadomie nieomijana).
- Pulpit i lista wizyt klientki nigdzie nie ujawniają ceny ani notatki
  wewnętrznej — potwierdzone wizualnie na obu ekranach.

## Change

- `apps/panel/src/components/calendar/FinalizationModal.tsx` (+
  `__tests__/finalizationModal.test.tsx`) — `usageMaterials` mapowane do
  kształtu przewodowego przed wysyłką (bez `productName`).
- `apps/panel/src/types.ts` — `FinalizeAppointmentRequest.usageMaterials`
  zawężony do `Omit<UsageMaterialItem, 'productName'>[]`.

## Validation

- Panel: `pnpm test` 352/352 (było 351, +1), `tsc` czysty, `eslint --fix` bez
  zmian.
- Fix zweryfikowany rytuałem fail-first: pierwsza próba testu (mock
  `useQuery` zwracający świeży obiekt literal przy każdym wywołaniu)
  spowodowała nieskończoną pętlę renderowania i OOM w jeście — poprawione na
  stabilne referencje (wzorzec zgodny z istniejącymi testami pliku), po czym
  `git stash` na samej naprawie potwierdził RED (dokładny komunikat błędu
  widoczny w asercji) → przywrócenie → GREEN.
- CI: zielone.
- Deploy: automatyczny push-deploy (run `30587036312`) — success.
- Live: finalizacja wizyty #212 z tym samym stanem receptury (ten sam
  produkt/ilość) → **„Zakończona" / „Zapłacono 70 zł · gotówka"**, zero
  błędów konsoli — potwierdzone bezpośrednio po deployu, na dokładnie tej
  samej wizycie, która wcześniej 400-owała.

## Rollout

Na `master`, wdrożone na produkcję. Deploy code: `75f13952`.

## Follow-up

1. Zweryfikować w kolejnej sesji (po ustąpieniu CAPTCHA): czy ocena 5★
   klientki `uat.client.20260730b@example.invalid` pojawia się poprawnie w
   `/reviews` administratorki (mechanizm był już zweryfikowany w
   analogicznym scenariuszu w poprzedniej sesji przez API — to tylko
   potwierdzenie wizualne UI).
2. Kontynuować `docs/UAT_PLAN.md`: §1.8 (magazyn — dalsza część, w tym
   niskie stany), §1.9 (statystyki/raport finansowy, eksport Excel), §1.10
   (ustawienia: katalog usług, rezerwacja online).
3. Rozważyć osobne zadanie: przetłumaczenie surowych komunikatów walidacji
   backendu (typu „property X should not exist") na czytelne komunikaty PL
   w warstwie `apiFetch`/`onError` — dziś działa jako fallback (lepszy niż
   cichy fail), ale nieczytelny dla właścicielki. Niski priorytet — do
   rozważenia po zamknięciu głównego UAT.
4. Dane testowe z TEGO przebiegu do sprzątnięcia przed Fazą C (dodatkowo do
   list z poprzednich dwóch journali z 2026-07-30):
   - konto klienckie `uat.client.20260730b@example.invalid`
     ("UAT Klientka Kontynuacja");
   - wizyta #212 (Strzyżenie dziecięce chłopcy, 3 sierpnia 2026, `completed`,
     `paidAmount=70`, z opinią 5★).
