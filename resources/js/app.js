import './bootstrap';          // Twój plik Inertia/Axios itp.

import Alpine from 'alpinejs';
window.Alpine = Alpine;
Alpine.start();                //  ➜ Alpine uruchamiamy **raz**

/*  ----  reszta skryptów dla konkret-nych stron  ----  */
import './calendar';           // kalendarz ładuje się dopiero TERAZ, już po Alpine
