# Extension Versum HTML Reference (2026-03-10)

Źródło: live capture z `https://panel.versum.com/salonblackandwhite/extension/` oraz `.../extension/tools/4` (Playwright snapshot + `#main-content.outerHTML`).

## Lista dodatków (`/extension/`)

Referencyjna struktura DOM:

```html
<div class="main-content extensions" id="main-content" role="main">
  <div class="breadcrumbs">
    <ul><li><div class="icon sprite-breadcrumbs_extensions"></div>Dodatki</li></ul>
  </div>
  <div class="inner extensions_boxes">
    <div class="row row_0">
      <div class="col-md-6 reduced-padding">
        <a class="box-link" href="/salonblackandwhite/extension/tools/4">
          <div class="ext-col ext_1 ext_active">
            <div class="ext_image"><svg class="svg-automatic_marketing">...</svg></div>
            <div class="ext_info">
              <div class="name">Marketing Automatyczny</div>
              <div class="short_desc">...</div>
              <div class="more" style="float:left">więcej</div>
              <div class="activate" style="float:right">
                status:
                <div class="icon sprite-active_green"></div>
                <div class="state active">Aktywny</div>
              </div>
              <div class="c"></div>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</div>
```

Kluczowe obserwacje copy-first:
- linki detalu w Versum są numeryczne (`tools/1,3,4,5,6,7,8`);
- karty mają wrapper `a.box-link`, grid jest bootstrapowy (`row` + `col-md-6 reduced-padding`);
- status ma literalny prefiks `status:` oraz `sprite-active_green` dla aktywnego dodatku.

## Detal dodatku (`/extension/tools/4`)

Referencyjna struktura DOM:

```html
<div class="main-content extensions" id="main-content" role="main">
  <div class="breadcrumbs">... / Marketing Automatyczny</div>
  <div class="inner extension_info container-fluid">
    <div class="row">
      <div class="col-sm-6 logo_with_actions">
        <div class="row">
          <div class="col-xs-3 extension_icon"><svg class="svg-automatic_marketing">...</svg></div>
          <div class="col-xs-9">
            <div class="ext_title">Marketing Automatyczny</div>
            <div class="ext_price_title">30 dni...<strong>69,00 zł</strong>/ miesiąc</div>
            <div class="row vertical-align status-info">
              <div class="col-xs-6">status: <div class="icon sprite-active_green"></div><div class="state active">Aktywny</div></div>
              <div class="col-xs-6"><div class="update_extension"><a class="disable_extension_link" href="/.../disable">Wyłącz dodatek</a></div></div>
            </div>
          </div>
        </div>
        <div class="desc"><p>... <a data-more-link="true" href="#">czytaj więcej »</a></p></div>
        <a class="button" href="/settings/marketing_creator/calendar"><div class="icon sprite-settings_blue"></div>ustawienia dodatku</a>
        <h2>Dostępność</h2>
        <table class="table-bordered availability-table no-hover">...</table>
      </div>
      <div class="col-sm-6">
        <div class="slider"><div id="gallery">...</div></div>
      </div>
    </div>
  </div>
</div>
```

Kluczowe obserwacje copy-first:
- tabela dostępności używa ikon obrazkowych `available-*.png` (nie znaków tekstowych);
- prawa kolumna zawiera galerię screenów dodatku (`slider`, `#gallery`, `gthumbnail`).
