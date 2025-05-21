<x-guest-layout>
    <div class="max-w-3xl mx-auto py-12">
        <h2 class="text-3xl font-bold mb-8">Nasze Usługi</h2>

        @forelse($services as $service)
            <div class="mb-8">
                <h3 class="text-xl font-bold mb-4 border-b pb-2">{{ $service->name }}</h3>
                @if($service->variants->count())
                    <table class="w-full text-base mb-2">
                        <thead>
                            <tr class="text-gray-600">
                                <th class="p-2 text-left font-semibold">Wariant</th>
                                <th class="p-2 text-left font-semibold">Cena</th>
                                <th class="p-2 text-left font-semibold">Czas trwania</th>
                                <th class="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($service->variants as $variant)
                                <tr class="border-b last:border-none">
                                    <td class="p-2">
                                        {{ $variant->variant_name }}
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
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <div class="text-gray-400 italic py-2">Brak wariantów tej usługi.</div>
                @endif
            </div>
        @empty
            <div class="text-center text-gray-400 py-12">
                Brak dostępnych usług. Wróć później!
            </div>
        @endforelse
    </div>
</x-guest-layout>
