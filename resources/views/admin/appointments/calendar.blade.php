<x-app-layout>
    <x-slot name="header">
        <h2 class="text-xl font-semibold text-gray-800 leading-tight">Kalendarz rezerwacji</h2>
    </x-slot>

    <div class="py-8 max-w-7xl mx-auto">
        <!-- Legenda statusów -->
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

        <div
            id="calendar"
            data-events-url="{{ route('admin.appointments.api') }}"
            data-update-url="{{ route('admin.appointments.updateTime', ':id') }}">
        </div>
    </div>

    <!-- Modal dodawania rezerwacji przez admina -->
    <div
        x-data="{
            open: false,
            date: '',
            user_id: '',
            variant_id: '',
            users: [],
            variants: [],
            init() {
                fetch('/admin/api/users')
                    .then(res => res.json())
                    .then(data => this.users = data);
        
                fetch('/admin/api/variants')
                    .then(res => res.json())
                    .then(data => this.variants = data);
            }
        }"
        x-init="init()"
        x-show="open"
        x-cloak

        class="fixed z-50 inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
            <h2 class="text-lg font-bold mb-4">Nowa rezerwacja</h2>

            <p class="text-sm mb-2">Data i godzina: <span x-text="date"></span></p>

            <div class="mb-4">
                <label class="block text-sm font-medium">Klient:</label>
                <select x-model="user_id" class="w-full border rounded px-2 py-1">
                    <option value="">-- wybierz klienta --</option>
                    <template x-for="user in users" :key="user.id">
                        <option :value="user.id" x-text="user.name"></option>
                    </template>
                </select>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium">Wariant usługi:</label>
                <select x-model="variant_id" class="w-full border rounded px-2 py-1">
                    <option value="">-- wybierz wariant --</option>
                    <template x-for="variant in variants" :key="variant.id">
                        <option :value="variant.id" x-text="variant.name"></option>
                    </template>
                </select>
            </div>

            <div class="flex justify-between items-center">
                <button @click="open = false" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    Anuluj
                </button>
                <button
                    @click="
                        if (!user_id || !variant_id) { alert('Wybierz klienta i usługę'); return; }
                        fetch('/admin/kalendarz/store', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').getAttribute('content'),
                            },
                            body: JSON.stringify({
                                user_id: user_id,
                                service_variant_id: variant_id,
                                appointment_at: date
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                open = false;
                                window.calendar.refetchEvents();
                            }
                        })
                        .catch(() => alert('Błąd tworzenia rezerwacji'));
                    "
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Zapisz rezerwację
                </button>
            </div>
        </div>
    </div>

    @vite(['resources/css/app.css', 'resources/js/calendar.js'])

    @push('head')
        <meta name="csrf-token" content="{{ csrf_token() }}">
    @endpush

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const calendarEl = document.getElementById('calendar');
            const eventsUrl = calendarEl.dataset.eventsUrl;
            const updateUrl = calendarEl.dataset.updateUrl;

            const calendar = new FullCalendar.Calendar(calendarEl, {
                plugins: [window.FullCalendar.dayGridPlugin, window.FullCalendar.timeGridPlugin, window.FullCalendar.interactionPlugin],
                initialView: 'timeGridWeek',
                locale: 'pl',
                editable: true,
                events: eventsUrl,

                dateClick: function (info) {
                    const hour = new Date(info.dateStr).getHours();
                    if (hour < 9 || hour > 17) {
                        alert('Można umawiać tylko w godzinach 9:00–18:00');
                        return;
                    }
                    const modal = document.querySelector('[x-data]');
                    modal.__x.$data.date = info.dateStr;
                    modal.__x.$data.open = true;
                }
            });

            calendar.render();
            window.calendar = calendar;
        });
    </script>
</x-app-layout>
