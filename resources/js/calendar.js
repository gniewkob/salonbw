import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';

document.addEventListener('DOMContentLoaded', function () {
	const calendarEl = document.getElementById('calendar');
	if (!calendarEl) return;

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

			const modal = document.getElementById('appointmentModal');
			if (!modal) return;

			const userEl = document.getElementById('modalUser');
			const serviceEl = document.getElementById('modalService');
			const variantEl = document.getElementById('modalVariant');
			const datetimeEl = document.getElementById('modalDatetime');
			const statusSpan = document.getElementById('modalStatus');

			if (userEl) userEl.textContent = props.user;
			if (serviceEl) serviceEl.textContent = props.service;
			if (variantEl) variantEl.textContent = props.variant ?? '—';
			if (datetimeEl) datetimeEl.textContent = props.datetime;

			if (statusSpan) {
				statusSpan.textContent = props.status;
				statusSpan.className = 'inline-block px-2 py-1 text-white text-xs font-semibold rounded';

				switch (props.status) {
					case 'odbyta': statusSpan.classList.add('bg-green-500'); break;
					case 'odwołana': statusSpan.classList.add('bg-red-500'); break;
					case 'nieodbyta': statusSpan.classList.add('bg-yellow-500'); break;
					default: statusSpan.classList.add('bg-blue-500');
				}
			}

			modal.classList.remove('hidden');
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
			const hour = new Date(info.dateStr).getHours();
			if (hour < 9 || hour > 17) {
				alert('Można umawiać tylko w godzinach 9:00–18:00');
				return;
			}
			tryShowModal(info.dateStr);
		}
	});

	requestAnimationFrame(() => {
		calendar.render();
		window.calendar = calendar;
	});

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
				document.getElementById('appointmentModal')?.classList.add('hidden');
				calendar.refetchEvents();
			}
		})
		.catch(() => alert('Błąd zmiany statusu.'));
	}

	function tryShowModal(dateStr, attempts = 5) {
		const modal = document.getElementById('adminCreateModal');
		if (modal && modal.__x && modal.__x.$data) {
			modal.__x.$data.date = dateStr;
			modal.__x.$data.open = true;
		} else if (attempts > 0) {
			setTimeout(() => tryShowModal(dateStr, attempts - 1), 100);
		} else {
			console.warn('Nie udało się zainicjalizować modala po kilku próbach');
		}
	}
});
