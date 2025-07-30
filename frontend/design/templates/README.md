# Versum UI Templates

Kompletny zestaw templatek UI dla systemu Versum, przygotowany do odtworzenia pełnego wyglądu aplikacji.

## 📁 Struktura plików

```
templates/
├── assets/
│   ├── styles.css          # Główne style CSS
│   ├── script.js           # JavaScript z funkcjami UI
│   └── svg-sprites.html    # SVG ikony i sprite'y
├── customers_template_optimized.html    # Przykład zoptymalizowanej template
├── customers_template.html              # Template klientów
├── products_template.html               # Template produktów
├── deliveries_template.html             # Template dostaw
├── use_template.html                    # Template zużycia
├── orders_template.html                 # Template zamówień
├── services_template.html               # Template usług
├── communication_template.html          # Template komunikacji
├── messages_template.html               # Template wiadomości
├── marketing_template.html              # Template marketingu
├── opinions_cancel_template.html        # Template anulowania opinii
├── opinions_moderation_template.html    # Template moderacji opinii
├── opinions_services_template.html      # Template opinii o usługach
├── opinions_employees_template.html     # Template opinii o pracownikach
├── opinions_booksy_template.html        # Template opinii Booksy
├── settings_categories_template.html    # Template kategorii ustawień
├── settings_employees_template.html     # Template pracowników
├── settings_service_variants_template.html  # Template wariantów usług
├── settings_payment_methods_template.html   # Template metod płatności
├── settings_customer_groups_template.html   # Template grup klientów
├── calendar_template.html               # Template kalendarza
├── timetable_employees_template.html    # Template harmonogramu pracowników
└── README.md                           # Ten plik
```

## 🎨 Komponenty UI

### Kolory

- **Primary**: `#25B4C1` (niebieski)
- **Success**: `#28a745` (zielony)
- **Warning**: `#ffc107` (żółty)
- **Danger**: `#dc3545` (czerwony)
- **Gray**: `#6c757d` (szary)

### Typografia

- **Font**: Open Sans
- **Rozmiary**: 14px (base), 16px, 18px, 20px
- **Wagi**: 400 (normal), 600 (semibold), 700 (bold)

### Komponenty

- **Cards**: Białe karty z cieniem
- **Buttons**: Przyciski z hover effects
- **Tables**: Tabele z sortowaniem
- **Forms**: Formularze z walidacją
- **Modals**: Modalne okna
- **Badges**: Etykiety statusu
- **Navigation**: Nawigacja z ikonami

## 🚀 Jak używać

### 1. Podstawowa struktura HTML

```html
<!DOCTYPE html>
<html lang="pl">
    <head>
        <meta charset="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>Tytuł strony - Versum</title>

        <!-- Local CSS -->
        <link href="assets/styles.css" rel="stylesheet" />

        <!-- Google Fonts -->
        <link
            href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700&subset=latin,latin-ext"
            rel="stylesheet"
        />
    </head>
    <body>
        <!-- SVG Sprites -->
        <div id="svg-sprites" style="display: none;"></div>

        <!-- Navigation -->
        <nav class="navbar">
            <!-- Zawartość nawigacji -->
        </nav>

        <!-- Main Content -->
        <div class="main-content">
            <div class="container">
                <!-- Zawartość strony -->
            </div>
        </div>

        <!-- Local JavaScript -->
        <script src="assets/script.js"></script>

        <!-- Load SVG sprites -->
        <script>
            fetch('assets/svg-sprites.html')
                .then((response) => response.text())
                .then((html) => {
                    document.getElementById('svg-sprites').innerHTML = html;
                });
        </script>
    </body>
</html>
```

### 2. Używanie ikon SVG

```html
<svg class="svg-icon">
    <use xlink:href="#svg-logo"></use>
</svg>
```

### 3. Tworzenie tabel z sortowaniem

```html
<table class="table">
    <thead>
        <tr>
            <th data-sort="name">Nazwa</th>
            <th data-sort="date">Data</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td data-name="Przykład">Przykład</td>
            <td data-date="2024-01-15">15.01.2024</td>
        </tr>
    </tbody>
</table>
```

### 4. Tworzenie formularzy

```html
<form id="myForm">
    <div class="form-group">
        <label class="form-label">Pole</label>
        <input type="text" class="form-control" name="field" required />
    </div>
    <button type="submit" class="btn btn-primary">Zapisz</button>
</form>
```

### 5. Tworzenie modalnych okien

```html
<!-- Trigger -->
<button class="btn btn-primary" data-modal="myModal">Otwórz modal</button>

<!-- Modal -->
<div id="myModal" class="modal">
    <div class="modal-content">
        <h3>Tytuł modala</h3>
        <p>Zawartość modala</p>
        <button
            class="btn btn-secondary"
            onclick="VersumUI.closeModal('myModal')"
        >
            Zamknij
        </button>
    </div>
</div>
```

## 🔧 Funkcje JavaScript

### VersumUI.showNotification(message, type)

Wyświetla powiadomienie

```javascript
VersumUI.showNotification('Operacja zakończona pomyślnie', 'success');
```

### VersumUI.formatDate(date)

Formatuje datę

```javascript
const formattedDate = VersumUI.formatDate('2024-01-15'); // "15.01.2024"
```

### VersumUI.formatCurrency(amount)

Formatuje walutę

```javascript
const formattedPrice = VersumUI.formatCurrency(123.45); // "123,45 zł"
```

### VersumUI.validateEmail(email)

Waliduje email

```javascript
const isValid = VersumUI.validateEmail('test@example.com'); // true
```

## 📱 Responsywność

Wszystkie templateki są w pełni responsywne i działają na:

- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🎯 Najlepsze praktyki

1. **Używaj lokalnych zasobów** - wszystkie pliki CSS, JS i SVG są lokalne
2. **Zachowaj strukturę** - używaj klas CSS z pliku `styles.css`
3. **Ikony SVG** - używaj sprite'ów z `svg-sprites.html`
4. **JavaScript** - wykorzystuj funkcje z `script.js`
5. **Responsywność** - testuj na różnych urządzeniach

## 🔄 Modyfikacja templatek

Aby zmodyfikować templateki:

1. **Zmiana kolorów**: Edytuj zmienne CSS w `assets/styles.css`
2. **Dodanie ikon**: Dodaj nowe symbole do `assets/svg-sprites.html`
3. **Nowe funkcje**: Rozszerz obiekt `VersumUI` w `assets/script.js`
4. **Nowe style**: Dodaj klasy CSS do `assets/styles.css`

## 📞 Wsparcie

W przypadku problemów:

1. Sprawdź konsolę przeglądarki pod kątem błędów JavaScript
2. Upewnij się, że wszystkie pliki assets są dostępne
3. Sprawdź, czy SVG sprite'y zostały poprawnie załadowane

## 📝 Licencja

Te templateki są przeznaczone do odtworzenia wyglądu systemu Versum i mogą być używane do celów edukacyjnych i rozwojowych.
