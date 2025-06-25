<x-app-layout>
	<x-slot name="header">
		<h2 class="text-xl font-semibold text-gray-800">Nowa rezerwacja</h2>
	</x-slot>

        <div class="max-w-2xl mx-auto mt-8"
             x-data="appointmentForm(@js($services), @js(old('service_variant_id', $preselectedVariant)) )"
             x-init="init()">
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
                                <label class="block font-medium mb-1">Usługa</label>
                                <select x-model="service_id" class="w-full p-2 border rounded" required>
                                        <option value="" disabled selected>Wybierz usługę</option>
                                        <template x-for="s in services" :key="s.id">
                                                <option :value="s.id" x-text="s.name"></option>
                                        </template>
                                </select>
                        </div>
                        <div>
                                <label class="block font-medium mb-1">Wariant usługi</label>
                                <select name="service_variant_id" x-model="variant_id" :disabled="!service_id" class="w-full p-2 border rounded" required>
                                        <option value="" disabled selected>Wybierz wariant</option>
                                        <template x-for="v in variants" :key="v.id">
                                                <option :value="v.id" x-text="v.variant_name + (v.price_pln ? ' – ' + Number(v.price_pln).toFixed(2) + ' zł' : '')"></option>
                                        </template>
                                </select>
                        </div>

                        <div>
                                <label class="block font-medium mb-1">Wybierz termin</label>
                                <div id="user-calendar" data-busy-url="{{ route('appointments.busy') }}" class="mb-4 h-96 border rounded"></div>
                                <input type="hidden" name="appointment_at" required>
                        </div>


                        <div>
                                <label class="block font-medium mb-1">Uwagi / specjalne wymagania</label>
                                <textarea name="note_user" class="w-full border rounded px-4 py-2" rows="3">{{ old('note_user') }}</textarea>
                        </div>

                        <div class="pt-4">
                                <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                                        Zarezerwuj
                                </button>
                                <a href="{{ route('messages.create', ['category' => 'rezerwacja']) }}" class="ml-4 text-blue-600 hover:underline">Nie widzisz terminu? Napisz do nas</a>
                        </div>
                </form>
        </div>
</x-app-layout>
