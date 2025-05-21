<x-guest-layout>
    <div class="max-w-3xl mx-auto py-12">
        <h2 class="text-3xl font-bold mb-8">Nasze Usługi</h2>
        <table class="w-full mb-12 text-base">
            <thead>
                <tr>
                    <th class="p-2 text-left">Usługa</th>
                    <th class="p-2 text-left">Cena</th>
                    <th class="p-2 text-left">Czas trwania</th>
                    <th class="p-2"></th>
                </tr>
            </thead>
            <tbody>
                @forelse($services as $service)
                    @forelse($service->variants as $variant)
                        <tr>
                            <td class="p-2">
                                <span class="font-semibold">{{ $service->name }}</span>
                                @if($service->name !== $variant->variant_name)
                                    <span class="text-gray-500"> – {{ $variant->variant_name }}</span>
                                @endif
                            </td>
                            <td class="p-2">
                                {{ number_format($variant->price, 2) }} zł
                            </td>
                            <td class="p-2">
                                {{ $variant->duration ?? '–' }} min
                            </td>
                            <td class="p-2">
                                <a href="{{ route('reservation.entry', ['variant_id' => $variant->id]) }}"
                                   class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                                    Zarezerwuj
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="text-gray-400 text-center">Brak wariantów tej usługi.</td>
                        </tr>
                    @endforelse
                @empty
                    <tr>
                        <td colspan="4" class="text-gray-400 text-center">Brak dostępnych usług.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</x-guest-layout>
