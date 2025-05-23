<x-app-layout>
    <x-slot name="header">
        <h2 class="text-xl font-semibold text-gray-800 leading-tight">Kalendarz rezerwacji</h2>
    </x-slot>

    <div class="py-8 max-w-7xl mx-auto">
        {{-- Legenda statusów --}}
        <div class="mb-4 flex flex-wrap items-center gap-4 text-sm">
            <span class="flex items-center gap-2">
                <span class="w-4 h-4 rounded bg-blue-500 inline-block"></span> Zaplanowana
            </span>
            <span class="flex items-center gap-2">
                <span class="w-4 h-4 rounded bg-green-500 inline-block"></span> Odbyta
            </span>
            <span class="flex items-center gap-2">
                <span class="w-4 h-4 rounded bg-yellow-500 inline-block"></span> Nieodbyta
            </span>
            <span class="flex items-center gap-2">
                <span class="w-4 h-4 rounded bg-red-500 inline-block"></span> Odwołana
            </span>
        </div>

        {{-- Kalendarz --}}
        <div
            id="calendar"
            data-events-url="{{ route('admin.appointments.api') }}"
            data-update-url="{{ route('admin.appointments.updateTime', ':id') }}">
        </div>
    </div>

    {{-- Modal szczegółów --}}
    <div id="appointmentModal" class="fixed z-50 inset-0 bg-black bg-opacity-50 hidden items-center justify-center">
        <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-md sm:w-auto">
            <h2 class="text-lg font-bold mb-2">Szczegóły rezerwacji</h2>
            <p><strong>Klient:</strong> <span id="modalUser"></span></p>
            <p><strong>Usługa:</strong> <span id="modalService"></span></p>
            <p><strong>Wariant:</strong> <span id="modalVariant"></span></p>
            <p><strong>Termin:</strong> <span id="modalDatetime"></span></p>
            <p><strong>Status:</strong>
                <span id="modalStatus" class="inline-block px-2 py-1 text-white text-xs font-semibold rounded"></span>
            </p>

            <div class="mt-6 flex justify-between items-center">
                <button id="btnDone" class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Oznacz jako odbyta</button>
                <button id="btnMissed" class="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Nieodbyta</button>
                <button id="btnCancel" class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">Anuluj</button>
            </div>

            <div class="mt-4 text-right">
                <button onclick="closeModal()" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Zamknij</button>
            </div>
        </div>
    </div>

    {{-- Vite --}}
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

            let selectedEventId = null;

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
                    selectedEventId = info.event.id;

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

            function sendStatusUpdate(status, reason = null) {
                if (!selectedEventId) return;
                fetch(`/admin/kalendarz/${selectedEventId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    },
                    body: JSON.stringify({ status, canceled_reason: reason }),
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        closeModal();
                        calendar.refetchEvents();
                    }
                })
                .catch(() => alert('Błąd zmiany statusu.'));
            }

            document.getElementById('btnDone').addEventListener('click', () => sendStatusUpdate('odbyta'));
            document.getElementById('btnMissed').addEventListener('click', () => sendStatusUpdate('nieodbyta'));
            document.getElementById('btnCancel').addEventListener('click', () => {
                const reason = prompt('Powód anulowania:', 'odwołana przez klienta');
                if (reason) sendStatusUpdate('odwołana', reason);
            });
        });
    </script>
</x-app-layout>
