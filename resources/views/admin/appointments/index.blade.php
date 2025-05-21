<x-app-layout>
	<x-slot name="header">
		<h2 class="text-xl font-semibold text-gray-800 leading-tight">
			Rezerwacje klientów
		</h2>
	</x-slot>

	<div class="py-8 max-w-6xl mx-auto">
		@if (session('success'))
			<div class="bg-green-100 text-green-800 p-4 rounded mb-6">
				{{ session('success') }}
			</div>
		@endif

		<table class="w-full table-auto border border-gray-200 shadow-sm bg-white rounded">
			<thead class="bg-gray-100">
				<tr>
					<th class="p-2 text-left">Klient</th>
					<th class="p-2 text-left">Usługa</th>
					<th class="p-2 text-left">Wariant</th>
					<th class="p-2 text-left">Termin</th>
					<th class="p-2 text-left">Status</th>
					<th class="p-2 text-left">Akcja</th>
				</tr>
			</thead>
			<tbody>
				@forelse ($appointments as $appointment)
					<tr class="border-t">
						<td class="p-2">{{ $appointment->user->name }}</td>
						<td class="p-2">{{ $appointment->service->name }}</td>
						<td class="p-2">{{ $appointment->variant->variant_name ?? '-' }}</td>
						<td class="p-2">{{ $appointment->appointment_at }}</td>
						<td class="p-2">{{ ucfirst($appointment->status) }}</td>
						<td class="p-2">
							<form method="POST" action="{{ route('admin.appointments.update', $appointment) }}">
								@csrf
								@method('PATCH')
								<select name="status" onchange="this.form.submit()" class="border px-2 py-1 rounded">
									<option value="zaplanowana" @selected($appointment->status === 'zaplanowana')>Zaplanowana</option>
									<option value="zatwierdzona" @selected($appointment->status === 'zatwierdzona')>Zatwierdzona</option>
									<option value="odrzucona" @selected($appointment->status === 'odrzucona')>Odrzucona</option>
								</select>
							</form>
						</td>
					</tr>
				@empty
					<tr>
						<td colspan="6" class="p-4 text-center text-gray-500">Brak rezerwacji.</td>
					</tr>
				@endforelse
			</tbody>
		</table>

		<div class="mt-4">
			{{ $appointments->links() }}
		</div>
	</div>
</x-app-layout>