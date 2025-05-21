<x-app-layout>
	<x-slot name="header">
		<h2 class="text-xl font-semibold text-gray-800">Nowa rezerwacja</h2>
	</x-slot>

	<div class="max-w-2xl mx-auto mt-8">
		@if ($errors->any())
			<div class="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
				<ul class="list-disc list-inside">
					@foreach ($errors->all() as $error)
						<li>{{ $error }}</li>
					@endforeach
				</ul>
			</div>
		@endif

		<form method="POST" action="{{ route('appointments.store') }}" class="space-y-6">
			@csrf

			<div>
				<label class="block font-medium mb-1">Wybierz usługę i wariant</label>
				<select name="service_variant_id" required class="w-full border rounded px-4 py-2">
					<option value="" disabled selected>-- wybierz wariant usługi --</option>
					@foreach ($services as $service)
						<optgroup label="{{ $service->name }}">
							@foreach ($service->variants as $variant)
								<option value="{{ $variant->id }}"
									@if ((int) $preselectedVariant === $variant->id) selected @endif>
									{{ $variant->variant_name }} — {{ $variant->duration_minutes }} min, {{ number_format($variant->price_pln, 2) }} zł
								</option>
							@endforeach
						</optgroup>
					@endforeach
				</select>
			</div>

			<div>
				<label class="block font-medium mb-1">Data i godzina wizyty</label>
				<input type="datetime-local" name="appointment_at" class="w-full border rounded px-4 py-2" required>
			</div>

			<div class="pt-4">
				<button type="submit" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
					Zarezerwuj
				</button>
			</div>
		</form>
	</div>
</x-app-layout>