# Versum Shell Analysis

Data: 2026-03-22

Status: aktywny dokument architektoniczny dla shared shella panelu

Powiązane dokumenty:
- `docs/VERSUM_SHELL_CONTRACT.md`
- `docs/VERSUM_CLONING_STANDARD.md`
- `docs/VERSUM_CLONE_PROGRESS.md`

## Cel

Ten dokument zapisuje, co zostało ustalone po analizie dumpów, assetów i live DOM-u Versum oraz po porównaniu tych referencji z panelem SalonBW.

Jego rola:
- wyjaśnić źródło driftu wizualnego,
- nazwać realny stack technologiczny Versum,
- ustalić poprawny kierunek dalszych prac,
- zablokować powrót do podejścia screen-by-screen, gdy problem dotyczy wspólnego chrome.

## Najważniejszy wniosek

Większość problemów wizualnych w panelu nie wynika z pojedynczych ekranów, tylko z błędnego podejścia architektonicznego.

Versum działa na jednym, wspólnym szkielecie strony. Moduły nie budują własnych layoutów. Zmieniają tylko:
- aktywną pozycję `mainnav`,
- zawartość `#sidenav`,
- breadcrumbs,
- content wewnątrz `#main-content > .inner`.

W SalonBW przez długi czas współistniały dwa różne systemy shellowe:
1. kanoniczny shell Versum w `/calendar`,
2. odtworzony shell Reactowy w pozostałych modułach.

To był główny root cause rozjazdów.

## Co faktycznie używa Versum

Na podstawie live DOM-u, dumpów i assetów:

### CSS / layout

- Bootstrap `3.3.7`
- klasy bootstrapowe w shellu:
  - `navbar`
  - `navbar-default`
  - `navbar-toggle`
  - `dropdown-toggle`
  - `col-xs-*`
  - `col-sm-*`
- sprite-based icons i klasy legacy typu:
  - `sprite-breadcrumbs_*`
  - `tree`
  - `tree_options`
  - `column_row`

### JavaScript / interakcje

- jQuery-centric runtime
- Rails UJS style traces:
  - `$.rails`
  - `authenticity_token`
  - `csrf-param`
- legacy libs:
  - `select2`
  - `moment`
  - `jquery-ui`
  - `bootstrap-growl`
- routing / interakcje przejściowe:
  - `pjax`
  - `data-push`

### Warstwa aplikacyjna

- server-rendered monolith
- bardzo mocny wspólny template
- nowsze wyspy JS / React tylko jako domieszki:
  - `window.reactLegacyBridge.*`

## Wniosek technologiczny

Versum nie osiąga spójności UX przez nowoczesny component framework.

Versum osiąga spójność UX przez:
- jeden wspólny template contract,
- stabilny DOM shape,
- stabilne klasy shellowe,
- wspólną geometrię layoutu między modułami.

To oznacza, że przy klonowaniu nie należy kopiować samego wyglądu ekranów. Trzeba odtworzyć wspólny contract shella.

## Co zostało potwierdzone w analizie live Versum

Na trasach typu:
- `calendar`
- `customers`
- `products`
- `statistics`

wspólne pozostają:
- `#navbar`
- `#main-container`
- `#sidebar`
- `#mainnav`
- `#sidenav`
- `#main-content`
- `.inner`

Różnią się tylko:
- `body.id`
- aktywny element `mainnav`
- root wrapper i zawartość `#sidenav`
- breadcrumbs items
- page content

To potwierdza, że shell jest w Versum częścią systemu, a nie modułu.

## Najważniejsze źródła driftu w SalonBW

W analizie porównawczej między live Versum a React shellem SalonBW wykryto stałe rozjazdy:

### 1. `body.id`

Versum:
- `logical_statistics`
- `physical_products`

SalonBW historycznie:
- `statistics`
- `products`

To wpływało na selektory CSS i vendorowe reguły layoutowe.

### 2. klasy `mainnav`

Versum:
- `stock`
- `extensions`

SalonBW historycznie:
- `products`
- `extension`

To psuło parity aktywnych stanów i stylowanie z assetów wzorcowych.

### 3. klasy `main-content`

Versum:
- `main-content stock`
- `main-content statistics`

SalonBW historycznie:
- opieranie klas bezpośrednio o klucz modułu, bez vendorowego mapowania

### 4. root `#sidenav`

Versum:
- `div.sidenav#sidenav`

SalonBW historycznie:
- częste dokładanie dodatkowej klasy `secondarynav`

To było lokalnym wynalazkiem, nie częścią contractu.

### 5. secondary nav wrappers

Versum używa stałych wzorców:
- `customers_index`
- `column_row`
- `column_row tree`
- `tree_options`

SalonBW przez długi czas renderował różne wrappery per moduł bez jednego kontraktu.

### 6. breadcrumbs

Versum:
- `.breadcrumbs`

SalonBW historycznie:
- mieszanie `.breadcrumbs` i `ul.breadcrumb`

To powodowało, że nawet przy poprawnym topbarze i sidenavie część modułów nadal odstawała shellowo.

### 7. lokalne shell overrides

Najgorszy wzorzec:
- poprawianie `statistics`, `settings` albo `extension` lokalnym CSS-em, mimo że problem leżał w shared shellu

To dawało mały ROI i wzmacniało dryf.

## Decyzja architektoniczna

### Zasada

Panel SalonBW ma mieć jeden wspólny shell, zgodny z Versum i `/calendar`.

### `calendar` jako referencja

`/calendar` jest u nas najbliżej prawdy, bo używa vendored runtime Versum. Dlatego:
- `calendar` i live Versum są źródłem prawdy dla shella,
- React shell ma zostać doprowadzony do tego samego contractu,
- nie kopiujemy całego runtime `calendar` do wszystkich modułów.

### Czego nie robimy

Nie robimy:
- migracji panelu na Rails / jQuery / Bootstrap JS,
- kopiowania całego vendored runtime poza `calendar`,
- kolejnych mikro-poprawek per ekran, jeśli problem dotyczy shella,
- lokalnych wyjątków typu `secondarynav` i `inner--wide`.

### Co robimy

Robimy:
- jeden `VersumShellContract`,
- jeden `Topbar`,
- jeden `MainNav`,
- jeden `SecondaryNavFrame`,
- jeden `Breadcrumbs` pattern,
- jeden `MainContentFrame`.

Moduł dostarcza tylko:
- aktywny moduł,
- shell profile,
- secondary nav content,
- breadcrumbs items,
- page content.

## Wdrożony kierunek zmian

Na podstawie tej analizy wdrożono:

### Shared shell contract

- `docs/VERSUM_SHELL_CONTRACT.md`
- shell profiles w `navigation.ts`
- vendor-compatible `body.id`
- vendor-compatible klasy `mainnav`
- vendor-compatible klasy `main-content`

### Secondary nav unification

- ujednolicone root wrappery typu:
  - `customers_index`
  - `column_row`
  - `column_row tree`

### Breadcrumb unification

- wspólny komponent `VersumBreadcrumbs`
- migracja z lokalnego `ul.breadcrumb` do wspólnego patternu

### Shared shell CSS

- usunięcie części lokalnych wyjątków
- przeniesienie logiki shellowej do wspólnego CSS

## Reguły dla kolejnych prac

### Reguła 1

Jeśli diff wizualny dotyczy:
- topbara,
- `mainnav`,
- `sidenav`,
- breadcrumbs,
- `main-content`,

to nie poprawiamy pojedynczej strony. Poprawiamy shared shell.

### Reguła 2

Moduł może stylować:
- tabelę,
- formularz,
- akcje,
- content,

ale nie może redefiniować globalnego chrome.

### Reguła 3

Najpierw shell parity, potem content parity.

Jeśli shell jest rozjechany, pixel-diff contentu nie jest wiarygodny.

### Reguła 4

Każda świadoma różnica względem contractu Versum musi być wpisana do:
- `docs/VERSUM_CLONE_PROGRESS.md`

## Rekomendowany workflow na przyszłość

1. Sprawdź, czy problem jest shellowy czy contentowy.
2. Jeśli shellowy:
   - porównaj z live Versum albo `/calendar`
   - popraw shared shell
   - uruchom shell smoke
3. Jeśli contentowy:
   - popraw moduł
   - nie nadpisuj chrome lokalnym CSS-em

## Krótka decyzja końcowa

Tak: większość problemów z designem brała się ze złego podejścia.

Versum ma spójny, wspólny szkielet stron niezależnie od contentu. SalonBW powinien działać dokładnie tak samo: jeden wspólny shell contract, a dynamiczny content dopiero w jego wnętrzu.
