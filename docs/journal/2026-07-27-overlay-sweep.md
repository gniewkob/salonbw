# Sweep warstwy nakładek (modale) + zakres jednoosobowy

- **Data:** 2026-07-27
- **Agent:** Claude Opus 5
- **Commity:** `27d96b9`, `0e0f8de`, `7f7efe0`, `88a792c`
- **PR:** #1466 (zmergowany → master `7a71c19`)

## Finding
Sweep wizualny robił zrzuty wyłącznie stron w spoczynku, więc **cała warstwa
nakładek (33 komponenty modal/drawer/panel) nigdy nie trafiła na żaden zrzut** —
mimo że to w modalach żyły najgorsze bugi projektu (2026-07-06: modale
renderowane niewidzialnie; 07-08: cztery kolejne tej samej klasy).
Dodatkowo sweep asertuje tylko żywotność (brak „Application error", brak „Nie
masz uprawnień", brak przekierowania do logowania, niepuste `body`), a regresja
E2E to 21 testów read-only — **ciągłości międzymodułowej nie sprawdza nic**.

## Change
- `visual-sweep.spec.ts`: nowy blok `overlays` otwierający modale używane
  codziennie w jednoosobowym salonie (drawer wizyty, nowa klientka/produkt/
  usługa, kategorie usług i produktów, panel szczegółów wizyty klientki) na obu
  viewportach. Ściśle niemutujący: otwiera → zrzut → Escape.
- `0e0f8de`: po pierwszym przebiegu okazało się, że `settle()` nie czeka na
  animacje CSS — modale łapały się w trakcie fade-in i wyglądały na wyblakłe
  (o mało nie zgłoszono fałszywego „za niski kontrast"). Dodane czekanie na
  `[role="dialog"]` + 600 ms.
- `7f7efe0`: numeracja pól klienta miała lukę (1,2,3,4,5,**7**…21) → ciągłe 1–20.
- `88a792c`: ETAP 3a w planie — brak jakiejkolwiek kategorii produktów.
- Zapisana decyzja ownera: zakres = jeden salon, jedna osoba (admin) → rola
  „pracownik" wypada z bramki GO.

## Validation
`tsc --noEmit` czyste; Playwright zbiera 4 nowe testy; panel **346/346**;
CI na PR #1466 **11/11 zielone**; sweep run `30306818237` = success,
**172 zrzuty** (było 164), w tym 8 zrzutów modali.

## Rollout
Master `7a71c19`, deploy automatyczny po merge. Sweep uruchomiony na tym SHA.

## Znaleziska ze zrzutów modali
- 🟡 Kategorie produktów: **„Brak kategorii."** → ETAP 3a.
- 🟡 Drawer „Nowa wizyta": CTA „UTWÓRZ WIZYTĘ" wygląda na przycięty dolną
  krawędzią modala przy wysokości 768 px — **do potwierdzenia** po poprawce
  animacji.
- 🎨 Natywne pola dat w modalach: format US `mm/dd/yyyy` (locale przeglądarki).
- Pominięte przez best-effort: `modal-new-service` (trigger „dodaj usługę" to
  prawdopodobnie link, nie `button`), kategorie na mobile (schowane w drawerze
  nawigacji), panel wizyty klientki (konto E2E nie ma wizyt).

## Follow-up
Ponowny dispatch sweepa z poprawką animacji → rzetelna ocena kontrastu i
przycięcia CTA; naprawić selektor „dodaj usługę". Potem faza A: migracja
cleanup E4.1+E4.2.
