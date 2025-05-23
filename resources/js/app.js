import './bootstrap';
import Alpine from 'alpinejs';

window.Alpine = Alpine;

function boot() {
  Alpine.start();
  import('./calendar');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
