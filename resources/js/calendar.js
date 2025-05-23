import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';

document.addEventListener('DOMContentLoaded', function () {
	const calendarEl = document.getElementById('calendar');
	const eventsUrl = calendarEl.dataset.eventsUrl;
	const updateUrl = calendarEl.dataset.updateUrl; // <-- dodane

	const calendar = new window.FullCalendar.Calendar(calendarEl, {
		plugins: [window.FullCalendar.dayGridPlugin, window.FullCalendar.interactionPlugin],
		initialView: 'dayGridMonth',
		locale: 'pl',
		editable: true,
		eventSources: [
			{
				url: eventsUrl,
				method: 'GET',
				failure: () => alert('Nie udało się pobrać danych z API.'),
			}
		],
		eventDrop: function (info) {
			const newDate = info.event.start.toISOString();
			const id = info.event.id;

			fetch(updateUrl.replace(':id', id), {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
				},
				body: JSON.stringify({ appointment_at: newDate }),
			})
			.then(response => {
				if (!response.ok) throw new Error('Błąd aktualizacji');
				return response.json();
			})
			.then(data => {
				console.log('Zaktualizowano:', data);
			})
			.catch(error => {
				alert('Nie udało się zapisać zmiany daty.');
				info.revert(); // cofnij zmianę jeśli błąd
			});
		}
	});

	calendar.render();
});
