<x-guest-layout>
    <div class="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold mb-8 text-center">Nasze Usługi</h2>
        @forelse($services as $service)
            <div class="mb-10">
                <h3 class="text-xl font-bold mb-4 border-b pb-2 text-gray-800">{{ $service->name }}</h3>
                @if($service->variants->count())
                    <div class="overflow-x-auto">
                        <table class="w-full bg-white shadow rounded-lg mb-2">
                            <thead>
                                <tr>
                                    <th class="p-3 text-left font-semibold text-gray-600">Wariant</th>
                                    <th class="p-3 text-left font-semibold text-gray-600">Cena</th>
                                    <th class="p-3 text-left font-semibold text-gray-600">Czas trwania</th>
                                    <th class="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($service->variants as $variant)
                                    <tr class="border-b last:border-none hover:bg-gray-50">
                                        <td class="p-3">{{ $variant->variant_name }}</td>
                                        <td class="p-3">
                                            {{ !is_null($variant->price_pln) ? number_format($variant->price_pln, 2).' zł' : '—' }}
                                        </td>
                                        <td class="p-3">
                                            {{ !is_null($variant->duration_minutes) ? $variant->duration_minutes.' min' : '—' }}
                                        </td>
                                        <td class="p-3">
                                            <a href="{{ route('reservation.entry', ['variant_id' => $variant->id]) }}"
                                               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm shadow">
                                                Zarezerwuj
                                            </a>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
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
