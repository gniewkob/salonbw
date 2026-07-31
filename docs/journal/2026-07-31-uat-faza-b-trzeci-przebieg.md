# UAT Fazy B — trzeci przebieg (magazyn/statystyki/ustawienia) + bug pulpitu

- **Data:** 2026-07-31
- **Agent:** Claude (kontynuacja „przejdź sam i skoryguj")
- **Commit:** `1b64834e`
- **PR:** brak (bezpośredni push na `master`)

## Finding

Dokończenie `docs/UAT_PLAN.md`: §1.8 (magazyn — niskie stany), §1.9
(statystyki/raport finansowy, eksport), §1.10 (ustawienia). Przy okazji
domknięta jedna otwarta pozycja z poprzedniego przebiegu: potwierdzenie, że
ocena 5★ klientki (`uat.client.20260730b@example.invalid`) faktycznie
pojawia się w `/reviews` administratorki — **potwierdzone, widoczna
poprawnie** (Aleksandra Bodora / UAT Klientka Kontynuacja / 5 / „Bardzo
profesjonalna obsługa, polecam!").

**🔴 Realny bug znaleziony i naprawiony: baner „niskim stanem magazynowym"
na pulpicie zaniżał liczbę produktów wymagających uwagi.** Backend rozdziela
`lowStockCount` (stan >0, ale poniżej minimum) i `outOfStockCount` (stan=0)
jako DWIE rozłączne kategorie (`stock-alerts.service.ts`) — strona
`/stock-alerts` poprawnie pokazuje obie („produkty: 12 | niski stan: 4 | brak
na stanie: 4", 8 wierszy łącznie). Widżet na pulpicie (`AdminDashboard.tsx`)
czytał WYŁĄCZNIE `lowStockCount` — pokazywał „4" zamiast realnych 8 produktów
wymagających działania, i w skrajnym przypadku (wszystkie problematyczne
produkty całkowicie wyprzedane, żaden tylko „niski") **baner znikałby
całkowicie**, mimo pustego magazynu. Naprawione: warunek wyświetlania i
liczba w odznace uwzględniają sumę obu kategorii, treść wyraźnie rozróżnia
„brak na stanie" od „na wyczerpaniu".

Reszta sekcji bez zastrzeżeń:
- **§1.8 magazyn:** `/stock-alerts` poprawnie liczy i listuje (link „dostawa"
  per wiersz do `/deliveries/new`), eksport Excel dostępny.
- **§1.9 statystyki:** raport finansowy `/statistics` renderuje się czysto,
  eksport CSV („pobierz raport Excel" — realnie generuje `.csv`, otwiera się
  poprawnie w Excelu, nazwa przycisku myląca ale nieblokująca — nie
  poprawiane, kosmetyka); `/statistics/services` i `/statistics/commissions`
  — zero błędów konsoli. **Nuans dot. już udokumentowanego findingu #4**
  (z pierwszego przebiegu): figury przychodu są filtrowane po
  `appointment.startTime` (data planowanej wizyty), NIE po dacie
  finalizacji/zapłaty — wizyta #212 (finalizowana dziś, zapłacona 70 zł
  gotówką, ale zaplanowana na przyszły poniedziałek 3 sierpnia po
  reschedule) nie wchodzi do „Utarg dziś"/„Utarg ten tydzień", mimo że
  „Saldo gotówki w kasie" (widoczne osobno, najwyraźniej suma bez filtra
  daty) już ją uwzględnia — 70 zł. To rozbieżność wynikająca z tego samego
  obszaru co finding #4, nie osobny bug — dopisane jako kontekst do przyszłej
  naprawy `statistics.service.ts`, nie naprawiane teraz.
- **§1.10 ustawienia:** `/settings`, `/settings/online-booking`, `/services`
  — wszystkie czyste, zero błędów konsoli.

## Change

- `apps/panel/src/components/dashboard/AdminDashboard.tsx` (+
  `__tests__/AdminDashboard.test.tsx`) — baner niskiego stanu uwzględnia
  `outOfStockCount` obok `lowStockCount`.

## Validation

- Panel: `pnpm test` 353/353 (było 352, +1), `tsc` czysty, `eslint --fix` bez
  zmian.
- Fix zweryfikowany rytuałem fail-first: `git stash` na samej naprawie →
  RED (dokładnie na nowym teście regresyjnym „wszystkie problematyczne
  produkty wyprzedane, zero low-stock" — dokładnie przypadek, który wcześniej
  chowałby baner całkowicie) → przywrócenie → GREEN.
- CI: zielone.
- Deploy: automatyczny push-deploy (run `30619335781`, 3m20s) — success.
- Live: pulpit pokazuje **„8 Produkty z niskim stanem magazynowym" / „4
  produktów brak na stanie, 4 na wyczerpaniu"** (było: „4" bez rozróżnienia)
  — potwierdzone bezpośrednio po deployu.

## Rollout

Na `master`, wdrożone na produkcję. Deploy code: `1b64834e`.

## Follow-up

1. **`docs/UAT_PLAN.md` §4 (kryterium zakończenia UAT) — w praktyce
   spełnione dla ścieżek §1 i §2** (wszystkie sekcje przejrzane w trzech
   przebiegach z 2026-07-30/31); zero otwartych 🔴 poza już udokumentowanym
   i świadomie odłożonym findingiem #4 (atrybucja `paidAmount` w raporcie
   finansowym). Formalny wpis „UAT zakończony" i decyzja o przejściu do
   Fazy C — do właściciela.
2. Finding #4 (`statistics.service.ts`) zostaje jako osobne zadanie —
   dotyczy zarówno mylącej atrybucji `paidAmount` jako czystego przychodu
   usługowego, jak i (nowo zaobserwowanej dziś) niespójności między
   `appointment.startTime`-owym filtrowaniem utargu a bezterminowym saldem
   gotówki w kasie.
3. Przed Fazą C posprzątać dane testowe z WSZYSTKICH CZTERECH przebiegów UAT
   z 2026-07-30/31 — pełne listy w journalach:
   `2026-07-30-uat-faza-b-pierwszy-przebieg.md`,
   `2026-07-30-uat-faza-b-receptura-i-deploy-incydent.md`,
   `2026-07-30-uat-faza-b-drugi-przebieg.md`, ten plik (brak nowych danych
   testowych w tym przebiegu — tylko odczyty i jedna korekta kodu).
