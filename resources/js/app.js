/* resources/js/app.js ----------------------------------------------------- */
import './bootstrap';
import './calendar';

import Alpine from 'alpinejs';

/* FullCalendar zostaje tak jak było – wystawiamy go w global */
import { Calendar }          from '@fullcalendar/core';
import dayGridPlugin         from '@fullcalendar/daygrid';
import timeGridPlugin        from '@fullcalendar/timegrid';
import interactionPlugin     from '@fullcalendar/interaction';

window.FullCalendar = {
	Calendar,
	dayGridPlugin,
	timeGridPlugin,
	interactionPlugin,
};

/* udostępniamy Alpine globalnie */
window.Alpine = Alpine;

/* ✨ startujemy PO zbudowaniu całego dokumentu */
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => Alpine.start());
} else {
	// (gdyby skrypt był w <body> z atrybutem defer)
	Alpine.start();
}
