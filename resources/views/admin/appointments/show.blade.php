<x-app-layout>
    <div class="max-w-lg mx-auto py-8">
        <h2 class="text-xl font-bold mb-6">Szczegóły wizyty</h2>
        <ul>
            <li><b>Usługa:</b> {{ $appointment->service->name }} – {{ $appointment->variant->variant_name }}</li>
            <li><b>Cena:</b> {{ number_format($appointment->price_pln, 2) }} zł</li>
            <li><b>Data:</b> {{ $appointment->appointment_at }}</li>
            <li><b>Status:</b> {{ $appointment->status }}</li>
        </ul>
        @if($appointment->note_client)
            <div class="my-4 p-4 rounded bg-green-100 border-l-4 border-green-500">
                <b>Zalecenia po wizycie:</b><br>
                {{ $appointment->note_client }}
            </div>
        @endif
    </div>
</x-app-layout>
