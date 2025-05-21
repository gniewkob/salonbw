import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';

document.addEventListener('DOMContentLoaded', function () {
	const calendarEl = document.getElementById('calendar');
	if (!calendarEl) return;

	const { Calendar, dayGridPlugin, timeGridPlugin, interactionPlugin } = window.FullCalendar;

	const calendar = new Calendar(calendarEl, {
		plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
		initialView: 'timeGridWeek',
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: 'dayGridMonth,timeGridWeek,timeGridDay',
		},
		locale: 'pl',
		events: calendarEl.dataset.eventsUrl,
	});

	calendar.render();
});
