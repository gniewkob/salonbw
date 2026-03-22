# Versum Shell Contract

Ten dokument definiuje kanoniczny shell panelu SalonBW. Jedyną referencją są:
- live Versum
- vendored runtime `/calendar`

## Cel

Panel ma używać jednego wspólnego shella niezależnie od modułu. Moduły mogą zmieniać tylko:
- aktywny element `mainnav`
- zawartość `#sidenav`
- breadcrumbs content
- content wewnątrz `#main-content > .inner`

## Kanoniczny DOM

### Top level

```html
<div id="navbar" class="navbar navbar-default navbar-static-top d-flex"></div>
<div id="main-container" class="main-container">
  <div id="sidebar" class="sidebar hidden-print">
    <div id="mainnav" class="mainnav"></div>
    <div id="sidenav" class="sidenav"></div>
  </div>
  <div id="main-content" class="main-content <module-class>">
    <div class="breadcrumbs"></div>
    <div class="inner"></div>
  </div>
</div>
```

## Wymagane klasy shellowe

### `body.id`

- `calendar`
- `customers`
- `physical_products`
- `logical_statistics`
- `communication`
- `services`
- `settings`
- `extension`

### `mainnav` li classes

- `calendar`
- `customers`
- `stock`
- `statistics`
- `communication`
- `services`
- `settings`
- `extensions`

### `main-content` classes

- `calendar`
- `customers`
- `stock`
- `statistics`
- `communication`
- `services`
- `settings`
- `extensions`

## Warianty `#sidenav`

### `calendar`
- runtime vendorowy

### `customers`
- root: `customers_index`
- wewnątrz `column_row`

### `products`
- root: `column_row`
- wewnątrz `tree`
- opcjonalnie `tree_options`

### `tree`
- root: `column_row tree`
- używany przez statystyki

### `list`
- root: `column_row`
- używany przez settings, communication, services, extension

## Breadcrumbs

Shellowy pattern:

```html
<div class="breadcrumbs" e2e-breadcrumbs="">
  <ul>
    <li>
      <div class="icon sprite-breadcrumbs_*"></div>
      <a href="...">Sekcja</a>
    </li>
    <li>
      <span> / </span>
      Widok
    </li>
  </ul>
</div>
```

## Czego moduł nie może zmieniać

Moduł nie może redefiniować:
- `#navbar`
- `#mainnav`
- `#sidenav`
- `.breadcrumbs`
- `#main-content`
- `.inner`

## Dozwolone różnice

Dozwolone są tylko różnice wynikające z danych lub funkcjonalności modułu:
- liczba elementów w `#sidenav`
- etykiety i aktywne stany
- breadcrumbs items
- zawartość `inner`

## Zakazane praktyki

- dokładanie klasy `secondarynav` do `#sidenav`
- dokładanie `inner--wide` bez jawnego shell contractu
- używanie `ul.breadcrumb` jako lokalnego substytutu `.breadcrumbs`
- lokalne CSS overrides modułów modyfikujące globalny chrome
