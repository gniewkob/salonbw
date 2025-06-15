<x-app-layout>
    <div class="max-w-2xl mx-auto py-8">
        <h2 class="text-2xl font-bold mb-6">Edytuj wizytę</h2>
        <form method="POST" action="{{ route('appointments.update', $appointment->id) }}">
            @csrf
            @method('PUT')
            <div class="mb-4">
                <label for="note_client" class="block font-medium mb-2">Zalecenia dla klienta:</label>
                <textarea name="note_client" id="note_client" class="w-full p-2 border rounded">{{ old('note_client', $appointment->note_client) }}</textarea>
            </div>
            <div class="mb-4">
                <label for="note_internal" class="block font-medium mb-2">Notatka wewnętrzna (tylko dla personelu):</label>
                <textarea name="note_internal" id="note_internal" class="w-full p-2 border rounded">{{ old('note_internal', $appointment->note_internal) }}</textarea>
            </div>
            <div class="mb-4">
                <label for="service_description" class="block font-medium mb-2">Opis usługi:</label>
                <textarea name="service_description" id="service_description" class="w-full p-2 border rounded">{{ old('service_description', $appointment->service_description) }}</textarea>
            </div>
            <div class="mb-4">
                <label for="products_used" class="block font-medium mb-2">Użyte produkty i proporcje:</label>
                <textarea name="products_used" id="products_used" class="w-full p-2 border rounded">{{ old('products_used', $appointment->products_used) }}</textarea>
            </div>
            <div class="mb-4">
                <label for="status" class="block font-medium mb-2">Status:</label>
                <select name="status" id="status" class="w-full p-2 border rounded">
                    <option value="zaplanowana" @selected($appointment->status === 'zaplanowana')>Zaplanowana</option>
                    <option value="odbyta" @selected($appointment->status === 'odbyta')>Odbyta</option>
                    <option value="odwołana" @selected($appointment->status === 'odwołana')>Odwołana</option>
                </select>
            </div>
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Zapisz zmiany</button>
        </form>
    </div>
</x-app-layout>
