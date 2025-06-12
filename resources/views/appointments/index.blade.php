<x-app-layout>
	<x-slot name="header">
		<h2 class="text-xl font-semibold text-gray-800 leading-tight">
			Moje rezerwacje
		</h2>
	</x-slot>

    <div class="max-w-4xl mx-auto mt-10">
            <a href="{{ route('appointments.create') }}"
               class="mb-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Nowa rezerwacja
            </a>

            <div class="space-y-4">
                    @forelse($appointments as $appointment)
                            <div class="p-4 border rounded shadow-sm bg-white">
                                    <div class="font-semibold">{{ $appointment->service->name ?? '[usługa usunięta]' }}</div>
                                    <div class="text-sm text-gray-600">
                                            Termin: {{ \Carbon\Carbon::parse($appointment->appointment_at)->format('d.m.Y H:i') }}
                                    </div>
                                    <div class="text-sm text-gray-600">
                                            Status: {{ ucfirst($appointment->status) }}
                                    </div>
                            </div>
                    @empty
                            <p class="text-center text-gray-500">Nie masz jeszcze żadnych rezerwacji.</p>
                    @endforelse

                    <div class="mt-6">
                            {{ $appointments->links() }}
                    </div>
            </div>
    </div>
</x-app-layout>
