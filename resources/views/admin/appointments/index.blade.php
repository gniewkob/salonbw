<x-app-layout>
    <div class="max-w-4xl mx-auto py-8">
        <h2 class="text-2xl font-bold mb-6">Moje wizyty</h2>
        <table class="w-full table-auto border-collapse">
            <thead>
                <tr>
                    <th class="p-2 border-b">Data</th>
                    <th class="p-2 border-b">Usługa</th>
                    <th class="p-2 border-b">Status</th>
                    <th class="p-2 border-b">Zalecenia</th>
                </tr>
            </thead>
            <tbody>
                @foreach($appointments as $appointment)
                    <tr>
                        <td class="p-2 border-b">{{ $appointment->appointment_at }}</td>
                        <td class="p-2 border-b">{{ $appointment->service->name }} – {{ $appointment->variant->variant_name }}</td>
                        <td class="p-2 border-b">{{ $appointment->status }}</td>
                        <td class="p-2 border-b">
                            @if($appointment->note_client)
                                <span class="text-green-600">{{ Str::limit($appointment->note_client, 40) }}</span>
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        <div class="mt-4">
            {{ $appointments->links() }}
        </div>
    </div>
</x-app-layout>
