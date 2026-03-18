# Master Plan: Route-Driven UI Kit Delivery

Data: 2026-03-17  
Status: roboczy plan wykonawczy zgodny z aktualnym SOP repo

## 1. Cel

Celem nie jest zbudowanie "design systemu dla design systemu", tylko przyspieszenie dowożenia brakujących tras panelu przez:

1. implementację brakujących flow z dumpa Versum,
2. równoległe wyciąganie z tych flow współdzielonych prymitywów UI,
3. ograniczenie długu legacy CSS dopiero po domknięciu backlogu funkcjonalnego.

Plan obowiązuje przede wszystkim dla `apps/panel`.

## 2. Zasady nadrzędne

Ten plan podlega bezpośrednio pod:

1. `docs/VERSUM_CLONING_STANDARD.md`
2. `Agent.md`
3. `AGENTS.md`
4. `docs/AGENT_EXECUTION_PLAYBOOK.md`

W razie konfliktu wygrywają dokumenty powyżej.

Najważniejsze reguły:

- pracujemy `route-pack first`, nie `component-library first`,
- nie budujemy abstrakcyjnych komponentów bez oparcia w realnych trasach z dumpa,
- Tailwind służy do layoutu i kompozycji,
- kolorystyka, typografia, hierarchia i język UI mają pozostać zgodne z Versum,
- nie refaktorujemy starych modułów masowo, dopóki backlog P1/P2 nie jest domknięty,
- każda świadoma różnica względem Versum musi być opisana w `docs/VERSUM_CLONE_PROGRESS.md`.

## 3. Problem, który rozwiązujemy

Obecny panel ma już szerokie pokrycie P1/P2, ale część tras nadal ma status `invent` zamiast `exact`, a duża część starszego UI jest oparta o legacy markup i klasy.

To powoduje dwa koszty:

- nowe widoki są wdrażane wolniej, bo za każdym razem odtwarzamy podobne struktury,
- unifikacja UI postępuje zbyt wolno, bo brakuje wspólnych prymitywów budowanych na realnych przypadkach.

## 4. Model pracy

### Faza A — Pierwsza paczka tras + pierwsza wersja UI Kit

Nie robimy osobnej fazy "1-2 dni na arsenał".

Zamiast tego:

1. wybieramy małą, spójną paczkę tras P1 z podobnymi wzorcami,
2. analizujemy dump dla każdej trasy,
3. implementujemy te trasy,
4. podczas implementacji wyciągamy współdzielone prymitywy do `apps/panel/src/components/ui/`.

Rekomendowana pierwsza paczka:

- `/settings/payment_configuration`
- `/settings/timetable/employees`
- `/settings/data-protection`

Opcjonalnie jako czwarta trasa:

- `/settings/customer-origins`

To dobra grupa startowa, bo współdzieli:

- formularze,
- sekcje ustawień,
- paski akcji,
- tabele/listy,
- modale i warianty potwierdzeń.

### Faza B — Szybka ofensywa P1/P2

Po ustabilizowaniu pierwszej wersji prymitywów:

1. bierzemy kolejne trasy z `docs/IMPLEMENTATION_MATRIX.md`,
2. składamy je z już istniejących komponentów,
3. dokładamy nowe prymitywy tylko wtedy, gdy wynikają z realnego brakującego wzorca.

Priorytet:

1. P1 z największą wartością biznesową i największym długiem `invent`,
2. potem P2,
3. dopiero na końcu P3 i edge cases.

### Faza C — Zasada skauta

Starszych modułów nie ruszamy hurtowo.

Dopuszczalne są tylko poprawki oportunistyczne:

- bugfix,
- mała zmiana produktowa,
- wymiana lokalnego fragmentu na wspólny komponent, jeśli dzieje się "przy okazji" i nie rozszerza znacząco zakresu zadania.

Zakaz:

- masowe refactory starych modułów w środku ofensywy P1/P2,
- przepisywanie stabilnych ekranów tylko dlatego, że "mogłyby już używać UI Kit".

### Faza D — Wielka unifikacja po domknięciu funkcji

Dopiero po domknięciu backlogu P1/P2 i osiągnięciu stanu operacyjnego:

1. robimy audyt użycia legacy CSS i starych wrapperów,
2. identyfikujemy, które klasy/pliki są nadal żywe,
3. planujemy sprint techniczny na wymianę najcięższych obszarów,
4. dopiero po migracji usuwamy nieużywany legacy CSS.

Nie zakładamy z góry, że każdy plik typu `default.css`, `responsive.css` czy `new-ui.css` zniknie bez wyjątku.
Najpierw dowód z użycia, potem usuwanie.

## 5. Definicja "Panel UI Kit" (Dla SalonBW)

`Panel UI Kit` to zestaw dedykowanych komponentów dla SalonBW. Odchodzimy od nazewnictwa "Versum" w docelowym kodzie (jest to system jednokliencki).

Pierwsza fala komponentów:

- `PanelSection`
- `PanelTable`
- `PanelActionBar`
- `PanelModal`
  _(pozostałe prymitywy wyciągamy organicznie w miarę pojawiania się reguły dwóch)_

**Lokalizacja komponentów (twardy podział):**

- `apps/panel/src/components/shell/` — wyłącznie dla komponentów shell-level (layout, statyczna nawigacja boczna, topbar).
- `apps/panel/src/components/ui/` — wyłącznie dla wyabstrahowanych, reużywalnych prymitywów content-level (tabele, przyciski, modale, sekcje formularzy).

Komponent trafia do wspólnej warstwy dopiero wtedy, gdy spełnia przynajmniej jeden warunek:

- ma co najmniej 2 realne użycia,
- rozwiązuje wspólny wzorzec z paczki tras P1,
- upraszcza routing/adaptację kolejnej trasy bez pogorszenia czytelności.

Komponent nie trafia do wspólnej warstwy, jeśli:

- jest jednorazową wariacją jednego ekranu,
- wymaga zbyt wczesnej abstrakcji,
- ukrywa logikę zależną od pojedynczej trasy.

## 6. Obowiązkowy loop wykonawczy

Dla każdej nowej trasy:

0. **Backend readiness:** zweryfikuj, czy endpointy API i kontrakty DTO dla tej trasy istnieją i są wdrożone (jeśli nie — stwórz je w NestJS przed kodowaniem frontendu).
1. sprawdź status i instrukcję w `docs/IMPLEMENTATION_MATRIX.md`,
2. otwórz screenshot, `page.html`, `network.json` i `responses/` z dumpa,
3. zapisz, które części są `reconstructed`, a które będą `invented`,
4. zaimplementuj trasę w docelowym miejscu `apps/panel/src/pages/...`,
5. wyciągnij wspólny prymityw tylko wtedy, gdy jest potwierdzony przez minimum dwa przypadki (pamiętając o podziale na katalogi `/ui/` i `/shell/`),
6. dodaj standardowe stany: `loading`, `empty`, `error`,
7. **Twardy gate przed PR:** sprawdź, czy z bieżącej paczki tras na pewno wyekstrahowano wspólne prymitywy (nie pomijaj tego kroku pod presją delivery),
8. uruchom lokalny lint i typecheck dla zmienionych pakietów,
9. po deployu wykonaj smoke krytycznego flow.

## 7. Czego nie robimy

- nie zaczynamy od tygodnia budowania abstrakcyjnego UI Kit bez dostarczania tras,
- nie przepisujemy całych stabilnych modułów tylko dla estetyki kodu,
- nie kopiujemy wielkich bloków HTML z dumpa do `pages/`,
- nie zgadujemy backendu tam, gdzie dump nie daje dowodu,
- nie blokujemy dowiezienia funkcji przez polowanie na drobne różnice wizualne.

## 8. Metryka sukcesu

Plan uznajemy za skuteczny, jeśli:

1. liczba tras `invent` w P1 systematycznie spada na rzecz `exact`,
2. kolejne trasy są wdrażane szybciej niż wcześniej,
3. liczba nowych lokalnych, jednorazowych komponentów maleje,
4. wspólne prymitywy w `apps/panel/src/components/ui/` faktycznie są reużywane,
5. nie pogarszamy stabilności produkcyjnej ani smoke testów.

## 9. Rekomendowane pierwsze wykonanie

Najbliższy sprint:

1. przeanalizować dump dla:
    - `/settings/payment_configuration`
    - `/settings/timetable/employees`
    - `/settings/data-protection`
2. ustalić brakujące kontrakty backendowe i miejsca, gdzie UI jest dziś tylko `invent`,
3. wdrożyć te trasy razem z pierwszym zestawem prymitywów:
    - `PanelSection`
    - `PanelActionBar`
    - `PanelTable`
    - `PanelModal`
    - `PanelInput`
4. zaktualizować `docs/VERSUM_CLONE_PROGRESS.md` o świadome delty.

## 10. Krótka decyzja architektoniczna

Kierunek docelowy brzmi:

`build UI Kit through backlog delivery`, nie `build UI Kit before backlog delivery`.

To jest zgodne z aktualnym SOP repo i minimalizuje ryzyko złej abstrakcji.
