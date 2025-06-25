<x-app-layout>
    <div class="max-w-lg mx-auto py-8">
        <h2 class="text-xl font-bold mb-6">Szczegóły wizyty</h2>
        <ul>
            <li><b>Usługa:</b> {{ $appointment->service->name }} – {{ $appointment->variant->variant_name }}</li>
            <li><b>Cena:</b> {{ number_format($appointment->price_pln, 2) }} zł</li>
            @if($appointment->discount_percent)
                <li><b>Rabat:</b> {{ $appointment->discount_percent }}%</li>
            @endif
            <li><b>Data:</b> {{ $appointment->appointment_at }}</li>
            <li><b>Status:</b> {{ $appointment->status }}</li>
            @if($appointment->note_user)
                <li><b>Uwagi klienta:</b> {{ $appointment->note_user }}</li>
            @endif
        </ul>
        @if($appointment->note_client)
            <div class="my-4 p-4 rounded bg-green-100 border-l-4 border-green-500">
                <b>Zalecenia po wizycie:</b><br>
                {{ $appointment->note_client }}
            </div>
        @endif
        @if($appointment->service_description)
            <div class="my-4 p-4 rounded bg-blue-100 border-l-4 border-blue-500">
                <b>Opis usługi:</b><br>
                {{ $appointment->service_description }}
            </div>
        @endif
        @if($appointment->products_used)
            <div class="my-4 p-4 rounded bg-purple-100 border-l-4 border-purple-500">
                <b>Użyte produkty:</b><br>
                {{ $appointment->products_used }}
            </div>
        @endif
        @if($appointment->note_internal)
            <div class="my-4 p-4 rounded bg-gray-100 border-l-4 border-gray-500">
                <b>Notatka fryzjera:</b><br>
                {{ $appointment->note_internal }}
            </div>
        @endif
    </div>
</x-app-layout>
