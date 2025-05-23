/* ------------------------------------------------------------------
 |  Bootstrap, Axios, Inertia… (jeśli używasz)
 * ------------------------------------------------------------------ */
import './bootstrap';

/* ------------------------------------------------------------------
 |  Alpine JS
 * ------------------------------------------------------------------ */
import Alpine from 'alpinejs';

window.Alpine = Alpine;

/**
 *  Uruchamiamy Alpine dopiero gdy cały dokument jest już sparsowany.
 *  Dzięki temu każdy element z x-data obecny w widoku Blade’a zostanie
 *  automatycznie zainicjalizowany — bez ręcznych hacków z initTree().
 */
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => Alpine.start());
} else {
	Alpine.start();   // fallback (w razie gdy skrypt ładuje się po DOM-ie)
}

/* ------------------------------------------------------------------
 |  Skrypty specyficzne dla konkretnych podstron
 * ------------------------------------------------------------------ */
import './calendar';
