<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl leading-tight">
            Kalendarz rezerwacji
        </h2>
    </x-slot>

    @push('styles')
    <style>
      #appointmentModal,
      #adminCreateModal,
      #adminEditFullModal,
      #realizeModal {
        z-index: 99999 !important;
      }
    
      /* Najprostsza blokada – wyłącza WSZYSTKIE kliknięcia na kalendarzu */
      .modal-open #calendar {
        pointer-events: none !important;
      }
    
      /* Modal i jego wnętrze – zawsze klikalne */
      #appointmentModal,
      #adminCreateModal,
      #adminEditFullModal,
      #realizeModal,
      #appointmentModal *,
      #adminCreateModal *,
      #adminEditFullModal *,
      #realizeModal *,
      .fixed.inset-0.bg-black.bg-opacity-50 {
        pointer-events: auto !important;
      }
    </style>
    @endpush

    @if($pendingCount > 0 || $proposedCount > 0)
    <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 py-2">
        <div class="bg-yellow-100 text-yellow-800 p-4 rounded mb-4">
            <p><strong>Oczekujące zgłoszenia:</strong> {{ $pendingCount }}</p>
            <p><strong>Proponowane terminy:</strong> {{ $proposedCount }}</p>
        </div>
    </div>
    @endif


    <div class="py-6 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div id="calendar"
             data-events-url="{{ route('admin.appointments.api') }}"
             class="bg-white shadow rounded-lg p-4">
        </div>
    </div>

    {{-- Modal podglądu rezerwacji --}}
    <div
      id="appointmentModal"
      x-data="viewModal"
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
            <template x-if="appointment.conflict">
              <p class="mb-2 text-red-600 font-semibold">Termin pokrywa się z inną wizytą.</p>
            </template>
            <template x-if="appointment.note_user">
              <p class="mb-2"><strong>Uwagi klienta:</strong> <span x-text="appointment.note_user"></span></p>
            </template>
          </div>
        </template>
        <div class="mt-4 text-right">
          <button
            @click="close()"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Zamknij
          </button>
          <button
            @click="edit()"
            class="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Edytuj
          </button>
          <button
            @click="realize()"
            class="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Realizuj
          </button>
        </div>
      </div>
    </div>

    {{-- Modal edycji rezerwacji --}}
    <div
      id="adminEditModal"
      x-data="editModal"
      x-init="init()"
      x-show="open"
      x-cloak
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Edytuj rezerwację</h2>

        <label class="block mb-2 text-sm font-medium">Data i godzina:</label>
        <input type="datetime-local" x-model="date" class="w-full mb-4 border rounded px-2 py-1">

        </div>
      </div>
    </div>

    {{-- Modal dodawania rezerwacji --}}
    <div
      id="adminCreateModal"
      x-data="createModal"
      x-init="init()"
      x-show="open"
      x-cloak
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Nowa rezerwacja</h2>

        <label class="block mb-2 text-sm font-medium">Data i godzina:</label>
        <input type="datetime-local" x-model="date" class="w-full mb-4 border rounded px-2 py-1">

        <label class="block mb-2 text-sm font-medium">Klient:</label>
        <select x-model="user_id" class="w-full mb-4 border rounded px-2 py-1">
          <template x-for="u in users" :key="u.id">
            <option :value="u.id" x-text="u.name"></option>
          </template>
        </select>

        <label class="block mb-2 text-sm font-medium">Usługa:</label>
        <select x-model="service_id" class="w-full mb-4 border rounded px-2 py-1">
          <option value="" disabled selected>Wybierz usługę</option>
          <template x-for="s in services" :key="s.id">
            <option :value="s.id" x-text="s.name"></option>
          </template>
        </select>

        <label class="block mb-2 text-sm font-medium">Wariant usługi:</label>
        <select x-model="variant_id" :disabled="!service_id" class="w-full mb-4 border rounded px-2 py-1">
          <option value="" disabled selected>Wybierz wariant</option>
          <template x-for="v in variants" :key="v.id">
            <option :value="v.id" x-text="v.variant_name"></option>
          </template>
        </select>

        <label class="block mb-2 text-sm font-medium">Rabat (%):</label>
        <input type="number" x-model="discount_percent" min="0" max="100" class="w-full mb-4 border rounded px-2 py-1">

        <label class="block mb-2 text-sm font-medium">Uwagi klienta:</label>
        <textarea x-model="note_user" class="w-full mb-4 border rounded px-2 py-1"></textarea>

        <label class="block mb-2 text-sm font-medium">Cena (zł):</label>
        <input type="number" x-model="price" class="w-full mb-4 border rounded px-2 py-1" readonly>

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

  {{-- Modal pełnej edycji wizyty --}}
  <div
    id="adminEditFullModal"
    x-data="editFullModal"
    x-init="init()"
    x-show="open"
    x-cloak
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-lg overflow-y-auto max-h-full">
      <h2 class="text-lg font-bold mb-4">Edytuj wizytę</h2>

      <label class="block mb-2 text-sm font-medium">Data i godzina:</label>
      <input type="datetime-local" x-model="date" class="w-full mb-4 border rounded px-2 py-1">

      <label class="block mb-2 text-sm font-medium">Klient:</label>
      <select x-model="user_id" class="w-full mb-4 border rounded px-2 py-1">
        <template x-for="u in users" :key="u.id">
          <option :value="u.id" x-text="u.name"></option>
        </template>
      </select>

      <label class="block mb-2 text-sm font-medium">Usługa:</label>
      <select x-model="service_id" class="w-full mb-4 border rounded px-2 py-1">
        <option value="" disabled selected>Wybierz usługę</option>
        <template x-for="s in services" :key="s.id">
          <option :value="s.id" x-text="s.name"></option>
        </template>
      </select>

      <label class="block mb-2 text-sm font-medium">Wariant usługi:</label>
      <select x-model="variant_id" :disabled="!service_id" class="w-full mb-4 border rounded px-2 py-1">
        <option value="" disabled selected>Wybierz wariant</option>
        <template x-for="v in variants" :key="v.id">
          <option :value="v.id" x-text="v.variant_name"></option>
        </template>
      </select>

      <label class="block mb-2 text-sm font-medium">Rabat (%):</label>
      <input type="number" x-model="discount_percent" min="0" max="100" class="w-full mb-4 border rounded px-2 py-1">

      <label class="block mb-2 text-sm font-medium">Uwagi klienta:</label>
      <textarea x-model="note_user" class="w-full mb-4 border rounded px-2 py-1"></textarea>

      <label class="block mb-2 text-sm font-medium">Cena (zł):</label>
      <input type="number" x-model="price" class="w-full mb-4 border rounded px-2 py-1" readonly>

      <label class="block mb-2 text-sm font-medium">Status:</label>
      <select x-model="status" class="w-full mb-4 border rounded px-2 py-1">
        <option value="zaplanowana">Zaplanowana</option>
        <option value="oczekuje">Oczekuje</option>
        <option value="proponowana">Proponowana</option>
        <option value="odbyta">Odbyta</option>
        <option value="odwołana">Odwołana</option>
        <option value="nieodbyta">Nieodbyta</option>
      </select>

      <label class="block mb-2 text-sm font-medium">Zalecenia dla klienta:</label>
      <textarea x-model="note_client" class="w-full mb-4 border rounded px-2 py-1"></textarea>

      <label class="block mb-2 text-sm font-medium">Notatka wewnętrzna:</label>
      <textarea x-model="note_internal" class="w-full mb-4 border rounded px-2 py-1"></textarea>

      <label class="block mb-2 text-sm font-medium">Opis usługi:</label>
      <textarea x-model="service_description" class="w-full mb-4 border rounded px-2 py-1"></textarea>

      <label class="block mb-2 text-sm font-medium">Użyte produkty:</label>
      <textarea x-model="products_used" class="w-full mb-4 border rounded px-2 py-1"></textarea>

      <div class="flex justify-end gap-2 mt-2">
        <button @click="destroy()" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Usuń</button>
        <button @click="close()" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Anuluj</button>
        <button @click="save()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Zapisz</button>
      </div>
    </div>
  </div>

  {{-- Modal realizacji wizyty --}}
  <div
    id="realizeModal"
    x-data="realizeModal"
    x-init="init()"
    x-show="open"
    x-cloak
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white rounded-lg p-6 shadow-lg w-full max-w-lg overflow-y-auto max-h-[90vh]">
      <h2 class="text-lg font-bold mb-4">Realizacja wizyty</h2>

      <div class="mb-4">
        <p><strong>Klient:</strong> <span x-text="appointment.user"></span></p>
        <p><strong>Usługa:</strong> <span x-text="appointment.service"></span> - <span x-text="appointment.variant"></span></p>
        <p><strong>Termin:</strong> <span x-text="appointment.datetime"></span></p>
        <template x-if="appointment.note_user">
          <p><strong>Uwagi klienta:</strong> <span x-text="appointment.note_user"></span></p>
        </template>
      </div>

      <div class="mb-4">
        <h3 class="font-semibold mb-2">Historia wizyt</h3>
        <ul class="text-sm max-h-32 overflow-y-auto list-disc list-inside" >
          <template x-for="h in history" :key="h.id">
            <li
              x-text="h.appointment_at + ' - ' + (h.service_name || '')"
              :title="h.tooltip"
            ></li>
          </template>
        </ul>
        <button
          x-show="!loadedAllHistory"
          @click="viewAllHistory()"
          class="mt-2 text-blue-600 hover:underline"
        >Pokaż całą historię</button>
      </div>

      <label class="block mb-2 text-sm font-medium">Zalecenia dla klienta:</label>
      <textarea x-model="note_client" class="w-full mb-4 border rounded px-2 py-1"></textarea>

      <label class="block mb-2 text-sm font-medium">Notatka wewnętrzna:</label>
      <textarea x-model="note_internal" class="w-full mb-4 border rounded px-2 py-1"></textarea>

      <label class="block mb-2 text-sm font-medium">Opis usługi:</label>
      <textarea x-model="service_description" class="w-full mb-4 border rounded px-2 py-1"></textarea>

      <label class="block mb-2 text-sm font-medium">Użyte produkty:</label>
      <textarea x-model="products_used" class="w-full mb-4 border rounded px-2 py-1"></textarea>

      <label class="block mb-2 text-sm font-medium">Kwota zapłacona (zł):</label>
      <input type="number" x-model="amount_paid_pln" class="w-full mb-4 border rounded px-2 py-1">

      <label class="block mb-2 text-sm font-medium">Metoda płatności:</label>
      <input type="text" x-model="payment_method" class="w-full mb-4 border rounded px-2 py-1" placeholder="np. gotówka, karta">

      <div class="flex justify-end gap-2 mt-2">
        <button @click="close()" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Anuluj</button>
        <button @click="finalize()" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Zapisz</button>
      </div>
    </div>
  </div>

  @push('scripts')
    @vite('resources/js/calendar.js')
  @endpush
</x-app-layout>
