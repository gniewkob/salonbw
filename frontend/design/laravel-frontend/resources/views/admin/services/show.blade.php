<x-app-layout>
	<x-slot name="header">
		<h2 class="font-semibold text-xl text-gray-800 leading-tight">
			Szczegóły usługi: {{ $service->name }}
		</h2>
	</x-slot>

	<div class="py-8 max-w-5xl mx-auto">
		@if ($service->description)
			<p class="mb-4 text-gray-700">{{ $service->description }}</p>
		@endif

		<h3 class="text-lg font-semibold mt-6 mb-2">Warianty usługi</h3>

		<table class="w-full table-auto border border-gray-200 rounded shadow bg-white">
			<thead class="bg-gray-100">
				<tr>
					<th class="text-left px-4 py-2">Wariant</th>
					<th class="text-left px-4 py-2">Czas trwania</th>
					<th class="text-left px-4 py-2">Cena</th>
					<th class="text-left px-4 py-2">Akcja</th>
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

		<div class="mt-6">
			<a href="{{ route('admin.services.index') }}" class="text-blue-600 hover:underline">← Wróć do listy usług</a>
		</div>
	</div>
</x-app-layout>