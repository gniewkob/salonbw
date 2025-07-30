<x-app-layout>
	<x-slot name="header">
		<h2 class="font-semibold text-xl text-gray-800 leading-tight">
			Edytuj usługę: {{ $service->name }}
		</h2>
	</x-slot>

	<div class="py-8 max-w-4xl mx-auto">
		@if (session('success'))
			<div class="bg-green-100 text-green-800 p-4 rounded mb-6">
				{{ session('success') }}
			</div>
		@endif
		
		@if ($errors->any())
			<div class="bg-red-100 text-red-700 px-4 py-3 rounded mb-6">
				<ul class="list-disc list-inside">
					@foreach ($errors->all() as $error)
						<li>{{ $error }}</li>
					@endforeach
				</ul>
			</div>
		@endif

		<form method="POST" action="{{ route('admin.services.update', $service) }}">
			@csrf
			@method('PUT')

			<div class="mb-4">
				<label class="block font-medium">Nazwa usługi</label>
				<input type="text" name="name" value="{{ old('name', $service->name) }}"
					   class="w-full border rounded px-4 py-2">
			</div>

			<div class="mb-6">
				<label class="block font-medium">Opis</label>
				<textarea name="description" class="w-full border rounded px-4 py-2">{{ old('description', $service->description) }}</textarea>
			</div>

			<h3 class="text-lg font-semibold mb-2">Warianty</h3>

			<div id="variants">
				@foreach ($service->variants as $i => $variant)
					<div class="border p-4 rounded mb-4 bg-gray-50">
						<input type="hidden" name="variants[{{ $i }}][id]" value="{{ $variant->id }}">
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label class="text-sm">Nazwa wariantu</label>
								<input type="text" name="variants[{{ $i }}][variant_name]" value="{{ $variant->variant_name }}" class="w-full border px-2 py-1 rounded">
							</div>
							<div>
								<label class="text-sm">Czas (min)</label>
								<input type="number" name="variants[{{ $i }}][duration_minutes]" value="{{ $variant->duration_minutes }}" class="w-full border px-2 py-1 rounded">
							</div>
							<div>
								<label class="text-sm">Cena (zł)</label>
								<input type="number" name="variants[{{ $i }}][price_pln]" value="{{ $variant->price_pln }}" class="w-full border px-2 py-1 rounded">
							</div>
						</div>
						<div class="mt-2">
							<label class="inline-flex items-center text-sm text-red-600">
								<input type="checkbox" name="variants[{{ $i }}][_delete]" class="mr-2">
								Usuń ten wariant
							</label>
						</div>
					</div>
				@endforeach
			</div>

			<div id="new-variants"></div>

			<button type="button" onclick="addVariant()" class="mt-2 mb-6 text-sm text-blue-600 hover:underline">
				+ Dodaj nowy wariant
			</button>

			<div>
				<button type="submit" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
					Zapisz zmiany
				</button>
			</div>
		</form>
	</div>

	<script>
		let variantIndex = {{ $service->variants->count() }};

		function addVariant() {
			const container = document.getElementById('new-variants');
			const html = `
				<div class="border p-4 rounded mb-4 bg-white shadow">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label class="block text-sm">Nazwa wariantu</label>
							<input type="text" name="variants[${variantIndex}][variant_name]" class="w-full border px-2 py-1 rounded">
						</div>
						<div>
							<label class="block text-sm">Czas (min)</label>
							<input type="number" name="variants[${variantIndex}][duration_minutes]" class="w-full border px-2 py-1 rounded">
						</div>
						<div>
							<label class="block text-sm">Cena (zł)</label>
							<input type="number" name="variants[${variantIndex}][price_pln]" class="w-full border px-2 py-1 rounded">
						</div>
					</div>
				</div>
			`;
			container.insertAdjacentHTML('beforeend', html);
			variantIndex++;
		}
	</script>
</x-app-layout>