<x-app-layout>
    <x-slot name="header">
        <h2 class="text-xl font-semibold leading-tight">Kalendarz rezerwacji</h2>
    </x-slot>

    <div class="py-8 max-w-7xl mx-auto">
        {{-- …legenda… --}}

        <div
            id="calendar"
            style="min-height: 600px;"
            data-events-url="{{ route('admin.appointments.api') }}"
            data-detail-url="{{ route('admin.appointments.show', ':id') }}"
            data-update-url="{{ route('admin.appointments.updateTime', ':id') }}"
        ></div>
    </div>

    {{-- Modal tworzenia wizyty --}}
    <div
        id="adminCreateModal"
        x-data="{
            open: false,
            date: '',
            user_id: '',
            variant_id: '',
            users: [],
            variants: [],
            init() {
                fetch('/admin/api/users')
                    .then(r => r.json())
                    .then(data => this.users = data);
                fetch('/admin/api/variants')
                    .then(r => r.json())
                    .then(data => this.variants = data);
            }
        }"
        x-init="init()"
        x-show="open"
        x-cloak
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
        <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-md" @click.outside="open = false">
            <h2 class="text-lg font-bold mb-4">Nowa rezerwacja</h2>
            <p class="text-sm mb-2">Data i godzina: <span x-text="date"></span></p>

            {{-- Wybór klienta --}}
            <div class="mb-4">
                <label class="block text-sm font-medium">Klient:</label>
                <select x-model="user_id" class="w-full border rounded px-2 py-1">
                    <option value="">-- wybierz klienta --</option>
                    <template x-for="u in users" :key="u.id">
                        <option :value="u.id" x-text="u.name"></option>
                    </template>
                </select>
            </div>

            {{-- Wariant usługi --}}
            <div class="mb-4">
                <label class="block text-sm font-medium">Wariant usługi:</label>
                <select x-model="variant_id" class="w-full border rounded px-2 py-1">
                    <option value="">-- wybierz wariant --</option>
                    <template x-for="v in variants" :key="v.id">
                        <option :value="v.id" x-text="v.name"></option>
                    </template>
                </select>
            </div>

            {{-- Akcje --}}
            <div class="flex justify-end gap-2">
                <button @click="open = false" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Anuluj</button>
                <button
                    @click="
                        if (!user_id || !variant_id) {
                            alert('Wybierz klienta i wariant usługi');
                            return;
                        }
                        fetch('{{ route('admin.appointments.store') }}', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
                            },
                            body: JSON.stringify({ user_id, variant_id, appointment_at: date })
                        })
                        .then(r => r.ok ? window.location.reload() : Promise.reject())
                        .catch(() => alert('Błąd tworzenia rezerwacji'));
                    "
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Zapisz
                </button>
            </div>
        </div>
    </div>

    {{-- Modal podglądu/edycji wizyty --}}
    <div
        id="appointmentModal"
        x-data="{
            open: false,
            appointment: { user: {}, variant: {} }
        }"
        x-show="open"
        x-cloak
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
        <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-md" @click.outside="open = false">
            <h2 class="text-lg font-bold mb-4">Szczegóły wizyty</h2>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <dt class="font-medium">Klient:</dt>
                    <dd x-text="appointment.user.name || '–'"></dd>
                </div>
                <div class="flex justify-between">
                    <dt class="font-medium">Usługa:</dt>
                    <dd x-text="appointment.variant.name || '–'"></dd>
                </div>
                <div class="flex justify-between">
                    <dt class="font-medium">Data:</dt>
                    <dd x-text="new Date(appointment.appointment_at).toLocaleString('pl-PL')"></dd>
                </div>
            </dl>
            <div class="mt-4 flex justify-end gap-2">
                <button @click="open = false" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    Zamknij
                </button>
                <button @click="open = false" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Zmień status
                </button>
            </div>
        </div>
    </div>
</x-app-layout>
