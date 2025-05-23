import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';

document.addEventListener('DOMContentLoaded', () => {
	/* ------------------------------------------------------------------
	   Inicjalizacja kalendarza
	------------------------------------------------------------------ */
	const calendarEl = document.getElementById('calendar');
	if (!calendarEl) return;

	const eventsUrl  = calendarEl.dataset.eventsUrl;
	const updateUrl  = calendarEl.dataset.updateUrl;
	let   selectedEventId = null;

	const calendar = new Calendar(calendarEl, {
		plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
		initialView: 'timeGridWeek',
		locale: plLocale,
		editable: true,
		height: 'auto',
		events: eventsUrl,

		/* ---------- kliknięcie wydarzenia ---------- */
		eventClick(info) {
			selectedEventId = info.event.id;
			const props = info.event.extendedProps;

			openModal('appointmentModal', modal => {
				document.getElementById('modalUser').textContent     = props.user;
				document.getElementById('modalService').textContent  = props.service;
				document.getElementById('modalVariant').textContent  = props.variant ?? '—';
				document.getElementById('modalDatetime').textContent = props.datetime;

				const statusSpan = document.getElementById('modalStatus');
				statusSpan.textContent = props.status;
				statusSpan.className   = 'inline-block px-2 py-1 text-white text-xs font-semibold rounded';

				switch (props.status) {
					case 'odbyta':   statusSpan.classList.add('bg-green-500');  break;
					case 'odwołana': statusSpan.classList.add('bg-red-500');    break;
					case 'nieodbyta':statusSpan.classList.add('bg-yellow-500'); break;
					default:         statusSpan.classList.add('bg-blue-500');
				}

				modal.classList.remove('hidden');
			});
		},

		/* ---------- klik w pusty termin ---------- */
		dateClick(info) {
			const hour = new Date(info.dateStr).getHours();
			if (hour < 9 || hour > 17) {
				alert('Można umawiać tylko w godzinach 9:00–18:00');
				return;
			}

			openModal('adminCreateModal', modal => {
				modal.__x.$data.date = info.dateStr;
				modal.__x.$data.open = true;
			});
		},

		/* ---------- przeciąganie wydarzenia ---------- */
		eventDrop(info) {
			const id      = info.event.id;
			const newDate = info.event.start.toISOString();

			fetch(updateUrl.replace(':id', id), {
				method : 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRF-TOKEN' : document
						.querySelector('meta[name="csrf-token"]')
						.getAttribute('content'),
				},
				body: JSON.stringify({ appointment_at: newDate }),
			})
			.then(r => {
				if (!r.ok) throw new Error('Błąd aktualizacji');
				return r.json();
			})
			.then(() => calendar.refetchEvents())
			.catch(() => {
				alert('Nie udało się zapisać zmiany daty.');
				info.revert();
			});
		}
	});

	calendar.render();
	window.calendar = calendar;

	/* ------------------------------------------------------------------
	   Przyciskowe akcje statusu rezerwacji
	------------------------------------------------------------------ */
	document.getElementById('btnDone')?.addEventListener('click', () => updateStatus('odbyta'));
	document.getElementById('btnMissed')?.addEventListener('click', () => updateStatus('nieodbyta'));
	document.getElementById('btnCancel')?.addEventListener('click', () => {
		const reason = prompt('Powód anulowania:', 'odwołana przez klienta');
		if (reason) updateStatus('odwołana', reason);
	});

	function updateStatus(status, canceled_reason = null) {
		if (!selectedEventId) return;

		fetch(`/admin/kalendarz/${selectedEventId}/status`, {
			method : 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRF-TOKEN' : document
					.querySelector('meta[name="csrf-token"]')
					.getAttribute('content'),
			},
			body: JSON.stringify({ status, canceled_reason }),
		})
		.then(r => r.json())
		.then(data => {
			if (data.success) {
				document.getElementById('appointmentModal')?.classList.add('hidden');
				calendar.refetchEvents();
			}
		})
		.catch(() => alert('Błąd zmiany statusu.'));
	}
});

/* ======================================================================
   Helper: czeka aż modal pojawi się w DOM-ie (i ewentualnie zainicjalizuje z Alpine)
====================================================================== */
function openModal(id, cb, triesLeft = 20) {
	const modal = document.getElementById(id);

	// jeśli element wciąż nie istnieje – spróbuj ponownie
	if (!modal) {
		if (triesLeft) return setTimeout(() => openModal(id, cb, triesLeft - 1), 100);
		console.warn(`Modal #${id} nie znalazł się w DOM-ie`);
		return;
	}

	// modal bez Alpine → działaj od razu
	if (!modal.hasAttribute('x-data')) {
		cb(modal);
		return;
	}

	// modal z Alpine → poczekaj aż framework zakończy inicjalizację
	window.Alpine?.nextTick(() => cb(modal));
}
