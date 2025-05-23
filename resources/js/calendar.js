import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';

document.addEventListener('DOMContentLoaded', function () {
	const calendarEl = document.getElementById('calendar');
	const eventsUrl = calendarEl.dataset.eventsUrl;
	const updateUrl = calendarEl.dataset.updateUrl;

	let selectedEventId = null;

	const calendar = new Calendar(calendarEl, {
		plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
		initialView: 'timeGridWeek',
		locale: plLocale,
		editable: true,
		events: eventsUrl,

		eventClick: function (info) {
			selectedEventId = info.event.id;
			const props = info.event.extendedProps;

			document.getElementById('modalUser').textContent = props.user;
			document.getElementById('modalService').textContent = props.service;
			document.getElementById('modalVariant').textContent = props.variant ?? '—';
			document.getElementById('modalDatetime').textContent = props.datetime;

			const statusSpan = document.getElementById('modalStatus');
			statusSpan.textContent = props.status;
			statusSpan.className = 'inline-block px-2 py-1 text-white text-xs font-semibold rounded';

			switch (props.status) {
				case 'odbyta': statusSpan.classList.add('bg-green-500'); break;
				case 'odwołana': statusSpan.classList.add('bg-red-500'); break;
				case 'nieodbyta': statusSpan.classList.add('bg-yellow-500'); break;
				default: statusSpan.classList.add('bg-blue-500');
			}

			document.getElementById('appointmentModal').classList.remove('hidden');
		},

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
			.then(() => calendar.refetchEvents())
			.catch(() => {
				alert('Nie udało się zapisać zmiany daty.');
				info.revert();
			});
		},

		dateClick: function (info) {
			const modal = document.querySelector('[x-data]');
			modal.__x.$data.date = info.dateStr;
			modal.__x.$data.open = true;
		}
	});

	calendar.render();
	window.calendar = calendar;

	// przyciski statusu
	document.getElementById('btnDone')?.addEventListener('click', () => updateStatus('odbyta'));
	document.getElementById('btnMissed')?.addEventListener('click', () => updateStatus('nieodbyta'));
	document.getElementById('btnCancel')?.addEventListener('click', () => {
		const reason = prompt('Powód anulowania:', 'odwołana przez klienta');
		if (reason) updateStatus('odwołana', reason);
	});

	function updateStatus(status, canceled_reason = null) {
		if (!selectedEventId) return;

		fetch(`/admin/kalendarz/${selectedEventId}/status`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
			},
			body: JSON.stringify({ status, canceled_reason }),
		})
		.then(res => res.json())
		.then(data => {
			if (data.success) {
				document.getElementById('appointmentModal').classList.add('hidden');
				calendar.refetchEvents();
			}
		})
		.catch(() => alert('Błąd zmiany statusu.'));
	}
});
