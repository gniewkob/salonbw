<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl leading-tight">
            Kalendarz rezerwacji
        </h2>
    </x-slot>

    @push('styles')
    <style>
      #appointmentModal,
      #adminCreateModal {
        z-index: 99999 !important;
      }
    
      /* Najprostsza blokada – wyłącza WSZYSTKIE kliknięcia na kalendarzu */
      .modal-open #calendar {
        pointer-events: none !important;
      }
    
      /* Modal i jego wnętrze – zawsze klikalne */
      #appointmentModal,
      #adminCreateModal,
      #appointmentModal *,
      #adminCreateModal *,
      .fixed.inset-0.bg-black.bg-opacity-50 {
        pointer-events: auto !important;
      }
    </style>
    @endpush


    <div class="py-6 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div id="calendar"
             data-events-url="{{ route('admin.appointments.api') }}"
             class="bg-white shadow rounded-lg p-4">
        </div>
    </div>

    {{-- Modal podglądu rezerwacji --}}
    <div
      id="appointmentModal"
      x-data="viewModal()"
      x-init="init()"
      x-show="open"
      x-cloak
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Szczegóły rezerwacji</h2>
        <template x-if="appointment">
          <div>
            <p class="mb-2"><strong>Klient:</strong>   <span x-text="appointment.user"></span></p>
            <p class="mb-2"><strong>Usługa:</strong>   <span x-text="appointment.service"></span></p>
            <p class="mb-2"><strong>Wariant:</strong>  <span x-text="appointment.variant"></span></p>
            <p class="mb-2"><strong>Termin:</strong>   <span x-text="appointment.datetime"></span></p>
            <p class="mb-2"><strong>Status:</strong>   <span x-text="appointment.status"></span></p>
          </div>
        </template>
        <div class="mt-4 text-right">
          <button
            @click="close()"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Zamknij
          </button>
        </div>
      </div>
    </div>

    {{-- Modal dodawania rezerwacji --}}
    <div
      id="adminCreateModal"
      x-data="createModal()"
      x-init="init()"
      x-show="open"
      x-cloak
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Nowa rezerwacja</h2>
        <p class="text-sm mb-4">Data i godzina: <span x-text="date"></span></p>

        <label class="block mb-2 text-sm font-medium">Klient:</label>
        <select x-model="user_id" class="w-full mb-4 border rounded px-2 py-1">
          <template x-for="u in users" :key="u.id">
            <option :value="u.id" x-text="u.name"></option>
          </template>
        </select>

        <label class="block mb-2 text-sm font-medium">Wariant usługi:</label>
        <select x-model="variant_id" class="w-full mb-4 border rounded px-2 py-1">
          <template x-for="v in variants" :key="v.id">
            <option :value="v.id" x-text="v.name"></option>
          </template>
        </select>

        <div class="flex justify-end gap-2">
          <button
            @click="close()"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Anuluj
          </button>
          <button
            @click="save()"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Zapisz
          </button>
        </div>
      </div>
    </div>

    @push('scripts')
      @vite(['resources/css/app.css','resources/js/app.js'])
    @endpush
</x-app-layout>
