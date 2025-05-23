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
 * Bootstrappujemy Alpine dopiero po DOMContentLoaded,
 * a dopiero potem — calendar.js. W ten sposób mamy pewność,
 * że każdy <div x-data> już istnieje, zanim Alpine zacznie go skanować,
 * a FullCalendar uruchomi się dopiero po starcie Alpine.
 */
function boot() {
    Alpine.start();
    import('./calendar');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
