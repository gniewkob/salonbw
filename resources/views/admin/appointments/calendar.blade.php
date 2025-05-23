<x-app-layout>
	<x-slot name="header">
		<h2 class="text-xl font-semibold text-gray-800 leading-tight">Kalendarz rezerwacji</h2>
	</x-slot>

	<div class="py-8 max-w-7xl mx-auto">
		<div
			id="calendar"
			data-events-url="{{ route('admin.appointments.api') }}"
			data-update-url="{{ route('admin.appointments.update', ':id') }}">
		</div>
	</div>

	<!-- Modal -->
	<div id="appointmentModal" class="fixed z-50 inset-0 bg-black bg-opacity-50 hidden items-center justify-center">
		<div class="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
			<h2 class="text-lg font-bold mb-2">Szczegóły rezerwacji</h2>
			<p><strong>Klient:</strong> <span id="modalUser"></span></p>
			<p><strong>Usługa:</strong> <span id="modalService"></span></p>
			<p><strong>Wariant:</strong> <span id="modalVariant"></span></p>
			<p><strong>Termin:</strong> <span id="modalDatetime"></span></p>
			<p><strong>Status:</strong> <span id="modalStatus"></span></p>

			<div class="mt-4 text-right">
				<button onclick="closeModal()" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
					Zamknij
				</button>
			</div>
		</div>
	</div>

	{{-- CSS + JS przez Vite --}}
	@vite(['resources/css/app.css', 'resources/js/calendar.js'])

	{{-- CSRF token --}}
	@push('head')
		<meta name="csrf-token" content="{{ csrf_token() }}">
	@endpush

	<script>
		function closeModal() {
			document.getElementById('appointmentModal').classList.add('hidden');
		}

		document.addEventListener('DOMContentLoaded', function () {
			const calendarEl = document.getElementById('calendar');
			const eventsUrl = calendarEl.dataset.eventsUrl;
			const updateUrl = calendarEl.dataset.updateUrl;

			const calendar = new FullCalendar.Calendar(calendarEl, {
				plugins: [window.FullCalendar.dayGridPlugin, window.FullCalendar.timeGridPlugin, window.FullCalendar.interactionPlugin],
				initialView: 'timeGridWeek',
				headerToolbar: {
					left: 'prev,next today',
					center: 'title',
					right: 'dayGridMonth,timeGridWeek,timeGridDay'
				},
				locale: 'pl',
				editable: true,
				events: eventsUrl,
				eventClick: function (info) {
					const props = info.event.extendedProps;

					document.getElementById('modalUser').textContent = props.user;
					document.getElementById('modalService').textContent = props.service;
					document.getElementById('modalVariant').textContent = props.variant ?? '—';
					document.getElementById('modalDatetime').textContent = props.datetime;
					document.getElementById('modalStatus').textContent = props.status;

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
					.then(data => {
						console.log('Zaktualizowano:', data);
					})
					.catch(error => {
						alert('Nie udało się zapisać zmiany daty.');
						info.revert();
					});
				}
			});

			calendar.render();
		});
	</script>
</x-app-layout>
