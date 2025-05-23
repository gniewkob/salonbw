/* resources/js/app.js ----------------------------------------------- */
import './bootstrap';
import 'vite/modulepreload-polyfill';     // (jeśli Twój bundler to dodaje)

import Alpine from 'alpinejs';
import { Calendar }          from '@fullcalendar/core';
import dayGridPlugin         from '@fullcalendar/daygrid';
import timeGridPlugin        from '@fullcalendar/timegrid';
import interactionPlugin     from '@fullcalendar/interaction';

/* — Alpine — */
window.Alpine = Alpine;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Alpine.start());
} else {
    Alpine.start();
}

/* — FullCalendar globalnie, żeby blade miał do niego dostęp — */
window.FullCalendar = { Calendar, dayGridPlugin, timeGridPlugin, interactionPlugin };

/* ❶  Import KALENDARZA **po** starcie Alpine
   - dynamicznie, aby kod wykonał się po przejściu powyższych linii.   */
import('./calendar');
