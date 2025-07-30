<x-app-layout>
	<x-slot name="header">
		<h2 class="font-semibold text-xl text-gray-800 leading-tight">
			Dodaj nową usługę
		</h2>
	</x-slot>

	<div class="max-w-4xl mx-auto py-8">
		@if ($errors->any())
			<div class="bg-red-100 text-red-700 px-4 py-3 rounded mb-6">
				<ul class="list-disc list-inside">
					@foreach ($errors->all() as $error)
						<li>{{ $error }}</li>
					@endforeach
				</ul>
			</div>
		@endif

		<form method="POST" action="{{ route('admin.services.store') }}">
			@csrf

			<div class="mb-4">
				<label class="block font-medium">Nazwa usługi</label>
				<input type="text" name="name" class="w-full border rounded px-4 py-2" value="{{ old('name') }}" required>
			</div>

			<div class="mb-6">
				<label class="block font-medium">Opis (opcjonalnie)</label>
				<textarea name="description" class="w-full border rounded px-4 py-2">{{ old('description') }}</textarea>
			</div>

			<h3 class="text-lg font-semibold mb-2">Warianty</h3>

			<div id="variants">
				<div class="variant-group mb-4 border p-4 rounded bg-gray-50">
					<label class="block text-sm font-medium">Nazwa wariantu</label>
					<input type="text" name="variants[0][variant_name]" class="w-full border rounded px-4 py-2 mb-2">

					<label class="block text-sm font-medium">Czas trwania (min)</label>
					<input type="number" name="variants[0][duration_minutes]" class="w-full border rounded px-4 py-2 mb-2">

					<label class="block text-sm font-medium">Cena (PLN)</label>
					<input type="number" name="variants[0][price_pln]" class="w-full border rounded px-4 py-2">
				</div>
			</div>

			<button type="button" onclick="addVariant()" class="mb-4 text-sm text-blue-600 hover:underline">
				+ Dodaj kolejny wariant
			</button>

			<div>
				<button type="submit" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
					Zapisz usługę
				</button>
			</div>
		</form>
	</div>

	<script>
		let variantIndex = 1;

		function addVariant() {
			const variantsDiv = document.getElementById('variants');

			const newGroup = document.createElement('div');
			newGroup.classList.add('variant-group', 'mb-4', 'border', 'p-4', 'rounded', 'bg-white', 'shadow');

			newGroup.innerHTML = `
				<label class="block font-medium">Nazwa wariantu</label>
				<input type="text" name="variants[${variantIndex}][variant_name]" class="w-full border rounded px-4 py-2 mb-2">

				<label class="block font-medium">Czas trwania (min)</label>
				<input type="number" name="variants[${variantIndex}][duration_minutes]" class="w-full border rounded px-4 py-2 mb-2">

				<label class="block font-medium">Cena (PLN)</label>
				<input type="number" name="variants[${variantIndex}][price_pln]" class="w-full border rounded px-4 py-2">
			`;

			variantsDiv.appendChild(newGroup);
			variantIndex++;
		}
	</script>
</x-app-layout>