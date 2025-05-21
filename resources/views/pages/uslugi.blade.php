<x-guest-layout>
<div class="max-w-5xl mx-auto py-8 px-4">
	<h1 class="text-3xl font-bold mb-6">Nasze Usługi</h1>

	@forelse ($services as $service)
		<div class="mb-8">
			<h2 class="text-xl font-semibold">{{ $service->name }}</h2>
			@if ($service->description)
				<p class="text-gray-700 mb-2">{{ $service->description }}</p>
			@endif

			<table class="w-full table-auto border border-gray-200 bg-white mb-4">
				<thead class="bg-gray-100">
					<tr>
						<th class="text-left px-4 py-2">Wariant</th>
						<th class="text-left px-4 py-2">Czas</th>
						<th class="text-left px-4 py-2">Cena</th>
						<th class="text-right px-4 py-2">Akcja</th>
					</tr>
				</thead>
				<tbody>
					@foreach ($service->variants as $variant)
						<tr class="border-t">
							<td class="px-4 py-2">{{ $variant->variant_name }}</td>
							<td class="px-4 py-2">{{ $variant->duration_minutes }} min</td>
							<td class="px-4 py-2">{{ number_format($variant->price_pln, 2) }} zł</td>
							<td class="px-4 py-2 text-right">
								<a href="{{ route('appointments.create', ['variant_id' => $variant->id]) }}"
								   class="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
									Zarezerwuj
								</a>
							</td>
						</tr>
					@endforeach
				</tbody>
			</table>
		</div>
	@empty
		<p class="text-gray-500">Brak usług do wyświetlenia.</p>
	@endforelse
</div>
</x-guest-layout>