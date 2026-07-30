# UAT Fazy B — pierwszy przebieg (właścicielka + klientka + §2a)

- **Data:** 2026-07-30
- **Agent:** Claude (na wyraźne polecenie właściciela: „przejdź sam i skoryguj")
- **Commit(y):** `c432ae4a`, `e05be6fc`
- **PR:** brak (bezpośredni push na `master`, zgodnie z dotychczasowym wzorcem repo)

## Finding

Pierwszy realny przebieg `docs/UAT_PLAN.md` na produkcji (`panel.salon-bw.pl`),
sterowany przez Playwright (rozszerzenie Chrome niedostępne w tym środowisku).
Przejście: §1 (ścieżka właścicielki — pulpit, kalendarz, szczegóły wizyty),
§1.6/§2a (pełna finalizacja z dodatkową usługą, sprzedażą produktu, zużytym
materiałem, rabatem, napiwkiem, zaleceniami, notatką wewnętrzną, receptura —
zweryfikowana w 9 miejscach jak wymaga §2a), §2 (rejestracja + rezerwacja
online na widoku mobilnym 390×844).

Znalezione i naprawione w trakcie:

1. **🔴 CSP blokował Sentry frontendu na każdej stronie panelu.**
   `connect-src` w `apps/panel/next.config.mjs` nie zawierał
   `*.ingest.de.sentry.io` (region UE, z którego faktycznie korzysta DSN) —
   tylko `.ingest.sentry.io`/`.ingest.us.sentry.io`. Monitoring błędów
   frontendu był realnie martwy na produkcji mimo że E2.5 było oznaczone jako
   zamknięte 2026-07-29 (tamta weryfikacja dotyczyła tylko backendu).
2. **🔴 Podwójne liczenie sprzedaży produktów w statystykach klienta.**
   `customer-statistics.service.ts` sumował `productSpent`/`favoriteProducts`
   z DWÓCH tabel jednocześnie: legacy `product_sales` ORAZ aktualnego
   `warehouse_sales`/`warehouse_sale_items` — obie zapisywane dla tej samej
   sprzedaży przez `retail.service.ts createSale()` (dual-write dla
   wstecznej kompatybilności). Na żywo: sprzedano 1 szt. za 35 zł, panel
   pokazywał `favoriteProducts.count: 2`, `productSpent: 70`,
   `totalSpent: 255` zamiast `220`. Naprawione: źródła wzajemnie się
   wykluczają (preferuj `warehouse_sales`, fallback na `product_sales` tylko
   gdy `warehouse_sales` nie istnieje) — istniejące testy jednoźródłowe bez
   zmian, dane produkcyjne (obie tabele) już nie dublują.
3. **🔴 „Płatność: nieopłacona" mimo zapłaconej, zakończonej wizyty.**
   Dwuwarstwowy bug: (a) `AppointmentDrawer.tsx` czytał
   `appointment.paymentStatus` — pole, którego **backend nigdze w kodzie nie
   ustawia** (potwierdzone grepem całego `src/`), więc zawsze spadało na
   twardy fallback `'nieopłacona'`; (b) po naprawieniu (a) na `paidAmount`,
   live-weryfikacja po deployu POKAZAŁA TEN SAM BŁĄD — bo `calendar.tsx`
   buduje obiekt `Appointment` przekazywany do drawera ręcznie z
   `CalendarEvent` (`appointmentsById` useMemo) i **nie kopiował
   `paidAmount`/`paymentMethod`** ze źródłowego eventu, mimo że sam kafelek
   kalendarza poprawnie czyta te pola i renderuje „Zapłacono 185 zł · karta".
   Naprawione oba miejsca w dwóch commitach (drugi jako bezpośredni
   follow-up po live-weryfikacji wykazała że pierwszy fix był niewystarczający).
4. **🟡 (nienaprawione, udokumentowane) Głębszy problem finansowy:**
   `statistics.service.ts` (`resolveAppointmentPrice`) i częściowo
   `customer-statistics.service.ts` traktują `appointment.paidAmount` jako
   czysty przychód usługowy, mimo że `paidAmount` to PEŁNA kwota transakcji
   (usługi + dodatkowe usługi + produkty − rabat + napiwek). Skutek na żywo:
   „Sprzedaż usług brutto" w raporcie finansowym pokazała 185,00 zł zamiast
   130,00 zł (70+70−10), a „Utarg dziś" 220,00 zł zamiast poprawnych
   165,00 zł (do zapłaty) — produkt (35 zł) i napiwek (20 zł) są de facto
   wliczane w „usługi" oprócz własnych, osobnych linii. Poprawny wzór
   (wyprowadzony wprost z arytmetyki samego modala finalizacji, którą
   zweryfikowano na żywo): `serviceRevenue = paidAmount − tipAmount −
   productSalesTegoTerminu`. Naprawa wymaga zmian w kilku miejscach
   `statistics.service.ts` (dashboard, wykres przychodów, ranking
   pracowników) z pełnym pokryciem testami — świadomie odłożone jako osobne
   zadanie zamiast pospiesznej poprawki silnika raportów finansowych bez
   przeglądu.
5. **🟡 (nienaprawione) Race przy szybkich kolejnych kliknięciach dwóch
   checkboxów zgód przy rejestracji** — błąd walidacji nie czyścił się
   reaktywnie przy bardzo szybkim, zautomatyzowanym kliknięciu RODO+Regulamin
   pod rząd; działało poprawnie przy pojedynczych, odseparowanych kliknięciach
   (typowe dla realnego użytkownika). Niska szkodliwość, niereprodukowalne
   ręcznie — do obserwacji, nie do natychmiastowej naprawy.
6. **🟡 (nienaprawione) Baner instalacji PWA** na `/auth/register` potrafi
   wizualnie zasłonić drugi checkbox zgody (Regulamin) na pierwszym ekranie
   mobilnym, dopóki użytkownik go nie odrzuci („Później").
7. **🔴 Deploy (MyDevil) padał dwukrotnie** po wcześniejszej (tej samej sesji)
   rotacji hasła bazy PostgreSQL — `password authentication failed`. Root
   cause: środowisko GitHub `production` ma **0 sekretów**
   (`total_count: 0`), a środowisko `staging` posiadało
   `DATABASE_URL`/`PGPASSWORD`/`MYDEVIL_DB_PASSWORD` z **poprzedniej**
   rotacji (2026-07-29) — dokładnie znany, udokumentowany gotcha
   `deploy-env-binds-staging-vars-on-prod` (push-triggered deploy zawsze
   czyta sekrety środowiska `staging`, niezależnie od gałęzi). Naprawione:
   zaktualizowano `DATABASE_URL`/`PGPASSWORD`/`MYDEVIL_DB_PASSWORD` w
   środowisku `staging` na dzisiejsze, prawidłowe wartości (odczytane z już
   poprawnie zrotowanego produkcyjnego `.env`, nigdy nie wypisane w
   widocznym outpucie). Potwierdzone: kolejny **push-triggered** (automatyczny)
   deploy zadziałał poprawnie bez ręcznej interwencji.

## Change

- `apps/panel/next.config.mjs` — dodano `https://*.ingest.de.sentry.io` do
  `connect-src`.
- `backend/salonbw-backend/src/customers/customer-statistics.service.ts` (+
  `.spec.ts`) — `product_sales`/`warehouse_sales` wzajemnie wykluczające się
  zamiast sumowanych.
- `apps/panel/src/components/calendar/AppointmentDrawer.tsx` (+
  `__tests__/appointmentDrawer.test.tsx`) — etykieta „Płatność" liczona z
  `paidAmount`.
- `apps/panel/src/pages/calendar.tsx` — `appointmentsById` przekazuje teraz
  `paidAmount`/`paymentMethod` z `CalendarEvent` do `Appointment`.
- Środowisko GitHub `staging`: 3 sekrety (`DATABASE_URL`, `PGPASSWORD`,
  `MYDEVIL_DB_PASSWORD`) zsynchronizowane z aktualnym hasłem produkcyjnym.

## Validation

- Backend: `pnpm test` 333/333 (było 332, +1 nowy test regresyjny), `tsc`
  czysty, `eslint` scoped na zmienione pliki bez błędów (4 przedistniejące
  ostrzeżenia bez zmian).
- Panel: `pnpm test` 349/349 (było 347, +2 nowe testy regresyjne), `tsc`
  czysty, `eslint src --fix` bez zmian.
- Oba bugi frontendowe zweryfikowane rytuałem fail-first (`git stash` na
  pliku źródłowym → RED → przywrócenie → GREEN) przed commitem.
- CI na obu commitach: zielone.
- Deploy: `target=api` (run `30571887173`, `environment=production` jawnie),
  `target=panel` (run `30573879194`), oraz **automatyczny push-deploy**
  (run `30577418669`) po naprawie sekretów `staging` — wszystkie `success`.
- Live po deployu: `/healthz` → `status: ok`; konsola panelu → **0 błędów**
  (było 2 błędy CSP na każdej stronie); „Łączne wydatki" na karcie klienta →
  **220,00 PLN** (poprawne, było 255,00 PLN) — potwierdza backend fix na
  żywo.
- „Płatność: opłacona" na drawerze wizyty #182 — **zweryfikowane wizualnie
  na żywo** (2026-07-30, po ustąpieniu CAPTCHA): kafelek kalendarza →
  „Otwórz szczegóły" → drawer pokazuje „Status: Zakończona" / „Płatność:
  opłacona". Fix `e05be6fc` potwierdzony end-to-end (kod + testy + UI).

## Rollout

Wszystkie zmiany na `master`, wdrożone na produkcję. Deploy code:
`c432ae4a`, `e05be6fc`. Sekrety `staging` zsynchronizowane — kolejne
zwykłe push-deploye powinny już działać bez ręcznej interwencji.

## Follow-up

1. ~~Priorytet: przy najbliższej sesji zalogować się jako admin i wizualnie
   potwierdzić „Płatność: opłacona"~~ — **ZROBIONE 2026-07-30**, patrz
   Validation wyżej.
2. Rozważyć naprawę finding #4 (paidAmount ≠ czysty przychód usługowy w
   `statistics.service.ts`) jako osobne, w pełni przetestowane zadanie —
   dotyczy realnych liczb w codziennym raporcie finansowym właścicielki.
3. Dane testowe utworzone podczas tego przebiegu UAT (do sprzątnięcia przed
   Fazą C — importem danych):
   - konto klienckie `uat.client.20260730@example.invalid`
     ("UAT Klientka Testowa");
   - rezerwacja #211 (Strzyżenie dziecięce chłopcy, 1 sierpnia 2026 12:00,
     `online_pending`);
   - wizyta #182 (SYNTHETIC Klient 02) zmieniona na `completed`,
     `paidAmount=185`, z dodatkową usługą/sprzedażą/materiałem/formułą/
     notatkami — dane syntetyczne, nieszkodliwe, ale nie odzwierciedlają już
     czystego stanu z E4.2.
4. Reszta `docs/UAT_PLAN.md` (§1.7–§1.10 karta klientki/magazyn/statystyki/
   ustawienia poza tym co przetestowano w §2a, cała ścieżka klientki §2
   poza rejestracją+rezerwacją: wiadomości, ocena, zgody, akceptacja
   przełożonego terminu) — nieprzetestowana w tym przebiegu, do kontynuacji.
5. `docs/PROJECT_STATE.md` zaktualizowany — patrz commit tego wpisu.
